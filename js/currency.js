// Система премиум валюты - Специи
// js/currency.js

var Currency = {
  // Количество специй
  spices: 0,
  
  // Всего заработано за всё время
  totalEarned: 0,
  
  // Всего потрачено
  totalSpent: 0,
  
  // История транзакций (последние 50)
  history: [],
  
  // Цены в магазине
  shop: {
    // Ускорители
    boosters: [
      { id: 'boost_2x_1h', name: 'Турбо x2', desc: 'x2 производство на 1 час', price: 30, emoji: '⚡', duration: 3600000 },
      { id: 'boost_2x_4h', name: 'Турбо x2 PRO', desc: 'x2 производство на 4 часа', price: 100, emoji: '⚡', duration: 14400000 },
      { id: 'boost_5x_30m', name: 'Мега буст', desc: 'x5 производство на 30 минут', price: 75, emoji: '🚀', duration: 1800000, multiplier: 5 }
    ],
    
    // Премиум скины (покупаются за специи)
    skins: [
      { id: 'diamond_shawarma', name: 'Бриллиантовая', emoji: '💠', price: 100, desc: 'Сияющая роскошь' },
      { id: 'fire_shawarma', name: 'Огненная', emoji: '🔥', price: 75, desc: 'Острая как пламя' },
      { id: 'rainbow_shawarma', name: 'Радужная', emoji: '🌈', price: 150, desc: 'Все цвета вкуса' },
      { id: 'ghost_shawarma', name: 'Призрачная', emoji: '👻', price: 200, desc: 'Загадочная и редкая' },
      { id: 'golden_shawarma', name: 'Золотая', emoji: '🏆', price: 300, desc: 'Легендарный статус' }
    ],
    
    // Разное
    misc: [
      { id: 'reset_challenges', name: 'Новые челленджи', desc: 'Сбросить ежедневные задания', price: 10, emoji: '🔄' },
      { id: 'mystery_box', name: 'Сундук удачи', desc: 'Случайная награда', price: 20, emoji: '🎁' },
      { id: 'golden_hour', name: 'Золотой час', desc: 'Золотые шаурмы каждые 30 сек', price: 50, emoji: '✨', duration: 3600000 }
    ]
  },
  
  // Активные бустеры
  activeBoosters: [],
  
  // Купленные премиум скины
  purchasedSkins: [],
  
  // Инициализация
  init: function() {
    this.load();
    this.checkBoosters();
    console.log('✅ Currency система инициализирована. Специи:', this.spices);
  },
  
  // Добавить специи
  add: function(amount, source) {
    if (amount <= 0) return;
    
    this.spices += amount;
    this.totalEarned += amount;
    
    // Записываем в историю
    this.history.unshift({
      type: 'earn',
      amount: amount,
      source: source,
      time: Date.now()
    });
    
    // Ограничиваем историю
    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }
    
    this.save();
    
    // Показываем уведомление
    if (typeof UI !== 'undefined' && amount >= 5) {
      UI.showAchievementPopup({
        emoji: '🌶️',
        name: '+' + amount + ' специй!',
        desc: source,
        reward: 0
      });
    }
    
    return true;
  },
  
  // Потратить специи
  spend: function(amount, reason) {
    if (amount <= 0 || this.spices < amount) return false;
    
    this.spices -= amount;
    this.totalSpent += amount;
    
    // Записываем в историю
    this.history.unshift({
      type: 'spend',
      amount: amount,
      reason: reason,
      time: Date.now()
    });
    
    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }
    
    this.save();
    return true;
  },
  
  // Купить товар
  purchase: function(itemId) {
    var item = this.findItem(itemId);
    if (!item) {
      console.log('Товар не найден:', itemId);
      return false;
    }
    
    if (this.spices < item.price) {
      if (typeof UI !== 'undefined') {
        UI.showAchievementPopup({
          emoji: '😢',
          name: 'Недостаточно специй',
          desc: 'Нужно: ' + item.price + ' 🌶️',
          reward: 0
        });
      }
      return false;
    }
    
    // Проверяем тип товара
    var category = this.getItemCategory(itemId);
    
    // Для скинов - проверяем не куплен ли уже
    if (category === 'skins') {
      if (this.purchasedSkins.indexOf(itemId) !== -1) {
        if (typeof UI !== 'undefined') {
          UI.showAchievementPopup({
            emoji: '⚠️',
            name: 'Уже куплено',
            desc: 'Этот скин у тебя есть',
            reward: 0
          });
        }
        return false;
      }
    }
    
    // Списываем специи
    if (!this.spend(item.price, item.name)) {
      return false;
    }
    
    // Применяем эффект
    this.applyPurchase(item, category);
    
    if (typeof Sounds !== 'undefined') {
      Sounds.purchase();
    }
    
    return true;
  },
  
  // Найти товар по ID
  findItem: function(itemId) {
    var categories = ['boosters', 'skins', 'misc'];
    for (var i = 0; i < categories.length; i++) {
      var items = this.shop[categories[i]];
      for (var j = 0; j < items.length; j++) {
        if (items[j].id === itemId) {
          return items[j];
        }
      }
    }
    return null;
  },
  
  // Получить категорию товара
  getItemCategory: function(itemId) {
    var categories = ['boosters', 'skins', 'misc'];
    for (var i = 0; i < categories.length; i++) {
      var items = this.shop[categories[i]];
      for (var j = 0; j < items.length; j++) {
        if (items[j].id === itemId) {
          return categories[i];
        }
      }
    }
    return null;
  },
  
  // Применить покупку
  applyPurchase: function(item, category) {
    var self = this;
    
    if (category === 'boosters') {
      // Добавляем бустер
      var booster = {
        id: item.id,
        name: item.name,
        multiplier: item.multiplier || 2,
        endsAt: Date.now() + item.duration
      };
      this.activeBoosters.push(booster);
      this.save();
      
      if (typeof UI !== 'undefined') {
        UI.showAchievementPopup({
          emoji: item.emoji,
          name: item.name + ' активирован!',
          desc: 'Действует ' + Math.floor(item.duration / 60000) + ' мин',
          reward: 0
        });
      }
      
    } else if (category === 'skins') {
      // Добавляем скин в коллекцию
      this.purchasedSkins.push(item.id);
      
      // Добавляем в систему скинов
      if (typeof Skins !== 'undefined') {
        // Добавляем премиум скин в список
        var skinExists = false;
        for (var i = 0; i < Skins.list.length; i++) {
          if (Skins.list[i].id === item.id) {
            skinExists = true;
            break;
          }
        }
        
        if (!skinExists) {
          Skins.list.push({
            id: item.id,
            name: item.name,
            emoji: item.emoji,
            desc: item.desc,
            unlockType: 'premium',
            unlockDesc: 'Куплено за специи'
          });
        }
        
        Skins.unlocked.push(item.id);
        Skins.select(item.id);
        Skins.save();
      }
      
      this.save();
      
      if (typeof UI !== 'undefined') {
        UI.showAchievementPopup({
          emoji: item.emoji,
          name: 'Новый скин!',
          desc: item.name,
          reward: 0
        });
      }
      
    } else if (category === 'misc') {
      // Особые товары
      if (item.id === 'reset_challenges') {
        if (typeof Challenges !== 'undefined') {
          Challenges.lastGenerated = 0;
          Challenges.generateDaily();
          if (typeof UI !== 'undefined') {
            UI.showAchievementPopup({
              emoji: '🔄',
              name: 'Челленджи обновлены!',
              desc: 'Новые задания ждут',
              reward: 0
            });
          }
        }
        
      } else if (item.id === 'mystery_box') {
        // Случайная награда
        this.openMysteryBox();
        
      } else if (item.id === 'golden_hour') {
        // Золотой час
        var booster = {
          id: item.id,
          name: item.name,
          type: 'golden',
          endsAt: Date.now() + item.duration
        };
        this.activeBoosters.push(booster);
        this.save();
        
        if (typeof UI !== 'undefined') {
          UI.showAchievementPopup({
            emoji: '✨',
            name: 'Золотой час!',
            desc: 'Золотые шаурмы каждые 30 сек',
            reward: 0
          });
        }
      }
    }
  },
  
  // Открыть сундук удачи
  openMysteryBox: function() {
    var rewards = [
      { type: 'shawarmas', amount: 5000, chance: 30, emoji: '🌯', name: '5,000 шаурмы' },
      { type: 'shawarmas', amount: 25000, chance: 20, emoji: '🌯', name: '25,000 шаурмы' },
      { type: 'shawarmas', amount: 100000, chance: 10, emoji: '🌯', name: '100,000 шаурмы' },
      { type: 'spices', amount: 5, chance: 15, emoji: '🌶️', name: '5 специй' },
      { type: 'spices', amount: 15, chance: 10, emoji: '🌶️', name: '15 специй' },
      { type: 'spices', amount: 50, chance: 5, emoji: '🌶️', name: '50 специй (ДЖЕКПОТ!)' },
      { type: 'boost', duration: 1800000, chance: 10, emoji: '⚡', name: 'x2 буст на 30 мин' }
    ];
    
    // Выбираем награду по шансам
    var roll = Math.random() * 100;
    var cumulative = 0;
    var reward = rewards[0];
    
    for (var i = 0; i < rewards.length; i++) {
      cumulative += rewards[i].chance;
      if (roll <= cumulative) {
        reward = rewards[i];
        break;
      }
    }
    
    // Применяем награду
    if (reward.type === 'shawarmas') {
      if (typeof Game !== 'undefined') {
        Game.state.shawarmas += reward.amount;
        Game.state.totalShawarmas += reward.amount;
        Game.state.lifetimeShawarmas += reward.amount;
      }
    } else if (reward.type === 'spices') {
      this.add(reward.amount, 'Сундук удачи');
    } else if (reward.type === 'boost') {
      this.activeBoosters.push({
        id: 'mystery_boost',
        name: 'Буст из сундука',
        multiplier: 2,
        endsAt: Date.now() + reward.duration
      });
      this.save();
    }
    
    if (typeof UI !== 'undefined') {
      UI.showAchievementPopup({
        emoji: reward.emoji,
        name: 'Из сундука:',
        desc: reward.name,
        reward: reward.type === 'shawarmas' ? reward.amount : 0
      });
      UI.createParticles(window.innerWidth / 2, window.innerHeight / 2, 15, '🎁');
    }
  },
  
  // Проверить активные бустеры
  checkBoosters: function() {
    var now = Date.now();
    var changed = false;
    
    for (var i = this.activeBoosters.length - 1; i >= 0; i--) {
      if (this.activeBoosters[i].endsAt <= now) {
        this.activeBoosters.splice(i, 1);
        changed = true;
      }
    }
    
    if (changed) {
      this.save();
    }
  },
  
  // Получить текущий множитель от бустеров
  getBoostMultiplier: function() {
    this.checkBoosters();
    
    var multiplier = 1;
    for (var i = 0; i < this.activeBoosters.length; i++) {
      var booster = this.activeBoosters[i];
      if (booster.multiplier && booster.type !== 'golden') {
        multiplier *= booster.multiplier;
      }
    }
    return multiplier;
  },
  
  // Проверить активен ли золотой час
  isGoldenHourActive: function() {
    this.checkBoosters();
    
    for (var i = 0; i < this.activeBoosters.length; i++) {
      if (this.activeBoosters[i].type === 'golden') {
        return true;
      }
    }
    return false;
  },
  
  // Сохранение
  save: function() {
    var data = {
      spices: this.spices,
      totalEarned: this.totalEarned,
      totalSpent: this.totalSpent,
      history: this.history,
      activeBoosters: this.activeBoosters,
      purchasedSkins: this.purchasedSkins
    };
    localStorage.setItem('shawarma_currency', JSON.stringify(data));
  },
  
  // Загрузка
  load: function() {
    try {
      var saved = localStorage.getItem('shawarma_currency');
      if (saved) {
        var data = JSON.parse(saved);
        this.spices = data.spices || 0;
        this.totalEarned = data.totalEarned || 0;
        this.totalSpent = data.totalSpent || 0;
        this.history = data.history || [];
        this.activeBoosters = data.activeBoosters || [];
        this.purchasedSkins = data.purchasedSkins || [];
      }
    } catch (e) {
      console.error('Ошибка загрузки валюты:', e);
    }
  }
};

console.log('✅ currency.js загружен');
