// Система мини-событий
// js/events.js

var Events = {
  // Активные эффекты
  activeEffects: [],
  
  // Типы событий
  eventTypes: [
    {
      id: 'rush_hour',
      name: 'Час пик! 🔥',
      desc: 'x2 к производству',
      duration: 30000,
      chance: 0.25,
      effect: { productionMultiplier: 2 },
      color: 'from-red-500 to-orange-500',
      emoji: '🔥'
    },
    {
      id: 'turbo_clicks',
      name: 'Турбо-клики! ⚡',
      desc: 'x5 за клик',
      duration: 15000,
      chance: 0.2,
      effect: { clickMultiplier: 5 },
      color: 'from-yellow-400 to-yellow-600',
      emoji: '⚡'
    },
    {
      id: 'lucky_bonus',
      name: 'Удача! 🍀',
      desc: 'Случайный бонус',
      duration: 0,
      chance: 0.2,
      effect: { instantBonus: true },
      color: 'from-green-400 to-emerald-600',
      emoji: '🍀'
    },
    {
      id: 'shawarma_rain',
      name: 'Дождь шаурмы! 🌧️',
      desc: 'Лови падающие бонусы!',
      duration: 10000,
      chance: 0.15,
      effect: { rain: true },
      color: 'from-blue-400 to-purple-500',
      emoji: '🌧️'
    },
    {
      id: 'discount_time',
      name: 'Распродажа! 💸',
      desc: '-50% на здания',
      duration: 20000,
      chance: 0.2,
      effect: { discountMultiplier: 0.5 },
      color: 'from-pink-500 to-rose-500',
      emoji: '💸'
    }
  ],
  
  // Интервалы появления (мс)
  minInterval: 60000,  // 1 минута
  maxInterval: 180000, // 3 минуты
  
  // Таймер следующего события
  nextEventTimeout: null,
  
  // Пауза событий (во время мини-игр)
  pauseEvents: false,
  
  // Инициализация
  init: function() {
    this.scheduleNextEvent();
    console.log('✅ Events система инициализирована');
  },
  
  // Запланировать следующее событие
  scheduleNextEvent: function() {
    var self = this;
    var delay = this.minInterval + Math.random() * (this.maxInterval - this.minInterval);
    
    this.nextEventTimeout = setTimeout(function() {
      self.triggerRandomEvent();
    }, delay);
  },
  
  // Вызвать случайное событие
  triggerRandomEvent: function() {
    // Не запускаем если пауза
    if (this.pauseEvents) {
      this.scheduleNextEvent();
      return;
    }
    
    // Выбираем случайное событие по весам
    var totalChance = 0;
    for (var i = 0; i < this.eventTypes.length; i++) {
      totalChance += this.eventTypes[i].chance;
    }
    
    var roll = Math.random() * totalChance;
    var cumulative = 0;
    var selectedEvent = null;
    
    for (var j = 0; j < this.eventTypes.length; j++) {
      cumulative += this.eventTypes[j].chance;
      if (roll <= cumulative) {
        selectedEvent = this.eventTypes[j];
        break;
      }
    }
    
    if (selectedEvent) {
      this.startEvent(selectedEvent);
    }
    
    // Планируем следующее
    this.scheduleNextEvent();
  },
  
  // Запустить событие
  startEvent: function(event) {
    var self = this;
    
    // Показываем уведомление
    if (typeof UI !== 'undefined') {
      UI.showEventNotification(event);
    }
    
    // Звук
    if (typeof SoundManager !== 'undefined') {
      SoundManager.achievement();
    }
    
    // Вибрация
    if (typeof Game !== 'undefined' && Game.isTelegram && Game.tg && Game.tg.HapticFeedback) {
      try {
        Game.tg.HapticFeedback.notificationOccurred('success');
      } catch(e) {}
    }
    
    // Обрабатываем эффект
    if (event.effect.instantBonus) {
      // Мгновенный бонус
      this.giveInstantBonus();
    } else if (event.effect.rain) {
      // Дождь шаурмы
      this.startShawarmaRain(event.duration);
    } else {
      // Временный эффект
      var activeEffect = {
        id: event.id,
        name: event.name,
        emoji: event.emoji,
        effect: event.effect,
        endsAt: Date.now() + event.duration
      };
      
      this.activeEffects.push(activeEffect);
      this.updateEffectsUI();
      
      // Визуальный эффект для турбо-кликов
      if (event.id === 'turbo_clicks') {
        document.body.classList.add('turbo-active');
      }
      
      // Убираем эффект по таймеру
      setTimeout(function() {
        self.removeEffect(event.id);
      }, event.duration);
    }
  },
  
  // Мгновенный бонус
  giveInstantBonus: function() {
    if (typeof Game === 'undefined') return;
    
    // Бонус = 10-60 секунд производства или минимум 500
    // Бонус = 5-15 секунд производства или минимум 25
    var bonus = Math.max(Game.state.perSecond * (5 + Math.random() * 10), 25);
    bonus = Math.floor(bonus * Game.state.prestigeBonus);
    
    Game.state.shawarmas += bonus;
    Game.state.totalShawarmas += bonus;
    Game.state.lifetimeShawarmas += bonus;
    
    if (typeof UI !== 'undefined') {
      UI.showAchievementPopup({
        name: 'Бонус удачи!',
        desc: 'Тебе повезло!',
        reward: bonus,
        emoji: '🍀'
      });
      UI.createParticles(window.innerWidth / 2, window.innerHeight / 2, 15, '🍀');
      UI.updateCounters();
    }
  },
  
  // Дождь шаурмы
  startShawarmaRain: function(duration) {
    var self = this;
    var container = document.getElementById('rain-container');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'rain-container';
      container.className = 'fixed inset-0 pointer-events-none z-30 overflow-hidden';
      document.body.appendChild(container);
    }
    
    var endTime = Date.now() + duration;
    var spawnInterval = setInterval(function() {
      if (Date.now() > endTime) {
        clearInterval(spawnInterval);
        return;
      }
      self.spawnRainDrop(container);
    }, 300);
    
    // Очищаем контейнер после
    setTimeout(function() {
      if (container.parentNode) {
        container.innerHTML = '';
      }
    }, duration + 3000);
  },
  
  // Создать падающую шаурму
  spawnRainDrop: function(container) {
    var drop = document.createElement('div');
    drop.className = 'absolute text-3xl cursor-pointer transition-transform';
    drop.style.cssText = 'pointer-events: auto; left:' + (5 + Math.random() * 90) + '%; top: -50px;';
    drop.innerHTML = '🌯';
    
    var self = this;
    drop.onclick = function(e) {
      e.stopPropagation();
      self.collectRainDrop(drop);
    };
    
    container.appendChild(drop);
    
    // Анимация падения
    var startY = -50;
    var endY = window.innerHeight + 50;
    var duration = 2000 + Math.random() * 1000;
    var startTime = Date.now();
    
    function animate() {
      var elapsed = Date.now() - startTime;
      var progress = elapsed / duration;
      
      if (progress >= 1 || !drop.parentNode) {
        if (drop.parentNode) drop.remove();
        return;
      }
      
      var y = startY + (endY - startY) * progress;
      var wobble = Math.sin(progress * Math.PI * 4) * 20;
      drop.style.transform = 'translateY(' + y + 'px) translateX(' + wobble + 'px) rotate(' + (progress * 360) + 'deg)';
      
      requestAnimationFrame(animate);
    }
    
    animate();
  },
  
  // Собрать падающую шаурму
  collectRainDrop: function(drop) {
    if (!drop.parentNode) return;
    
    // Бонус за пойманную шаурму = 1 секунда производства или минимум 5
    var bonus = Math.max(Game.state.perSecond * 1, 5);
    bonus = Math.floor(bonus * Game.state.prestigeBonus);
    
    Game.state.shawarmas += bonus;
    Game.state.totalShawarmas += bonus;
    Game.state.lifetimeShawarmas += bonus;
    
    // Эффект
    var rect = drop.getBoundingClientRect();
    if (typeof UI !== 'undefined') {
      UI.showFloatingNumber(rect.left, rect.top, bonus);
      UI.createParticles(rect.left, rect.top, 5, '✨');
    }
    
    // Звук клика
    if (typeof SoundManager !== 'undefined') {
      SoundManager.click();
    }
    
    drop.remove();
  },
  
  // Удалить эффект
  removeEffect: function(effectId) {
    for (var i = this.activeEffects.length - 1; i >= 0; i--) {
      if (this.activeEffects[i].id === effectId) {
        this.activeEffects.splice(i, 1);
        break;
      }
    }
    this.updateEffectsUI();
    
    // Убираем визуальный эффект турбо
    if (effectId === 'turbo_clicks') {
      document.body.classList.remove('turbo-active');
    }
    
    // Показываем что эффект закончился
    if (typeof UI !== 'undefined') {
      UI.showAchievementPopup({
        name: 'Эффект закончился',
        desc: effectId,
        reward: 0,
        emoji: '⏰'
      });
    }
  },
  
  // Обновить UI активных эффектов
  updateEffectsUI: function() {
    if (typeof UI !== 'undefined') {
      UI.renderActiveEffects(this.activeEffects);
    }
  },
  
  // Получить текущий множитель производства от событий
  getProductionMultiplier: function() {
    var mult = 1;
    for (var i = 0; i < this.activeEffects.length; i++) {
      if (this.activeEffects[i].effect.productionMultiplier) {
        mult *= this.activeEffects[i].effect.productionMultiplier;
      }
    }
    return mult;
  },
  
  // Получить текущий множитель клика от событий
  getClickMultiplier: function() {
    var mult = 1;
    for (var i = 0; i < this.activeEffects.length; i++) {
      if (this.activeEffects[i].effect.clickMultiplier) {
        mult *= this.activeEffects[i].effect.clickMultiplier;
      }
    }
    return mult;
  },
  
  // Получить текущую скидку от событий
  getDiscountMultiplier: function() {
    var mult = 1;
    for (var i = 0; i < this.activeEffects.length; i++) {
      if (this.activeEffects[i].effect.discountMultiplier) {
        mult *= this.activeEffects[i].effect.discountMultiplier;
      }
    }
    return mult;
  }
};

console.log('✅ events.js загружен');
