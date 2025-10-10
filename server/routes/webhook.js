const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const esimGoApi = require('../services/esimGoApi');

// Webhook для Stripe
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { packageId } = session.metadata;

      // Создаем заказ eSIM после успешной оплаты
      const order = await esimGoApi.createOrder(packageId, 1);
      
      console.log('Order created:', order);
      
      // Здесь можно сохранить заказ в БД и отправить уведомление пользователю
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// Webhook для YooKassa
router.post('/yookassa', async (req, res) => {
  try {
    const { type, object } = req.body;

    if (type === 'payment.succeeded') {
      const { packageId } = object.metadata;

      // Создаем заказ eSIM после успешной оплаты
      const order = await esimGoApi.createOrder(packageId, 1);
      
      console.log('Order created:', order);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

