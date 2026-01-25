// Основная логика игры с облачным сохранением
// js/game.js v2.1 - Комбо и золотая шаурма

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
  
  // Комбо система
  combo: {
    count: 0,
    multiplier: 1,
    lastClickTime: 0,
    comboTimeout: 1000, // 1 секунда на следующий клик
    maxMultiplier: 5
  },
  
  // Золотая шаурма
  goldenShawarma: {
    active: false,
    element: null,
    minInterval: 90000,  // Минимум 1.5 минуты
    maxInterval: 180000, // Максимум 3 минуты
    displayTime: 6000,   // Показывается 6 сек
    bonusMultiplier: 3   // x3 от текущего perSecond
  },
  
  // Информация о пользователе Telegram
  userInfo: {
    id: null,
    username: null,
    firstName: null
  },
  
  tg: null,
  isTelegram: false,
  isReady: false,
  cloudSaveEnabled: false,
  lastCloudSave: 0,
  cloudSaveInterval: 15000, // Сохранять в облако каждые 15 сек
  
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
        
        // Получаем данные пользователя
        if (this.tg.initDataUnsafe && this.tg.initDataUnsafe.user) {
          this.userInfo.id = this.tg.initDataUnsafe.user.id;
          this.userInfo.username = this.tg.initDataUnsafe.user.username || null;
          this.userInfo.firstName = this.tg.initDataUnsafe.user.first_name || 'Игрок';
        }
      }
    } catch (e) {
      console.log('⚠️ Telegram WebApp недоступен:', e.message);
      this.isTelegram = false;
    }
    
    // Fallback ID для браузера
    if (!this.userInfo.id) {
      this.userInfo.id = this.getOrCreateBrowserId();
      this.userInfo.firstName = 'Гость';
    }
    
    console.log('👤 Пользователь:', this.userInfo);
    
    // Инициализируем звуки
    if (typeof SoundManager !== 'undefined') {
      SoundManager.init();
    }
    
    // Инициализируем localStorage
    if (typeof GameStorage !== 'undefined') {
      GameStorage.init(this.userInfo.id);
    }
    
    // Инициализируем Supabase
    if (typeof DB !== 'undefined' && GameConfig.SUPABASE_URL && GameConfig.SUPABASE_KEY) {
      this.cloudSaveEnabled = DB.init(GameConfig.SUPABASE_URL, GameConfig.SUPABASE_KEY);
      if (this.cloudSaveEnabled) {
        DB.setUserId(this.userInfo.id);
      }
    }
    
    // Копируем конфигурацию
    this.state.buildings = JSON.parse(JSON.stringify(GameConfig.buildings));
    this.state.upgrades = JSON.parse(JSON.stringify(GameConfig.upgrades));
    this.state.achievements = JSON.parse(JSON.stringify(GameConfig.achievements));
    
    // Загружаем игру (сначала пробуем из облака)
    this.loadGame();
    
    // Настраиваем события
    this.setupEventDelegation();
    
    // Запускаем игровые циклы
    this.startGameLoops();
    
    // Инициализируем систему событий
    if (typeof Events !== 'undefined') {
      Events.init();
    }
    
    // Инициализируем систему заказов
    if (typeof Orders !== 'undefined') {
      Orders.init();
    }
    
    this.isReady = true;
    console.log('✅ Game.init() завершён');
  },
  
  // Генерируем ID для браузера
  getOrCreateBrowserId: function() {
    var browserId = localStorage.getItem('shawarma_browser_id');
    if (!browserId) {
      browserId = 'browser_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
      localStorage.setItem('shawarma_browser_id', browserId);
    }
    return browserId;
  },
  
  // Настройка событий
  setupEventDelegation: function() {
    var self = this;
    
    document.addEventListener('click', function(e) {
      if (typeof SoundManager !== 'undefined') {
        SoundManager.unlock();
      }
      
      var target = e.target;
      while (target && target !== document) {
        if (target.dataset && target.dataset.action) break;
        target = target.parentElement;
      }
      
      if (!target || !target.dataset || !target.dataset.action) return;
      
      var action = target.dataset.action;
      var id = target.dataset.id ? parseInt(target.dataset.id, 10) : null;
      var tab = target.dataset.tab;
      var mode = target.dataset.mode ? parseInt(target.dataset.mode, 10) : null;
      
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
        case 'show-leaderboard':
          if (typeof UI !== 'undefined') {
            UI.showLeaderboard();
          }
          break;
        case 'set-buy-mode':
          if (mode !== null && typeof UI !== 'undefined') {
            UI.buyMode = mode;
            UI.forceUpdateTab();
          }
          break;
        case 'open-minigames':
          if (typeof UI !== 'undefined') {
            UI.showMinigamesMenu();
          }
          break;
        case 'show-settings':
          if (typeof UI !== 'undefined') {
            UI.showSettings();
          }
          break;
        case 'claim-order':
          if (typeof Orders !== 'undefined' && id) {
            Orders.claimReward(target.dataset.id);
            UI.forceUpdateTab();
          }
          break;
      }
    });
    
    console.log('✅ Event delegation настроен');
  },
  
  // Загрузка игры
  loadGame: function() {
    var self = this;
    var loadingComplete = false;
    
    // Показываем индикатор загрузки
    this.showLoadingStatus('Загрузка данных...');
    
    console.log('🔄 Начинаем загрузку...');
    console.log('  cloudSaveEnabled:', this.cloudSaveEnabled);
    console.log('  DB exists:', typeof DB !== 'undefined');
    console.log('  DB.isReady:', typeof DB !== 'undefined' ? DB.isReady : 'N/A');
    
    // Таймаут на случай если облако не отвечает
    var loadingTimeout = setTimeout(function() {
      if (!loadingComplete) {
        console.log('⏱️ Таймаут загрузки облака (5сек), грузим локально');
        loadingComplete = true;
        self.loadFromLocalStorage();
        self.finishLoading();
      }
    }, 5000);
    
    // Сначала пробуем загрузить из облака
    if (this.cloudSaveEnabled && typeof DB !== 'undefined' && DB.isReady) {
      console.log('☁️ Пробуем загрузить из облака...');
      DB.loadUser(function(cloudData) {
        if (loadingComplete) {
          console.log('⚠️ Облако ответило после таймаута, игнорируем');
          return;
        }
        loadingComplete = true;
        clearTimeout(loadingTimeout);
        
        if (cloudData) {
          console.log('☁️ Загружены данные из облака:', cloudData);
          self.applyCloudData(cloudData);
        } else {
          console.log('☁️ Облако пустое, грузим из localStorage');
          self.loadFromLocalStorage();
        }
        self.finishLoading();
      });
    } else {
      // Облако не доступно, грузим локально
      console.log('💾 Облако недоступно, грузим локально');
      loadingComplete = true;
      clearTimeout(loadingTimeout);
      this.loadFromLocalStorage();
      this.finishLoading();
    }
  },
  
  // Показать статус загрузки
  showLoadingStatus: function(text) {
    var appEl = document.getElementById('app');
    if (appEl) {
      appEl.innerHTML = 
        '<div class="flex items-center justify-center min-h-screen">' +
          '<div class="text-center">' +
            '<div class="text-6xl mb-4 animate-pulse">🌯</div>' +
            '<div class="text-2xl font-bold text-orange-600">' + text + '</div>' +
            '<div class="text-sm text-gray-500 mt-2">Подождите немного</div>' +
          '</div>' +
        '</div>';
    }
  },
  
  // Применить данные из облака
  applyCloudData: function(data) {
    this.state.shawarmas = parseFloat(data.shawarmas) || 0;
    this.state.totalShawarmas = parseFloat(data.total_shawarmas) || 0;
    this.state.lifetimeShawarmas = parseFloat(data.lifetime_shawarmas) || 0;
    this.state.perClick = parseInt(data.per_click) || 1;
    this.state.clickCount = parseInt(data.click_count) || 0;
    this.state.prestigeLevel = parseInt(data.prestige_level) || 0;
    this.state.prestigeBonus = parseFloat(data.prestige_bonus) || 1;
    this.state.dailyStreak = parseInt(data.daily_streak) || 0;
    this.state.lastDailyReward = data.last_daily_reward ? new Date(data.last_daily_reward).getTime() : 0;
    this.state.lastPlayTime = data.last_play_time ? new Date(data.last_play_time).getTime() : Date.now();
    
    // Применяем здания
    if (data.buildings && data.buildings.length) {
      for (var i = 0; i < data.buildings.length; i++) {
        var cloudBuilding = data.buildings[i];
        var building = this.findBuilding(cloudBuilding.building_id);
        if (building) {
          building.owned = cloudBuilding.owned;
          // Пересчитываем стоимость
          var baseCost = GameConfig.buildings[cloudBuilding.building_id - 1].cost;
          building.cost = Math.floor(baseCost * Math.pow(1.15, cloudBuilding.owned));
        }
      }
    }
    
    // Применяем улучшения
    if (data.upgrades && data.upgrades.length) {
      for (var j = 0; j < data.upgrades.length; j++) {
        var cloudUpgrade = data.upgrades[j];
        var upgrade = this.findUpgrade(cloudUpgrade.upgrade_id);
        if (upgrade) {
          upgrade.purchased = cloudUpgrade.purchased;
        }
      }
    }
    
    // Применяем достижения
    if (data.achievements && data.achievements.length) {
      for (var k = 0; k < data.achievements.length; k++) {
        var cloudAch = data.achievements[k];
        var achievement = this.findAchievement(cloudAch.achievement_id);
        if (achievement) {
          achievement.unlocked = true;
        }
      }
    }
  },
  
  // Загрузка из localStorage
  loadFromLocalStorage: function() {
    var saved = null;
    if (typeof GameStorage !== 'undefined') {
      saved = GameStorage.load();
    }
    
    if (saved) {
      console.log('💾 Загружены локальные данные');
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
      
      if (saved.buildings) {
        for (var i = 0; i < saved.buildings.length; i++) {
          var sb = saved.buildings[i];
          var building = this.findBuilding(sb.id);
          if (building) {
            building.owned = sb.owned;
            building.cost = sb.cost;
          }
        }
      }
      
      if (saved.upgrades) {
        for (var j = 0; j < saved.upgrades.length; j++) {
          var su = saved.upgrades[j];
          var upgrade = this.findUpgrade(su.id);
          if (upgrade) upgrade.purchased = su.purchased;
        }
      }
      
      if (saved.achievements) {
        for (var k = 0; k < saved.achievements.length; k++) {
          var sa = saved.achievements[k];
          var achievement = this.findAchievement(sa.id);
          if (achievement) achievement.unlocked = sa.unlocked;
        }
      }
    }
  },
  
  // Завершение загрузки
  finishLoading: function() {
    this.calculateOfflineProgress();
    this.calculateProduction();
    this.checkDailyReward();
    
    if (typeof UI !== 'undefined') {
      UI.render();
    }
  },
  
  // Вспомогательные функции поиска
  findBuilding: function(id) {
    for (var i = 0; i < this.state.buildings.length; i++) {
      if (this.state.buildings[i].id === id) return this.state.buildings[i];
    }
    return null;
  },
  
  findUpgrade: function(id) {
    for (var i = 0; i < this.state.upgrades.length; i++) {
      if (this.state.upgrades[i].id === id) return this.state.upgrades[i];
    }
    return null;
  },
  
  findAchievement: function(id) {
    for (var i = 0; i < this.state.achievements.length; i++) {
      if (this.state.achievements[i].id === id) return this.state.achievements[i];
    }
    return null;
  },
  
  // Сохранение игры (локально + облако)
  saveGame: function() {
    // Локальное сохранение
    if (typeof GameStorage !== 'undefined') {
      GameStorage.save(this.state);
    }
    
    // Облачное сохранение (с троттлингом)
    var now = Date.now();
    if (this.cloudSaveEnabled && (now - this.lastCloudSave > this.cloudSaveInterval)) {
      this.saveToCloud();
      this.lastCloudSave = now;
    }
  },
  
  // Сохранение в облако
  saveToCloud: function() {
    if (!this.cloudSaveEnabled) return;
    
    var self = this;
    DB.saveUser(this.state, this.userInfo, function(success) {
      if (success) {
        console.log('☁️ Сохранено в облако');
      }
    });
  },
  
  // Принудительное сохранение в облако
  forceSaveToCloud: function() {
    if (this.cloudSaveEnabled) {
      this.saveToCloud();
    }
  },
  
  // Расчёт офлайн прогресса
  calculateOfflineProgress: function() {
    var now = Date.now();
    var timePassed = (now - this.state.lastPlayTime) / 1000;
    
    if (timePassed > 10 && this.state.perSecond > 0) {
      var maxOfflineTime = 4 * 60 * 60;
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
  
  showDailyRewardModal: function() {
    var modal = document.getElementById('daily-reward-modal');
    if (!modal) return;
    
    // Начинаем с 50, потом +25 за каждый день подряд (макс 7 дней = 225)
    var reward = 50 + Math.min(this.state.dailyStreak - 1, 6) * 25;
    
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
  
  claimDailyReward: function() {
    var reward = 50 + Math.min(this.state.dailyStreak - 1, 6) * 25;
    this.state.shawarmas += reward;
    this.state.totalShawarmas += reward;
    this.state.lifetimeShawarmas += reward;
    this.state.lastDailyReward = Date.now();
    
    var modal = document.getElementById('daily-reward-modal');
    if (modal) modal.classList.add('hidden');
    
    if (typeof UI !== 'undefined') {
      UI.createParticles(window.innerWidth / 2, window.innerHeight / 2, 20, '🎁');
    }
    
    this.saveGame();
    this.forceSaveToCloud();
    
    if (typeof UI !== 'undefined') {
      UI.render();
    }
  },
  
  // Расчёт производства
  calculateProduction: function() {
    var baseProduction = 0;
    for (var i = 0; i < this.state.buildings.length; i++) {
      var b = this.state.buildings[i];
      // Бонус +1% за каждое купленное здание этого типа
      var quantityBonus = 1 + (b.owned * 0.01);
      baseProduction += b.owned * b.production * quantityBonus;
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
    var now = Date.now();
    
    // Комбо система
    if (now - this.combo.lastClickTime < this.combo.comboTimeout) {
      this.combo.count++;
      this.combo.multiplier = Math.min(1 + (this.combo.count * 0.1), this.combo.maxMultiplier);
    } else {
      this.combo.count = 0;
      this.combo.multiplier = 1;
    }
    this.combo.lastClickTime = now;
    
    // Множитель от событий
    var eventClickMult = (typeof Events !== 'undefined') ? Events.getClickMultiplier() : 1;
    
    // Расчёт награды с комбо и событиями
    var clickReward = this.state.perClick * this.combo.multiplier * eventClickMult;
    
    this.state.shawarmas += clickReward;
    this.state.totalShawarmas += clickReward;
    this.state.lifetimeShawarmas += clickReward;
    this.state.clickCount++;
    
    var shawarmaBtn = document.getElementById('shawarma-btn');
    if (shawarmaBtn) {
      shawarmaBtn.classList.add('shake');
      setTimeout(function() {
        shawarmaBtn.classList.remove('shake');
      }, 300);
    }
    
    if (typeof UI !== 'undefined') {
      // Показываем число с комбо
      var displayText = clickReward;
      if (this.combo.multiplier > 1) {
        UI.showFloatingNumber(event.clientX, event.clientY, clickReward, 'x' + this.combo.multiplier.toFixed(1));
      } else {
        UI.showFloatingNumber(event.clientX, event.clientY, clickReward);
      }
      
      // Обновляем комбо-индикатор
      UI.updateComboIndicator(this.combo.count, this.combo.multiplier);
    }
    
    if (typeof SoundManager !== 'undefined') {
      SoundManager.click();
    }
    
    // Больше частиц при комбо
    var particleChance = 0.1 + (this.combo.multiplier - 1) * 0.1;
    if (Math.random() < particleChance && typeof UI !== 'undefined') {
      var particleCount = Math.min(5 + this.combo.count, 15);
      UI.createParticles(event.clientX, event.clientY, particleCount);
    }
    
    try {
      if (this.isTelegram && this.tg && this.tg.HapticFeedback) {
        // Сильнее вибрация при комбо
        var intensity = this.combo.multiplier > 2 ? 'medium' : 'light';
        this.tg.HapticFeedback.impactOccurred(intensity);
      }
    } catch (e) {}
    
    this.checkAchievements();
    
    if (typeof UI !== 'undefined') {
      UI.updateCounters();
    }
  },
  
  getBuildingDiscount: function() {
    var discount = 1;
    for (var i = 0; i < this.state.upgrades.length; i++) {
      var u = this.state.upgrades[i];
      if (u.purchased && u.type === 'discount') {
        discount *= u.buildingDiscount;
      }
    }
    // Скидка от событий
    if (typeof Events !== 'undefined') {
      discount *= Events.getDiscountMultiplier();
    }
    return discount;
  },
  
  buyBuilding: function(buildingId) {
    var building = this.findBuilding(buildingId);
    if (!building) return;
    
    var discount = this.getBuildingDiscount();
    var buyMode = (typeof UI !== 'undefined') ? UI.buyMode : 1;
    
    // Считаем сколько можем купить
    var totalCost = 0;
    var count = 0;
    var tempCost = building.cost;
    
    if (buyMode === 100) {
      // MAX - покупаем сколько можем
      var budget = this.state.shawarmas;
      while (Math.floor(tempCost * discount) <= budget && count < 1000) {
        var cost = Math.floor(tempCost * discount);
        totalCost += cost;
        budget -= cost;
        tempCost = Math.floor(tempCost * 1.15);
        count++;
      }
    } else {
      // x1 или x10
      for (var i = 0; i < buyMode; i++) {
        var cost = Math.floor(tempCost * discount);
        if (totalCost + cost > this.state.shawarmas) break;
        totalCost += cost;
        tempCost = Math.floor(tempCost * 1.15);
        count++;
      }
    }
    
    if (count > 0 && this.state.shawarmas >= totalCost) {
      this.state.shawarmas -= totalCost;
      building.owned += count;
      building.cost = tempCost;
      
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
  
  getTotalBuildings: function() {
    var total = 0;
    for (var i = 0; i < this.state.buildings.length; i++) {
      total += this.state.buildings[i].owned;
    }
    return total;
  },
  
  checkAchievements: function() {
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
  
  openPrestigeModal: function() {
    if (this.state.totalShawarmas < 10000000) {
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
    // Та же формула что и в confirmPrestige
    var logBonus = Math.log10(Math.max(this.state.lifetimeShawarmas, 1000000) / 1000000);
    var newBonus = 1 + (logBonus * 0.5) + ((this.state.prestigeLevel + 1) * 0.1);
    newBonus = Math.min(newBonus, 10);
    
    var totalEl = document.getElementById('prestige-total');
    var buildingsEl = document.getElementById('prestige-buildings');
    var bonusEl = document.getElementById('prestige-bonus');
    
    if (totalEl && typeof UI !== 'undefined') {
      totalEl.textContent = UI.formatNumber(this.state.totalShawarmas);
    }
    if (buildingsEl) buildingsEl.textContent = totalBuildings;
    if (bonusEl) bonusEl.textContent = newBonus.toFixed(2);
    
    var modal = document.getElementById('prestige-modal');
    if (modal) modal.classList.remove('hidden');
  },
  
  closePrestigeModal: function() {
    var modal = document.getElementById('prestige-modal');
    if (modal) modal.classList.add('hidden');
  },
  
  confirmPrestige: function() {
    var self = this;
    
    this.state.prestigeLevel++;
    // Логарифмическая формула - рост замедляется с каждым престижем
    // 1M = x1.5, 10M = x2, 100M = x2.5, 1B = x3, и т.д.
    var logBonus = Math.log10(Math.max(this.state.lifetimeShawarmas, 1000000) / 1000000);
    this.state.prestigeBonus = 1 + (logBonus * 0.5) + (this.state.prestigeLevel * 0.1);
    this.state.prestigeBonus = Math.min(this.state.prestigeBonus, 10); // Максимум x10
    
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
    
    // Сбрасываем данные в облаке
    if (this.cloudSaveEnabled) {
      DB.resetForPrestige(function() {
        self.saveGame();
        self.forceSaveToCloud();
      });
    } else {
      this.saveGame();
    }
    
    this.checkAchievements();
    this.calculateProduction();
    
    if (typeof UI !== 'undefined') {
      UI.render(true);
    }
  },
  
  switchTab: function(tab) {
    this.state.currentTab = tab;
    if (typeof UI !== 'undefined') {
      UI.render(true);
    }
  },
  
  // Показать лидерборд
  showLeaderboard: function() {
    if (!this.cloudSaveEnabled) {
      if (typeof UI !== 'undefined') {
        UI.showAchievementPopup({
          name: 'Лидерборд недоступен',
          desc: 'Требуется подключение к интернету',
          reward: 0,
          emoji: '📶'
        });
      }
      return;
    }
    
    DB.getLeaderboard(10, function(leaders) {
      if (typeof UI !== 'undefined') {
        UI.showLeaderboard(leaders);
      }
    });
  },
  
  // Запуск игровых циклов
  startGameLoops: function() {
    var self = this;
    
    // Автопроизводство
    setInterval(function() {
      var eventMult = (typeof Events !== 'undefined') ? Events.getProductionMultiplier() : 1;
      var production = (self.state.perSecond / 10) * eventMult;
      self.state.shawarmas += production;
      self.state.totalShawarmas += production;
      self.state.lifetimeShawarmas += production;
    }, 100);
    
    // Обновление UI
    setInterval(function() {
      if (typeof UI !== 'undefined') {
        UI.updateCounters();
      }
    }, 1000);
    
    // Обновление кнопок
    setInterval(function() {
      if (typeof UI !== 'undefined') {
        UI.updateButtonStates();
      }
    }, 2000);
    
    // Обновление достижений (если открыта вкладка)
    setInterval(function() {
      if (self.state.currentTab === 'achievements' && typeof UI !== 'undefined') {
        UI.updateAchievementsProgress();
      }
    }, 1000);
    
    // Обновление заказов (если открыта вкладка)
    setInterval(function() {
      if (self.state.currentTab === 'orders' && typeof UI !== 'undefined') {
        UI.forceUpdateTab();
      }
    }, 1000);
    
    // Автосохранение
    setInterval(function() {
      self.saveGame();
    }, 5000);
    
    // Сохранение в облако при закрытии
    window.addEventListener('beforeunload', function() {
      self.forceSaveToCloud();
    });
    
    // Для Telegram - сохранение при сворачивании
    if (this.isTelegram && this.tg) {
      document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
          self.forceSaveToCloud();
        }
      });
    }
    
    // Запускаем цикл золотой шаурмы
    this.scheduleGoldenShawarma();
    
    console.log('✅ Game loops запущены');
  },
  
  // Планирование появления золотой шаурмы
  scheduleGoldenShawarma: function() {
    var self = this;
    var delay = this.goldenShawarma.minInterval + 
                Math.random() * (this.goldenShawarma.maxInterval - this.goldenShawarma.minInterval);
    
    setTimeout(function() {
      self.spawnGoldenShawarma();
    }, delay);
  },
  
  // Появление золотой шаурмы
  spawnGoldenShawarma: function() {
    if (this.goldenShawarma.active) return;
    
    // Не спавним если события на паузе (мини-игра)
    if (typeof Events !== 'undefined' && Events.pauseEvents) {
      this.scheduleGoldenShawarma();
      return;
    }
    
    var self = this;
    this.goldenShawarma.active = true;
    
    // Создаём элемент
    var golden = document.createElement('div');
    golden.id = 'golden-shawarma';
    golden.innerHTML = '🌯';
    golden.className = 'fixed text-6xl cursor-pointer z-50 animate-bounce filter drop-shadow-lg';
    golden.style.cssText = 'left:' + (20 + Math.random() * 60) + '%;top:' + (30 + Math.random() * 40) + '%;' +
      'text-shadow: 0 0 20px gold, 0 0 40px orange;transform:scale(1.2);';
    
    // Клик по золотой шаурме
    golden.onclick = function(e) {
      e.stopPropagation();
      self.collectGoldenShawarma();
    };
    
    document.body.appendChild(golden);
    this.goldenShawarma.element = golden;
    
    // Звук появления
    if (typeof SoundManager !== 'undefined') {
      SoundManager.achievement();
    }
    
    // Показываем подсказку
    if (typeof UI !== 'undefined') {
      UI.showAchievementPopup({
        name: 'Золотая шаурма!',
        desc: 'Быстрее! Кликни на неё!',
        reward: 0,
        emoji: '✨'
      });
    }
    
    // Автоисчезновение
    setTimeout(function() {
      if (self.goldenShawarma.active) {
        self.removeGoldenShawarma();
        self.scheduleGoldenShawarma();
      }
    }, this.goldenShawarma.displayTime);
  },
  
  // Сбор золотой шаурмы
  collectGoldenShawarma: function() {
    if (!this.goldenShawarma.active) return;
    
    // Расчёт бонуса (5 секунд производства или минимум 25)
    var bonus = Math.max(this.state.perSecond * this.goldenShawarma.bonusMultiplier, 25);
    bonus = Math.floor(bonus * this.state.prestigeBonus);
    
    this.state.shawarmas += bonus;
    this.state.totalShawarmas += bonus;
    this.state.lifetimeShawarmas += bonus;
    
    // Эффекты
    var el = this.goldenShawarma.element;
    if (el && typeof UI !== 'undefined') {
      var rect = el.getBoundingClientRect();
      UI.createParticles(rect.left + rect.width/2, rect.top + rect.height/2, 20, '⭐');
      UI.showFloatingNumber(rect.left + rect.width/2, rect.top, bonus, 'БОНУС!');
    }
    
    if (typeof SoundManager !== 'undefined') {
      SoundManager.achievement();
    }
    
    // Вибрация
    try {
      if (this.isTelegram && this.tg && this.tg.HapticFeedback) {
        this.tg.HapticFeedback.notificationOccurred('success');
      }
    } catch (e) {}
    
    // Убираем и планируем следующую
    this.removeGoldenShawarma();
    this.scheduleGoldenShawarma();
    
    if (typeof UI !== 'undefined') {
      UI.updateCounters();
    }
  },
  
  // Удаление золотой шаурмы
  removeGoldenShawarma: function() {
    if (this.goldenShawarma.element) {
      this.goldenShawarma.element.remove();
      this.goldenShawarma.element = null;
    }
    this.goldenShawarma.active = false;
  }
};

console.log('✅ game.js загружен');
