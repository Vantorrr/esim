const axios = require('axios');

class EsimGoAPI {
  constructor() {
    // Позволяем конфигурировать базовый URL и версию из .env
    // По умолчанию используем корневой URL, т.к. у провайдера могли измениться версии
    this.baseURL = process.env.ESIM_GO_API_URL || 'https://api.esim-go.com';
    this.apiKey = process.env.ESIM_GO_API_KEY;
    this.marginMultiplier = 2; // 100% margin
  }

  async request(endpoint, method = 'GET', data = null) {
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          // Согласно документации некоторые интеграции требуют Bearer
          // Сохраняем совместимость: если явно указана ESIM_GO_USE_X_API_KEY, используем старый заголовок
          ...(process.env.ESIM_GO_USE_X_API_KEY === 'true'
            ? { 'X-API-Key': this.apiKey }
            : { Authorization: `Bearer ${this.apiKey}` }),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const payload = error.response?.data || error.message;
      console.error('eSIM-GO API Error:', payload);
      throw new Error(error.response?.data?.message || 'API request failed');
    }
  }

  // Универсальный перебор кандидатов эндпоинтов (у провайдера могли меняться пути)
  async tryEndpoints(candidates, method = 'GET', data = null, mapper = (x) => x) {
    let lastErr = null;
    for (const ep of candidates) {
      try {
        const res = await this.request(ep, method, data);
        return mapper(res);
      } catch (err) {
        lastErr = err;
        // продолжаем, если Not Found — пробуем следующий эндпоинт
        if (!/not\s*found/i.test(err.message)) break; // если не 404 — выходим
      }
    }
    throw lastErr || new Error('No working endpoint found');
  }

  // Получить список стран
  async getCountries() {
    // Возможные варианты согласно разным версиям API
    const candidates = ['/v2.2/countries', '/v3/countries', '/countries', '/locations'];
    return this.tryEndpoints(candidates);
  }

  // Получить пакеты для страны
  async getPackages(countryCode) {
    const withCountry = countryCode ? [
      `/v3/packages?country=${countryCode}`,
      `/v2.2/packages?country=${countryCode}`,
      `/packages?country=${countryCode}`,
      `/esim?country=${countryCode}`,
    ] : [
      '/v3/packages',
      '/v2.2/packages',
      '/packages',
      '/esim',
    ];

    const mapper = (resp) => {
      // адаптируем разные структуры ответов
      let items = resp?.packages || resp?.esims || resp?.items || resp;
      if (!Array.isArray(items)) items = items?.data || [];
      const mapped = items.map((p) => ({
        id: p.id || p.packageId || p.code,
        name: p.name || p.title,
        data: p.data || p.dataVolume || p.size,
        validity: p.validity || p.days || p.duration,
        country: p.country || p.countryCode,
        coverage: p.coverage || p.countries || [],
        originalPrice: p.price || p.amount || p.cost,
        price: parseFloat(((p.price || p.amount || p.cost) * this.marginMultiplier).toFixed(2)),
      }));
      return { esims: mapped };
    };

    return this.tryEndpoints(withCountry, 'GET', null, mapper);
  }

  // Получить детали пакета
  async getPackageDetails(packageId) {
    const candidates = [
      `/v3/packages/${packageId}`,
      `/v2.2/packages/${packageId}`,
      `/packages/${packageId}`,
      `/esim/${packageId}`,
    ];

    const mapper = (p) => {
      const price = p.price || p.amount || p.cost;
      return {
        id: p.id || p.packageId || p.code,
        name: p.name || p.title,
        data: p.data || p.dataVolume || p.size,
        validity: p.validity || p.days || p.duration,
        country: p.country || p.countryCode,
        coverage: p.coverage || p.countries || [],
        originalPrice: price,
        price: parseFloat((price * this.marginMultiplier).toFixed(2)),
      };
    };

    return this.tryEndpoints(candidates, 'GET', null, mapper);
  }

  // Создать заказ
  async createOrder(packageId, quantity = 1) {
    const payloadCandidates = [
      { type: 'sim', quantity, package: packageId },
      { quantity, packageId },
      { items: [{ packageId, quantity }] },
    ];

    const endpointCandidates = ['/v3/orders', '/v2.2/orders', '/orders', '/order'];

    let lastErr = null;
    for (const body of payloadCandidates) {
      try {
        const res = await this.tryEndpoints(endpointCandidates, 'POST', body);
        return res;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('Order creation failed');
  }

  // Получить информацию о заказе
  async getOrder(orderId) {
    const data = await this.request(`/orders/${orderId}`);
    return data;
  }

  // Получить список заказов
  async getOrders() {
    const data = await this.request('/orders');
    return data;
  }

  // Получить QR код и данные активации
  async getOrderQR(orderId) {
    const order = await this.getOrder(orderId);
    
    if (order.esims && order.esims.length > 0) {
      const esim = order.esims[0];
      return {
        iccid: esim.iccid,
        smdpAddress: esim.smdpAddress,
        activationCode: esim.activationCode,
        qrCode: esim.qrCode,
        qrCodeUrl: esim.qrCodeUrl,
      };
    }
    
    throw new Error('eSIM data not available yet');
  }
}

module.exports = new EsimGoAPI();

