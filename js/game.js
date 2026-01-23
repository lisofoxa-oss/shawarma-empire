// Основная логика игры

const Game = {
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
  
  // Инициализация игры
  init() {
    // Проверяем Telegram
    this.isTelegram = window.Telegram && window.Telegram.WebApp;
    if (this.isTelegram) {
      this.tg = window.Telegram.WebApp;
      this.tg.expand();
      this.tg.enableClosingConfirmation();
    }
    
    // Получаем ID пользователя
    const userId = this.isTelegram && this.tg.initDataUnsafe?.user?.id 
      ? this.tg.initDataUnsafe.user.id 
      : Math.floor(Math.random() * 1000000);
    
    // Инициализируем подсистемы
    Sounds.init();
    Storage.init(userId);
    
    // Копируем конфигурацию
    this.state.buildings = JSON.parse(JSON.stringify(GameConfig.buildings));
    this.state.upgrades = JSON.parse(JSON.stringify(GameConfig.upgrades));
    this.state.achievements = JSON.parse(JSON.stringify(GameConfig.achievements));
    
    // Загружаем сохранение
    this.loadGame();
    
    // Запускаем игровые циклы
    this.startGameLoops();
  },
  
  // Загрузка игры
  loadGame() {
    const saved = Storage.load();
    if (saved) {
      Object.assign(this.state, {
        shawarmas: saved.shawarmas || 0,
        totalShawarmas: saved.totalShawarmas || 0,
        lifetimeShawarmas: saved.lifetimeShawarmas || 0,
        perClick: saved.perClick || 1,
        clickCount: saved.clickCount || 0,
        prestigeLevel: saved.prestigeLevel || 0,
        prestigeBonus: saved.prestigeBonus || 1,
        lastPlayTime: saved.lastPlayTime || Date.now(),
        dailyStreak: saved.dailyStreak || 0,
        lastDailyReward: saved.lastDailyReward || 0,
      });
      
      // Загружаем здания
      if (saved.buildings) {
        saved.buildings.forEach(savedBuilding => {
          const building = this.state.buildings.find(b => b.id === savedBuilding.id);
          if (building) {
            building.owned = savedBuilding.owned;
            building.cost = savedBuilding.cost;
          }
        });
      }
      
      // Загружаем улучшения
      if (saved.upgrades) {
        saved.upgrades.forEach(savedUpgrade => {
          const upgrade = this.state.upgrades.find(u => u.id === savedUpgrade.id);
          if (upgrade) upgrade.purchased = savedUpgrade.purchased;
        });
      }
      
      // Загружаем достижения
      if (saved.achievements) {
        saved.achievements.forEach(savedAch => {
          const achievement = this.state.achievements.find(a => a.id === savedAch.id);
          if (achievement) achievement.unlocked = savedAch.unlocked;
        });
      }
    }
    
    // Рассчитываем офлайн прогресс
    this.calculateOfflineProgress();
    
    // Рассчитываем производство
    this.calculateProduction();
    
    // Проверяем ежедневную награду
    this.checkDailyReward();
    
    // Отрисовываем интерфейс
    UI.render();
  },
  
  // Сохранение игры
  saveGame() {
    Storage.save(this.state);
  },
  
  // Расчёт офлайн прогресса
  calculateOfflineProgress() {
    const now = Date.now();
    const timePassed = (now - this.state.lastPlayTime) / 1000;
    
    if (timePassed > 10 && this.state.perSecond > 0) {
      const maxOfflineTime = 4 * 60 * 60; // Макс 4 часа
      const actualTime = Math.min(timePassed, maxOfflineTime);
      const offlineProduction = this.state.perSecond * actualTime;
      
      if (offlineProduction > 0) {
        this.state.shawarmas += offlineProduction;
        this.state.totalShawarmas += offlineProduction;
        this.state.lifetimeShawarmas += offlineProduction;
        
        const hours = Math.floor(actualTime / 3600);
        const minutes = Math.floor((actualTime % 3600) / 60);
        const timeStr = hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м`;
        
        UI.showAchievementPopup({
          name: 'Офлайн прогресс',
          desc: `Ты отсутствовал ${timeStr}`,
          reward: Math.floor(offlineProduction),
          emoji: '💤'
        });
      }
    }
    
    this.state.lastPlayTime = now;
  },
  
  // Проверка ежедневной награды
  checkDailyReward() {
    const now = Date.now();
    const lastReward = this.state.lastDailyReward;
    const dayInMs = 24 * 60 * 60 * 1000;
    
    if (now - lastReward > dayInMs) {
      const daysSince = Math.floor((now - lastReward) / dayInMs);
      
      if (daysSince === 1) {
        this.state.dailyStreak++;
      } else if (daysSince > 1) {
        this.state.dailyStreak = 1;
      }
      
      this.showDailyRewardModal();
    }
  },
  
  // Показать модалку ежедневной награды
  showDailyRewardModal() {
    const modal = document.getElementById('daily-reward-modal');
    const reward = 1000 * this.state.dailyStreak;
    
    document.getElementById('daily-reward-amount').textContent = '+' + UI.formatNumber(reward) + ' 🌯';
    document.getElementById('daily-streak').textContent = this.state.dailyStreak;
    
    modal.classList.remove('hidden');
    Sounds.achievement();
  },
  
  // Забрать ежедневную награду
  claimDailyReward() {
    const reward = 1000 * this.state.dailyStreak;
    this.state.shawarmas += reward;
    this.state.totalShawarmas += reward;
    this.state.lifetimeShawarmas += reward;
    this.state.lastDailyReward = Date.now();
    
    document.getElementById('daily-reward-modal').classList.add('hidden');
    UI.createParticles(window.innerWidth / 2, window.innerHeight / 2, 20, '🎁');
    this.saveGame();
    UI.render();
  },
  
  // Расчёт производства
  calculateProduction() {
    let baseProduction = this.state.buildings.reduce((sum, b) => 
      sum + (b.owned * b.production), 0
    );
    
    const productionMultiplier = this.state.upgrades
      .filter(u => u.purchased && u.type === 'production')
      .reduce((mult, u) => mult * u.productionMultiplier, 1);
    
    this.state.perSecond = baseProduction * productionMultiplier * this.state.prestigeBonus;
    
    this.state.perClick = 1 + this.state.upgrades
      .filter(u => u.purchased && u.type === 'click')
      .reduce((sum, u) => sum + u.clickBonus, 0);
    
    this.state.perClick *= this.state.prestigeBonus;
  },
  
  // Клик по шаурме
  handleClick(event) {
    this.state.shawarmas += this.state.perClick;
    this.state.totalShawarmas += this.state.perClick;
    this.state.lifetimeShawarmas += this.state.perClick;
    this.state.clickCount++;
    
    const shawarmaBtn = document.getElementById('shawarma-btn');
    if (shawarmaBtn) {
      shawarmaBtn.classList.add('shake');
      setTimeout(() => shawarmaBtn.classList.remove('shake'), 300);
    }
    
    UI.showFloatingNumber(event.clientX, event.clientY, this.state.perClick);
    Sounds.click();
    
    if (Math.random() < 0.1) {
      UI.createParticles(event.clientX, event.clientY, 5);
    }
    
    if (this.isTelegram && this.tg.HapticFeedback) {
      this.tg.HapticFeedback.impactOccurred('light');
    }
    
    this.checkAchievements();
    UI.render();
  },
  
  // Покупка здания
  buyBuilding(buildingId) {
    const building = this.state.buildings.find(b => b.id === buildingId);
    if (!building) return;
    
    let finalCost = building.cost;
    
    const discount = this.state.upgrades
      .filter(u => u.purchased && u.type === 'discount')
      .reduce((disc, u) => disc * u.buildingDiscount, 1);
    
    finalCost = Math.floor(finalCost * discount);
    
    if (this.state.shawarmas >= finalCost) {
      this.state.shawarmas -= finalCost;
      building.owned++;
      building.cost = Math.floor(building.cost * 1.15);
      
      this.calculateProduction();
      this.saveGame();
      Sounds.purchase();
      
      if (this.isTelegram && this.tg.HapticFeedback) {
        this.tg.HapticFeedback.notificationOccurred('success');
      }
      
      this.checkAchievements();
      UI.render();
    }
  },
  
  // Покупка улучшения
  buyUpgrade(upgradeId) {
    const upgrade = this.state.upgrades.find(u => u.id === upgradeId);
    if (!upgrade || upgrade.purchased) return;
    
    if (this.state.shawarmas >= upgrade.cost) {
      this.state.shawarmas -= upgrade.cost;
      upgrade.purchased = true;
      
      this.calculateProduction();
      this.saveGame();
      Sounds.purchase();
      
      if (this.isTelegram && this.tg.HapticFeedback) {
        this.tg.HapticFeedback.notificationOccurred('success');
      }
      
      UI.render();
    }
  },
  
  // Проверка достижений
  checkAchievements() {
    const totalBuildings = this.state.buildings.reduce((sum, b) => sum + b.owned, 0);
    
    this.state.achievements.forEach(ach => {
      if (ach.unlocked) return;
      
      let progress = 0;
      if (ach.type === 'total') progress = this.state.totalShawarmas;
      if (ach.type === 'clicks') progress = this.state.clickCount;
      if (ach.type === 'buildings') progress = totalBuildings;
      if (ach.type === 'prestige') progress = this.state.prestigeLevel;
      
      if (progress >= ach.target) {
        ach.unlocked = true;
        this.state.shawarmas += ach.reward;
        UI.showAchievementPopup(ach);
        Sounds.achievement();
      }
    });
  },
  
  // Открыть модалку престижа
  openPrestigeModal() {
    if (this.state.totalShawarmas < 1000000) {
      UI.showAchievementPopup({
        name: 'Недостаточно прогресса',
        desc: 'Нужно минимум 1M шаурмы для престижа',
        reward: 0,
        emoji: '⚠️'
      });
      return;
    }
    
    const totalBuildings = this.state.buildings.reduce((sum, b) => sum + b.owned, 0);
    const newBonus = 1 + (this.state.lifetimeShawarmas / 1000000) * 0.5;
    
    document.getElementById('prestige-total').textContent = UI.formatNumber(this.state.totalShawarmas);
    document.getElementById('prestige-buildings').textContent = totalBuildings;
    document.getElementById('prestige-bonus').textContent = newBonus.toFixed(2);
    
    document.getElementById('prestige-modal').classList.remove('hidden');
  },
  
  // Закрыть модалку престижа
  closePrestigeModal() {
    document.getElementById('prestige-modal').classList.add('hidden');
  },
  
  // Подтвердить престиж
  confirmPrestige() {
    this.state.prestigeLevel++;
    this.state.prestigeBonus = 1 + (this.state.lifetimeShawarmas / 1000000) * 0.5;
    
    this.state.shawarmas = 0;
    this.state.totalShawarmas = 0;
    
    // Сбрасываем здания
    this.state.buildings.forEach((b, index) => {
      b.owned = 0;
      b.cost = GameConfig.buildings[index].cost;
    });
    
    // Сбрасываем улучшения
    this.state.upgrades.forEach(u => u.purchased = false);
    
    this.closePrestigeModal();
    Sounds.achievement();
    UI.createParticles(window.innerWidth / 2, window.innerHeight / 2, 30, '⭐');
    
    UI.showAchievementPopup({
      name: 'Престиж достигнут!',
      desc: `Множитель: x${this.state.prestigeBonus.toFixed(2)}`,
      reward: 0,
      emoji: '⭐'
    });
    
    this.checkAchievements();
    this.calculateProduction();
    this.saveGame();
    UI.render();
  },
  
  // Смена вкладки
  switchTab(tab) {
    this.state.currentTab = tab;
    UI.render();
  },
  
  // Запуск игровых циклов
  startGameLoops() {
    // Автопроизводство каждые 100мс
    setInterval(() => {
      this.state.shawarmas += this.state.perSecond / 10;
      this.state.totalShawarmas += this.state.perSecond / 10;
      this.state.lifetimeShawarmas += this.state.perSecond / 10;
      UI.render();
    }, 100);
    
    // Автосохранение каждые 5 секунд
    setInterval(() => {
      this.saveGame();
    }, 5000);
  }
};
