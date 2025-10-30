const express = require('express');
const crypto = require('crypto');
const router = express.Router();

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
  try {
    // Minimal fast-ack
    res.status(200).json({ ok: true });

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

    // Here: enqueue processing, ensure idempotency by event/payment id
  } catch (e) {
    console.error('[131] webhook handler error:', e.message);
    // Do not fail acknowledgment
  }
});

module.exports = router;


