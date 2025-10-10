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
      // Правильный путь к каталогу: /v2.5/catalogue (возвращает {"bundles":[...]})
      packages: process.env.ESIM_GO_PACKAGES_PATH || '/v2.5/catalogue',
      packageDetails: process.env.ESIM_GO_PACKAGE_DETAILS_PATH || '/v2.5/catalogue/:id', // ожидает :id (name бандла)
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
        console.log('[eSIM-GO] getPackages returned:', bundles?.esims?.length || 0, 'packages');
        const set = new Map();
        for (const p of bundles.esims || []) {
          const code = p.country || (Array.isArray(p.coverage) ? p.coverage[0] : undefined);
          if (!code) continue;
          if (!set.has(code)) {
            // Генерируем emoji флаг из ISO кода (например, US → 🇺🇸)
            const flag = code.length === 2 
              ? String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)))
              : '🌐';
            set.set(code, { 
              code, 
              name: p.countryName || code,
              flag 
            });
          }
        }
        const countriesList = Array.from(set.values());
        console.log('[eSIM-GO] derived', countriesList.length, 'countries from bundles');
        return { countries: countriesList };
      } catch (err) {
        console.warn('[eSIM-GO] derive countries failed:', err.message);
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
      // адаптируем разные структуры ответов: v2.5 возвращает {"bundles": [...]}
      let items = resp?.bundles || resp?.packages || resp?.esims || resp?.items || resp;
      if (!Array.isArray(items)) items = items?.data || [];
      console.log('[eSIM-GO] mapper received', items.length, 'items');
      const mapped = items.map((p) => {
        // Извлекаем ISO коды стран из массива countries
        const countryIso = p.countries?.[0]?.iso || p.country || p.countryCode;
        const countryName = p.countries?.[0]?.name || p.name;
        return {
          id: p.name || p.id || p.packageId || p.code, // в v2.5 id = name (например, "esim_1GB_7D_AD_V2")
          name: p.description || p.title || p.name,
          data: p.dataAmount ? `${p.dataAmount}MB` : (p.data || p.dataVolume || p.size),
          validity: p.duration || p.validity || p.days,
          country: countryIso,
          countryName: countryName, // сохраняем имя страны для countries list
          coverage: p.countries?.map(c => c.iso) || p.coverage || [],
          originalPrice: p.price || p.amount || p.cost,
          price: parseFloat(((p.price || p.amount || p.cost) * this.marginMultiplier).toFixed(2)),
        };
      });
      console.log('[eSIM-GO] mapped to', mapped.length, 'esims');
      return { esims: mapped };
    };

    try {
      const result = await this.tryEndpoints(withCountry, 'GET', null, mapper);
      // API v2.5 не фильтрует по country параметру, делаем фильтрацию на сервере
      if (countryCode && result.esims) {
        console.log('[eSIM-GO] filtering', result.esims.length, 'packages by country:', countryCode);
        const filtered = result.esims.filter(p => 
          p.country === countryCode || 
          (Array.isArray(p.coverage) && p.coverage.includes(countryCode))
        );
        console.log('[eSIM-GO] filtered down to', filtered.length, 'packages');
        return { esims: filtered };
      }
      return result;
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
    // v2.5 API не имеет эндпоинта для деталей одного бандла, поэтому берём из каталога
    try {
      console.log('[eSIM-GO] getPackageDetails: looking for', packageId, 'in catalogue');
      const allPackages = await this.getPackages();
      const found = allPackages.esims.find(p => p.id === packageId);
      if (found) {
        console.log('[eSIM-GO] found package in catalogue:', found.name);
        return found;
      }
      throw new Error(`Package ${packageId} not found in catalogue`);
    } catch (e) {
      console.warn('[eSIM-GO] getPackageDetails failed:', e.message);
      throw e;
    }
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

