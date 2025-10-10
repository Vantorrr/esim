const express = require('express');
const router = express.Router();
const bot = require('../bot');

// Webhook endpoint для Telegram бота
router.post('/telegram-webhook', async (req, res) => {
  try {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.sendStatus(500);
  }
});

// Установить webhook
router.post('/set-webhook', async (req, res) => {
  try {
    const webhookUrl = `${process.env.WEBHOOK_URL || req.protocol + '://' + req.get('host')}/api/bot/telegram-webhook`;
    
    const result = await bot.setWebHook(webhookUrl);
    
    res.json({ 
      success: true, 
      webhookUrl,
      result 
    });
  } catch (error) {
    console.error('Set webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Удалить webhook (для dev)
router.post('/delete-webhook', async (req, res) => {
  try {
    const result = await bot.deleteWebHook();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить info о webhook
router.get('/webhook-info', async (req, res) => {
  try {
    const info = await bot.getWebHookInfo();
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

