const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const esimGoApi = require('../services/esimGoApi');

// Создать платежную сессию Stripe
router.post('/stripe/create-session', async (req, res) => {
  try {
    const { packageId, packageName, price, currency = 'usd' } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: packageName,
              description: 'eSIM Package',
            },
            unit_amount: Math.round(price * 100), // В центах
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.WEBHOOK_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.WEBHOOK_URL}/cancel`,
      metadata: {
        packageId,
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Создать платеж YooKassa
router.post('/yookassa/create-payment', async (req, res) => {
  try {
    const { packageId, packageName, price, currency = 'RUB' } = req.body;

    // Заглушка для YooKassa - нужно будет реализовать с их SDK
    const payment = {
      id: 'yookassa_' + Date.now(),
      status: 'pending',
      amount: { value: price, currency },
      confirmation: {
        type: 'redirect',
        confirmation_url: `${process.env.WEBHOOK_URL}/yookassa/confirm`,
      },
      metadata: {
        packageId,
      },
    };

    res.json(payment);
  } catch (error) {
    console.error('YooKassa payment creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

