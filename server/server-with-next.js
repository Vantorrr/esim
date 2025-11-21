require('dotenv').config();
const express = require('express');
const next = require('next');
const cors = require('cors');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 8080;

// Подготовка Next.js
app.prepare().then(() => {
  const server = express();

  // Middleware
  server.use(cors());
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));

  // API Routes
  server.use('/api/esim', require('./routes/esim'));
  server.use('/api/payments/131', require('./routes/payments131'));
  server.use('/api/user-esims', require('./routes/user-esims'));
  server.use('/api/test-payments', require('./routes/test-payments'));
  server.use('/api/webhook', require('./routes/webhook'));
  server.use('/api/webhook', require('./routes/esimGoWebhook'));
  server.use('/api/bot', require('./routes/bot'));

  // Health check
  server.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Запускаем Telegram бота
  if (process.env.TELEGRAM_BOT_TOKEN) {
    try {
      require('./bot');
      console.log('🤖 Telegram бот запущен!');
    } catch (error) {
      console.error('❌ Ошибка запуска бота:', error.message);
    }
  } else {
    console.log('⚠️  TELEGRAM_BOT_TOKEN не найден, бот не запущен');
  }

  // Все остальные запросы обрабатывает Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  // Error handler
  server.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  });

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔌 API: http://localhost:${PORT}/api`);
  });
});

