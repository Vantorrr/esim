const express = require('express');
const router = express.Router();
const userEsimRepo = require('../services/userEsimRepo');
const esimGoApi = require('../services/esimGoApi');

// Создать тестовую запись оплаты
router.post('/create-test-payment', async (req, res) => {
  try {
    const {
      telegramId = '123456789',
      packageId = 'test-pkg-1',
      sessionId = `test_session_${Date.now()}`,
      orderId = `test_order_${Date.now()}`,
      amount = 1000,
    } = req.body;

    // Создаем pending запись
    await userEsimRepo.createPending({
      telegramId: String(telegramId),
      packageId,
      paymentSessionId: sessionId,
      paymentOrderId: orderId,
      amountRub: amount,
      currency: 'RUB',
    });

    res.json({
      success: true,
      message: 'Test payment created',
      data: {
        telegramId,
        packageId,
        sessionId,
        orderId,
      },
    });
  } catch (error) {
    console.error('[Test] Error creating test payment:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Симулировать webhook payment_finished
router.post('/simulate-payment-finished/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Находим запись
    const record = await userEsimRepo.findBySessionId(sessionId);
    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    // Создаем заказ eSIM
    const order = await esimGoApi.createOrder(record.package_id, 1);
    const esimOrderId = order.id || order.orderId || order.order_id;

    // Помечаем как оплаченный
    await userEsimRepo.markPaidAndAttachEsim(sessionId, esimOrderId, 'succeeded');

    res.json({
      success: true,
      message: 'Payment marked as finished',
      data: {
        sessionId,
        esimOrderId,
        telegramId: record.telegram_id,
      },
    });
  } catch (error) {
    console.error('[Test] Error simulating payment:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Получить все платежи пользователя
router.get('/user-payments/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    
    const payments = await userEsimRepo.getByTelegramId(telegramId);
    
    res.json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error('[Test] Error getting user payments:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
