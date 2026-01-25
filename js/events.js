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
  
  // Интервалы появления (мс) - события реже
  minInterval: 180000,  // 3 минуты
  maxInterval: 420000,  // 7 минут
  
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
    
    // Показываем баннер с кнопкой старта
    var banner = document.createElement('div');
    banner.id = 'rain-banner';
    banner.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50';
    banner.innerHTML = 
      '<div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-2xl shadow-2xl text-center max-w-xs">' +
        '<div class="text-5xl mb-3 animate-bounce">🌧️🌯</div>' +
        '<div class="text-xl font-bold mb-2">Дождь шаурмы!</div>' +
        '<div class="text-sm opacity-90 mb-4">Лови падающие шаурмы!</div>' +
        '<button id="start-rain-btn" class="w-full bg-white text-purple-600 font-bold py-3 px-6 rounded-xl hover:bg-gray-100 transition-all">' +
          '🎮 Начать!' +
        '</button>' +
        '<div class="text-xs opacity-70 mt-2">Исчезнет через 5 сек...</div>' +
      '</div>';
    
    document.body.appendChild(banner);
    
    // Автоматически убираем баннер через 5 секунд если не нажали
    var bannerTimeout = setTimeout(function() {
      if (banner && banner.parentNode) {
        banner.remove();
      }
    }, 5000);
    
    // Обработчик клика
    var startBtn = document.getElementById('start-rain-btn');
    if (startBtn) {
      startBtn.onclick = function() {
        clearTimeout(bannerTimeout);
        banner.remove();
        self.startRainGame();
      };
    }
  },
  
  // Сама игра ловли шаурмы
  startRainGame: function() {
    var self = this;
    var caught = 0;
    var totalReward = 0;
    var timeLeft = 10;
    var gameActive = true;
    
    // Приостанавливаем основные события
    this.pauseEvents = true;
    
    // Создаём игровой контейнер
    var container = document.createElement('div');
    container.id = 'rain-game';
    container.className = 'fixed inset-0 z-50';
    container.style.background = 'linear-gradient(to bottom, #1e3a5f, #0f172a)';
    container.innerHTML = 
      '<div class="absolute top-4 left-0 right-0 flex justify-between px-4 text-white">' +
        '<div class="bg-white bg-opacity-20 px-4 py-2 rounded-xl">' +
          '<div class="text-xs opacity-80">Поймано</div>' +
          '<div id="rain-caught" class="text-2xl font-bold">0</div>' +
        '</div>' +
        '<div class="bg-white bg-opacity-20 px-4 py-2 rounded-xl">' +
          '<div class="text-xs opacity-80">Время</div>' +
          '<div id="rain-timer" class="text-2xl font-bold">10</div>' +
        '</div>' +
        '<div class="bg-white bg-opacity-20 px-4 py-2 rounded-xl">' +
          '<div class="text-xs opacity-80">Награда</div>' +
          '<div id="rain-reward" class="text-2xl font-bold text-yellow-400">0</div>' +
        '</div>' +
      '</div>' +
      '<div id="rain-area" class="absolute inset-0 top-20 overflow-hidden"></div>';
    
    document.body.appendChild(container);
    
    var rainArea = document.getElementById('rain-area');
    
    // Функция создания падающей шаурмы
    function spawnShawarma() {
      if (!gameActive) return;
      
      var shawarma = document.createElement('div');
      shawarma.className = 'absolute cursor-pointer select-none';
      var size = 40 + Math.random() * 20;
      shawarma.style.cssText = 
        'left:' + (5 + Math.random() * 85) + '%;' +
        'top:-60px;' +
        'font-size:' + size + 'px;' +
        'z-index:10;' +
        'transition: transform 0.1s;';
      shawarma.textContent = '🌯';
      
      // Клик по шаурме
      shawarma.onclick = function(e) {
        e.stopPropagation();
        if (!gameActive) return;
        
        caught++;
        var bonus = Math.max(Math.floor(Game.state.perSecond * 1), 5);
        totalReward += bonus;
        
        // Обновляем счётчики
        var caughtEl = document.getElementById('rain-caught');
        var rewardEl = document.getElementById('rain-reward');
        if (caughtEl) caughtEl.textContent = caught;
        if (rewardEl) rewardEl.textContent = totalReward;
        
        // Эффект
        shawarma.style.transform = 'scale(1.5)';
        shawarma.style.opacity = '0';
        setTimeout(function() { 
          if (shawarma.parentNode) shawarma.remove(); 
        }, 150);
        
        // Звук
        if (typeof SoundManager !== 'undefined') {
          SoundManager.click();
        }
        
        // Вибрация
        try {
          if (Game.isTelegram && Game.tg && Game.tg.HapticFeedback) {
            Game.tg.HapticFeedback.impactOccurred('light');
          }
        } catch(e) {}
      };
      
      rainArea.appendChild(shawarma);
      
      // Анимация падения
      var startTime = Date.now();
      var duration = 2000 + Math.random() * 1500;
      var startTop = -60;
      var endTop = rainArea.clientHeight + 60;
      var wobbleOffset = Math.random() * Math.PI * 2;
      
      function animate() {
        if (!gameActive || !shawarma.parentNode) return;
        
        var elapsed = Date.now() - startTime;
        var progress = elapsed / duration;
        
        if (progress >= 1) {
          shawarma.remove();
          return;
        }
        
        var currentTop = startTop + (endTop - startTop) * progress;
        var wobble = Math.sin(wobbleOffset + progress * Math.PI * 4) * 30;
        shawarma.style.top = currentTop + 'px';
        shawarma.style.marginLeft = wobble + 'px';
        
        requestAnimationFrame(animate);
      }
      
      animate();
    }
    
    // Спавним шаурмы каждые 250мс
    var spawnInterval = setInterval(function() {
      if (gameActive) {
        spawnShawarma();
        if (Math.random() < 0.3) spawnShawarma();
        if (Math.random() < 0.1) spawnShawarma();
      }
    }, 250);
    
    // Таймер
    var timerInterval = setInterval(function() {
      timeLeft--;
      var timerEl = document.getElementById('rain-timer');
      if (timerEl) {
        timerEl.textContent = timeLeft;
        if (timeLeft <= 3) {
          timerEl.style.color = '#ff6b6b';
        }
      }
      
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        clearInterval(spawnInterval);
        gameActive = false;
        self.endRainGame(container, caught, totalReward);
      }
    }, 1000);
  },
  
  // Конец игры дождя
  endRainGame: function(container, caught, totalReward) {
    var self = this;
    
    // Выдаём награду
    Game.state.shawarmas += totalReward;
    Game.state.totalShawarmas += totalReward;
    Game.state.lifetimeShawarmas += totalReward;
    
    // Показываем результат
    container.innerHTML = 
      '<div class="flex items-center justify-center h-full">' +
        '<div class="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-8 rounded-3xl shadow-2xl text-center max-w-sm mx-4">' +
          '<div class="text-6xl mb-4">🌧️🌯</div>' +
          '<h2 class="text-2xl font-bold mb-4">Дождь закончился!</h2>' +
          '<div class="space-y-3 mb-6">' +
            '<div class="bg-white bg-opacity-20 rounded-xl p-3">' +
              '<div class="text-sm opacity-80">Поймано шаурмы</div>' +
              '<div class="text-3xl font-bold">' + caught + ' 🌯</div>' +
            '</div>' +
            '<div class="bg-yellow-400 text-yellow-900 rounded-xl p-3">' +
              '<div class="text-sm">Награда</div>' +
              '<div class="text-2xl font-bold">+' + totalReward + ' шаурмы</div>' +
            '</div>' +
          '</div>' +
          '<button id="close-rain-btn" class="w-full bg-white text-purple-600 font-bold py-3 rounded-xl hover:bg-gray-100">' +
            'Отлично!' +
          '</button>' +
        '</div>' +
      '</div>';
    
    // Звук
    if (typeof SoundManager !== 'undefined') {
      SoundManager.achievement();
    }
    
    // Кнопка закрытия
    var closeBtn = document.getElementById('close-rain-btn');
    if (closeBtn) {
      closeBtn.onclick = function() {
        container.remove();
        self.pauseEvents = false;
        if (typeof UI !== 'undefined') {
          UI.updateCounters();
        }
      };
    }
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
