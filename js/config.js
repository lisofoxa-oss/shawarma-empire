// Конфигурация игры - здания, улучшения, достижения

const GameConfig = {
  // Настройки Supabase (заполни своими данными)
  SUPABASE_URL: 'YOUR_SUPABASE_URL',
  SUPABASE_KEY: 'YOUR_SUPABASE_ANON_KEY',
  
  // Здания (от дешёвых к дорогим)
  buildings: [
    { id: 1, name: 'Стажёр', cost: 15, owned: 0, production: 0.1, emoji: '👨‍🍳', desc: 'Учится крутить шаурму' },
    { id: 2, name: 'Шаурмист', cost: 100, owned: 0, production: 1, emoji: '🧑‍🍳', desc: 'Опытный мастер' },
    { id: 3, name: 'Киоск', cost: 500, owned: 0, production: 5, emoji: '🏪', desc: 'Маленькая точка продаж' },
    { id: 4, name: 'Тележка', cost: 2000, owned: 0, production: 15, emoji: '🛒', desc: 'Мобильная торговля' },
    { id: 5, name: 'Кафе', cost: 5000, owned: 0, production: 40, emoji: '🍽️', desc: 'Уютное заведение' },
    { id: 6, name: 'Фудтрак', cost: 15000, owned: 0, production: 100, emoji: '🚚', desc: 'Шаурма на колёсах' },
    { id: 7, name: 'Ресторан', cost: 40000, owned: 0, production: 250, emoji: '🏢', desc: 'Престижное место' },
    { id: 8, name: 'Сеть', cost: 100000, owned: 0, production: 600, emoji: '🌐', desc: 'Франшиза по городу' },
    { id: 9, name: 'Фабрика', cost: 500000, owned: 0, production: 2000, emoji: '🏭', desc: 'Массовое производство' },
    { id: 10, name: 'Корпорация', cost: 2000000, owned: 0, production: 8000, emoji: '🏛️', desc: 'Международный бренд' },
    { id: 11, name: 'Мегакорп', cost: 10000000, owned: 0, production: 30000, emoji: '🌍', desc: 'Мировое господство' },
    { id: 12, name: 'Космостанция', cost: 50000000, owned: 0, production: 100000, emoji: '🛸', desc: 'Шаурма в космосе!' },
  ],
  
  // Улучшения
  upgrades: [
    // Улучшения клика
    { id: 1, name: 'Острый соус', cost: 50, purchased: false, clickBonus: 1, type: 'click', emoji: '🌶️' },
    { id: 2, name: 'Свежие овощи', cost: 200, purchased: false, clickBonus: 2, type: 'click', emoji: '🥬' },
    { id: 3, name: 'Премиум мясо', cost: 1000, purchased: false, clickBonus: 5, type: 'click', emoji: '🥩' },
    { id: 4, name: 'Секретная приправа', cost: 5000, purchased: false, clickBonus: 10, type: 'click', emoji: '✨' },
    { id: 5, name: 'Золотой лаваш', cost: 25000, purchased: false, clickBonus: 25, type: 'click', emoji: '🏆' },
    { id: 6, name: 'Алмазный нож', cost: 100000, purchased: false, clickBonus: 50, type: 'click', emoji: '💎' },
    
    // Множители производства
    { id: 7, name: 'Быстрые руки', cost: 500, purchased: false, productionMultiplier: 1.5, type: 'production', emoji: '⚡' },
    { id: 8, name: 'Автоматизация', cost: 3000, purchased: false, productionMultiplier: 2, type: 'production', emoji: '🤖' },
    { id: 9, name: 'Турборежим', cost: 15000, purchased: false, productionMultiplier: 2.5, type: 'production', emoji: '🚀' },
    { id: 10, name: 'Квантовая печь', cost: 75000, purchased: false, productionMultiplier: 3, type: 'production', emoji: '⚛️' },
    { id: 11, name: 'Временной ускоритель', cost: 500000, purchased: false, productionMultiplier: 5, type: 'production', emoji: '⏰' },
    
    // Скидки на здания
    { id: 12, name: 'Дешёвая аренда', cost: 2000, purchased: false, buildingDiscount: 0.9, type: 'discount', emoji: '💰' },
    { id: 13, name: 'Оптовые закупки', cost: 10000, purchased: false, buildingDiscount: 0.85, type: 'discount', emoji: '📦' },
    { id: 14, name: 'Связи в мэрии', cost: 50000, purchased: false, buildingDiscount: 0.8, type: 'discount', emoji: '🏛️' },
    { id: 15, name: 'Монополия', cost: 250000, purchased: false, buildingDiscount: 0.75, type: 'discount', emoji: '👑' },
  ],
  
  // Достижения
  achievements: [
    // Достижения за общее производство
    { id: 1, name: 'Первые шаги', desc: 'Создай 10 шаурмы', target: 10, type: 'total', unlocked: false, reward: 50 },
    { id: 2, name: 'Любитель', desc: 'Создай 100 шаурмы', target: 100, type: 'total', unlocked: false, reward: 200 },
    { id: 3, name: 'Мастер', desc: 'Создай 1000 шаурмы', target: 1000, type: 'total', unlocked: false, reward: 1000 },
    { id: 4, name: 'Магнат', desc: 'Создай 10000 шаурмы', target: 10000, type: 'total', unlocked: false, reward: 5000 },
    { id: 5, name: 'Легенда', desc: 'Создай 100000 шаурмы', target: 100000, type: 'total', unlocked: false, reward: 25000 },
    { id: 6, name: 'Титан', desc: 'Создай 1000000 шаурмы', target: 1000000, type: 'total', unlocked: false, reward: 100000 },
    
    // Достижения за клики
    { id: 7, name: 'Кликер', desc: 'Кликни 100 раз', target: 100, type: 'clicks', unlocked: false, reward: 100 },
    { id: 8, name: 'Безумный кликер', desc: 'Кликни 1000 раз', target: 1000, type: 'clicks', unlocked: false, reward: 500 },
    { id: 9, name: 'Бог кликов', desc: 'Кликни 10000 раз', target: 10000, type: 'clicks', unlocked: false, reward: 2500 },
    
    // Достижения за здания
    { id: 10, name: 'Предприниматель', desc: 'Купи 10 зданий', target: 10, type: 'buildings', unlocked: false, reward: 300 },
    { id: 11, name: 'Империя', desc: 'Купи 50 зданий', target: 50, type: 'buildings', unlocked: false, reward: 1500 },
    { id: 12, name: 'Монополист', desc: 'Купи 100 зданий', target: 100, type: 'buildings', unlocked: false, reward: 5000 },
    
    // Достижения за престиж
    { id: 13, name: 'Первый престиж', desc: 'Достигни 1 престижа', target: 1, type: 'prestige', unlocked: false, reward: 10000 },
    { id: 14, name: 'Мастер престижа', desc: 'Достигни 5 престижа', target: 5, type: 'prestige', unlocked: false, reward: 50000 },
  ]
};

// Проверка загрузки
console.log('✅ config.js загружен');
