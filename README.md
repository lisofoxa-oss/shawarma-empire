# 🌯 Империя Шаурмы - Telegram Web App

Idle-кликер игра в Telegram о построении империи шаурмы!

## 🚀 Технологии

- **Frontend**: HTML, JavaScript, Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Bot**: Telegram Bot API

## 📦 Установка

### 1. Склонируй репозиторий
```bash
git clone https://github.com/твой-username/shawarma-empire.git
cd shawarma-empire
```

### 2. Настрой Supabase

1. Создай проект на [supabase.com](https://supabase.com)
2. Выполни SQL из файла выше для создания таблиц
3. Сохрани URL и anon key

### 3. Настрой Telegram бота

1. Создай бота через @BotFather
2. Сохрани токен бота

### 4. Деплой на Vercel

1. Зарегистрируйся на [vercel.com](https://vercel.com)
2. Подключи GitHub репозиторий
3. Добавь переменные окружения:
   - `TELEGRAM_BOT_TOKEN` - токен бота
   - `WEB_APP_URL` - URL твоего приложения на Vercel

### 5. Замени данные в index.html

Найди строки:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Замени на свои данные из Supabase.

### 6. Настрой webhook для бота

После деплоя на Vercel, открой в браузере:
```
https://api.telegram.org/bot<ТВО_ТОКЕН>/setWebhook?url=https://твой-проект.vercel.app/api/webhook
```

## 🎮 Как играть

1. Открой бота в Telegram
2. Нажми /start
3. Кликай "Играть"
4. Строй империю шаурмы!

## 📝 Структура проекта

```
shawarma-empire/
├── index.html          # Главная страница Web App
├── vercel.json         # Конфигурация Vercel
├── api/
│   └── webhook.js      # Обработчик Telegram webhook
└── README.md           # Этот файл
```

## 🔧 Разработка

Проект полностью бесплатный на всех этапах:
- GitHub - бесплатно
- Vercel - бесплатный план (100GB bandwidth)
- Supabase - бесплатно до 500MB базы данных
- Telegram Bot - бесплатно

## 📈 Планы развития

- [ ] Система достижений
- [ ] Престиж система
- [ ] Ежедневные награды
- [ ] Рейтинг игроков
- [ ] Звуковые эффекты
- [ ] Больше улучшений и зданий

## 📄 Лицензия

MIT License - делай что хочешь!
