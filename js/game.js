// Основная логика игры
// Исправлено для совместимости с мобильными устройствами

var Game = {
  // Состояние игры
  state: {
    shawarmas: 0,
    totalShawarmas: 0,
    lifetimeShawarmas: 0,
    perClick: 1,
    perSecond: 0,
    clickCount: 0,
    prestigeLevel: 0,
    prestigeBonus: 1,
    lastPlayTime: Date.now(),
    dailyStreak: 0,
    lastDailyReward: 0,
    buildings: [],
    upgrades: [],
    achievements: [],
    currentTab: 'buildings'
  },
  
  tg: null,
  isTelegram: false,
  isReady: false,
  
  // Инициализация игры
  init: function() {
    console.log('🎮 Game.init() вызван');
    
    var self = this;
    
    // Проверяем Telegram
    try {
      this.isTelegram = !!(window.Telegram && window.Telegram.WebApp);
      if (this.isTelegram) {
        this.tg = window.Telegram.WebApp;
        this.tg.expand();
        this.tg.enableClosingConfirmation();
        this.tg.ready();
        console.log('📱 Telegram WebApp обнаружен');
      }
    } catch (e) {
      console.log('⚠️ Telegram WebApp недоступен:', e.message);
      this.isTelegram = false;
    }
    
    // Получаем ID пользователя
    var userId = 'guest_' + Math.floor(Math.random() * 1000000);
    try {
      if (this.isTelegram && this.tg.initDataUnsafe && this.tg.initDataUnsafe.user) {
        userId = 'tg_' + this.tg.initDataUnsafe.user.id;
      }
    } catch (e) {
      console.log('⚠️ Не удалось получить Telegram user id');
    }
    
    // Инициализируем подсистемы
    if (typeof SoundManager !== 'undefined') {
      SoundManager.init();
    }
    
    if (typeof GameStorage !== 'undefined') {
      GameStorage.init(userId);
    }
    
    // Копируем конфигурацию
    this.state.buildings = JSON.parse(JSON.stringify(GameConfig.buildings));
    this.state.upgrades = JSON.parse(JSON.stringify(GameConfig.upgrades));
    this.state.achievements = JSON.parse(JSON.stringify(GameConfig.achievements));
    
    // Загружаем сохранение
    this.loadGame();
    
    // Настраиваем делегирование событий
    this.setupEventDelegation();
    
    // Запускаем игровые циклы
    this.startGameLoops();
    
    this.isReady = true;
    console.log('✅ Game.init() завершён успешно');
  },
  
  // Настройка делегирования событий
  setupEventDelegation: function() {
    var self = this;
    
    document.addEventListener('click', function(e) {
      // Разблокируем аудио при любом клике
      if (typeof SoundManager !== 'undefined') {
        SoundManager.unlock();
      }
      
      var target = e.target;
      
      // Ищем элемент с data-action
      while (target && target !== document) {
        if (target.dataset && target.dataset.action) {
          break;
        }
        target = target.parentElement;
      }
      
      if (!target || !target.dataset || !target.dataset.action) return;
      
      var action = target.dataset.action;
      var id = target.dataset.id ? parseInt(target.dataset.id, 10) : null;
      var tab = target.dataset.tab;
      
      switch(action) {
        case 'buy-building':
          if (id !== null) self.buyBuilding(id);
          break;
        case 'buy-upgrade':
          if (id !== null) self.buyUpgrade(id);
          break;
        case 'switch-tab':
          if (tab) self.switchTab(tab);
          break;
        case 'click-shawarma':
          self.handleClick(e);
          break;
        case 'open-prestige':
          self.openPrestigeModal();
          break;
        case 'close-prestige':
          self.closePrestigeModal();
          break;
        case 'confirm-prestige':
          self.confirmPrestige();
          break;
        case 'claim-daily':
          self.claimDailyReward();
          break;
      }
    });
    
    console.log('✅ Event delegation настроен');
  },
  
  // Загрузка игры
  loadGame: function() {
    var saved = null;
    
    if (typeof GameStorage !== 'undefined') {
      saved = GameStorage.load();
    }
    
    if (saved) {
      console.log('📂 Загружено сохранение');
      
      this.state.shawarmas = saved.shawarmas || 0;
      this.state.totalShawarmas = saved.totalShawarmas || 0;
      this.state.lifetimeShawarmas = saved.lifetimeShawarmas || 0;
      this.state.perClick = saved.perClick || 1;
      this.state.clickCount = saved.clickCount || 0;
      this.state.prestigeLevel = saved.prestigeLevel || 0;
      this.state.prestigeBonus = saved.prestigeBonus || 1;
      this.state.lastPlayTime = saved.lastPlayTime || Date.now();
      this.state.dailyStreak = saved.dailyStreak || 0;
      this.state.lastDailyReward = saved.lastDailyReward || 0;
      
      // Загружаем здания
      if (saved.buildings && saved.buildings.length) {
        for (var i = 0; i < saved.buildings.length; i++) {
          var savedBuilding = saved.buildings[i];
          var building = this.findBuilding(savedBuilding.id);
          if (building) {
            building.owned = savedBuilding.owned;
            building.cost = savedBuilding.cost;
          }
        }
      }
      
      // Загружаем улучшения
      if (saved.upgrades && saved.upgrades.length) {
        for (var j = 0; j < saved.upgrades.length; j++) {
          var savedUpgrade = saved.upgrades[j];
          var upgrade = this.findUpgrade(savedUpgrade.id);
          if (upgrade) {
            upgrade.purchased = savedUpgrade.purchased;
          }
        }
      }
      
      // Загружаем достижения
      if (saved.achievements && saved.achievements.length) {
        for (var k = 0; k < saved.achievements.length; k++) {
          var savedAch = saved.achievements[k];
          var achievement = this.findAchievement(savedAch.id);
          if (achievement) {
            achievement.unlocked = savedAch.unlocked;
          }
        }
      }
    }
    
    // Рассчитываем офлайн прогресс
    this.calculateOfflineProgress();
    
    // Рассчитываем производство
    this.calculateProduction();
    
    // Проверяем ежедневную награду
    this.checkDailyReward();
    
    // Отрисовываем интерфейс
    if (typeof UI !== 'undefined') {
      UI.render();
    }
  },
  
  // Вспомогательные функции поиска
  findBuilding: function(id) {
    for (var i = 0; i < this.state.buildings.length; i++) {
      if (this.state.buildings[i].id === id) {
        return this.state.buildings[i];
      }
    }
    return null;
  },
  
  findUpgrade: function(id) {
    for (var i = 0; i < this.state.upgrades.length; i++) {
      if (this.state.upgrades[i].id === id) {
        return this.state.upgrades[i];
      }
    }
    return null;
  },
  
  findAchievement: function(id) {
    for (var i = 0; i < this.state.achievements.length; i++) {
      if (this.state.achievements[i].id === id) {
        return this.state.achievements[i];
      }
    }
    return null;
  },
  
  // Сохранение игры
  saveGame: function() {
    if (typeof GameStorage !== 'undefined') {
      GameStorage.save(this.state);
    }
  },
  
  // Расчёт офлайн прогресса
  calculateOfflineProgress: function() {
    var now = Date.now();
    var timePassed = (now - this.state.lastPlayTime) / 1000;
    
    if (timePassed > 10 && this.state.perSecond > 0) {
      var maxOfflineTime = 4 * 60 * 60; // Макс 4 часа
      var actualTime = Math.min(timePassed, maxOfflineTime);
      var offlineProduction = this.state.perSecond * actualTime;
      
      if (offlineProduction > 0) {
        this.state.shawarmas += offlineProduction;
        this.state.totalShawarmas += offlineProduction;
        this.state.lifetimeShawarmas += offlineProduction;
        
        var hours = Math.floor(actualTime / 3600);
        var minutes = Math.floor((actualTime % 3600) / 60);
        var timeStr = hours > 0 ? hours + 'ч ' + minutes + 'м' : minutes + 'м';
        
        if (typeof UI !== 'undefined') {
          UI.showAchievementPopup({
            name: 'Офлайн прогресс',
            desc: 'Ты отсутствовал ' + timeStr,
            reward: Math.floor(offlineProduction),
            emoji: '💤'
          });
        }
      }
    }
    
    this.state.lastPlayTime = now;
  },
  
  // Проверка ежедневной награды
  checkDailyReward: function() {
    var now = Date.now();
    var lastReward = this.state.lastDailyReward;
    var dayInMs = 24 * 60 * 60 * 1000;
    
    if (now - lastReward > dayInMs) {
      var daysSince = Math.floor((now - lastReward) / dayInMs);
      
      if (daysSince === 1) {
        this.state.dailyStreak++;
      } else if (daysSince > 1) {
        this.state.dailyStreak = 1;
      }
      
      this.showDailyRewardModal();
    }
  },
  
  // Показать модалку ежедневной награды
  showDailyRewardModal: function() {
    var modal = document.getElementById('daily-reward-modal');
    if (!modal) return;
    
    var reward = 1000 * Math.max(1, this.state.dailyStreak);
    
    var amountEl = document.getElementById('daily-reward-amount');
    var streakEl = document.getElementById('daily-streak');
    
    if (amountEl) {
      amountEl.textContent = '+' + (typeof UI !== 'undefined' ? UI.formatNumber(reward) : reward) + ' 🌯';
    }
    if (streakEl) {
      streakEl.textContent = this.state.dailyStreak || 1;
    }
    
    modal.classList.remove('hidden');
    
    if (typeof SoundManager !== 'undefined') {
      SoundManager.achievement();
    }
  },
  
  // Забрать ежедневную награду
  claimDailyReward: function() {
    var reward = 1000 * Math.max(1, this.state.dailyStreak);
    this.state.shawarmas += reward;
    this.state.totalShawarmas += reward;
    this.state.lifetimeShawarmas += reward;
    this.state.lastDailyReward = Date.now();
    
    var modal = document.getElementById('daily-reward-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
    
    if (typeof UI !== 'undefined') {
      UI.createParticles(window.innerWidth / 2, window.innerHeight / 2, 20, '🎁');
    }
    
    this.saveGame();
    
    if (typeof UI !== 'undefined') {
      UI.render();
    }
  },
  
  // Расчёт производства
  calculateProduction: function() {
    var baseProduction = 0;
    for (var i = 0; i < this.state.buildings.length; i++) {
      var b = this.state.buildings[i];
      baseProduction += b.owned * b.production;
    }
    
    var productionMultiplier = 1;
    for (var j = 0; j < this.state.upgrades.length; j++) {
      var u = this.state.upgrades[j];
      if (u.purchased && u.type === 'production') {
        productionMultiplier *= u.productionMultiplier;
      }
    }
    
    this.state.perSecond = baseProduction * productionMultiplier * this.state.prestigeBonus;
    
    var clickBonus = 0;
    for (var k = 0; k < this.state.upgrades.length; k++) {
      var cu = this.state.upgrades[k];
      if (cu.purchased && cu.type === 'click') {
        clickBonus += cu.clickBonus;
      }
    }
    
    this.state.perClick = (1 + clickBonus) * this.state.prestigeBonus;
  },
  
  // Клик по шаурме
  handleClick: function(event) {
    this.state.shawarmas += this.state.perClick;
    this.state.totalShawarmas += this.state.perClick;
    this.state.lifetimeShawarmas += this.state.perClick;
    this.state.clickCount++;
    
    var shawarmaBtn = document.getElementById('shawarma-btn');
    if (shawarmaBtn) {
      shawarmaBtn.classList.add('shake');
      setTimeout(function() {
        shawarmaBtn.classList.remove('shake');
      }, 300);
    }
    
    if (typeof UI !== 'undefined') {
      UI.showFloatingNumber(event.clientX, event.clientY, this.state.perClick);
    }
    
    if (typeof SoundManager !== 'undefined') {
      SoundManager.click();
    }
    
    if (Math.random() < 0.1 && typeof UI !== 'undefined') {
      UI.createParticles(event.clientX, event.clientY, 5);
    }
    
    // Вибрация в Telegram
    try {
      if (this.isTelegram && this.tg && this.tg.HapticFeedback) {
        this.tg.HapticFeedback.impactOccurred('light');
      }
    } catch (e) {}
    
    this.checkAchievements();
    
    if (typeof UI !== 'undefined') {
      UI.updateCounters();
    }
  },
  
  // Получить скидку на здания
  getBuildingDiscount: function() {
    var discount = 1;
    for (var i = 0; i < this.state.upgrades.length; i++) {
      var u = this.state.upgrades[i];
      if (u.purchased && u.type === 'discount') {
        discount *= u.buildingDiscount;
      }
    }
    return discount;
  },
  
  // Покупка здания
  buyBuilding: function(buildingId) {
    var building = this.findBuilding(buildingId);
    if (!building) return;
    
    var discount = this.getBuildingDiscount();
    var finalCost = Math.floor(building.cost * discount);
    
    if (this.state.shawarmas >= finalCost) {
      this.state.shawarmas -= finalCost;
      building.owned++;
      building.cost = Math.floor(building.cost * 1.15);
      
      this.calculateProduction();
      this.saveGame();
      
      if (typeof SoundManager !== 'undefined') {
        SoundManager.purchase();
      }
      
      try {
        if (this.isTelegram && this.tg && this.tg.HapticFeedback) {
          this.tg.HapticFeedback.notificationOccurred('success');
        }
      } catch (e) {}
      
      this.checkAchievements();
      
      if (typeof UI !== 'undefined') {
        UI.forceUpdateTab();
        UI.updateCounters();
      }
    }
  },
  
  // Покупка улучшения
  buyUpgrade: function(upgradeId) {
    var upgrade = this.findUpgrade(upgradeId);
    if (!upgrade || upgrade.purchased) return;
    
    if (this.state.shawarmas >= upgrade.cost) {
      this.state.shawarmas -= upgrade.cost;
      upgrade.purchased = true;
      
      this.calculateProduction();
      this.saveGame();
      
      if (typeof SoundManager !== 'undefined') {
        SoundManager.purchase();
      }
      
      try {
        if (this.isTelegram && this.tg && this.tg.HapticFeedback) {
          this.tg.HapticFeedback.notificationOccurred('success');
        }
      } catch (e) {}
      
      if (typeof UI !== 'undefined') {
        UI.forceUpdateTab();
        UI.updateCounters();
      }
    }
  },
  
  // Подсчёт общего количества зданий
  getTotalBuildings: function() {
    var total = 0;
    for (var i = 0; i < this.state.buildings.length; i++) {
      total += this.state.buildings[i].owned;
    }
    return total;
  },
  
  // Проверка достижений
  checkAchievements: function() {
    var self = this;
    var totalBuildings = this.getTotalBuildings();
    
    for (var i = 0; i < this.state.achievements.length; i++) {
      var ach = this.state.achievements[i];
      if (ach.unlocked) continue;
      
      var progress = 0;
      if (ach.type === 'total') progress = this.state.totalShawarmas;
      else if (ach.type === 'clicks') progress = this.state.clickCount;
      else if (ach.type === 'buildings') progress = totalBuildings;
      else if (ach.type === 'prestige') progress = this.state.prestigeLevel;
      
      if (progress >= ach.target) {
        ach.unlocked = true;
        this.state.shawarmas += ach.reward;
        
        if (typeof UI !== 'undefined') {
          UI.showAchievementPopup(ach);
        }
        
        if (typeof SoundManager !== 'undefined') {
          SoundManager.achievement();
        }
      }
    }
  },
  
  // Открыть модалку престижа
  openPrestigeModal: function() {
    if (this.state.totalShawarmas < 1000000) {
      if (typeof UI !== 'undefined') {
        UI.showAchievementPopup({
          name: 'Недостаточно прогресса',
          desc: 'Нужно минимум 1M шаурмы для престижа',
          reward: 0,
          emoji: '⚠️'
        });
      }
      return;
    }
    
    var totalBuildings = this.getTotalBuildings();
    var newBonus = 1 + (this.state.lifetimeShawarmas / 1000000) * 0.5;
    
    var totalEl = document.getElementById('prestige-total');
    var buildingsEl = document.getElementById('prestige-buildings');
    var bonusEl = document.getElementById('prestige-bonus');
    
    if (totalEl && typeof UI !== 'undefined') {
      totalEl.textContent = UI.formatNumber(this.state.totalShawarmas);
    }
    if (buildingsEl) {
      buildingsEl.textContent = totalBuildings;
    }
    if (bonusEl) {
      bonusEl.textContent = newBonus.toFixed(2);
    }
    
    var modal = document.getElementById('prestige-modal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  },
  
  // Закрыть модалку престижа
  closePrestigeModal: function() {
    var modal = document.getElementById('prestige-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  },
  
  // Подтвердить престиж
  confirmPrestige: function() {
    this.state.prestigeLevel++;
    this.state.prestigeBonus = 1 + (this.state.lifetimeShawarmas / 1000000) * 0.5;
    
    this.state.shawarmas = 0;
    this.state.totalShawarmas = 0;
    
    // Сбрасываем здания
    for (var i = 0; i < this.state.buildings.length; i++) {
      this.state.buildings[i].owned = 0;
      this.state.buildings[i].cost = GameConfig.buildings[i].cost;
    }
    
    // Сбрасываем улучшения
    for (var j = 0; j < this.state.upgrades.length; j++) {
      this.state.upgrades[j].purchased = false;
    }
    
    this.closePrestigeModal();
    
    if (typeof SoundManager !== 'undefined') {
      SoundManager.achievement();
    }
    
    if (typeof UI !== 'undefined') {
      UI.createParticles(window.innerWidth / 2, window.innerHeight / 2, 30, '⭐');
      
      UI.showAchievementPopup({
        name: 'Престиж достигнут!',
        desc: 'Множитель: x' + this.state.prestigeBonus.toFixed(2),
        reward: 0,
        emoji: '⭐'
      });
    }
    
    this.checkAchievements();
    this.calculateProduction();
    this.saveGame();
    
    if (typeof UI !== 'undefined') {
      UI.render(true);
    }
  },
  
  // Смена вкладки
  switchTab: function(tab) {
    this.state.currentTab = tab;
    if (typeof UI !== 'undefined') {
      UI.render(true);
    }
  },
  
  // Запуск игровых циклов
  startGameLoops: function() {
    var self = this;
    
    // Автопроизводство каждые 100мс
    setInterval(function() {
      self.state.shawarmas += self.state.perSecond / 10;
      self.state.totalShawarmas += self.state.perSecond / 10;
      self.state.lifetimeShawarmas += self.state.perSecond / 10;
    }, 100);
    
    // Обновление счётчиков раз в секунду
    setInterval(function() {
      if (typeof UI !== 'undefined') {
        UI.updateCounters();
      }
    }, 1000);
    
    // Периодическое обновление кнопок
    setInterval(function() {
      if (typeof UI !== 'undefined') {
        UI.updateButtonStates();
      }
    }, 2000);
    
    // Автосохранение каждые 5 секунд
    setInterval(function() {
      self.saveGame();
    }, 5000);
    
    console.log('✅ Game loops запущены');
  }
};

console.log('✅ game.js загружен');
