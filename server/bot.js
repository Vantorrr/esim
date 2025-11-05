require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL || 'https://esim-production.up.railway.app';

if (!token) {
  console.log('⚠️  TELEGRAM_BOT_TOKEN не найден в .env');
  process.exit(1);
}

// Используем webhook вместо polling для production
const useWebhook = process.env.NODE_ENV === 'production';

const bot = useWebhook 
  ? new TelegramBot(token)  // Без polling для production
  : new TelegramBot(token, { polling: true });  // С polling для dev

console.log(`🤖 Telegram бот запущен! (режим: ${useWebhook ? 'webhook' : 'polling'})`);

// Кнопки меню - только главное!
const mainMenu = {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: '🌊 Открыть eWave',
          web_app: { url: webAppUrl }
        }
      ],
      [
        {
          text: '❓ Помощь',
          callback_data: 'help'
        },
        {
          text: '💬 Поддержка',
          url: 'https://t.me/eWaveSupport'
        }
      ],
      [
        {
          text: '✉️ Email',
          callback_data: 'email'
        }
      ]
    ]
  }
};

// Команда /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'друг';
  
  const welcomeText = `
🌊 *Привет, ${firstName}!*

Добро пожаловать в *eWave* — твой проводник в мир цифровых SIM-карт!

*Что мы предлагаем:*
✅ eSIM для 200+ стран мира
⚡ Мгновенная активация через QR-код
💰 Выгодные цены без переплат
📱 Готово за 1 минуту
🔒 Безопасная оплата

Начни прямо сейчас! 👇
  `.trim();

  try {
    // Отправляем картинку с текстом (по прямой ссылке для лучшего качества)
    const imageUrl = 'https://i.ibb.co/0jYrfStZ/IMAGE-2025-11-05-10-30-23.jpg';
    
    await bot.sendPhoto(chatId, imageUrl, {
      caption: welcomeText,
      parse_mode: 'Markdown',
      ...mainMenu
    });
  } catch (error) {
    console.error('Ошибка отправки картинки:', error);
    // Fallback: пробуем локальный файл
    try {
      const imagePath = path.join(__dirname, '../public/bot-welcome.jpg');
      if (fs.existsSync(imagePath)) {
        await bot.sendPhoto(chatId, imagePath, {
          caption: welcomeText,
          parse_mode: 'Markdown',
          ...mainMenu
        });
      } else {
        // Если ничего не работает, отправляем только текст
        await bot.sendMessage(chatId, welcomeText, {
          parse_mode: 'Markdown',
          ...mainMenu
        });
      }
    } catch (e) {
      console.error('Критическая ошибка:', e);
      // Последняя попытка - просто текст
      await bot.sendMessage(chatId, welcomeText, {
        parse_mode: 'Markdown',
        ...mainMenu
      }).catch(err => console.error('Не удалось отправить даже текст:', err));
    }
  }
});

// Команда /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpText = `
❓ *Помощь eWave*

*Как это работает:*
1️⃣ Нажми кнопку "🌊 Открыть eWave"
2️⃣ Выбери страну и тариф
3️⃣ Оплати удобным способом
4️⃣ Получи QR-код и инструкцию
5️⃣ Пользуйся интернетом по всему миру!

*Как установить eSIM:*
📱 Настройки → Сотовая связь → Добавить eSIM
📷 Отсканируй QR-код
✅ Готово!

*Если нужна помощь:*
Напиши на email: ewavenet@yandex.com

—
🧑‍💻 Разработка: [N0FACE](https://noface.digital) • [@pavel_xdev](https://t.me/pavel_xdev)
  `.trim();
  
  bot.sendMessage(chatId, helpText, {
    parse_mode: 'Markdown',
    ...mainMenu
  });
});

// Команда /menu
bot.onText(/\/menu/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, '🌊 *Главное меню eWave*\n\nВыбери действие:', {
    parse_mode: 'Markdown',
    ...mainMenu
  });
});

// Обработка callback кнопок
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  
  // Убираем "часики" у кнопки
  await bot.answerCallbackQuery(query.id);
  
  switch (data) {
    case 'help':
      bot.sendMessage(chatId,
        `❓ *Помощь*\n\n` +
        `*Как это работает:*\n` +
        `1️⃣ Нажми кнопку "🌊 Открыть eWave"\n` +
        `2️⃣ Выбери страну и тариф\n` +
        `3️⃣ Оплати удобным способом\n` +
        `4️⃣ Получи QR-код и инструкцию\n` +
        `5️⃣ Пользуйся интернетом по всему миру!\n\n` +
        `*Частые вопросы:*\n\n` +
        `*Q: Как установить eSIM?*\n` +
        `A: Настройки → Сотовая связь → Добавить eSIM → Отсканируй QR\n\n` +
        `*Q: Когда активируется eSIM?*\n` +
        `A: Автоматически при первом подключении к сети в стране назначения\n\n` +
        `*Q: Возможен возврат?*\n` +
        `A: Да, если eSIM не был активирован\n\n` +
        `*Не нашёл ответ?*\n` +
        `Почта поддержки: ewavenet@yandex.com\n\n` +
        `—\n` +
        `🧑‍💻 Разработка: [N0FACE](https://noface.digital) • [@pavel_xdev](https://t.me/pavel_xdev)`,
        { parse_mode: 'Markdown', ...mainMenu }
      );
      break;
    case 'email':
      bot.sendMessage(chatId, 'Почта поддержки: ewavenet@yandex.com', { ...mainMenu });
      break;
  }
});

// Обработка любого текста
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Пропускаем команды
  if (text && text.startsWith('/')) return;
  
  // На любой другой текст отвечаем меню
  bot.sendMessage(chatId,
    `Привет! Я бот eWave 🌊\n\n` +
    `Используй кнопки ниже или команды:\n` +
    `/start - Главное меню\n` +
    `/help - Помощь\n` +
    `/menu - Показать меню\n\n` +
    `Email поддержки: ewavenet@yandex.com`,
    mainMenu
  );
});

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

module.exports = bot;

