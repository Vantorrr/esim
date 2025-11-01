const express = require('express');
const router = express.Router();
const esimGoApi = require('../services/esimGoApi');

// Получить все eSIM пользователя
router.get('/my-esims', async (req, res) => {
  try {
    // TODO: Получить userId из сессии/токена
    const userId = req.query.userId || 'demo-user';
    
    const esims = await esimGoApi.getUserESIMs(userId);
    
    res.json({
      success: true,
      esims,
    });
  } catch (error) {
    console.error('[User eSIMs] Error:', error);
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

