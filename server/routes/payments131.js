const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const payments131Client = require('../services/payments131Client');
const esimGoApi = require('../services/esimGoApi');
const userEsimRepo = require('../services/userEsimRepo');
const fs = require('fs');

// In-memory store for SBP QR / deeplink by sessionId
// NOTE: good enough for this app; for production-scale use persistent storage.
const sbpQrStore = new Map();

// Optional IP whitelist for incoming webhooks from Bank131.
// If PAYMENT_131_WEBHOOK_WHITELIST is not set, all IPs are allowed.
const rawWebhookWhitelist = process.env.PAYMENT_131_WEBHOOK_WHITELIST || '';
const whitelist = rawWebhookWhitelist
  .split(',')
  .map((ip) => ip.trim())
  .filter(Boolean);

// Lightweight diagnostics (no secrets leaked)
// Enable via env PAYMENT_131_DEBUG=true
router.get('/debug', async (req, res) => {
  if (process.env.PAYMENT_131_DEBUG !== 'true') {
    return res.status(404).json({ error: 'Not found' });
  }
  try {
    const key = (process.env.PAYMENT_131_PRIVATE_PEM || process.env.PAYMENT_131_PRIVATE_KEY || '').trim();
    const header = key.match(/-----BEGIN ([A-Z\s]+)-----/)?.[1] || 'NONE';
    const encrypted = /ENCRYPTED/i.test(header);
    const hasEnd = /-----END [^-]+-----/.test(key);
    let parseOk = false;
    let signOk = false;
    let parseError = null;
    let signError = null;
    let signaturePreview = null;
    if (key) {
      try {
        const privateKeyObj = require('crypto').createPrivateKey({ key, format: 'pem' });
        parseOk = true;
        try {
          const signer = require('crypto').createSign('RSA-SHA256');
          signer.update('ewave-debug');
          signer.end();
          const sig = signer.sign(privateKeyObj, 'base64');
          signaturePreview = sig.slice(0, 16);
          signOk = true;
        } catch (e) {
          signError = e.message;
        }
      } catch (e) {
        parseError = e.message;
      }
    }
    // Also build a real signature and analyze it
    let signatureHeaderInfo = null;
    let signingStringSample = null;
    try {
      const client = require('../services/payments131Client');
      const testPath = '/api/v1/session/init/payment';
      const testBody = JSON.stringify({ test: true });
      const { headers } = client.buildHeaders({ method: 'post', path: testPath, body: testBody });
      const xPartnerSign = String(headers['X-PARTNER-SIGN'] || '');
      signatureHeaderInfo = {
        sample: xPartnerSign.slice(0, 80),
        length: xPartnerSign.length,
        hasCR: /\r/.test(xPartnerSign),
        hasLF: /\n/.test(xPartnerSign),
        nonAsciiCount: [...xPartnerSign].map(c => c.charCodeAt(0)).filter(code => (code < 32 && code !== 9) || code >= 127).length,
        hasAuthorization: Boolean(headers.Authorization),
        note: 'Signature is created from request body (JSON) only, not headers',
      };
      // Extract signed payload from client if available
      if (client.__lastSigningString) {
        signingStringSample = client.__lastSigningString.slice(0, 300);
      }
    } catch (e) {
      signatureHeaderInfo = { error: e.message };
    }
    const debugPayload = payments131Client.__lastDebug || null;

    res.json({
      configured: Boolean(key),
      baseUrlConfigured: Boolean((process.env.PAYMENT_131_BASE_URL || '').trim()),
      project: process.env.PAYMENT_131_PROJECT || '',
      merchant: process.env.PAYMENT_131_MERCHANT || process.env.PAYMENT_131_MERCHANT_ID || '',
      keyId: process.env.PAYMENT_131_KEY_ID || process.env.PAYMENT_131_KID || '',
      keyHeader: header,
      encrypted,
      hasEndFooter: hasEnd,
      parseOk,
      parseError,
      signOk,
      signError,
      signaturePreview,
      signatureHeaderInfo,
      signingStringSample,
      lastRequest: debugPayload
        ? {
            method: debugPayload.method,
            path: debugPayload.path,
            payloadPreview: debugPayload.payload ? debugPayload.payload.slice(0, 200) : null,
            payloadLength: debugPayload.payload?.length || 0,
            headers: debugPayload.headersSnapshot,
          }
        : null,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Deeper signature header debug (no secrets revealed)
router.get('/debug-sign', async (req, res) => {
  if (process.env.PAYMENT_131_DEBUG !== 'true') {
    return res.status(404).json({ error: 'Not found' });
  }
  try {
    const client = require('../services/payments131Client');
    const testPath = client.resolvePath(client.createPathTemplate, { orderId: 'debug' });
    const { headers } = client.buildHeaders({ method: 'post', path: testPath, body: { test: true } });
    const value = String(headers.Signature || '');
    const hasCR = /\r/.test(value);
    const hasLF = /\n/.test(value);
    const nonAscii = [...value].map(c => c.charCodeAt(0)).filter(code => code < 32 && code !== 9 || code >= 127);
    res.json({
      sample: value.slice(0, 80),
      length: value.length,
      hasCR,
      hasLF,
      nonAsciiCount: nonAscii.length,
      nonAsciiFirstCodes: nonAscii.slice(0, 5),
      headersList: (value.match(/headers=\"([^\"]+)\"/) || [,''])[1],
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

function extractClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return (
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress ||
    req.ip ||
    ''
  );
}

function normalizeIp(ip) {
  if (!ip) return '';
  return ip.replace('::ffff:', '').trim();
}

function isIpAllowed(ip) {
  if (!whitelist.length) return true;
  const normalized = normalizeIp(ip);
  return whitelist.includes(normalized);
}

router.post('/sbp/create-payment', async (req, res) => {
  try {
    const {
      amount,
      currency = 'RUB',
      orderId,
      description,
      successUrl,
      failUrl,
      metadata,
      customer,
      extra,
    } = req.body || {};

    if (!amount) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'amount is required' });
    }

    const finalOrderId = orderId || `ewave_${Date.now()}`;

    const response = await payments131Client.createSbpPayment({
      amount,
      currency,
      orderId: finalOrderId,
      description,
      successUrl,
      failUrl,
      metadata,
      customer,
      extra,
    });
    const sessionId = response.sessionId || response.session?.id;

    // Сохраняем pending-запись в БД, чтобы потом привязать eSIM к Telegram-пользователю
    const telegramId =
      (extra && (extra.telegramId || extra.telegram_id)) ||
      (metadata && (metadata.telegramId || metadata.telegram_id)) ||
      (customer && (customer.telegramId || customer.telegram_id)) ||
      (customer && customer.reference);
    const packageId =
      (metadata && (metadata.packageId || metadata.package_id)) ||
      (extra && (extra.packageId || extra.package_id));

    if (telegramId && packageId && sessionId) {
      userEsimRepo
        .createPending({
          telegramId,
          packageId,
          paymentSessionId: sessionId,
          paymentOrderId: finalOrderId,
          amountRub: amount,
          currency,
        })
        .catch((err) => {
          console.warn('[userEsims] createPending error:', err.message);
        });
    }

    res.json({ orderId: finalOrderId, ...response });
  } catch (error) {
    console.error('[131] create SBP payment failed:', error.message, error.details || '');
    res.status(error.statusCode || 500).json({
      error: 'PAYMENT_131_SBP_ERROR',
      message: error.message,
      details: error.details,
    });
  }
});

router.get('/sbp/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const data = await payments131Client.getSbpPaymentStatus(orderId);
    res.json(data);
  } catch (error) {
    console.error('[131] fetch SBP payment status failed:', error.message, error.details || '');
    res.status(error.statusCode || 500).json({
      error: 'PAYMENT_131_SBP_STATUS_ERROR',
      message: error.message,
      details: error.details,
    });
  }
});

// GET public key (fallback if not served by Next public dir)
router.get('/public-key', (req, res) => {
  res.type('text/plain');
  const pem = process.env.PAYMENT_131_PUBLIC_PEM || '';
  if (!pem) {
    return res.status(404).send('Public key not configured');
  }
  return res.send(pem);
});

// POST webhook receiver
router.post('/webhook', async (req, res) => {
  const clientIp = normalizeIp(extractClientIp(req));

  if (!isIpAllowed(clientIp)) {
    console.warn('[131] webhook rejected (IP not whitelisted):', clientIp);
    return res.status(403).json({ error: 'FORBIDDEN' });
  }

  try {
    // Optional signature verification (header names may differ; adjust when spec is final)
    const publicKey = (process.env.PAYMENT_131_PUBLIC_PEM || '').trim();
    const signatureHeader = req.headers['x-signature'] || req.headers['x-131-signature'];
    const digestHeader = req.headers['x-digest'] || '';

    if (publicKey && signatureHeader) {
      try {
        const verifier = crypto.createVerify('RSA-SHA256');
        const rawBody = Buffer.from(JSON.stringify(req.body));
        verifier.update(rawBody);
        verifier.end();
        const isValid = verifier.verify(publicKey, signatureHeader, 'base64');
        console.log('[131] webhook received, signature valid:', isValid, 'digest:', digestHeader);
      } catch (e) {
        console.warn('[131] signature verify failed:', e.message);
      }
    } else {
      console.log('[131] webhook received (no signature header configured)');
    }

    const body = req.body || {};

    // Handle ready_to_confirm: confirm session to move flow forward (per docs step 5)
    if (body.type === 'ready_to_confirm' && body.session && body.session.id) {
      const sessionId = body.session.id;
      console.log('[131] ready_to_confirm received, sending session/confirm for session', sessionId);
      // Fire-and-forget, не блокируем ответ вебхука
      payments131Client
        .confirmSession(sessionId)
        .then(() => {
          console.log('[131] session/confirm sent successfully for', sessionId);
        })
        .catch((err) => {
          console.error('[131] session/confirm failed for', sessionId, err.message);
        });
    }

    // Store SBP QR deeplink from action_required webhook for later retrieval by sessionId
    if (body.type === 'action_required' && body.session && body.session.id) {
      const sessionId = body.session.id;
      const acquiring = Array.isArray(body.session.acquiring_payments)
        ? body.session.acquiring_payments[0]
        : null;
      const qrContent =
        acquiring &&
        acquiring.customer_interaction &&
        acquiring.customer_interaction.inform &&
        acquiring.customer_interaction.inform.qr &&
        acquiring.customer_interaction.inform.qr.content;

      if (qrContent) {
        sbpQrStore.set(sessionId, {
          sessionId,
          paymentId: acquiring.id,
          qrDeeplink: qrContent,
          updatedAt: new Date().toISOString(),
        });
        console.log('[131] stored SBP QR deeplink for session', sessionId);
      } else {
        console.log('[131] action_required webhook without QR content for session', sessionId);
      }
    }

    // Here: enqueue processing, ensure idempotency by event/payment id

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[131] webhook handler error:', e.message);
    // Do not fail acknowledgment
    res.status(200).json({ ok: false });
  }
});

// GET stored SBP QR deeplink by sessionId (used by frontend polling)
router.get('/sbp/session/:sessionId/link', (req, res) => {
  const { sessionId } = req.params;
  const data = sbpQrStore.get(sessionId);
  if (!data) {
    return res.status(404).json({ error: 'NOT_READY' });
  }
  return res.json(data);
});

module.exports = router;


