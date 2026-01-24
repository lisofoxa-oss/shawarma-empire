// Конфигурация игры - здания, улучшения, достижения
// Версия с исправленным балансом

var GameConfig = {
  // Supabase настройки (будут переопределены из HTML)
  SUPABASE_URL: window.SUPABASE_URL || '',
  SUPABASE_KEY: window.SUPABASE_KEY || '',
  
  // Версия игры
  VERSION: '2.1.0',
  
  // Здания (сбалансированная прогрессия)
  // Формула окупаемости: cost / production ≈ 100-150 секунд
  buildings: [
    { id: 1, name: 'Стажёр', cost: 15, owned: 0, production: 0.1, emoji: '👨‍🍳', desc: 'Учится крутить шаурму' },
    { id: 2, name: 'Шаурмист', cost: 100, owned: 0, production: 0.5, emoji: '🧑‍🍳', desc: 'Опытный мастер' },
    { id: 3, name: 'Киоск', cost: 500, owned: 0, production: 3, emoji: '🏪', desc: 'Маленькая точка продаж' },
    { id: 4, name: 'Тележка', cost: 2500, owned: 0, production: 15, emoji: '🛒', desc: 'Мобильная торговля' },
    { id: 5, name: 'Кафе', cost: 10000, owned: 0, production: 50, emoji: '🍽️', desc: 'Уютное заведение' },
    { id: 6, name: 'Фудтрак', cost: 40000, owned: 0, production: 200, emoji: '🚚', desc: 'Шаурма на колёсах' },
    { id: 7, name: 'Ресторан', cost: 150000, owned: 0, production: 800, emoji: '🏢', desc: 'Престижное место' },
    { id: 8, name: 'Сеть', cost: 500000, owned: 0, production: 3000, emoji: '🌐', desc: 'Франшиза по городу' },
    { id: 9, name: 'Фабрика', cost: 2000000, owned: 0, production: 12000, emoji: '🏭', desc: 'Массовое производство' },
    { id: 10, name: 'Корпорация', cost: 10000000, owned: 0, production: 50000, emoji: '🏛️', desc: 'Международный бренд' },
    { id: 11, name: 'Мегакорп', cost: 50000000, owned: 0, production: 250000, emoji: '🌍', desc: 'Мировое господство' },
    { id: 12, name: 'Космостанция', cost: 300000000, owned: 0, production: 1500000, emoji: '🛸', desc: 'Шаурма в космосе!' },
  ],
  
  // Улучшения (появляются по мере прогресса)
  upgrades: [
    // Улучшения клика (примерно когда клик становится неэффективным)
    { id: 1, name: 'Острый соус', cost: 100, purchased: false, clickBonus: 1, type: 'click', emoji: '🌶️' },
    { id: 2, name: 'Свежие овощи', cost: 500, purchased: false, clickBonus: 3, type: 'click', emoji: '🥬' },
    { id: 3, name: 'Премиум мясо', cost: 3000, purchased: false, clickBonus: 10, type: 'click', emoji: '🥩' },
    { id: 4, name: 'Секретная приправа', cost: 15000, purchased: false, clickBonus: 25, type: 'click', emoji: '✨' },
    { id: 5, name: 'Золотой лаваш', cost: 75000, purchased: false, clickBonus: 100, type: 'click', emoji: '🏆' },
    { id: 6, name: 'Алмазный нож', cost: 500000, purchased: false, clickBonus: 500, type: 'click', emoji: '💎' },
    
    // Множители производства (значительные вехи)
    { id: 7, name: 'Быстрые руки', cost: 1000, purchased: false, productionMultiplier: 1.25, type: 'production', emoji: '⚡' },
    { id: 8, name: 'Автоматизация', cost: 10000, purchased: false, productionMultiplier: 1.5, type: 'production', emoji: '🤖' },
    { id: 9, name: 'Турборежим', cost: 100000, purchased: false, productionMultiplier: 2, type: 'production', emoji: '🚀' },
    { id: 10, name: 'Квантовая печь', cost: 1000000, purchased: false, productionMultiplier: 2.5, type: 'production', emoji: '⚛️' },
    { id: 11, name: 'Временной ускоритель', cost: 10000000, purchased: false, productionMultiplier: 3, type: 'production', emoji: '⏰' },
    
    // Скидки на здания (появляются в mid-game)
    { id: 12, name: 'Оптовые закупки', cost: 25000, purchased: false, buildingDiscount: 0.95, type: 'discount', emoji: '📦' },
    { id: 13, name: 'Связи в мэрии', cost: 250000, purchased: false, buildingDiscount: 0.90, type: 'discount', emoji: '🏛️' },
    { id: 14, name: 'Монополия', cost: 2500000, purchased: false, buildingDiscount: 0.85, type: 'discount', emoji: '👑' },
  ],
  
  // Достижения (награды = примерно 5-10% от цели, чтобы не ломать баланс)
  achievements: [
    // За производство (основная прогрессия)
    { id: 1, name: 'Первая шаурма', desc: 'Создай 10 шаурмы', target: 10, type: 'total', unlocked: false, reward: 5 },
    { id: 2, name: 'Начинающий', desc: 'Создай 100 шаурмы', target: 100, type: 'total', unlocked: false, reward: 25 },
    { id: 3, name: 'Любитель', desc: 'Создай 1,000 шаурмы', target: 1000, type: 'total', unlocked: false, reward: 100 },
    { id: 4, name: 'Мастер', desc: 'Создай 10,000 шаурмы', target: 10000, type: 'total', unlocked: false, reward: 500 },
    { id: 5, name: 'Эксперт', desc: 'Создай 100,000 шаурмы', target: 100000, type: 'total', unlocked: false, reward: 2500 },
    { id: 6, name: 'Магнат', desc: 'Создай 1,000,000 шаурмы', target: 1000000, type: 'total', unlocked: false, reward: 10000 },
    { id: 7, name: 'Легенда', desc: 'Создай 10,000,000 шаурмы', target: 10000000, type: 'total', unlocked: false, reward: 50000 },
    { id: 8, name: 'Титан', desc: 'Создай 100,000,000 шаурмы', target: 100000000, type: 'total', unlocked: false, reward: 250000 },
    
    // За клики (награды скромные, клики - не основа игры)
    { id: 9, name: 'Кликер', desc: 'Сделай 100 кликов', target: 100, type: 'clicks', unlocked: false, reward: 10 },
    { id: 10, name: 'Активный кликер', desc: 'Сделай 500 кликов', target: 500, type: 'clicks', unlocked: false, reward: 50 },
    { id: 11, name: 'Мастер кликов', desc: 'Сделай 2,000 кликов', target: 2000, type: 'clicks', unlocked: false, reward: 200 },
    { id: 12, name: 'Безумный кликер', desc: 'Сделай 10,000 кликов', target: 10000, type: 'clicks', unlocked: false, reward: 1000 },
    
    // За здания (награды как бонус к экономике)
    { id: 13, name: 'Первая покупка', desc: 'Купи 5 зданий', target: 5, type: 'buildings', unlocked: false, reward: 25 },
    { id: 14, name: 'Предприниматель', desc: 'Купи 25 зданий', target: 25, type: 'buildings', unlocked: false, reward: 250 },
    { id: 15, name: 'Бизнесмен', desc: 'Купи 75 зданий', target: 75, type: 'buildings', unlocked: false, reward: 2500 },
    { id: 16, name: 'Империя', desc: 'Купи 150 зданий', target: 150, type: 'buildings', unlocked: false, reward: 25000 },
    
    // За престиж (награды на новый цикл)
    { id: 17, name: 'Перерождение', desc: 'Сделай первый престиж', target: 1, type: 'prestige', unlocked: false, reward: 0 },
    { id: 18, name: 'Опытный', desc: 'Достигни 3 престижа', target: 3, type: 'prestige', unlocked: false, reward: 0 },
    { id: 19, name: 'Ветеран', desc: 'Достигни 5 престижа', target: 5, type: 'prestige', unlocked: false, reward: 0 },
    { id: 20, name: 'Мастер престижа', desc: 'Достигни 10 престижа', target: 10, type: 'prestige', unlocked: false, reward: 0 },
  ]
};

console.log('✅ config.js загружен (v' + GameConfig.VERSION + ')');
