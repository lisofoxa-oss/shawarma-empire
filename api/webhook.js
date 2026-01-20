// api/webhook.js
export default async function handler(req, res) {
  // Проверяем, что это POST запрос
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    
    // Получаем данные сообщения
    const message = update.message;
    if (!message) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text;

    // Токен бота из переменных окружения
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const WEB_APP_URL = process.env.WEB_APP_URL;

    // Команда /start
    if (text === '/start') {
      await sendMessage(chatId, BOT_TOKEN, {
        text: '🌯 Добро пожаловать в Империю Шаурмы!\n\nСтрой свою империю шаурмы с нуля! Кликай, покупай здания, нанимай сотрудников и становись магнатом шаурмы!\n\n👇 Нажми кнопку ниже, чтобы начать игру!',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🎮 Играть',
                web_app: { url: WEB_APP_URL }
              }
            ],
            [
              {
                text: '📊 Статистика',
                callback_data: 'stats'
              },
              {
                text: '❓ Помощь',
                callback_data: 'help'
              }
            ]
          ]
        }
      });
    }

    // Команда /help
    else if (text === '/help') {
      await sendMessage(chatId, BOT_TOKEN, {
        text: '📖 Как играть:\n\n1️⃣ Кликай по шаурме и зарабатывай очки\n2️⃣ Покупай здания для автоматического производства\n3️⃣ Улучшай силу клика специальными улучшениями\n4️⃣ Строй империю шаурмы!\n\n💡 Совет: сначала купи стажёров, они дёшево производят шаурму автоматически!'
      });
    }

    // Команда /stats
    else if (text === '/stats') {
      await sendMessage(chatId, BOT_TOKEN, {
        text: '📊 Твоя статистика:\n\nОткрой игру, чтобы увидеть полную статистику!',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🎮 Открыть игру',
                web_app: { url: WEB_APP_URL }
              }
            ]
          ]
        }
      });
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Error:', error);
    return res.status(200).json({ ok: true });
  }
}

// Функция отправки сообщения
async function sendMessage(chatId, token, options) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      ...options
    })
  });
}
