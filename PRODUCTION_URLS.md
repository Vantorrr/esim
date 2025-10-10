# 🌐 Production URLs - eWave

## 🚂 Railway (Backend + Frontend)

**Главный URL:**
```
https://esim-production.up.railway.app
```

---

## 📡 API Endpoints:

### Health Check:
```bash
curl https://esim-production.up.railway.app/api/health
```

### eSIM API:
```bash
# Список стран
curl https://esim-production.up.railway.app/api/esim/countries

# Пакеты для США
curl https://esim-production.up.railway.app/api/esim/packages?country=US

# Детали пакета
curl https://esim-production.up.railway.app/api/esim/packages/PACKAGE_ID
```

### Payment API:
```bash
# Создать платёж Т-Банк
curl -X POST https://esim-production.up.railway.app/api/tinkoff/create-payment \
  -H "Content-Type: application/json" \
  -d '{"packageId":"test","packageName":"Test","price":1000}'

# Создать Stripe сессию
curl -X POST https://esim-production.up.railway.app/api/payment/stripe/create-session \
  -H "Content-Type: application/json" \
  -d '{"packageId":"test","packageName":"Test","price":10}'
```

---

## 🔗 Webhook URLs (для настройки в сервисах):

### eSIM-GO Portal:
```
https://esim-production.up.railway.app/api/webhook/esim-go
```

**Настройка:**
1. Зайди на portal.esim-go.com
2. API Details → Callback URL
3. Вставь URL выше
4. Save Changes

### Т-Банк ЛК:
```
https://esim-production.up.railway.app/api/tinkoff/notification
```

**Настройка:**
1. Личный кабинет Т-Банка
2. Терминалы → URL уведомлений
3. Вставь URL выше
4. Сохранить

### Stripe Dashboard:
```
https://esim-production.up.railway.app/api/webhook/stripe
```

**Настройка:**
1. dashboard.stripe.com → Developers → Webhooks
2. Add endpoint
3. URL: вставь выше
4. Events: `checkout.session.completed`
5. Add endpoint

### YooKassa:
```
https://esim-production.up.railway.app/api/webhook/yookassa
```

---

## ⚙️ Переменные окружения Railway:

**Обнови в Variables:**
```bash
WEBHOOK_URL=https://esim-production.up.railway.app/api/webhook
NEXT_PUBLIC_API_URL=https://esim-production.up.railway.app/api
```

---

## 🤖 Telegram Bot:

**Mini App URL:**
```
https://esim-production.up.railway.app
```

**Настройка в @BotFather:**
```
/mybots
→ Выбери своего бота
→ Bot Settings → Menu Button
→ URL: https://esim-production.up.railway.app

/newapp (если ещё не создал)
→ URL: https://esim-production.up.railway.app
```

---

## 📱 Открыть приложение:

**Прямая ссылка:**
```
https://esim-production.up.railway.app
```

**Через бота:**
```
https://t.me/твой_бот_username
```

---

## 🧪 Тесты:

### Frontend:
```bash
# Открой в браузере
open https://esim-production.up.railway.app

# Должна появиться загрузочная заставка с логом
# Потом главная страница с выбором стран
```

### Backend API:
```bash
# Health check
curl https://esim-production.up.railway.app/api/health

# Ожидается:
{"status":"ok","timestamp":"2025-10-10T..."}

# Список стран
curl https://esim-production.up.railway.app/api/esim/countries

# Должен вернуть список стран
```

---

## 📊 Мониторинг:

### Railway Dashboard:
```
1. Открой проект на railway.app
2. Deployments → View Logs
3. Metrics → CPU, Memory
```

### Логи в реальном времени:
```
railway logs --follow
```

---

## 🔐 Custom Domain (опционально):

Если хочешь свой домен:

1. Railway → Settings → Domains
2. Add Custom Domain
3. Укажи: `esim.твой-домен.com`
4. Добавь CNAME запись в DNS:
   ```
   CNAME esim esim-production.up.railway.app
   ```
5. Обнови все URLs выше на новый домен

---

## 💡 Полезные команды:

```bash
# Проверить все endpoints
curl https://esim-production.up.railway.app/api/health
curl https://esim-production.up.railway.app/api/esim/countries
curl "https://esim-production.up.railway.app/api/esim/packages?country=US"

# Открыть в браузере
open https://esim-production.up.railway.app

# Смотреть логи Railway
railway logs
```

---

## 🎉 Готово!

Твоё приложение запущено на:
```
https://esim-production.up.railway.app ✅
```

**Всё работает!** 🔥

---

**Следующие шаги:**
1. ✅ Обнови WEBHOOK_URL в Railway Variables
2. ✅ Настрой webhooks в eSIM-GO
3. ✅ Настрой Telegram бота
4. ✅ Протестируй покупку eSIM
5. ✅ Profit! 💰

