const express = require('express');
const router = express.Router();
const esimGoApi = require('../services/esimGoApi');

// Получить список стран
router.get('/countries', async (req, res) => {
  try {
    const countries = await esimGoApi.getCountries();
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить пакеты (все или для конкретной страны)
router.get('/packages', async (req, res) => {
  try {
    const { country } = req.query;
    const packages = await esimGoApi.getPackages(country);
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

module.exports = router;

