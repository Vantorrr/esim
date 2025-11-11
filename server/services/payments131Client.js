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
    return amount.toFixed(2);
  }
  if (typeof amount === 'string') {
    return amount;
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
    const lowerMethod = method.toLowerCase();
    const requestId = crypto.randomUUID();
    const dateHeader = new Date().toUTCString();
    const payload = body ? JSON.stringify(body) : '';

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

    const headers = {
      'Content-Type': 'application/json',
      Date: dateHeader,
      'X-Request-Id': requestId,
      'X-PARTNER-MERCHANT': this.merchant,
      'X-PARTNER-PROJECT': this.project,
    };

    const headersList = ['(request-target)', 'date', 'x-request-id', 'x-partner-merchant', 'x-partner-project'];

    if (payload) {
      const digest = `SHA-256=${crypto.createHash('sha256').update(payload).digest('base64')}`;
      headers.Digest = digest;
      headersList.splice(2, 0, 'digest');
    }

    const signingString = headersList
      .map((headerName) => {
        switch (headerName) {
          case '(request-target)':
            return `${headerName}: ${lowerMethod} ${path}`;
          case 'date':
            return `date: ${dateHeader}`;
          case 'digest':
            return `digest: ${headers.Digest}`;
          case 'x-request-id':
            return `x-request-id: ${requestId}`;
          case 'x-partner-merchant':
            return `x-partner-merchant: ${this.merchant}`;
          case 'x-partner-project':
            return `x-partner-project: ${this.project}`;
          default:
            return '';
        }
      })
      .filter(Boolean)
      .join('\n');

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signingString);
    signer.end();

    let signature;
    try {
      signature = signer.sign(privateKeyObject, 'base64');
    } catch (e) {
      const err = new Error(`Signing failed: ${e.message}`);
      err.details = { reason: 'Probably wrong PEM format or encrypted key' };
      throw err;
    }
    // Build signature header and sanitize any accidental CR/LF from env vars
    const signatureHeader = sanitizeAscii(
      `keyId="${this.keyId}",algorithm="rsa-sha256",headers="${headersList.join(' ')}",signature="${signature}"`
    ).replace(/[\r\n]+/g, '');
    // Some specs use 'Signature', some use 'X-PARTNER-SIGN' — send both
    headers['Signature'] = signatureHeader;
    headers['X-PARTNER-SIGN'] = signatureHeader;

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

    try {
      const response = await this.http.request({
        method,
        url: normalizedPath,
        data: body,
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
    if (!orderId) {
      throw new Error('orderId is required for 131 SBP payment');
    }

    // Use /api/v1/session/init/payment for accepting payments via SBP
    const path = '/api/v1/session/init/payment';

    const payload = {
      merchant_order_id: orderId,
      description: description || `Order ${orderId}`,
      amount_details: {
        amount: formatAmount(amount),
        currency,
      },
      payment_method: {
        type: 'sbp',
      },
      customer: customer || {},
      metadata: metadata || {},
      ...extra,
    };

    // Очистка undefined полей
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === null) {
        delete payload[key];
      }
    });

    return this.request('post', path, payload);
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

module.exports = new Payments131Client();



