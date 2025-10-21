const axios = require('axios');
const cacheRepo = require('./cacheRepo');
const { getStaticCoverageByName } = require('./staticCoverage');

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

    // Попробуем поднять кэш из БД мгновенно
    this.restoreFromSnapshot().finally(() => {
      // Запускаем обновление в фоне (не блокирует запуск)
      this.refreshCache().catch(err => {
        console.error('[eSIM-GO] Initial cache load failed:', err.message);
      });
    });
  }

  async restoreFromSnapshot() {
    try {
      // Если установлен флаг принудительного обновления - пропускаем восстановление из БД
      if (process.env.FORCE_CACHE_REBUILD === 'true') {
        console.log('[eSIM-GO] FORCE_CACHE_REBUILD=true, skipping DB restore');
        return;
      }
      
      const snap = await cacheRepo.getSnapshot('catalogue_v2_5');
      if (snap && Array.isArray(snap.data) && snap.data.length > 0) {
        // Проверяем, правильный ли формат coverage (должны быть ISO-коды, а не названия)
        const samplePkg = snap.data.find(p => p.coverage && p.coverage.length > 0);
        const hasBadCoverage = samplePkg && samplePkg.coverage[0]?.length > 3; // если > 3 символов — это не ISO
        
        if (hasBadCoverage) {
          console.log('[eSIM-GO] Old snapshot format detected, will rebuild on next refresh cycle');
          // Используем старый кэш временно, но сразу запустим обновление
          this.allPackagesCache = snap.data;
          this.cacheTimestamp = 0; // force immediate refresh
        } else {
          this.allPackagesCache = snap.data;
          this.cacheTimestamp = snap.updatedAt?.getTime?.() || Date.now();
        }
        
        // Для главной — региональные категории из кэша
        const regionalCategories = this.getRegionalCategories(this.allPackagesCache);
        this.topPackagesCache = regionalCategories.length > 0 ? regionalCategories : this.allPackagesCache.slice(0, 10);
        console.log('[eSIM-GO] Restored cache from DB snapshot:', this.allPackagesCache.length, 'packages');
      } else {
        console.log('[eSIM-GO] No DB snapshot found');
      }
    } catch (err) {
      console.warn('[eSIM-GO] restoreFromSnapshot failed:', err.message);
    }
  }

  // Получаем региональные категории (по одному представителю каждого региона)
  getRegionalCategories(packages) {
    if (!packages || !Array.isArray(packages)) {
      console.warn('[eSIM-GO] getRegionalCategories: invalid packages');
      return [];
    }
    
    console.log('[eSIM-GO] getRegionalCategories called with', packages.length, 'packages');
    
    // Региональные пакеты с заданным порядком показа (чтобы Global не шли подряд)
    const regions = [
      { order: 1,  name: 'Global - Light',        nameRu: 'Весь мир – Лайт',        pattern: /global.*light/i,     icon: '🌍' },
      { order: 2,  name: 'Europe + USA',          nameRu: 'Европа + США',           pattern: /europe.*usa|europe.*us[^a-z]/i, icon: '🇪🇺' },
      { order: 3,  name: 'Middle East',           nameRu: 'Ближний Восток',          pattern: /middle.*east/i,      icon: '🕌' },
      { order: 4,  name: 'Global - Standard',     nameRu: 'Весь мир – Стандарт',     pattern: /global.*standard/i,  icon: '🌍' },
      { order: 5,  name: 'Asia',                  nameRu: 'Азия',                    pattern: /asia/i,              icon: '🌏' },
      { order: 6,  name: 'Americas',              nameRu: 'Америка',                 pattern: /americas/i,          icon: '🌎' },
      { order: 7,  name: 'Africa',                nameRu: 'Африка',                  pattern: /africa/i,            icon: '🌍' },
      { order: 8,  name: 'Europe + Business Hubs',nameRu: 'Европа + Деловые центры', pattern: /europe.*business|business.*hub/i, icon: '🇪🇺' },
      { order: 9,  name: 'South East Europe',     nameRu: 'Юго-Восточная Европа',    pattern: /south.*east.*europe/i, icon: '🇪🇺' },
      { order: 10, name: 'Global - Max',          nameRu: 'Весь мир – Макс',         pattern: /global.*max/i,       icon: '🌍' },
    ];

    const categories = [];
    
    for (const region of regions) {
      try {
        // Ищем по паттерну в названии (description)
        const regionPackages = packages.filter(p => p && p.name && region.pattern.test(p.name));
        
        console.log(`[eSIM-GO] Checking region "${region.nameRu}": found ${regionPackages.length} packages`);
        if (regionPackages.length > 0 && regionPackages[0].coverage) {
          console.log(`[eSIM-GO] Sample coverage for "${region.nameRu}":`, regionPackages[0].coverage?.slice(0, 5), `(${regionPackages[0].coverage?.length} total)`);
        }
        
        if (regionPackages.length > 0) {
          // Предпочитаем НЕ безлимитные пакеты как представителя
          const limited = regionPackages.filter(p => !/unlimited|безлимит/i.test((p.data || '') + ' ' + (p.name || '')));
          const pool = limited.length > 0 ? limited : regionPackages;
          const representative = [...pool].sort((a, b) => (a.price || 0) - (b.price || 0))[0];
          // Собираем агрегированное покрытие региона (уникальные ISO)
          const coverageSet = new Set();
          for (const rp of regionPackages) {
            if (Array.isArray(rp.coverage) && rp.coverage.length > 0) {
              for (const iso of rp.coverage) {
                if (iso && typeof iso === 'string') coverageSet.add(iso);
              }
            }
          }
          
          let finalCoverage = Array.from(coverageSet);
          // Если покрытие пустое или содержит не-ISO (длинные строки), подставим статический список
          const looksBad = finalCoverage.length === 0 || (finalCoverage[0] && finalCoverage[0].length > 3);
          if (looksBad) {
            const staticList = getStaticCoverageByName(region.name) || getStaticCoverageByName(region.nameRu);
            if (staticList && staticList.length) {
              finalCoverage = staticList;
              console.log(`[eSIM-GO] Using static coverage for "${region.nameRu}":`, finalCoverage.length);
            }
          }
          console.log(`[eSIM-GO] Region "${region.nameRu}": ${regionPackages.length} packages → ${finalCoverage.length} countries`);
          
          categories.push({
            ...representative,
            isRegionalCategory: true,
            regionName: region.name,
            regionNameRu: region.nameRu,
            regionIcon: region.icon,
            variantsCount: regionPackages.length,
            _order: region.order || 999,
            regionCoverage: finalCoverage,
          });
        }
      } catch (err) {
        console.error('[eSIM-GO] Error processing region', region.name, ':', err.message);
      }
    }
    
    // Сортируем по заданному порядку
    const sorted = categories.sort((a, b) => (a._order || 999) - (b._order || 999));
    console.log('[eSIM-GO] Found', sorted.length, 'regional categories from', packages.length, 'packages');
    return sorted;
  }

  // Умная фильтрация: сперва приоритетные ограниченные пакеты, затем безлимит
  smartFilter(packages, opts = {}) {
    const { limit = 10, reserveUnlimited = true, maxUnlimited = 6, ensure7Days = true } = opts;
    // Помощники
    const parseDataToMb = (dataStr) => {
      if (!dataStr) return 0;
      if (/unlimited|безлимит/i.test(dataStr)) return -1; // маркер безлимита
      const m = String(dataStr).match(/(\d+(?:\.\d+)?)\s*(GB|MB)/i);
      if (!m) return 0;
      const value = parseFloat(m[1]);
      const unit = m[2].toUpperCase();
      return unit === 'GB' ? Math.round(value * 1000) : Math.round(value);
    };

    const priorities = [
      { dataMb: 1000, validity: 7, order: 1 },   // 1GB/7
      { dataMb: 2000, validity: 15, order: 2 },  // 2GB/15
      { dataMb: 5000, validity: 30, order: 3 },  // 5GB/30
      { dataMb: 10000, validity: 30, order: 4 }, // 10GB/30
      { dataMb: 50000, validity: 30, order: 5 }, // 50GB/30
    ];

    const unlimitedValidityOrder = [1, 3, 5, 7, 15, 30];

    const limited = [];
    const unlimited = [];

    for (const pkg of packages) {
      const dataMb = parseDataToMb(pkg.data);
      if (dataMb === -1) {
        unlimited.push(pkg);
      } else {
        // Вычисляем приоритет для ограниченных
        let pr = 999;
        for (const p of priorities) {
          if (dataMb === p.dataMb && pkg.validity === p.validity) {
            pr = p.order;
            break;
          }
        }
        limited.push({ ...pkg, _priority: pr });
      }
    }

    const limitedSorted = limited
      .sort((a, b) => (a._priority !== b._priority ? a._priority - b._priority : a.price - b.price))
      .map(({ _priority, ...rest }) => rest);

    const unlimitedSorted = unlimited
      .sort((a, b) => {
        const ai = unlimitedValidityOrder.indexOf(a.validity);
        const bi = unlimitedValidityOrder.indexOf(b.validity);
        if (ai !== bi) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        return a.price - b.price;
      });

    // Гарантируем присутствие безлимитов в выдаче
    if (reserveUnlimited && unlimitedSorted.length > 0) {
      const reserved = Math.min(unlimitedSorted.length, maxUnlimited, limit);
      const limitedCap = Math.max(0, limit - reserved);
      let firstLimited = limitedSorted.slice(0, limitedCap);

      // Гарантируем один 7-дневный ограниченный тариф (если есть)
      if (ensure7Days && limitedSorted.length > 0) {
        const seven = [...limitedSorted]
          .filter(p => Number(p.validity) === 7)
          .sort((a, b) => (a.price - b.price))[0];
        if (seven) {
          const already = firstLimited.find(p => p.id === seven.id);
          if (!already) {
            if (firstLimited.length < limitedCap) {
              firstLimited = [seven, ...firstLimited];
            } else if (firstLimited.length > 0) {
              // заменяем самый дорогой в limited на 7-дневный
              const maxIdx = firstLimited.reduce((mi, p, i, arr) => (p.price > arr[mi].price ? i : mi), 0);
              firstLimited[maxIdx] = seven;
            }
          }
        }
      }
      const firstUnlimited = unlimitedSorted.slice(0, reserved);
      return [...firstLimited, ...firstUnlimited];
    }

    let result = [...limitedSorted, ...unlimitedSorted];
    // Без резервирования безлимитов — всё равно постараемся добавить 7 дней
    if (ensure7Days) {
      const seven = [...limitedSorted]
        .filter(p => Number(p.validity) === 7)
        .sort((a, b) => (a.price - b.price))[0];
      if (seven) {
        const inResult = result.slice(0, limit).find(p => p.id === seven.id);
        if (!inResult) {
          result = [seven, ...result.filter(p => p.id !== seven.id)];
        }
      }
    }
    return result.slice(0, limit);
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
        
        // DEBUG: проверяем структуру countries для первого глобального пакета
        if (p.description && /global.*light/i.test(p.description) && !this._loggedGlobalSample) {
          console.log('[eSIM-GO] Sample Global-Light bundle:', {
            description: p.description,
            countries: p.countries,
            coverage: p.coverage,
          });
          this._loggedGlobalSample = true;
        }
        
        // Конвертируем MB в GB для удобства отображения
        let dataDisplay = '';
        
        if (typeof p.dataAmount === 'number') {
          if (p.dataAmount === -1) {
            // Unlimited пакеты имеют dataAmount = -1
            dataDisplay = 'Безлимит';
          } else if (p.dataAmount >= 1000) {
            const gb = p.dataAmount / 1000;
            dataDisplay = gb % 1 === 0 ? `${gb}GB` : `${gb.toFixed(1)}GB`;
          } else if (p.dataAmount > 0) {
            dataDisplay = `${p.dataAmount}MB`;
          } else {
            dataDisplay = '1GB';
          }
        } else {
          // Фоллбек: парсим из description
          const desc = p.description || p.name || '';
          const match = desc.match(/(\d+)\s*(GB|MB)/i);
          if (match) {
            const value = parseInt(match[1]);
            const unit = match[2].toUpperCase();
            dataDisplay = unit === 'GB' ? `${value}GB` : (value >= 1000 ? `${value/1000}GB` : `${value}MB`);
          } else if (/unlimited|безлимит/i.test(desc)) {
            dataDisplay = 'Безлимит';
          } else {
            dataDisplay = '1GB';
          }
        }
        
        // Правильно извлекаем coverage: если есть countries с iso — берём их, иначе []
        let coverageList = [];
        if (Array.isArray(p.countries) && p.countries.length > 0 && p.countries[0]?.iso) {
          coverageList = p.countries.map(c => c.iso).filter(Boolean);
        }
        
        return {
          id: p.name || p.id || p.packageId || p.code,
          name: p.description || p.title || p.name,
          data: dataDisplay,
          validity: p.duration || p.validity || p.days,
          country: countryIso,
          countryName: countryName,
          coverage: coverageList,
          originalPrice: p.price || p.amount || p.cost,
          price: parseFloat(((p.price || p.amount || p.cost) * this.marginMultiplier).toFixed(2)),
        };
      };
      
      // Первая страница как начальный кэш
      const firstPageMapped = (firstPage.bundles || []).map(mapBundle);
      if (!this.allPackagesCache || (this.allPackagesCache && this.allPackagesCache.length === 0)) {
        this.allPackagesCache = firstPageMapped;
      }
      if (!this.topPackagesCache || this.topPackagesCache.length === 0) {
        this.topPackagesCache = firstPageMapped.slice(0, 10);
      }
      console.log('[eSIM-GO] Initial cache ready:', this.topPackagesCache.length, 'packages');
      
      // Загружаем остальные страницы МЕДЛЕННО в фоне (по 1 странице каждые 500ms)
      let allBundles = firstPage.bundles || [];
      
      console.log('[eSIM-GO] Starting background loading of remaining', pageCount - 1, 'pages...');
      
      const loadNextPage = async (pageNum) => {
        if (pageNum > pageCount) {
          // Все страницы загружены
          const allMapped = allBundles.map(mapBundle);
          
          // Убираем дубликаты (одинаковый name + data + validity, оставляем самый дешёвый)
          const uniqueMap = new Map();
          for (const pkg of allMapped) {
            const key = `${pkg.name}_${pkg.data}_${pkg.validity}`;
            const existing = uniqueMap.get(key);
            if (!existing || pkg.price < existing.price) {
              uniqueMap.set(key, pkg);
            }
          }
          
          this.allPackagesCache = Array.from(uniqueMap.values());
          this.cacheTimestamp = Date.now();
          console.log('[eSIM-GO] Full cache completed:', allMapped.length, '→', this.allPackagesCache.length, 'unique packages');
          
          // Сохраняем снапшот в БД для мгновенного старта при следующих рестартах
          cacheRepo.saveSnapshot('catalogue_v2_5', this.allPackagesCache).then((ok) => {
            if (ok) console.log('[eSIM-GO] Snapshot saved to DB');
          });
          
          // Формируем региональные категории из ПОЛНОГО кэша
          const regionalCategories = this.getRegionalCategories(this.allPackagesCache);
          if (regionalCategories.length > 0) {
            this.topPackagesCache = regionalCategories;
            console.log('[eSIM-GO] Regional categories updated:', this.topPackagesCache.length);
          }
          
          // Планируем следующее обновление через 30 минут
          setTimeout(() => this.refreshCache(), this.cacheLifetime);
          return;
        }
        
        try {
          const pageData = await this.request(`${this.paths.packages}?page=${pageNum}`);
          allBundles = allBundles.concat(pageData.bundles || []);
          
          if (pageNum % 10 === 0) {
            console.log('[eSIM-GO] Background: loaded', pageNum, '/', pageCount, '| Total:', allBundles.length);
          }
          
          // Следующая страница через 500ms
          setTimeout(() => loadNextPage(pageNum + 1), 500);
        } catch (err) {
          console.error('[eSIM-GO] Failed to load page', pageNum, ':', err.message);
          // Повторяем через 2 секунды при ошибке
          setTimeout(() => loadNextPage(pageNum + 1), 2000);
        }
      };
      
      // Начинаем фоновую загрузку со страницы 2
      setTimeout(() => loadNextPage(2), 500);
      
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
      // Нормализуем к единому виду и исключаем RU
      let countriesArr = [];
      if (Array.isArray(res)) countriesArr = res;
      else if (res?.countries) countriesArr = res.countries;
      else if (res?.items) countriesArr = res.items;

      const notRU = (item) => {
        if (!item) return false;
        if (typeof item === 'string') return item.toUpperCase() !== 'RU';
        const code = (item.code || item.iso || '').toString().toUpperCase();
        return code !== 'RU';
      };
      const filtered = (countriesArr || []).filter(notRU);
      return { countries: filtered };
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
              ? String.fromCodePoint(...code.toUpperCase().split('').map(c => 0x1F1E6 - 65 + c.charCodeAt(0)))
              : '🌐';
            set.set(code, { 
              code, 
              name: p.countryName || code,
              flag 
            });
          }
        }
        let countriesList = Array.from(set.values())
          // оставляем только корректные ISO-2
          .filter(c => typeof c.code === 'string' && /^[A-Z]{2}$/i.test(c.code))
          // нормализуем код к верхнему регистру
          .map(c => ({ ...c, code: c.code.toUpperCase() }));

        // Исключаем RU
        countriesList = countriesList.filter(c => (c.code || '').toUpperCase() !== 'RU');

        // Если список выглядит подозрительно маленьким — добавим ключевые страны явно
        const mustHave = [
          { code: 'VN', name: 'Vietnam', nameRu: 'Вьетнам' },
          { code: 'AE', name: 'United Arab Emirates', nameRu: 'ОАЭ' },
          { code: 'TH', name: 'Thailand', nameRu: 'Таиланд' },
          { code: 'TR', name: 'Turkey', nameRu: 'Турция' },
          { code: 'CN', name: 'China', nameRu: 'Китай' },
        ];
        const existingCodes = new Set(countriesList.map(c => c.code));
        for (const item of mustHave) {
          if (!existingCodes.has(item.code)) {
            const flag = String.fromCodePoint(...item.code.split('').map(c => 0x1F1E6 - 65 + c.toUpperCase().charCodeAt(0)));
            countriesList.push({ code: item.code, name: item.name, flag });
          }
        }

        // Сортируем по названию для стабильности
        countriesList.sort((a, b) => (a.name || a.code).localeCompare(b.name || b.code));
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

  // Получить все варианты региона (все пакеты с таким названием региона)
  async getRegionPackages(regionSlug) {
    console.log('[eSIM-GO] Getting packages for region slug:', regionSlug);
    
    if (!this.allPackagesCache) {
      console.warn('[eSIM-GO] Cache not ready for region search');
      return { esims: [] };
    }
    
    // Маппинг slug → паттерн для поиска
    const regionPatterns = {
      'global-light': /global.*light/i,
      'global-standard': /global.*standard/i,
      'global-max': /global.*max/i,
      'europe-usa': /europe.*usa|europe.*us[^a-z]/i,
      'south-east-europe': /south.*east.*europe/i,
      'middle-east': /middle.*east/i,
      'europe-business-hubs': /europe.*business|business.*hub/i,
      'americas': /americas/i,
      'africa': /africa/i,
      'asia': /asia/i,
    };
    
    const pattern = regionPatterns[regionSlug];
    if (!pattern) {
      console.warn('[eSIM-GO] Unknown region slug:', regionSlug, '| Available:', Object.keys(regionPatterns).join(', '));
      return { esims: [] };
    }
    
    // Фильтруем пакеты по паттерну
    let regionPackages = this.allPackagesCache.filter(p => p && p.name && pattern.test(p.name));
    console.log('[eSIM-GO] Found', regionPackages.length, 'packages matching pattern for', regionSlug);

    // Middle East: исключаем Africa и при отсутствии результатов используем статическое покрытие
    if (regionSlug === 'middle-east') {
      // 1) отсекаем варианты, в названии которых фигурирует Africa
      regionPackages = regionPackages.filter(p => !/africa/i.test(p.name || ''));

      // 2) если после отсечения пусто — фильтруем по статическому списку ISO стран Ближнего Востока
      if (regionPackages.length === 0) {
        const staticME = getStaticCoverageByName('Middle East') || getStaticCoverageByName('Ближний Восток');
        if (Array.isArray(staticME) && staticME.length > 0) {
          regionPackages = this.allPackagesCache.filter(p => Array.isArray(p.coverage) && p.coverage.some(iso => staticME.includes(iso)));
        }
      }
    }
    
    // Убираем дубликаты (одинаковый data + validity, но разные группы) — оставляем самый предпочтительный
    const uniqueMap = new Map();
    const prefer = (a, b) => {
      const aUnlimited = /unlimited|безлимит/i.test((a.data || '') + ' ' + (a.name || ''));
      const bUnlimited = /unlimited|безлимит/i.test((b.data || '') + ' ' + (b.name || ''));
      if (aUnlimited || bUnlimited) {
        const aStd = /standard|стандарт/i.test(a.name || '');
        const bStd = /standard|стандарт/i.test(b.name || '');
        if (aStd !== bStd) return aStd ? a : b; // предпочитаем Standard
      }
      return (a.price <= b.price) ? a : b; // иначе дешевле
    };
    for (const pkg of regionPackages) {
      const key = `${pkg.data}_${pkg.validity}`;
      const existing = uniqueMap.get(key);
      if (!existing) uniqueMap.set(key, pkg);
      else uniqueMap.set(key, prefer(existing, pkg));
    }
    const uniquePackages = Array.from(uniqueMap.values());
    console.log('[eSIM-GO] After deduplication:', uniquePackages.length, 'unique packages');
    
    // Сортируем по приоритету (GB и дни)
    const sorted = this.smartFilter(uniquePackages, { limit: 50, reserveUnlimited: true, maxUnlimited: 10, ensure7Days: true });
    console.log('[eSIM-GO] After smart filter:', sorted.length, 'packages');
    
    return { esims: sorted };
  }

  // Получить пакеты для страны
  async getPackages(countryCode) {
    // Временная блокировка выдачи по РФ (эквайринг)
    if (countryCode && String(countryCode).toUpperCase() === 'RU') {
      console.warn('[eSIM-GO] RU country requested — returning empty list');
      return { esims: [] };
    }
    // Если страна не указана — возвращаем региональные категории
    if (!countryCode) {
      if (this.topPackagesCache && this.topPackagesCache.length > 0) {
        console.log('[eSIM-GO] Returning regional categories:', this.topPackagesCache.length);
        const first = this.topPackagesCache[0];
        console.log('[eSIM-GO] First category:', first?.regionNameRu || first?.name, '| isRegionalCategory:', first?.isRegionalCategory);
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
      
      // Дедупликаты по (data + validity) — оставляем предпочтительный вариант (Unlimited → Standard)
      const uniqueMap = new Map();
      const prefer = (a, b) => {
        const aUnlimited = /unlimited|безлимит/i.test((a.data || '') + ' ' + (a.name || ''));
        const bUnlimited = /unlimited|безлимит/i.test((b.data || '') + ' ' + (b.name || ''));
        if (aUnlimited || bUnlimited) {
          const aStd = /standard|стандарт/i.test(a.name || '');
          const bStd = /standard|стандарт/i.test(b.name || '');
          if (aStd !== bStd) return aStd ? a : b;
        }
        return (a.price <= b.price) ? a : b;
      };
      for (const pkg of packages) {
        const key = `${pkg.data}_${pkg.validity}`;
        const existing = uniqueMap.get(key);
        if (!existing) uniqueMap.set(key, pkg);
        else uniqueMap.set(key, prefer(existing, pkg));
      }
      const deduped = Array.from(uniqueMap.values());
      
      // Применяем умную фильтрацию: топ-10 по приоритету
      const smartFiltered = this.smartFilter(deduped, { limit: 10, reserveUnlimited: true, maxUnlimited: 6, ensure7Days: true });
      console.log('[eSIM-GO] smart filtered to', smartFiltered.length, 'packages');
      return { esims: smartFiltered };
    }
    
    // Если полный кэш ещё не готов, но есть топ-10 — возвращаем топ-10 с фильтрацией
    if (countryCode && this.topPackagesCache) {
      console.warn('[eSIM-GO] Full cache not ready, using top 10 with filter');
      let packages = this.topPackagesCache.filter(p => 
        p.country === countryCode || 
        (Array.isArray(p.coverage) && p.coverage.includes(countryCode))
      );
      // Дедупликаты по (data + validity) — оставляем самый дешёвый
      const uniqueMap = new Map();
      for (const pkg of packages) {
        const key = `${pkg.data}_${pkg.validity}`;
        const existing = uniqueMap.get(key);
        if (!existing || pkg.price < existing.price) {
          uniqueMap.set(key, pkg);
        }
      }
      packages = Array.from(uniqueMap.values());
      return { esims: this.smartFilter(packages, { limit: 10, reserveUnlimited: true, maxUnlimited: 6 }) };
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
      
      // Сначала ищем в топ-кэше (там лежат региональные категории с полным regionCoverage)
      if (this.topPackagesCache) {
        const found = this.topPackagesCache.find(p => p.id === packageId);
        if (found) {
          console.log('[eSIM-GO] found in top cache (regional):', found.name, '| regionCoverage:', found.regionCoverage?.length);
          return found;
        }
      }
      
      // Потом в полном кэше (обычные пакеты)
      if (this.allPackagesCache) {
        const found = this.allPackagesCache.find(p => p.id === packageId);
        if (found) {
          console.log('[eSIM-GO] found in full cache:', found.name);
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

