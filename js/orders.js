// Система заказов (мини-квесты)
// js/orders.js

var Orders = {
  // Активные заказы
  activeOrders: [],
  maxOrders: 3,
  
  // Типы заказов
  orderTypes: [
    {
      id: 'click',
      templates: [
        { desc: 'Сделай {target} кликов', targetMin: 10, targetMax: 50 },
        { desc: 'Накликай {target} раз', targetMin: 20, targetMax: 100 },
      ],
      check: function(order) { return Game.state.clickCount - order.startValue; }
    },
    {
      id: 'produce',
      templates: [
        { desc: 'Произведи {target} шаурмы', targetMin: 100, targetMax: 5000 },
        { desc: 'Создай {target} шаурмы', targetMin: 500, targetMax: 10000 },
      ],
      check: function(order) { return Game.state.totalShawarmas - order.startValue; }
    },
    {
      id: 'buy_building',
      templates: [
        { desc: 'Купи {target} зданий', targetMin: 1, targetMax: 5 },
      ],
      check: function(order) {
        var total = 0;
        for (var i = 0; i < Game.state.buildings.length; i++) {
          total += Game.state.buildings[i].owned;
        }
        return total - order.startValue;
      }
    },
    {
      id: 'slicer',
      templates: [
        { desc: 'Набери {target} очков в Слайсере', targetMin: 50, targetMax: 200 },
      ],
      check: function(order) {
        var best = parseInt(localStorage.getItem('slicer_best') || '0');
        return best >= order.target ? order.target : 0;
      }
    }
  ],
  
  // Эмодзи для заказчиков
  customers: ['👨', '👩', '🧑', '👴', '👵', '🧔', '👨‍🍳', '👩‍💼', '🧑‍🎤', '👨‍🚀'],
  
  // Время обновления заказов (мс)
  refreshInterval: 300000, // 5 минут
  lastRefresh: 0,
  
  // Инициализация
  init: function() {
    this.load();
    this.checkRefresh();
    
    // Проверяем заказы каждые 2 секунды
    var self = this;
    setInterval(function() {
      self.checkOrders();
    }, 2000);
    
    console.log('✅ Orders инициализирован');
  },
  
  // Загрузка из localStorage
  load: function() {
    try {
      var saved = localStorage.getItem('shawarma_orders');
      if (saved) {
        var data = JSON.parse(saved);
        this.activeOrders = data.orders || [];
        this.lastRefresh = data.lastRefresh || 0;
      }
    } catch (e) {
      console.error('Ошибка загрузки заказов:', e);
    }
  },
  
  // Сохранение
  save: function() {
    try {
      localStorage.setItem('shawarma_orders', JSON.stringify({
        orders: this.activeOrders,
        lastRefresh: this.lastRefresh
      }));
    } catch (e) {
      console.error('Ошибка сохранения заказов:', e);
    }
  },
  
  // Проверка обновления заказов
  checkRefresh: function() {
    var now = Date.now();
    if (now - this.lastRefresh > this.refreshInterval || this.activeOrders.length === 0) {
      this.generateOrders();
      this.lastRefresh = now;
      this.save();
    }
  },
  
  // Генерация новых заказов
  generateOrders: function() {
    this.activeOrders = [];
    
    // Масштабируем сложность по прогрессу
    var scale = 1 + Math.log10(Math.max(1, Game.state.lifetimeShawarmas / 1000));
    
    for (var i = 0; i < this.maxOrders; i++) {
      var order = this.generateOrder(scale);
      if (order) {
        this.activeOrders.push(order);
      }
    }
    
    console.log('📋 Сгенерировано заказов:', this.activeOrders.length);
  },
  
  // Генерация одного заказа
  generateOrder: function(scale) {
    var typeIndex = Math.floor(Math.random() * this.orderTypes.length);
    var type = this.orderTypes[typeIndex];
    var template = type.templates[Math.floor(Math.random() * type.templates.length)];
    
    // Вычисляем цель с масштабированием
    var target = Math.floor(
      (template.targetMin + Math.random() * (template.targetMax - template.targetMin)) * scale
    );
    
    // Награда зависит от сложности
    var reward = Math.floor(target * (5 + Math.random() * 10));
    
    // Начальное значение для отслеживания прогресса
    var startValue = 0;
    if (type.id === 'click') startValue = Game.state.clickCount;
    if (type.id === 'produce') startValue = Game.state.totalShawarmas;
    if (type.id === 'buy_building') {
      for (var i = 0; i < Game.state.buildings.length; i++) {
        startValue += Game.state.buildings[i].owned;
      }
    }
    
    return {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      typeId: type.id,
      desc: template.desc.replace('{target}', this.formatNumber(target)),
      target: target,
      reward: reward,
      startValue: startValue,
      customer: this.customers[Math.floor(Math.random() * this.customers.length)],
      completed: false
    };
  },
  
  // Форматирование числа
  formatNumber: function(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.floor(num).toString();
  },
  
  // Проверка выполнения заказов
  checkOrders: function() {
    var anyCompleted = false;
    
    for (var i = 0; i < this.activeOrders.length; i++) {
      var order = this.activeOrders[i];
      if (order.completed) continue;
      
      var type = null;
      for (var j = 0; j < this.orderTypes.length; j++) {
        if (this.orderTypes[j].id === order.typeId) {
          type = this.orderTypes[j];
          break;
        }
      }
      
      if (type) {
        var progress = type.check(order);
        if (progress >= order.target) {
          order.completed = true;
          anyCompleted = true;
        }
      }
    }
    
    if (anyCompleted) {
      this.save();
    }
  },
  
  // Получить прогресс заказа
  getProgress: function(order) {
    var type = null;
    for (var j = 0; j < this.orderTypes.length; j++) {
      if (this.orderTypes[j].id === order.typeId) {
        type = this.orderTypes[j];
        break;
      }
    }
    
    if (type) {
      return Math.min(type.check(order), order.target);
    }
    return 0;
  },
  
  // Забрать награду
  claimReward: function(orderId) {
    for (var i = 0; i < this.activeOrders.length; i++) {
      var order = this.activeOrders[i];
      if (order.id === orderId && order.completed) {
        // Выдаём награду
        Game.state.shawarmas += order.reward;
        Game.state.totalShawarmas += order.reward;
        Game.state.lifetimeShawarmas += order.reward;
        
        // Удаляем заказ
        this.activeOrders.splice(i, 1);
        
        // Генерируем новый
        var scale = 1 + Math.log10(Math.max(1, Game.state.lifetimeShawarmas / 1000));
        var newOrder = this.generateOrder(scale);
        if (newOrder) {
          this.activeOrders.push(newOrder);
        }
        
        this.save();
        
        // Эффекты
        if (typeof UI !== 'undefined') {
          UI.showAchievementPopup({
            name: 'Заказ выполнен!',
            desc: order.desc,
            reward: order.reward,
            emoji: '📦'
          });
          UI.updateCounters();
        }
        
        if (typeof SoundManager !== 'undefined') {
          SoundManager.achievement();
        }
        
        return true;
      }
    }
    return false;
  },
  
  // Время до обновления заказов
  getTimeToRefresh: function() {
    var remaining = this.refreshInterval - (Date.now() - this.lastRefresh);
    return Math.max(0, remaining);
  }
};

console.log('✅ orders.js загружен');
