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
    // Кэш всех тарифов (загружаем постепенно в фоне)
    this.allPackagesCache = null;
    this.topPackagesCache = null; // топ-10 для главной
    this.cacheTimestamp = null;
    this.cacheLifetime = 30 * 60 * 1000; // 30 минут
    // Запускаем загрузку топ-10 сразу, остальное — в фоне (async, не блокирует конструктор)
    this.refreshCache().catch(err => {
      console.error('[eSIM-GO] Initial cache load failed:', err.message);
    });
  }

  // Получаем региональные категории (по одному представителю каждого региона)
  getRegionalCategories(packages) {
    if (!packages || !Array.isArray(packages)) {
      console.warn('[eSIM-GO] getRegionalCategories: invalid packages');
      return [];
    }
    
    const regions = [
      { name: 'Global - Light', nameRu: 'Весь мир – Лайт', pattern: /global.*light/i, icon: '🌍' },
      { name: 'Global - Standard', nameRu: 'Весь мир – Стандарт', pattern: /global.*standard/i, icon: '🌍' },
      { name: 'Global - Max', nameRu: 'Весь мир – Макс', pattern: /global.*max/i, icon: '🌍' },
      { name: 'Europe + USA', nameRu: 'Европа + США', pattern: /europe.*usa|usa.*europe/i, icon: '🇪🇺' },
      { name: 'South East Europe', nameRu: 'Юго-Восточная Европа', pattern: /south.*east.*europe/i, icon: '🇪🇺' },
      { name: 'Middle East', nameRu: 'Ближний Восток', pattern: /middle.*east/i, icon: '🕌' },
      { name: 'Europe + USA + Business Hubs', nameRu: 'Европа + США + Деловые центры', pattern: /europe.*usa.*business|business.*hub/i, icon: '🇪🇺' },
      { name: 'Americas + US + CA', nameRu: 'Америка + США + Канада', pattern: /americas.*us.*ca|americas/i, icon: '🌎' },
      { name: 'Africa', nameRu: 'Африка', pattern: /^africa/i, icon: '🌍' },
      { name: 'Asia', nameRu: 'Азия', pattern: /^asia/i, icon: '🌏' },
    ];

    const categories = [];
    
    for (const region of regions) {
      try {
        // Находим все пакеты этого региона
        const regionPackages = packages.filter(p => p && p.name && region.pattern.test(p.name));
        
        if (regionPackages.length > 0) {
          // Берём самый дешёвый как представителя категории
          const representative = [...regionPackages].sort((a, b) => (a.price || 0) - (b.price || 0))[0];
          categories.push({
            ...representative,
            isRegionalCategory: true,
            regionName: region.name,
            regionNameRu: region.nameRu,
            regionIcon: region.icon,
            variantsCount: regionPackages.length,
          });
        }
      } catch (err) {
        console.error('[eSIM-GO] Error processing region', region.name, ':', err.message);
      }
    }
    
    return categories;
  }

  // Умная фильтрация по приоритету: 1GB/7д → 2GB/15д → 5GB/30д → 10GB/30д → 50GB/30д → безлимит
  smartFilter(packages, limit = 10) {
    const priorities = [
      { data: 1000, validity: 7, priority: 1 },      // 1GB / 7 дней
      { data: 2000, validity: 15, priority: 2 },     // 2GB / 15 дней
      { data: 5000, validity: 30, priority: 3 },     // 5GB / 30 дней
      { data: 10000, validity: 30, priority: 4 },    // 10GB / 30 дней
      { data: 50000, validity: 30, priority: 5 },    // 50GB / 30 дней
      // Безлимит (unlimited) — определяем по ключевому слову в description
      { unlimited: true, validity: 1, priority: 6 },
      { unlimited: true, validity: 3, priority: 7 },
      { unlimited: true, validity: 5, priority: 8 },
      { unlimited: true, validity: 7, priority: 9 },
      { unlimited: true, validity: 15, priority: 10 },
      { unlimited: true, validity: 30, priority: 11 },
    ];

    const getPriority = (pkg) => {
      const isUnlimited = /unlimited|безлимит/i.test(pkg.name || '');
      const dataInMB = parseInt(pkg.data) || 0;

      for (const p of priorities) {
        if (p.unlimited && isUnlimited && pkg.validity === p.validity) {
          return p.priority;
        }
        if (!p.unlimited && dataInMB === p.data && pkg.validity === p.validity) {
          return p.priority;
        }
      }
      return 999; // Низкий приоритет для остальных
    };

    return packages
      .map(pkg => ({ ...pkg, _priority: getPriority(pkg) }))
      .sort((a, b) => {
        if (a._priority !== b._priority) return a._priority - b._priority;
        return a.price - b.price; // При равном приоритете — по цене
      })
      .slice(0, limit);
  }

  async refreshCache() {
    try {
      if (!this.apiKey) {
        console.warn('[eSIM-GO] API key not set, skipping cache refresh');
        setTimeout(() => this.refreshCache(), 60 * 1000); // Повтор через минуту
        return;
      }
      
      console.log('[eSIM-GO] Loading first page for top packages...');
      const firstPage = await this.request(`${this.paths.packages}?page=1`);
      const pageCount = firstPage.pageCount || 1;
      console.log('[eSIM-GO] Total pages:', pageCount, '| Total bundles:', firstPage.rows);
      
      // Маппим первую страницу для быстрого старта
      const mapBundle = (p) => {
        const countryIso = p.countries?.[0]?.iso || p.country || p.countryCode;
        const countryName = p.countries?.[0]?.name || p.name;
        
        // Конвертируем MB в GB для удобства отображения
        let dataDisplay = p.data || p.dataVolume || p.size;
        if (p.dataAmount) {
          const mb = p.dataAmount;
          if (mb >= 1000) {
            const gb = mb / 1000;
            // Убираем .0 если целое число
            dataDisplay = gb % 1 === 0 ? `${gb}GB` : `${gb.toFixed(1)}GB`;
          } else {
            dataDisplay = `${mb}MB`;
          }
        }
        
        return {
          id: p.name || p.id || p.packageId || p.code,
          name: p.description || p.title || p.name,
          data: dataDisplay,
          validity: p.duration || p.validity || p.days,
          country: countryIso,
          countryName: countryName,
          coverage: p.countries?.map(c => c.iso) || p.coverage || [],
          originalPrice: p.price || p.amount || p.cost,
          price: parseFloat(((p.price || p.amount || p.cost) * this.marginMultiplier).toFixed(2)),
        };
      };
      
      const firstPageMapped = (firstPage.bundles || []).map(mapBundle);
      
      // Топ региональных пакетов для главной: выбираем ОДНОГО представителя каждого региона
      const regionalCategories = this.getRegionalCategories(firstPageMapped);
      this.topPackagesCache = regionalCategories;
      console.log('[eSIM-GO] Regional categories ready:', this.topPackagesCache.length);
      
      // Загружаем остальные страницы в фоне
      let allBundles = firstPage.bundles || [];
      const batchSize = 10;
      
      for (let i = 2; i <= pageCount; i += batchSize) {
        const promises = [];
        for (let j = i; j < i + batchSize && j <= pageCount; j++) {
          promises.push(this.request(`${this.paths.packages}?page=${j}`));
        }
        const results = await Promise.all(promises);
        for (const res of results) {
          allBundles = allBundles.concat(res.bundles || []);
        }
        console.log('[eSIM-GO] Loaded pages', i, '-', Math.min(i + batchSize - 1, pageCount), '| Total:', allBundles.length);
      }
      
      // Маппим все бандлы
      this.allPackagesCache = allBundles.map(mapBundle);
      this.cacheTimestamp = Date.now();
      console.log('[eSIM-GO] Full cache refreshed:', this.allPackagesCache.length, 'packages');
      
      // Обновляем региональные категории из полного кэша
      const updatedCategories = this.getRegionalCategories(this.allPackagesCache);
      this.topPackagesCache = updatedCategories;
      console.log('[eSIM-GO] Updated regional categories:', this.topPackagesCache.length);
      
      // Планируем следующее обновление
      setTimeout(() => this.refreshCache(), this.cacheLifetime);
    } catch (e) {
      console.error('[eSIM-GO] Cache refresh failed:', e.message);
      // Повторяем через 5 минут при ошибке
      setTimeout(() => this.refreshCache(), 5 * 60 * 1000);
    }
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
      // Фоллбек: строим список стран из ПОЛНОГО каталога (не топ-10!)
      try {
        // Используем полный кэш, если доступен
        const packagesToUse = this.allPackagesCache || this.topPackagesCache || [];
        console.log('[eSIM-GO] Deriving countries from', packagesToUse.length, 'packages');
        
        const set = new Map();
        for (const p of packagesToUse) {
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
        console.log('[eSIM-GO] derived', countriesList.length, 'countries from cache');
        return { countries: countriesList };
      } catch (err) {
        console.warn('[eSIM-GO] derive countries failed:', err.message);
        return {
          countries: [
            { code: 'US', name: 'United States', flag: '🇺🇸' },
            { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
            { code: 'FR', name: 'France', flag: '🇫🇷' },
            { code: 'DE', name: 'Germany', flag: '🇩🇪' },
            { code: 'ES', name: 'Spain', flag: '🇪🇸' },
            { code: 'IT', name: 'Italy', flag: '🇮🇹' },
          ],
        };
      }
    }
  }

  // Получить все варианты региона (например, все тарифы "Global - Light")
  async getRegionPackages(regionName) {
    console.log('[eSIM-GO] Getting packages for region:', regionName);
    
    if (!this.allPackagesCache) {
      console.warn('[eSIM-GO] Cache not ready for region search');
      return { esims: [] };
    }
    
    // Находим паттерн региона
    const regionPatterns = {
      'global-light': /global.*light/i,
      'global-standard': /global.*standard/i,
      'global-max': /global.*max/i,
      'europe-usa': /europe.*usa|usa.*europe/i,
      'south-east-europe': /south.*east.*europe/i,
      'middle-east': /middle.*east/i,
      'europe-usa-business': /europe.*usa.*business|business.*hub/i,
      'americas': /americas.*us.*ca|americas/i,
      'africa': /^africa/i,
      'asia': /^asia/i,
    };
    
    const pattern = regionPatterns[regionName];
    if (!pattern) {
      console.warn('[eSIM-GO] Unknown region:', regionName);
      return { esims: [] };
    }
    
    // Фильтруем все пакеты этого региона
    const regionPackages = this.allPackagesCache.filter(p => pattern.test(p.name || ''));
    
    // Сортируем по приоритету (GB и дни)
    const sorted = this.smartFilter(regionPackages, 50);
    console.log('[eSIM-GO] Found', sorted.length, 'packages for region', regionName);
    
    return { esims: sorted };
  }

  // Получить пакеты для страны
  async getPackages(countryCode) {
    // Если страна не указана — возвращаем региональные категории
    if (!countryCode) {
      if (this.topPackagesCache) {
        console.log('[eSIM-GO] Returning regional categories');
        return { esims: this.topPackagesCache };
      }
      console.warn('[eSIM-GO] Regional categories not ready yet, falling back');
    }
    
    // Если страна указана — используем полный кэш + умную фильтрацию
    if (countryCode && this.allPackagesCache) {
      console.log('[eSIM-GO] Using full cache:', this.allPackagesCache.length, 'packages');
      const packages = this.allPackagesCache.filter(p => 
        p.country === countryCode || 
        (Array.isArray(p.coverage) && p.coverage.includes(countryCode))
      );
      console.log('[eSIM-GO] filtered to', packages.length, 'packages for', countryCode);
      
      // Применяем умную фильтрацию: топ-10 по приоритету
      const smartFiltered = this.smartFilter(packages, 10);
      console.log('[eSIM-GO] smart filtered to', smartFiltered.length, 'packages');
      return { esims: smartFiltered };
    }
    
    // Если полный кэш ещё не готов, но есть топ-10 — возвращаем топ-10 с фильтрацией
    if (countryCode && this.topPackagesCache) {
      console.warn('[eSIM-GO] Full cache not ready, using top 10 with filter');
      const packages = this.topPackagesCache.filter(p => 
        p.country === countryCode || 
        (Array.isArray(p.coverage) && p.coverage.includes(countryCode))
      );
      return { esims: packages };
    }
    
    // Фоллбек: если кэш ещё не загружен, используем старую логику (первые 50)
    console.warn('[eSIM-GO] Cache not ready, falling back to single page');
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
    // v2.5 API не имеет эндпоинта для деталей одного бандла, поэтому ищем в полном кэше
    try {
      console.log('[eSIM-GO] getPackageDetails: looking for', packageId);
      
      // Сначала ищем в полном кэше (если загружен)
      if (this.allPackagesCache) {
        const found = this.allPackagesCache.find(p => p.id === packageId);
        if (found) {
          console.log('[eSIM-GO] found in full cache:', found.name);
          return found;
        }
      }
      
      // Если нет в кэше — ищем в топ-10
      if (this.topPackagesCache) {
        const found = this.topPackagesCache.find(p => p.id === packageId);
        if (found) {
          console.log('[eSIM-GO] found in top cache:', found.name);
          return found;
        }
      }
      
      // Если кэш ещё не готов — грузим весь каталог и ищем там
      console.log('[eSIM-GO] Not in cache, searching in full catalogue...');
      const firstPage = await this.request(`${this.paths.packages}?page=1`);
      const pageCount = firstPage.pageCount || 1;
      
      for (let page = 1; page <= pageCount; page++) {
        const pageData = page === 1 ? firstPage : await this.request(`${this.paths.packages}?page=${page}`);
        const bundles = pageData.bundles || [];
        
        for (const bundle of bundles) {
          if (bundle.name === packageId) {
            console.log('[eSIM-GO] found package on page', page);
            const countryIso = bundle.countries?.[0]?.iso;
            const countryName = bundle.countries?.[0]?.name;
            return {
              id: bundle.name,
              name: bundle.description,
              data: bundle.dataAmount ? `${bundle.dataAmount}MB` : '',
              validity: bundle.duration,
              country: countryIso,
              countryName: countryName,
              coverage: bundle.countries?.map(c => c.iso) || [],
              originalPrice: bundle.price,
              price: parseFloat((bundle.price * this.marginMultiplier).toFixed(2)),
            };
          }
        }
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

