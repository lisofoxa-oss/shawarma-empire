// api/webhook.js - Telegram Bot Webhook Handler
// Версия 2.0 с поддержкой callback-кнопок

export default async function handler(req, res) {
  // Разрешаем только POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Получаем переменные окружения
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const WEB_APP_URL = process.env.WEB_APP_URL || 'https://your-app.vercel.app';

  if (!BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN не установлен!');
    return res.status(500).json({ error: 'Bot token not configured' });
  }

  try {
    const update = req.body;
    console.log('Получен update:', JSON.stringify(update, null, 2));

    // Обработка обычных сообщений
    if (update.message) {
      await handleMessage(update.message, BOT_TOKEN, WEB_APP_URL);
    }
    
    // Обработка callback-кнопок (inline buttons)
    if (update.callback_query) {
      await handleCallback(update.callback_query, BOT_TOKEN, WEB_APP_URL);
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Ошибка webhook:', error);
    return res.status(200).json({ ok: true }); // Всегда 200, чтобы Telegram не ретраил
  }
}

// Обработка текстовых сообщений
async function handleMessage(message, token, webAppUrl) {
  const chatId = message.chat.id;
  const text = message.text || '';
  const firstName = message.from?.first_name || 'Игрок';

  // /start - Приветствие
  if (text === '/start' || text.startsWith('/start ')) {
    await sendMessage(chatId, token, {
      text: `🌯 Привет, ${firstName}!\n\nДобро пожаловать в *Империю Шаурмы*!\n\nСтрой свою империю с нуля:\n• 🖱 Кликай и зарабатывай шаурму\n• 🏪 Покупай здания для автодохода\n• ⚡ Улучшай производство\n• ⭐ Достигай престижа!\n\n👇 Нажми кнопку чтобы играть!`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🎮 Играть сейчас!',
              web_app: { url: webAppUrl }
            }
          ],
          [
            {
              text: '📖 Как играть',
              callback_data: 'help'
            },
            {
              text: '🏆 Достижения',
              callback_data: 'achievements'
            }
          ],
          [
            {
              text: '📢 Новости',
              callback_data: 'news'
            }
          ]
        ]
      }
    });
    return;
  }

  // /help - Помощь
  if (text === '/help') {
    await sendHelpMessage(chatId, token, webAppUrl);
    return;
  }

  // /play - Быстрый запуск игры
  if (text === '/play') {
    await sendMessage(chatId, token, {
      text: '🌯 Запускаем игру!',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Играть', web_app: { url: webAppUrl } }]
        ]
      }
    });
    return;
  }

  // Неизвестная команда - показываем меню
  await sendMessage(chatId, token, {
    text: `🌯 Не понял команду.\n\nИспользуй кнопки ниже или команды:\n/start - Главное меню\n/play - Запустить игру\n/help - Помощь`,
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎮 Играть', web_app: { url: webAppUrl } }]
      ]
    }
  });
}

// Обработка callback-кнопок
async function handleCallback(callback, token, webAppUrl) {
  const chatId = callback.message.chat.id;
  const messageId = callback.message.message_id;
  const data = callback.data;
  const callbackId = callback.id;

  // Отвечаем на callback чтобы убрать "часики"
  await answerCallback(callbackId, token);

  switch (data) {
    case 'help':
      await sendHelpMessage(chatId, token, webAppUrl);
      break;

    case 'achievements':
      await sendMessage(chatId, token, {
        text: `🏆 *Достижения в игре:*\n\n` +
          `📊 *За производство:*\n` +
          `• Первые шаги (10 шаурмы)\n` +
          `• Любитель (100)\n` +
          `• Мастер (1,000)\n` +
          `• Магнат (10,000)\n` +
          `• Легенда (100,000)\n` +
          `• Титан (1,000,000)\n\n` +
          `🖱 *За клики:*\n` +
          `• Кликер (100 кликов)\n` +
          `• Безумный кликер (1,000)\n` +
          `• Бог кликов (10,000)\n\n` +
          `🏪 *За здания:*\n` +
          `• Предприниматель (10 зданий)\n` +
          `• Империя (50)\n` +
          `• Монополист (100)\n\n` +
          `Открой игру и собери их все! 🎮`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 Играть', web_app: { url: webAppUrl } }],
            [{ text: '◀️ Назад', callback_data: 'back_to_menu' }]
          ]
        }
      });
      break;

    case 'news':
      await sendMessage(chatId, token, {
        text: `📢 *Новости игры:*\n\n` +
          `🆕 *Версия 1.2.0*\n` +
          `• Исправлена работа на мобильных\n` +
          `• Улучшена производительность\n` +
          `• 12 зданий для покупки\n` +
          `• 15 улучшений\n` +
          `• Система престижа\n` +
          `• Ежедневные награды\n\n` +
          `🔜 *Скоро:*\n` +
          `• Рейтинг игроков\n` +
          `• Реферальная система\n` +
          `• Новые здания\n\n` +
          `Следи за обновлениями! 🚀`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 Играть', web_app: { url: webAppUrl } }],
            [{ text: '◀️ Назад', callback_data: 'back_to_menu' }]
          ]
        }
      });
      break;

    case 'back_to_menu':
      // Возвращаемся в главное меню
      await editMessage(chatId, messageId, token, {
        text: `🌯 *Империя Шаурмы*\n\nВыбери действие:`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 Играть сейчас!', web_app: { url: webAppUrl } }],
            [
              { text: '📖 Как играть', callback_data: 'help' },
              { text: '🏆 Достижения', callback_data: 'achievements' }
            ],
            [{ text: '📢 Новости', callback_data: 'news' }]
          ]
        }
      });
      break;

    default:
      console.log('Неизвестный callback:', data);
  }
}

// Отправка сообщения с помощью
async function sendHelpMessage(chatId, token, webAppUrl) {
  await sendMessage(chatId, token, {
    text: `📖 *Как играть в Империю Шаурмы:*\n\n` +
      `*1️⃣ Кликай по шаурме*\n` +
      `Каждый клик = шаурма. Чем больше кликов, тем богаче!\n\n` +
      `*2️⃣ Покупай здания*\n` +
      `Здания автоматически производят шаурму:\n` +
      `• 👨‍🍳 Стажёр - 0.1/сек\n` +
      `• 🧑‍🍳 Шаурмист - 1/сек\n` +
      `• 🏪 Киоск - 5/сек\n` +
      `• ...и ещё 9 зданий до Космостанции! 🛸\n\n` +
      `*3️⃣ Покупай улучшения*\n` +
      `• 🌶️ Сила клика\n` +
      `• ⚡ Множители производства\n` +
      `• 💰 Скидки на здания\n\n` +
      `*4️⃣ Достигай престижа*\n` +
      `Накопи 1M шаурмы → Сбрось прогресс → Получи постоянный множитель!\n\n` +
      `*💡 Совет:* Сначала купи несколько стажёров для пассивного дохода!`,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎮 Понял, играть!', web_app: { url: webAppUrl } }],
        [{ text: '◀️ Назад', callback_data: 'back_to_menu' }]
      ]
    }
  });
}

// === API функции ===

async function sendMessage(chatId, token, options) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      ...options
    })
  });
  
  const result = await response.json();
  if (!result.ok) {
    console.error('Ошибка sendMessage:', result);
  }
  return result;
}

async function editMessage(chatId, messageId, token, options) {
  const url = `https://api.telegram.org/bot${token}/editMessageText`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      ...options
    })
  });
  
  const result = await response.json();
  if (!result.ok) {
    console.error('Ошибка editMessage:', result);
  }
  return result;
}

async function answerCallback(callbackId, token, text = '') {
  const url = `https://api.telegram.org/bot${token}/answerCallbackQuery`;
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackId,
      text: text
    })
  });
}
