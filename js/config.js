// Конфигурация игры v2.2 - Медленное развитие
// js/config.js

var GameConfig = {
  SUPABASE_URL: window.SUPABASE_URL || '',
  SUPABASE_KEY: window.SUPABASE_KEY || '',
  VERSION: '2.2.0',
  
  // Здания - медленная прогрессия
  // Окупаемость ~200-300 секунд, чтобы игра была длинной
  buildings: [
    { id: 1, name: 'Стажёр', cost: 15, owned: 0, production: 0.05, emoji: '👨‍🍳', desc: 'Учится крутить шаурму' },
    { id: 2, name: 'Шаурмист', cost: 150, owned: 0, production: 0.3, emoji: '🧑‍🍳', desc: 'Опытный мастер' },
    { id: 3, name: 'Киоск', cost: 1000, owned: 0, production: 2, emoji: '🏪', desc: 'Маленькая точка продаж' },
    { id: 4, name: 'Тележка', cost: 5000, owned: 0, production: 8, emoji: '🛒', desc: 'Мобильная торговля' },
    { id: 5, name: 'Кафе', cost: 25000, owned: 0, production: 30, emoji: '🍽️', desc: 'Уютное заведение' },
    { id: 6, name: 'Фудтрак', cost: 100000, owned: 0, production: 100, emoji: '🚚', desc: 'Шаурма на колёсах' },
    { id: 7, name: 'Ресторан', cost: 500000, owned: 0, production: 400, emoji: '🏢', desc: 'Престижное место' },
    { id: 8, name: 'Сеть', cost: 2500000, owned: 0, production: 1500, emoji: '🌐', desc: 'Франшиза по городу' },
    { id: 9, name: 'Фабрика', cost: 15000000, owned: 0, production: 8000, emoji: '🏭', desc: 'Массовое производство' },
    { id: 10, name: 'Корпорация', cost: 100000000, owned: 0, production: 40000, emoji: '🏛️', desc: 'Международный бренд' },
    { id: 11, name: 'Мегакорп', cost: 750000000, owned: 0, production: 200000, emoji: '🌍', desc: 'Мировое господство' },
    { id: 12, name: 'Космостанция', cost: 5000000000, owned: 0, production: 1000000, emoji: '🛸', desc: 'Шаурма в космосе!' },
  ],
  
  // Улучшения - появляются как вехи
  upgrades: [
    // Клик - ранняя игра
    { id: 1, name: 'Острый соус', cost: 200, purchased: false, clickBonus: 1, type: 'click', emoji: '🌶️' },
    { id: 2, name: 'Свежие овощи', cost: 1500, purchased: false, clickBonus: 2, type: 'click', emoji: '🥬' },
    { id: 3, name: 'Премиум мясо', cost: 10000, purchased: false, clickBonus: 5, type: 'click', emoji: '🥩' },
    { id: 4, name: 'Секретная приправа', cost: 75000, purchased: false, clickBonus: 15, type: 'click', emoji: '✨' },
    { id: 5, name: 'Золотой лаваш', cost: 500000, purchased: false, clickBonus: 50, type: 'click', emoji: '🏆' },
    { id: 6, name: 'Алмазный нож', cost: 5000000, purchased: false, clickBonus: 200, type: 'click', emoji: '💎' },
    
    // Производство - ключевые множители
    { id: 7, name: 'Быстрые руки', cost: 5000, purchased: false, productionMultiplier: 1.2, type: 'production', emoji: '⚡' },
    { id: 8, name: 'Автоматизация', cost: 50000, purchased: false, productionMultiplier: 1.35, type: 'production', emoji: '🤖' },
    { id: 9, name: 'Турборежим', cost: 500000, purchased: false, productionMultiplier: 1.5, type: 'production', emoji: '🚀' },
    { id: 10, name: 'Квантовая печь', cost: 5000000, purchased: false, productionMultiplier: 1.75, type: 'production', emoji: '⚛️' },
    { id: 11, name: 'Временной ускоритель', cost: 50000000, purchased: false, productionMultiplier: 2, type: 'production', emoji: '⏰' },
    
    // Скидки - mid/late game
    { id: 12, name: 'Оптовые закупки', cost: 100000, purchased: false, buildingDiscount: 0.95, type: 'discount', emoji: '📦' },
    { id: 13, name: 'Связи в мэрии', cost: 1000000, purchased: false, buildingDiscount: 0.92, type: 'discount', emoji: '🏛️' },
    { id: 14, name: 'Монополия', cost: 25000000, purchased: false, buildingDiscount: 0.88, type: 'discount', emoji: '👑' },
  ],
  
  // Достижения - награды очень скромные
  achievements: [
    // Производство
    { id: 1, name: 'Первая шаурма', desc: 'Создай 10 шаурмы', target: 10, type: 'total', unlocked: false, reward: 0 },
    { id: 2, name: 'Начинающий', desc: 'Создай 500 шаурмы', target: 500, type: 'total', unlocked: false, reward: 25 },
    { id: 3, name: 'Любитель', desc: 'Создай 5,000 шаурмы', target: 5000, type: 'total', unlocked: false, reward: 100 },
    { id: 4, name: 'Мастер', desc: 'Создай 50,000 шаурмы', target: 50000, type: 'total', unlocked: false, reward: 500 },
    { id: 5, name: 'Эксперт', desc: 'Создай 500,000 шаурмы', target: 500000, type: 'total', unlocked: false, reward: 2000 },
    { id: 6, name: 'Магнат', desc: 'Создай 5,000,000 шаурмы', target: 5000000, type: 'total', unlocked: false, reward: 10000 },
    { id: 7, name: 'Легенда', desc: 'Создай 50,000,000 шаурмы', target: 50000000, type: 'total', unlocked: false, reward: 50000 },
    { id: 8, name: 'Титан', desc: 'Создай 500,000,000 шаурмы', target: 500000000, type: 'total', unlocked: false, reward: 250000 },
    
    // Клики
    { id: 9, name: 'Кликер', desc: 'Сделай 100 кликов', target: 100, type: 'clicks', unlocked: false, reward: 0 },
    { id: 10, name: 'Активный кликер', desc: 'Сделай 1,000 кликов', target: 1000, type: 'clicks', unlocked: false, reward: 50 },
    { id: 11, name: 'Мастер кликов', desc: 'Сделай 5,000 кликов', target: 5000, type: 'clicks', unlocked: false, reward: 200 },
    { id: 12, name: 'Безумный кликер', desc: 'Сделай 25,000 кликов', target: 25000, type: 'clicks', unlocked: false, reward: 1000 },
    
    // Здания
    { id: 13, name: 'Первая покупка', desc: 'Купи 10 зданий', target: 10, type: 'buildings', unlocked: false, reward: 0 },
    { id: 14, name: 'Предприниматель', desc: 'Купи 50 зданий', target: 50, type: 'buildings', unlocked: false, reward: 250 },
    { id: 15, name: 'Бизнесмен', desc: 'Купи 100 зданий', target: 100, type: 'buildings', unlocked: false, reward: 2500 },
    { id: 16, name: 'Империя', desc: 'Купи 200 зданий', target: 200, type: 'buildings', unlocked: false, reward: 25000 },
    
    // Престиж
    { id: 17, name: 'Перерождение', desc: 'Сделай первый престиж', target: 1, type: 'prestige', unlocked: false, reward: 0 },
    { id: 18, name: 'Опытный', desc: 'Достигни 3 престижа', target: 3, type: 'prestige', unlocked: false, reward: 0 },
    { id: 19, name: 'Ветеран', desc: 'Достигни 5 престижа', target: 5, type: 'prestige', unlocked: false, reward: 0 },
    { id: 20, name: 'Мастер престижа', desc: 'Достигни 10 престижа', target: 10, type: 'prestige', unlocked: false, reward: 0 },
  ]
};

console.log('✅ config.js v' + GameConfig.VERSION + ' загружен');
