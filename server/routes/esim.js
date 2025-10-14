const express = require('express');
const router = express.Router();
const esimGoApi = require('../services/esimGoApi');
const currencyService = require('../services/currencyService');
const cacheRepo = require('../services/cacheRepo');

// Получить текущий курс USD/RUB
router.get('/currency', (req, res) => {
  res.json({
    rate: currencyService.getRate(),
    lastUpdate: currencyService.getLastUpdate(),
  });
});

// Получить список стран
router.get('/countries', async (req, res) => {
  try {
    const countries = await esimGoApi.getCountries();
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить пакеты (все или для конкретной страны или региона)
router.get('/packages', async (req, res) => {
  try {
    const { country, region } = req.query;
    
    let packages;
    if (region) {
      // Если запрошен регион — возвращаем все варианты этого региона
      packages = await esimGoApi.getRegionPackages(region);
    } else {
      packages = await esimGoApi.getPackages(country);
    }
    
    // Добавляем цены в рублях к каждому пакету
    const rate = currencyService.getRate();
    if (packages.esims) {
      packages.esims = packages.esims.map(pkg => ({
        ...pkg,
        priceRub: currencyService.convertToRub(pkg.price),
        currencyRate: rate,
      }));
    }
    
    // Короткое кэширование ответов (можно править через переменные окружения)
    res.set('Cache-Control', 'public, max-age=15, s-maxage=60, stale-while-revalidate=120');
    res.json(packages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить детали пакета
router.get('/packages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const packageDetails = await esimGoApi.getPackageDetails(id);
    
    // Добавляем цену в рублях
    const rate = currencyService.getRate();
    packageDetails.priceRub = currencyService.convertToRub(packageDetails.price);
    packageDetails.currencyRate = rate;
    
    res.json(packageDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создать заказ (временно, до интеграции с платежами)
router.post('/orders', async (req, res) => {
  try {
    const { packageId, quantity } = req.body;
    const order = await esimGoApi.createOrder(packageId, quantity);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить заказ
router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await esimGoApi.getOrder(id);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить QR код для заказа
router.get('/orders/:id/qr', async (req, res) => {
  try {
    const { id } = req.params;
    const qrData = await esimGoApi.getOrderQR(id);
    res.json(qrData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Админ: форс обновить кэш каталога (удалить снапшот и перезагрузить)
router.post('/admin/rebuild-cache', async (req, res) => {
  try {
    await cacheRepo.deleteSnapshot('catalogue_v2_5');
    // Тригерим обновление
    esimGoApi.refreshCache();
    res.json({ success: true, message: 'Rebuild started' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET alias для удобного вызова из браузера
router.get('/admin/rebuild-cache', async (req, res) => {
  try {
    await cacheRepo.deleteSnapshot('catalogue_v2_5');
    esimGoApi.refreshCache();
    res.json({ success: true, message: 'Rebuild started' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

