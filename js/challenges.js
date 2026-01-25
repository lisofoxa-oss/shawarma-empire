// Система ежедневных челленджей
// js/challenges.js

var Challenges = {
  // Активные челленджи на сегодня
  daily: [],
  
  // Время последней генерации
  lastGenerated: 0,
  
  // Типы челленджей
  types: [
    {
      id: 'clicks',
      name: 'Кликер',
      desc: 'Сделай {target} кликов',
      icon: '👆',
      targets: [100, 250, 500, 1000],
      getProgress: function() { return Game.state.clickCount - Challenges.startValues.clicks; }
    },
    {
      id: 'produce',
      name: 'Производство',
      desc: 'Произведи {target} шаурмы',
      icon: '🌯',
      targets: [1000, 5000, 25000, 100000],
      getProgress: function() { return Game.state.totalShawarmas - Challenges.startValues.produce; }
    },
    {
      id: 'buy_buildings',
      name: 'Строитель',
      desc: 'Купи {target} зданий',
      icon: '🏗️',
      targets: [5, 10, 25, 50],
      getProgress: function() { return Game.getTotalBuildings() - Challenges.startValues.buildings; }
    },
    {
      id: 'buy_upgrades',
      name: 'Улучшатель',
      desc: 'Купи {target} улучшений',
      icon: '⚡',
      targets: [1, 2, 3, 5],
      getProgress: function() { 
        var count = 0;
        for (var i = 0; i < Game.state.upgrades.length; i++) {
          if (Game.state.upgrades[i].purchased) count++;
        }
        return count - Challenges.startValues.upgrades; 
      }
    },
    {
      id: 'combo',
      name: 'Комбо мастер',
      desc: 'Достигни комбо x{target}',
      icon: '🔥',
      targets: [5, 10, 15, 20],
      getProgress: function() { return Game.combo.count; }
    },
    {
      id: 'golden',
      name: 'Охотник',
      desc: 'Поймай {target} золотых шаурм',
      icon: '✨',
      targets: [1, 2, 3, 5],
      getProgress: function() { return Challenges.goldenCaught; }
    },
    {
      id: 'minigame',
      name: 'Игрок',
      desc: 'Сыграй {target} мини-игр',
      icon: '🎮',
      targets: [1, 2, 3, 5],
      getProgress: function() { return Challenges.minigamesPlayed; }
    }
  ],
  
  // Счётчики для челленджей
  goldenCaught: 0,
  minigamesPlayed: 0,
  startValues: {
    clicks: 0,
    produce: 0,
    buildings: 0,
    upgrades: 0
  },
  
  // Инициализация
  init: function() {
    this.load();
    this.checkNewDay();
    console.log('✅ Challenges система инициализирована');
  },
  
  // Проверка нового дня
  checkNewDay: function() {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    if (this.lastGenerated < today) {
      this.generateDaily();
    }
  },
  
  // Генерация челленджей на день
  generateDaily: function() {
    var now = new Date();
    this.lastGenerated = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Сбрасываем счётчики
    this.goldenCaught = 0;
    this.minigamesPlayed = 0;
    this.startValues = {
      clicks: Game.state.clickCount,
      produce: Game.state.totalShawarmas,
      buildings: Game.getTotalBuildings(),
      upgrades: this.countUpgrades()
    };
    
    // Выбираем 3 случайных типа
    var shuffled = this.types.slice().sort(function() { return 0.5 - Math.random(); });
    var selected = shuffled.slice(0, 3);
    
    this.daily = [];
    
    for (var i = 0; i < selected.length; i++) {
      var type = selected[i];
      // Сложность зависит от прогресса игрока
      var difficulty = Math.min(3, Math.floor(Game.state.prestigeLevel) + (Game.state.totalShawarmas > 100000 ? 1 : 0));
      var target = type.targets[Math.min(difficulty, type.targets.length - 1)];
      
      // Награда зависит от сложности
      var baseReward = [100, 500, 2500, 10000][difficulty];
      var reward = Math.floor(baseReward * (1 + Math.random() * 0.5));
      
      this.daily.push({
        id: type.id + '_' + Date.now() + '_' + i,
        typeId: type.id,
        name: type.name,
        desc: type.desc.replace('{target}', target),
        icon: type.icon,
        target: target,
        reward: reward,
        claimed: false
      });
    }
    
    this.save();
  },
  
  // Подсчёт купленных улучшений
  countUpgrades: function() {
    var count = 0;
    for (var i = 0; i < Game.state.upgrades.length; i++) {
      if (Game.state.upgrades[i].purchased) count++;
    }
    return count;
  },
  
  // Получить прогресс челленджа
  getProgress: function(challenge) {
    var type = null;
    for (var i = 0; i < this.types.length; i++) {
      if (this.types[i].id === challenge.typeId) {
        type = this.types[i];
        break;
      }
    }
    if (!type) return 0;
    return Math.max(0, type.getProgress());
  },
  
  // Проверить выполнен ли челлендж
  isCompleted: function(challenge) {
    return this.getProgress(challenge) >= challenge.target;
  },
  
  // Забрать награду
  claimReward: function(challengeId) {
    for (var i = 0; i < this.daily.length; i++) {
      var ch = this.daily[i];
      if (ch.id === challengeId && !ch.claimed && this.isCompleted(ch)) {
        ch.claimed = true;
        
        Game.state.shawarmas += ch.reward;
        Game.state.totalShawarmas += ch.reward;
        Game.state.lifetimeShawarmas += ch.reward;
        
        if (typeof Sounds !== 'undefined') Sounds.achievement();
        if (typeof UI !== 'undefined') {
          UI.showAchievementPopup({
            emoji: ch.icon,
            name: 'Челлендж выполнен!',
            desc: ch.name,
            reward: ch.reward
          });
          UI.createParticles(window.innerWidth / 2, window.innerHeight / 2, 10, '⭐');
        }
        
        this.save();
        Game.saveGame();
        return true;
      }
    }
    return false;
  },
  
  // Уведомление о пойманной золотой шаурме
  onGoldenCaught: function() {
    this.goldenCaught++;
    this.save();
  },
  
  // Уведомление о сыгранной мини-игре
  onMinigamePlayed: function() {
    this.minigamesPlayed++;
    this.save();
  },
  
  // Время до сброса челленджей
  getTimeToReset: function() {
    var now = new Date();
    var tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return tomorrow.getTime() - now.getTime();
  },
  
  // Сохранение
  save: function() {
    var data = {
      daily: this.daily,
      lastGenerated: this.lastGenerated,
      goldenCaught: this.goldenCaught,
      minigamesPlayed: this.minigamesPlayed,
      startValues: this.startValues
    };
    localStorage.setItem('shawarma_challenges', JSON.stringify(data));
  },
  
  // Загрузка
  load: function() {
    try {
      var saved = localStorage.getItem('shawarma_challenges');
      if (saved) {
        var data = JSON.parse(saved);
        this.daily = data.daily || [];
        this.lastGenerated = data.lastGenerated || 0;
        this.goldenCaught = data.goldenCaught || 0;
        this.minigamesPlayed = data.minigamesPlayed || 0;
        this.startValues = data.startValues || {
          clicks: 0,
          produce: 0,
          buildings: 0,
          upgrades: 0
        };
      }
    } catch (e) {
      console.error('Ошибка загрузки челленджей:', e);
    }
  }
};

console.log('✅ challenges.js загружен');
