const axios = require('axios');
const crypto = require('crypto');

function normalizePem(pem) {
  if (!pem) return '';
  const hydrated = pem.trim().replace(/\\n/g, '\n');
  if (hydrated.includes('BEGIN')) {
    return hydrated.endsWith('\n') ? hydrated : `${hydrated}\n`;
  }
  return `-----BEGIN PRIVATE KEY-----\n${hydrated}\n-----END PRIVATE KEY-----\n`;
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
    this.project = process.env.PAYMENT_131_PROJECT || '';
    this.merchant = process.env.PAYMENT_131_MERCHANT || process.env.PAYMENT_131_MERCHANT_ID || '';
    this.keyId = process.env.PAYMENT_131_KEY_ID || process.env.PAYMENT_131_KID || '';
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

    const headers = {
      'Content-Type': 'application/json',
      Date: dateHeader,
      'X-Request-Id': requestId,
      Merchant: this.merchant,
      Project: this.project,
    };

    const headersList = ['(request-target)', 'date', 'x-request-id', 'merchant', 'project'];

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
          case 'merchant':
            return `merchant: ${this.merchant}`;
          case 'project':
            return `project: ${this.project}`;
          default:
            return '';
        }
      })
      .filter(Boolean)
      .join('\n');

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signingString);
    signer.end();

    const signature = signer.sign(this.privateKey, 'base64');
    headers.Signature = `keyId="${this.keyId}",algorithm="rsa-sha256",headers="${headersList.join(' ')}",signature="${signature}"`;

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

    const path = this.resolvePath(this.createPathTemplate, { orderId });

    const payload = {
      order: {
        id: orderId,
        description: description || `Order ${orderId}`,
      },
      amount: {
        value: formatAmount(amount),
        currency,
      },
      payment_method: 'SBP',
      success_url: successUrl,
      fail_url: failUrl,
      customer,
      metadata,
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

  async getSbpPaymentStatus(orderId) {
    if (!orderId) {
      throw new Error('orderId is required to fetch 131 SBP payment status');
    }

    const path = this.resolvePath(this.statusPathTemplate, { orderId });
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


