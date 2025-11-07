# 📡 Примеры использования API

## esim-go.com API

### Аутентификация

Все запросы требуют API ключ в заголовке:

\`\`\`bash
X-API-Key: your_api_key_here
\`\`\`

### 1. Получить список стран

\`\`\`bash
curl -X GET "https://api.esim-go.com/v2.2/countries" \\
  -H "X-API-Key: your_api_key_here"
\`\`\`

**Ответ:**
\`\`\`json
{
  "countries": [
    {
      "code": "US",
      "name": "United States",
      "flag": "🇺🇸"
    },
    {
      "code": "GB",
      "name": "United Kingdom",
      "flag": "🇬🇧"
    }
  ]
}
\`\`\`

### 2. Получить пакеты для страны

\`\`\`bash
curl -X GET "https://api.esim-go.com/v2.2/esim?country=US" \\
  -H "X-API-Key: your_api_key_here"
\`\`\`

**Ответ:**
\`\`\`json
{
  "esims": [
    {
      "id": "esim_123",
      "name": "USA 5GB",
      "data": "5GB",
      "validity": 30,
      "price": 15.99,
      "country": "US",
      "coverage": ["United States"],
      "operator": "T-Mobile"
    }
  ]
}
\`\`\`

### 3. Получить детали пакета

\`\`\`bash
curl -X GET "https://api.esim-go.com/v2.2/esim/esim_123" \\
  -H "X-API-Key: your_api_key_here"
\`\`\`

### 4. Создать заказ

\`\`\`bash
curl -X POST "https://api.esim-go.com/v2.2/orders" \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "sim",
    "quantity": 1,
    "package": "esim_123"
  }'
\`\`\`

**Ответ:**
\`\`\`json
{
  "id": "order_456",
  "status": "pending",
  "package": "esim_123",
  "quantity": 1,
  "price": 15.99,
  "created_at": "2025-01-15T10:30:00Z"
}
\`\`\`

### 5. Получить информацию о заказе

\`\`\`bash
curl -X GET "https://api.esim-go.com/v2.2/orders/order_456" \\
  -H "X-API-Key: your_api_key_here"
\`\`\`

**Ответ:**
\`\`\`json
{
  "id": "order_456",
  "status": "completed",
  "esims": [
    {
      "iccid": "89123456789012345678",
      "smdpAddress": "sm-dp.example.com",
      "activationCode": "LPA:1$sm-dp.example.com$ABC123",
      "qrCode": "data:image/png;base64,...",
      "qrCodeUrl": "https://api.esim-go.com/qr/order_456.png"
    }
  ]
}
\`\`\`

## Внутренний API (eWave Backend)

### Base URL

\`\`\`
http://localhost:8080/api
\`\`\`

### eSIM Endpoints

#### GET /api/esim/countries

Получить список стран

**Пример:**
\`\`\`javascript
fetch('http://localhost:8080/api/esim/countries')
  .then(res => res.json())
  .then(data => console.log(data));
\`\`\`

#### GET /api/esim/packages

Получить все пакеты или фильтр по стране

**Query Parameters:**
- `country` (optional): Код страны (US, GB, и т.д.)

**Пример:**
\`\`\`javascript
fetch('http://localhost:8080/api/esim/packages?country=US')
  .then(res => res.json())
  .then(data => console.log(data));
\`\`\`

#### GET /api/esim/packages/:id

Получить детали пакета

**Пример:**
\`\`\`javascript
fetch('http://localhost:8080/api/esim/packages/esim_123')
  .then(res => res.json())
  .then(data => console.log(data));
\`\`\`

#### POST /api/esim/orders

Создать заказ (временно, до интеграции с платежами)

**Body:**
\`\`\`json
{
  "packageId": "esim_123",
  "quantity": 1
}
\`\`\`

**Пример:**
\`\`\`javascript
fetch('http://localhost:8080/api/esim/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    packageId: 'esim_123',
    quantity: 1
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
\`\`\`

#### GET /api/esim/orders/:id

Получить информацию о заказе

**Пример:**
\`\`\`javascript
fetch('http://localhost:8080/api/esim/orders/order_456')
  .then(res => res.json())
  .then(data => console.log(data));
\`\`\`

#### GET /api/esim/orders/:id/qr

Получить QR-код и данные активации

**Пример:**
\`\`\`javascript
fetch('http://localhost:8080/api/esim/orders/order_456/qr')
  .then(res => res.json())
  .then(data => console.log(data));
\`\`\`

### Payment Endpoints

#### POST /api/payment/stripe/create-session

Создать сессию оплаты Stripe

**Body:**
\`\`\`json
{
  "packageId": "esim_123",
  "packageName": "USA 5GB",
  "price": 15.99,
  "currency": "usd"
}
\`\`\`

**Пример:**
\`\`\`javascript
fetch('http://localhost:8080/api/payment/stripe/create-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    packageId: 'esim_123',
    packageName: 'USA 5GB',
    price: 15.99,
    currency: 'usd'
  })
})
  .then(res => res.json())
  .then(data => {
    // Перенаправить на Stripe Checkout
    window.location.href = data.url;
  });
\`\`\`

**Ответ:**
\`\`\`json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
\`\`\`

#### POST /api/payment/yookassa/create-payment

Создать платёж YooKassa

**Body:**
\`\`\`json
{
  "packageId": "esim_123",
  "packageName": "USA 5GB",
  "price": 1199,
  "currency": "RUB"
}
\`\`\`

### Webhook Endpoints

#### POST /api/webhook/stripe

Принимает события от Stripe

**События:**
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

#### POST /api/payments/131/webhook

Принимает уведомления от Банка 131 по СБП

**Типовые события:**
- `ready_to_confirm`
- `payment_finished`
- `action_required`

## Frontend API Client

### Использование в компонентах

\`\`\`typescript
import { getCountries, getPackages, createPayment131SBP } from '@/lib/api';

// Получить страны
const countries = await getCountries();

// Получить пакеты
const packages = await getPackages('US');

// Создать платёж через СБП
const payment = await createPayment131SBP({
  amount: 1990,
  currency: 'RUB',
  orderId: 'esim_123',
  description: 'USA 5GB / 30 дней',
  successUrl: `${window.location.origin}/success?order=esim_123`,
  failUrl: `${window.location.origin}/checkout?package=esim_123&status=failed`,
});

// Перенаправить на оплату (ссылка или QR)
if (payment.url) {
  window.location.href = payment.url;
}
\`\`\`

## Telegram Mini Apps API

### Инициализация

\`\`\`typescript
import { initTelegramSDK, getTelegramUser } from '@/lib/telegram';

// Инициализировать SDK
const tg = initTelegramSDK();

// Получить пользователя
const user = getTelegramUser();
console.log(user.id, user.first_name);
\`\`\`

### Main Button

\`\`\`typescript
import { showMainButton, hideMainButton } from '@/lib/telegram';

// Показать кнопку
showMainButton('Оплатить $15.99', () => {
  // Обработчик нажатия
  handlePayment();
});

// Скрыть кнопку
hideMainButton();
\`\`\`

### Back Button

\`\`\`typescript
import { showBackButton, hideBackButton } from '@/lib/telegram';

// Показать кнопку назад
showBackButton(() => {
  router.back();
});

// Скрыть
hideBackButton();
\`\`\`

### Haptic Feedback

\`\`\`typescript
import { hapticFeedback } from '@/lib/telegram';

// Лёгкая вибрация
hapticFeedback('light');

// Средняя вибрация
hapticFeedback('medium');

// Сильная вибрация
hapticFeedback('heavy');
\`\`\`

## Обработка ошибок

### API ошибки

\`\`\`typescript
try {
  const packages = await getPackages('US');
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Неверный API ключ');
  } else if (error.response?.status === 404) {
    console.error('Пакеты не найдены');
  } else {
    console.error('Ошибка API:', error.message);
  }
}
\`\`\`

### Платёжные ошибки

\`\`\`typescript
try {
  const payment = await createPayment131SBP({ amount: 1990, orderId: 'esim_123' });
  window.location.href = payment.url;
} catch (error) {
  alert('Ошибка при создании платежа СБП: ' + error.message);
}
\`\`\`

## Тестовые данные

### Тестирование СБП

```
- Используйте тестовую среду Банка 131 или sandbox-ссылку, выданную менеджером
- Проверьте сценарии: успешная оплата, пользователь отменил, ожидание подтверждения
- Для боевой среды можно провести реальный платёж на минимальную сумму и оформить возврат
```

### esim-go Test Mode

Если у esim-go есть тестовый режим, используйте test API key.
Заказы в тестовом режиме не создают реальные eSIM.

---

Больше примеров в [документации esim-go](https://docs.esim-go.com) 📚

