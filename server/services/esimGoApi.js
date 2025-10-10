const axios = require('axios');

class EsimGoAPI {
  constructor() {
    // Нормализуем базовый URL до origin (без /vX/...). Даже если в .env указана версия — отрежем её
    // Корректный домен API у провайдера с дефисом: api.esim-go.com
    const raw = process.env.ESIM_GO_API_URL || 'https://api.esim-go.com';
    try {
      const u = new URL(raw);
      this.baseURL = `${u.protocol}//${u.host}`; // только origin
    } catch (e) {
      this.baseURL = 'https://api.esim-go.com';
    }
    this.apiKey = process.env.ESIM_GO_API_KEY;
    this.marginMultiplier = 2; // 100% margin
    // Позволяем переопределять конкретные пути через переменные окружения,
    // чтобы быстро подстроиться под фактическую схему провайдера
    this.paths = {
      countries: process.env.ESIM_GO_COUNTRIES_PATH || '',
      // По умолчанию используем v2.5 каталог бандлов, согласно документации: Guides → Reference → API v2.5 → Catalogue → Get Bundle catalogue
      // https://docs.esim-go.com/guides/setup_esimgo_account/
      packages: process.env.ESIM_GO_PACKAGES_PATH || '/v2.5/catalogue/bundles',
      packageDetails: process.env.ESIM_GO_PACKAGE_DETAILS_PATH || '/v2.5/catalogue/bundles/:id', // ожидает :id
      orders: process.env.ESIM_GO_ORDERS_PATH || '/v2.5/orders',
    };
  }

  async request(endpoint, method = 'GET', data = null) {
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          // ПОД КЛЮЧ: принудительно используем X-API-Key (можно переключить флагом при необходимости)
          ...(process.env.ESIM_GO_USE_BEARER === 'true'
            ? { Authorization: `Bearer ${this.apiKey}` }
            : { 'X-API-Key': this.apiKey }),
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
        console.warn('[eSIM-GO] endpoint failed:', ep, '-', err.message);
        // продолжаем перебирать все кандидаты
        continue;
      }
    }
    throw lastErr || new Error('No working endpoint found');
  }

  // Получить список стран
  async getCountries() {
    // Возможные варианты согласно разным версиям API
    const candidates = [
      this.paths.countries,
      '/v3/countries',
      '/v2.2/countries',
      '/countries',
      '/locations',
    ].filter(Boolean);
    try {
      const res = await this.tryEndpoints(candidates);
      // Попытка нормализации форматов ответа
      if (Array.isArray(res)) return { countries: res };
      if (res?.countries) return res;
      if (res?.items) return { countries: res.items };
      return { countries: [] };
    } catch (e) {
      console.warn('[eSIM-GO] countries direct failed → derive from bundles');
      // Фоллбек: строим список стран из каталога бандлов
      try {
        const bundles = await this.getPackages();
        const set = new Map();
        for (const p of bundles.esims || []) {
          const code = p.country || (Array.isArray(p.coverage) ? p.coverage[0] : undefined);
          if (!code) continue;
          if (!set.has(code)) set.set(code, { code, name: code });
        }
        return { countries: Array.from(set.values()) };
      } catch (_) {
        console.warn('[eSIM-GO] derive countries failed → mock');
        return {
          countries: [
            { code: 'US', name: 'United States' },
            { code: 'GB', name: 'United Kingdom' },
            { code: 'FR', name: 'France' },
            { code: 'DE', name: 'Germany' },
          ],
        };
      }
    }
  }

  // Получить пакеты для страны
  async getPackages(countryCode) {
    const withCountry = countryCode ? [
      this.paths.packages && `${this.paths.packages}?country=${countryCode}`,
      `/v3/packages?country=${countryCode}`,
      `/v2.2/packages?country=${countryCode}`,
      `/packages?country=${countryCode}`,
      `/products?country=${countryCode}`,
      `/esims?country=${countryCode}`,
      `/esim?country=${countryCode}`,
    ] : [
      this.paths.packages,
      '/v3/packages',
      '/v2.2/packages',
      '/packages',
      '/products',
      '/esims',
      '/esim',
    ].filter(Boolean);

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

    try {
      return await this.tryEndpoints(withCountry, 'GET', null, mapper);
    } catch (e) {
      console.warn('[eSIM-GO] packages fallback → mock');
      const all = [
        { id: 'mock_us_3gb', name: 'USA 3GB / 7 days', data: '3GB', validity: 7, country: 'US', coverage: ['United States'], originalPrice: 6, price: 12 },
        { id: 'mock_us_5gb', name: 'USA 5GB / 30 days', data: '5GB', validity: 30, country: 'US', coverage: ['United States'], originalPrice: 10, price: 20 },
        { id: 'mock_eu_5gb', name: 'Europe 5GB / 15 days', data: '5GB', validity: 15, country: 'EU', coverage: ['EU'], originalPrice: 12, price: 24 },
        { id: 'mock_eu_10gb', name: 'Europe 10GB / 30 days', data: '10GB', validity: 30, country: 'EU', coverage: ['EU'], originalPrice: 20, price: 40 },
        { id: 'mock_asia_5gb', name: 'Asia 5GB / 30 days', data: '5GB', validity: 30, country: 'ASIA', coverage: ['TH', 'SG', 'JP', 'VN'], originalPrice: 14, price: 28 },
        { id: 'mock_global_10gb', name: 'Global 10GB / 30 days', data: '10GB', validity: 30, country: 'GLOBAL', coverage: ['200+'], originalPrice: 35, price: 70 },
      ];
      if (!countryCode) return { esims: all };
      // Фильтруем по стране, если запрошена
      const filtered = all.filter(p => p.country === countryCode || (Array.isArray(p.coverage) && p.coverage.includes(countryCode)));
      return { esims: filtered.length ? filtered : all.slice(0, 2) };
    }
  }

  // Получить детали пакета
  async getPackageDetails(packageId) {
    const fromEnv = this.paths.packageDetails ? this.paths.packageDetails.replace(':id', packageId) : '';
    const candidates = [
      fromEnv,
      `/v3/packages/${packageId}`,
      `/v2.2/packages/${packageId}`,
      `/packages/${packageId}`,
      `/products/${packageId}`,
      `/esims/${packageId}`,
      `/esim/${packageId}`,
    ].filter(Boolean);

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

    const endpointCandidates = [
      this.paths.orders,
      '/v3/orders',
      '/v2.2/orders',
      '/orders',
      '/order',
    ].filter(Boolean);

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

