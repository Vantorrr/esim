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

const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Telegram бот запущен!');

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
          url: 'https://t.me/support'
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

*Как это работает:*
1️⃣ Нажми кнопку "🌊 Открыть eWave"
2️⃣ Выбери страну и тариф
3️⃣ Оплати удобным способом
4️⃣ Получи QR-код и инструкцию
5️⃣ Пользуйся интернетом по всему миру!

Начни прямо сейчас! 👇
  `.trim();

  try {
    // Отправляем фото с текстом и кнопками
    const photoPath = path.join(__dirname, '../public/welcome.jpg');
    
    if (fs.existsSync(photoPath)) {
      await bot.sendPhoto(chatId, photoPath, {
        caption: welcomeText,
        parse_mode: 'Markdown',
        ...mainMenu
      });
    } else {
      // Если фото нет, отправляем просто текст
      await bot.sendMessage(chatId, welcomeText, {
        parse_mode: 'Markdown',
        ...mainMenu
      });
    }
  } catch (error) {
    console.error('Ошибка отправки:', error);
    await bot.sendMessage(chatId, welcomeText, {
      parse_mode: 'Markdown',
      ...mainMenu
    });
  }
});

// Команда /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpText = `
❓ *Помощь eWave*

*Как купить eSIM:*
1. Нажми "🌊 Открыть eWave"
2. Выбери страну назначения
3. Выбери подходящий тариф
4. Оплати (Т-Банк, Stripe или ЮKassa)
5. Получи QR-код в приложении

*Как установить eSIM:*
📱 Настройки → Сотовая связь → Добавить eSIM
📷 Отсканируй QR-код
✅ Готово!

*Что делать если не работает:*
• Проверь что включен роуминг данных
• Убедись что выбрана правильная SIM для интернета
• Перезагрузи устройство
• Напиши в поддержку: @support

*Поддерживаемые устройства:*
📱 iPhone XS и новее
📱 Google Pixel 3 и новее
📱 Samsung Galaxy S20 и новее
📱 Большинство современных устройств

*Остались вопросы?*
Напиши в поддержку: @support
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
        `*Частые вопросы:*\n\n` +
        `*Q: Как установить eSIM?*\n` +
        `A: Настройки → Сотовая связь → Добавить eSIM → Отсканируй QR\n\n` +
        `*Q: Когда активируется eSIM?*\n` +
        `A: Автоматически при первом подключении к сети в стране назначения\n\n` +
        `*Q: Могу ли я использовать с основной SIM?*\n` +
        `A: Да! Можно использовать две SIM одновременно\n\n` +
        `*Q: Возможен возврат?*\n` +
        `A: Да, если eSIM не был активирован\n\n` +
        `*Не нашёл ответ?*\n` +
        `Напиши в поддержку: @support`,
        { parse_mode: 'Markdown', ...mainMenu }
      );
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
    `/menu - Показать меню`,
    mainMenu
  );
});

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

module.exports = bot;

