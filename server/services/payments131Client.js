const axios = require('axios');
const crypto = require('crypto');

function sanitizeAscii(value) {
  return String(value ?? '')
    .normalize('NFKC')
    // strip any non-printable or non-ASCII bytes
    .replace(/[^\x20-\x7E]/g, '')
    // collapse accidental multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePem(pem) {
  if (!pem) return '';
  // Remove surrounding quotes if someone pasted with quotes
  let value = String(pem).trim().replace(/^['"]|['"]$/g, '');
  // Support escaped newlines and Windows newlines
  value = value.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
  // Collapse accidental spaces around header/footer
  value = value.replace(/-+\s*BEGIN\s+([A-Z\s]+)\s*-+/g, (m, t) => `-----BEGIN ${t.trim()}-----`);
  value = value.replace(/-+\s*END\s+([A-Z\s]+)\s*-+/g, (m, t) => `-----END ${t.trim()}-----`);

  // If only base64 provided without headers — wrap as PKCS#8
  if (!/-----BEGIN [^-]+-----/.test(value)) {
    value = `-----BEGIN PRIVATE KEY-----\n${value}\n-----END PRIVATE KEY-----\n`;
  }

  // Ensure single trailing newline
  if (!value.endsWith('\n')) value += '\n';
  return value;
}

function formatAmount(amount) {
  if (typeof amount === 'number') {
    return Math.round(amount * 100);
  }
  if (typeof amount === 'string') {
    const numeric = Number(amount);
    if (Number.isNaN(numeric)) {
      throw new Error('Amount string must be numeric');
    }
    return Math.round(numeric * 100);
  }
  throw new Error('Amount must be string or number');
}

class Payments131Client {
  constructor() {
    this.baseURL = (process.env.PAYMENT_131_BASE_URL || '').replace(/\/$/, '');
    this.project = sanitizeAscii(process.env.PAYMENT_131_PROJECT || '');
    this.merchant = sanitizeAscii(process.env.PAYMENT_131_MERCHANT || process.env.PAYMENT_131_MERCHANT_ID || '');
    this.keyId = sanitizeAscii(process.env.PAYMENT_131_KEY_ID || process.env.PAYMENT_131_KID || '');
    this.privateKey = normalizePem(process.env.PAYMENT_131_PRIVATE_PEM || process.env.PAYMENT_131_PRIVATE_KEY || '');
    this.createPathTemplate = process.env.PAYMENT_131_FPS_CREATE_PATH || '/fps/v1/projects/{project}/orders';
    this.statusPathTemplate = process.env.PAYMENT_131_FPS_STATUS_PATH || '/fps/v1/projects/{project}/orders/{orderId}';
    this.cancelPathTemplate = process.env.PAYMENT_131_FPS_CANCEL_PATH || '';
    this.timeout = Number(process.env.PAYMENT_131_TIMEOUT_MS || 15000);

    this.http = axios.create({
      baseURL: this.baseURL,
    });
  }

  ensureConfigured() {
    const missing = [];
    if (!this.baseURL) missing.push('PAYMENT_131_BASE_URL');
    if (!this.project) missing.push('PAYMENT_131_PROJECT');
    if (!this.merchant) missing.push('PAYMENT_131_MERCHANT');
    if (!this.keyId) missing.push('PAYMENT_131_KEY_ID');
    if (!this.privateKey) missing.push('PAYMENT_131_PRIVATE_PEM');

    if (missing.length) {
      throw new Error(`131 FPS client misconfigured. Missing env: ${missing.join(', ')}`);
    }
  }

  buildHeaders({ method, path, body }) {
    const requestId = crypto.randomUUID();
    const payload = body
      ? typeof body === 'string'
        ? body
        : JSON.stringify(body)
      : '';

    // Try to parse the private key early to provide clear error messages
    let privateKeyObject;
    try {
      const keyHeaderMatch = (this.privateKey || '').match(/-----BEGIN ([A-Z\s]+)-----/);
      const keyHeader = keyHeaderMatch ? keyHeaderMatch[1].trim() : 'UNKNOWN';
      if (/ENCRYPTED/i.test(keyHeader)) {
        const err = new Error(
          'Encrypted private key is not supported. Please provide an unencrypted PKCS#8 or PKCS#1 PEM.'
        );
        err.details = {
          tip: 'Run: openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in encrypted.pem -out key.pem',
        };
        throw err;
      }
      privateKeyObject = crypto.createPrivateKey({
        key: this.privateKey,
        format: 'pem',
      });
    } catch (e) {
      const header = (this.privateKey || '').match(/-----BEGIN [^-]+-----/)?.[0] || 'NO HEADER';
      const snippet = (this.privateKey || '').split('\n').slice(0, 2).join('\\n');
      const err = new Error(`Private key parse failed: ${e.message}`);
      err.details = { header, snippet };
      throw err;
    }

    // Build base headers object (no HTTP Signature, only body signature in X-PARTNER-SIGN)
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Request-Id': requestId,
      'X-PARTNER-MERCHANT': this.merchant,
      'X-PARTNER-PROJECT': this.project,
    };

    // Sign raw JSON payload with RSA-SHA256 and send base64 signature in X-PARTNER-SIGN
    let signature;
    try {
      const signer = crypto.createSign('RSA-SHA256');
      signer.update(payload, 'utf8');
      signer.end();
      signature = signer.sign(privateKeyObject, 'base64');
    } catch (e) {
      const err = new Error(`Signing failed: ${e.message}`);
      err.details = { reason: 'Probably wrong PEM format or encrypted key' };
      throw err;
    }

    headers['X-PARTNER-SIGN'] = sanitizeAscii(signature);

    if (process.env.PAYMENT_131_DEBUG === 'true') {
      console.log('[131] Signing payload (JSON body only):', payload.slice(0, 200));
      console.log('[131] Signature (base64):', signature.slice(0, 50) + '...');
      // Store for debug endpoint
      this.__lastSigningString = payload;
      this.__lastSignatureHeader = headers['X-PARTNER-SIGN'];
    }

    return { headers, requestId };
  }

  resolvePath(template, variables = {}) {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      if (key === 'project') {
        return encodeURIComponent(this.project);
      }
      if (variables[key] !== undefined) {
        return encodeURIComponent(String(variables[key]));
      }
      throw new Error(`Missing variable ${key} for path template ${template}`);
    });
  }

  async request(method, path, body) {
    this.ensureConfigured();

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const { headers } = this.buildHeaders({ method, path: normalizedPath, body });
    const payload = typeof body === 'string' ? body : body ? JSON.stringify(body) : undefined;

    if (process.env.PAYMENT_131_DEBUG === 'true') {
      this.__lastDebug = {
        method,
        path: normalizedPath,
        payload,
        headersSnapshot: {
          'X-PARTNER-PROJECT': headers['X-PARTNER-PROJECT'],
          'X-PARTNER-SIGN': headers['X-PARTNER-SIGN'],
        },
      };
      console.log('[131] request', {
        method,
        path: normalizedPath,
        hasPayload: Boolean(payload),
        payloadPreview: payload ? payload.slice(0, 200) : null,
        payloadLength: payload?.length || 0,
        headers: {
          'X-PARTNER-PROJECT': headers['X-PARTNER-PROJECT'],
          'X-PARTNER-SIGN': headers['X-PARTNER-SIGN']?.slice(0, 16) + '...',
        },
      });
    }

    try {
      const response = await this.http.request({
        method,
        url: normalizedPath,
        data: payload,
        headers,
        timeout: this.timeout,
      });

      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const details = error.response?.data;
      const message = error.message || 'HTTP request failed';
      const err = new Error(`[131] ${method.toUpperCase()} ${normalizedPath} failed (${status || 'no status'}): ${message}`);
      err.statusCode = status;
      err.details = details;
      throw err;
    }
  }

  async createSbpPayment({
    amount,
    currency = 'RUB',
    orderId,
    description,
    successUrl,
    failUrl,
    metadata,
    customer,
    extra,
  }) {
    if (!amount) {
      throw new Error('Amount is required for 131 SBP payment');
    }

    const paymentDetails = {
      type: 'faster_payment_system',
      faster_payment_system: {
        description: description || `Order ${orderId}`,
      },
    };

    const customerRef =
      (customer && customer.reference) || orderId || `ewave_${Date.now()}`;

    const payload = {
      payment_details: paymentDetails,
      amount_details: {
        amount: formatAmount(amount),
        currency: (currency || 'RUB').toLowerCase(),
      },
      customer: customer || { reference: customerRef },
      ...extra,
    };

    // Очистка undefined полей
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === null) {
        delete payload[key];
      }
    });

    const payloadString = JSON.stringify(payload);

    // Step 1: create payment session (per docs payment-fps-qr)
    const createResponse = await this.request('post', '/api/v1/session/create', payloadString);

    const sessionId = createResponse?.session?.id;
    if (!sessionId) {
      // If bank didn't return session, just bubble raw response
      return { status: 'error', error: { description: '131 did not return session id', code: 'no_session' }, raw: createResponse };
    }

    // Step 2: start payment for this session (per typical flow for SBP)
    // According to docs, session/start/payment can (optionally) receive the same payment_details,
    // amount_details, customer and payment_options.return_url.
    const startBody = {
      session_id: sessionId,
      payment_details: paymentDetails,
      amount_details: payload.amount_details,
      customer: payload.customer,
      payment_options: successUrl ? { return_url: successUrl } : undefined,
    };

    // Remove undefined fields
    Object.keys(startBody).forEach((key) => {
      if (startBody[key] === undefined) {
        delete startBody[key];
      }
    });

    const startResponse = await this.request('post', '/api/v1/session/start/payment', JSON.stringify(startBody));

    // Try to extract QR deeplink for SBP payments when bank is configured for payment-fps-qr
    const qrDeeplink =
      startResponse?.session?.customer_interaction?.inform?.qr?.content ||
      startResponse?.session?.customer_interaction?.inform?.fps_qr?.content;

    return {
      orderId: orderId || customerRef,
      sessionId,
      status: startResponse?.status || createResponse?.status,
      paymentUrl: qrDeeplink,
      qrDeeplink,
      session: startResponse?.session || createResponse?.session,
      raw: {
        createResponse,
        startResponse,
      },
    };
  }

  async getSbpPaymentStatus(sessionId) {
    if (!sessionId) {
      throw new Error('sessionId is required to fetch 131 SBP payment status');
    }

    const path = `/api/v1/session/${sessionId}/status`;
    return this.request('get', path);
  }

  async cancelSbpPayment(orderId, reason) {
    if (!this.cancelPathTemplate) {
      throw new Error('Cancel path is not configured for 131 SBP');
    }
    const path = this.resolvePath(this.cancelPathTemplate, { orderId });
    const payload = reason ? { reason } : undefined;
    return this.request('post', path, payload);
  }
}

const clientInstance = new Payments131Client();
module.exports = clientInstance;



// Updated 1763467838
