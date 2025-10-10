const express = require('express');
const router = express.Router();
const tinkoffApi = require('../services/tinkoffApi');
const esimGoApi = require('../services/esimGoApi');

// Создать платёж Т-Банк
router.post('/create-payment', async (req, res) => {
  try {
    const { packageId, packageName, price, email = 'customer@email.com' } = req.body;

    // Генерируем уникальный OrderId
    const orderId = `esim_${Date.now()}`;

    // Инициализируем платёж
    const payment = await tinkoffApi.init(
      orderId,
      price,
      `eSIM: ${packageName}`,
      email
    );

    if (!payment.Success) {
      throw new Error(payment.Message || 'Ошибка создания платежа');
    }

    res.json({
      paymentId: payment.PaymentId,
      paymentUrl: payment.PaymentURL,
      orderId: orderId,
      amount: price,
      status: payment.Status,
      metadata: {
        packageId,
      },
    });
  } catch (error) {
    console.error('Tinkoff payment creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Проверить статус платежа
router.get('/payment/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const state = await tinkoffApi.getState(paymentId);

    res.json(state);
  } catch (error) {
    console.error('Tinkoff get state error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook от Т-Банк
router.post('/notification', async (req, res) => {
  try {
    const notification = req.body;

    // Проверяем подпись
    if (!tinkoffApi.validateNotification(notification)) {
      console.error('Invalid Tinkoff notification signature');
      return res.status(400).send('Invalid signature');
    }

    // Обрабатываем успешную оплату
    if (notification.Status === 'CONFIRMED') {
      console.log('Payment confirmed:', notification.PaymentId);

      // Здесь нужно создать заказ eSIM
      // Получаем packageId из OrderId или храним отдельно
      // const order = await esimGoApi.createOrder(packageId, 1);
      
      // Сохраняем в БД связь paymentId <-> orderId
    }

    // Всегда возвращаем OK для Тинькофф
    res.send('OK');
  } catch (error) {
    console.error('Tinkoff webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

