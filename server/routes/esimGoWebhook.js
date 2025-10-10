const express = require('express');
const router = express.Router();

// Webhook от eSIM-GO
router.post('/esim-go', async (req, res) => {
  try {
    const notification = req.body;
    
    console.log('eSIM-GO Webhook received:', notification);

    // Обрабатываем разные типы уведомлений
    switch (notification.event) {
      case 'order.completed':
        console.log('Order completed:', notification.orderId);
        // Здесь можно отправить уведомление пользователю в Telegram
        break;

      case 'order.failed':
        console.log('Order failed:', notification.orderId);
        // Обработка ошибки
        break;

      case 'esim.activated':
        console.log('eSIM activated:', notification.esimId);
        break;

      default:
        console.log('Unknown event:', notification.event);
    }

    // Всегда возвращаем 200 OK для esim-go
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('eSIM-GO webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

