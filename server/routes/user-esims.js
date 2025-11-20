const express = require('express');
const router = express.Router();
const esimGoApi = require('../services/esimGoApi');
const userEsimRepo = require('../services/userEsimRepo');

// Получить все eSIM пользователя
router.get('/my-esims', async (req, res) => {
  try {
    const telegramId = req.query.telegramId || req.query.userId;
    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'telegramId is required',
      });
    }

    const rows = await userEsimRepo.getByTelegramId(telegramId);

    // Обогащаем данными из eSIM-GO (по orderId), если он уже создан
    const enriched = await Promise.all(
      rows.map(async (row) => {
        let order = null;
        let qr = null;
        if (row.esim_order_id) {
          try {
            order = await esimGoApi.getOrder(row.esim_order_id);
          } catch (e) {
            console.warn('[User eSIMs] getOrder failed for', row.esim_order_id, e.message);
          }
          try {
            qr = await esimGoApi.getOrderQR(row.esim_order_id);
          } catch (e) {
            console.warn('[User eSIMs] getOrderQR failed for', row.esim_order_id, e.message);
          }
        }
        return {
          id: row.id,
          telegramId: row.telegram_id,
          packageId: row.package_id,
          paymentSessionId: row.payment_session_id,
          paymentStatus: row.payment_status,
          paymentOrderId: row.payment_order_id,
          amountRub: row.amount_rub,
          currency: row.currency,
          esimOrderId: row.esim_order_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          esimOrder: order,
          qrData: qr,
        };
      })
    );

    res.json({
      success: true,
      esims: enriched,
    });
  } catch (error) {
    console.error('[User eSIMs] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Получить последний успешно оплаченный eSIM пользователя
router.get('/last-completed', async (req, res) => {
  try {
    const telegramId = req.query.telegramId || req.query.userId;
    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'telegramId is required',
      });
    }

    const row = await userEsimRepo.getLastCompletedByTelegramId(telegramId);
    if (!row) {
      return res.json({ success: true, esim: null });
    }

    let order = null;
    let qr = null;
    if (row.esim_order_id) {
      try {
        order = await esimGoApi.getOrder(row.esim_order_id);
        qr = await esimGoApi.getOrderQR(row.esim_order_id);
      } catch (e) {
        console.warn('[User eSIMs] getLastCompleted: failed to load order/qr', e.message);
      }
    }

    res.json({
      success: true,
      esim: {
        id: row.id,
        telegramId: row.telegram_id,
        packageId: row.package_id,
        paymentSessionId: row.payment_session_id,
        paymentStatus: row.payment_status,
        paymentOrderId: row.payment_order_id,
        amountRub: row.amount_rub,
        currency: row.currency,
        esimOrderId: row.esim_order_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        esimOrder: order,
        qrData: qr,
      },
    });
  } catch (error) {
    console.error('[User eSIMs] last-completed Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Получить статус конкретной eSIM
router.get('/esim-status/:iccid', async (req, res) => {
  try {
    const { iccid } = req.params;
    
    if (!iccid) {
      return res.status(400).json({
        success: false,
        error: 'ICCID is required',
      });
    }
    
    const status = await esimGoApi.getESIMStatus(iccid);
    
    res.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('[eSIM Status] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Получить детали eSIM (включая QR-код)
router.get('/esim-details/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required',
      });
    }
    
    const qrData = await esimGoApi.getOrderQR(orderId);
    
    res.json({
      success: true,
      data: qrData,
    });
  } catch (error) {
    console.error('[eSIM Details] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;

