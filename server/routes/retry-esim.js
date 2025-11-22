const express = require('express');
const router = express.Router();
const userEsimRepo = require('../services/userEsimRepo');
const esimGoApi = require('../services/esimGoApi');

// Попробовать создать eSIM для всех оплаченных заказов без eSIM
router.post('/retry-pending-esims', async (req, res) => {
  try {
    // Получаем все записи через прямой запрос к БД
    const db = require('../services/db');
    const allRecords = await db.query(`
      SELECT * FROM user_esims 
      WHERE payment_status = 'succeeded' 
      AND (esim_order_id IS NULL OR esim_order_id = '')
      ORDER BY created_at DESC
      LIMIT 100
    `);

    const results = [];
    
    for (const record of allRecords.rows) {
      try {
        console.log(`[Retry] Attempting to create eSIM for session ${record.payment_session_id}`);
        
        // Пробуем создать заказ
        const order = await esimGoApi.createOrder(record.package_id, 1);
        const esimOrderId = order.id || order.orderId || order.order_id;
        
        // Обновляем запись
        await userEsimRepo.markPaidAndAttachEsim(
          record.payment_session_id, 
          esimOrderId, 
          'succeeded'
        );
        
        results.push({
          sessionId: record.payment_session_id,
          telegramId: record.telegram_id,
          status: 'success',
          esimOrderId
        });
        
      } catch (error) {
        console.error(`[Retry] Failed for session ${record.payment_session_id}:`, error.message);
        results.push({
          sessionId: record.payment_session_id,
          telegramId: record.telegram_id,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      processed: results.length,
      results
    });
    
  } catch (error) {
    console.error('[Retry] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Повторить для конкретного пользователя
router.post('/retry-user-esims/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    
    const userRecords = await userEsimRepo.getByTelegramId(telegramId);
    const pendingRecords = userRecords.filter(r => 
      r.payment_status === 'succeeded' && !r.esim_order_id
    );
    
    const results = [];
    
    for (const record of pendingRecords) {
      try {
        const order = await esimGoApi.createOrder(record.package_id, 1);
        const esimOrderId = order.id || order.orderId || order.order_id;
        
        await userEsimRepo.markPaidAndAttachEsim(
          record.payment_session_id, 
          esimOrderId, 
          'succeeded'
        );
        
        results.push({
          sessionId: record.payment_session_id,
          status: 'success',
          esimOrderId
        });
        
      } catch (error) {
        results.push({
          sessionId: record.payment_session_id,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      telegramId,
      processed: results.length,
      results
    });
    
  } catch (error) {
    console.error('[Retry] Error for user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
