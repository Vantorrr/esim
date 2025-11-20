require('dotenv').config();
const express = require('express');
const cors = require('cors');
const esimRoutes = require('./routes/esim');
const payments131Routes = require('./routes/payments131');
const userEsimsRoutes = require('./routes/user-esims');
const webhookRoutes = require('./routes/webhook');
const esimGoWebhookRoutes = require('./routes/esimGoWebhook');
const botRoutes = require('./routes/bot');
const esimGoApi = require('./services/esimGoApi');
const cacheRepo = require('./services/cacheRepo');

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

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/esim', esimRoutes);
app.use('/api/payments/131', payments131Routes);
app.use('/api/user-esims', userEsimsRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/webhook', esimGoWebhookRoutes);
app.use('/api/bot', botRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin: force rebuild cache (GET/POST)
app.all('/api/admin/rebuild-cache', async (req, res) => {
  try {
    await cacheRepo.deleteSnapshot('catalogue_v2_5');
    esimGoApi.refreshCache();
    res.json({ success: true, message: 'Rebuild started' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

