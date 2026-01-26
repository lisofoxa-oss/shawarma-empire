// Система скинов шаурмы
// js/skins.js

var Skins = {
  // Текущий выбранный скин
  current: 'default',
  
  // Разблокированные скины
  unlocked: ['default'],
  
  // Все доступные скины
  list: [
    {
      id: 'default',
      name: 'Классика',
      emoji: '🌯',
      desc: 'Оригинальная шаурма',
      unlockType: 'default',
      unlockDesc: 'Доступно с начала'
    },
    {
      id: 'taco',
      name: 'Тако',
      emoji: '🌮',
      desc: 'Мексиканский стиль',
      unlockType: 'clicks',
      unlockTarget: 1000,
      unlockDesc: 'Сделай 1,000 кликов'
    },
    {
      id: 'burrito',
      name: 'Кебаб',
      emoji: '🥙',
      desc: 'Ближневосточный стиль',
      unlockType: 'total',
      unlockTarget: 50000,
      unlockDesc: 'Произведи 50,000 шаурмы'
    },
    {
      id: 'hotdog',
      name: 'Хот-дог',
      emoji: '🌭',
      desc: 'Американская мечта',
      unlockType: 'buildings',
      unlockTarget: 50,
      unlockDesc: 'Купи 50 зданий'
    },
    {
      id: 'pizza',
      name: 'Пицца',
      emoji: '🍕',
      desc: 'Итальянская классика',
      unlockType: 'total',
      unlockTarget: 500000,
      unlockDesc: 'Произведи 500,000 шаурмы'
    },
    {
      id: 'falafel',
      name: 'Фалафель',
      emoji: '🧆',
      desc: 'Вегетарианский выбор',
      unlockType: 'upgrades',
      unlockTarget: 5,
      unlockDesc: 'Купи 5 улучшений'
    },
    {
      id: 'sushi',
      name: 'Суши',
      emoji: '🍣',
      desc: 'Японский деликатес',
      unlockType: 'total',
      unlockTarget: 5000000,
      unlockDesc: 'Произведи 5M шаурмы'
    },
    {
      id: 'dumpling',
      name: 'Пельмень',
      emoji: '🥟',
      desc: 'Русская душа',
      unlockType: 'clicks',
      unlockTarget: 10000,
      unlockDesc: 'Сделай 10,000 кликов'
    },
    {
      id: 'burger',
      name: 'Бургер',
      emoji: '🍔',
      desc: 'Король фастфуда',
      unlockType: 'buildings',
      unlockTarget: 100,
      unlockDesc: 'Купи 100 зданий'
    },
    {
      id: 'donut',
      name: 'Пончик',
      emoji: '🍩',
      desc: 'Сладкая жизнь',
      unlockType: 'golden',
      unlockTarget: 10,
      unlockDesc: 'Поймай 10 золотых шаурм'
    },
    {
      id: 'cake',
      name: 'Торт',
      emoji: '🎂',
      desc: 'Праздничное настроение',
      unlockType: 'total',
      unlockTarget: 50000000,
      unlockDesc: 'Произведи 50M шаурмы'
    },
    {
      id: 'gem',
      name: 'Кристалл',
      emoji: '💎',
      desc: 'Легендарный скин',
      unlockType: 'prestige',
      unlockTarget: 3,
      unlockDesc: 'Достигни 3 престижа'
    },
    {
      id: 'star',
      name: 'Звезда',
      emoji: '⭐',
      desc: 'Сияющая награда',
      unlockType: 'prestige',
      unlockTarget: 5,
      unlockDesc: 'Достигни 5 престижа'
    },
    {
      id: 'rocket',
      name: 'Ракета',
      emoji: '🚀',
      desc: 'К звёздам!',
      unlockType: 'total',
      unlockTarget: 500000000,
      unlockDesc: 'Произведи 500M шаурмы'
    },
    {
      id: 'alien',
      name: 'Инопланетянин',
      emoji: '👽',
      desc: 'Космический гость',
      unlockType: 'prestige',
      unlockTarget: 10,
      unlockDesc: 'Достигни 10 престижа'
    },
    {
      id: 'crown',
      name: 'Корона',
      emoji: '👑',
      desc: 'Королевский статус',
      unlockType: 'total',
      unlockTarget: 1000000000,
      unlockDesc: 'Произведи 1B шаурмы'
    }
  ],
  
  // Статистика для разблокировки
  stats: {
    goldenCaught: 0
  },
  
  // Инициализация
  init: function() {
    this.load();
    this.checkUnlocks();
    console.log('✅ Skins система инициализирована');
  },
  
  // Проверить разблокировки
  checkUnlocks: function() {
    var newUnlocks = [];
    
    for (var i = 0; i < this.list.length; i++) {
      var skin = this.list[i];
      
      // Уже разблокирован
      if (this.unlocked.indexOf(skin.id) !== -1) continue;
      
      var unlocked = false;
      
      switch (skin.unlockType) {
        case 'default':
          unlocked = true;
          break;
        case 'clicks':
          unlocked = Game.state.clickCount >= skin.unlockTarget;
          break;
        case 'total':
          unlocked = Game.state.lifetimeShawarmas >= skin.unlockTarget;
          break;
        case 'buildings':
          unlocked = Game.getTotalBuildings() >= skin.unlockTarget;
          break;
        case 'upgrades':
          var upgCount = 0;
          for (var j = 0; j < Game.state.upgrades.length; j++) {
            if (Game.state.upgrades[j].purchased) upgCount++;
          }
          unlocked = upgCount >= skin.unlockTarget;
          break;
        case 'prestige':
          unlocked = Game.state.prestigeLevel >= skin.unlockTarget;
          break;
        case 'golden':
          unlocked = this.stats.goldenCaught >= skin.unlockTarget;
          break;
      }
      
      if (unlocked) {
        this.unlocked.push(skin.id);
        newUnlocks.push(skin);
      }
    }
    
    // Показываем уведомления о новых скинах
    for (var k = 0; k < newUnlocks.length; k++) {
      var newSkin = newUnlocks[k];
      if (typeof UI !== 'undefined') {
        UI.showAchievementPopup({
          emoji: newSkin.emoji,
          name: 'Новый скин!',
          desc: newSkin.name + ' разблокирован',
          reward: 0
        });
      }
      if (typeof Sounds !== 'undefined') Sounds.achievement();
    }
    
    if (newUnlocks.length > 0) {
      this.save();
    }
    
    return newUnlocks;
  },
  
  // Выбрать скин
  select: function(skinId) {
    if (this.unlocked.indexOf(skinId) !== -1) {
      this.current = skinId;
      this.save();
      this.updateDisplay();
      return true;
    }
    return false;
  },
  
  // Получить текущий скин
  getCurrent: function() {
    for (var i = 0; i < this.list.length; i++) {
      if (this.list[i].id === this.current) {
        return this.list[i];
      }
    }
    return this.list[0];
  },
  
  // Обновить отображение шаурмы
  updateDisplay: function() {
    var btn = document.getElementById('shawarma-btn');
    if (!btn) return;
    
    var skin = this.getCurrent();
    btn.textContent = skin.emoji;
    
    if (skin.customStyle) {
      btn.style.cssText += skin.customStyle;
    } else {
      btn.style.filter = '';
    }
  },
  
  // Уведомление о пойманной золотой шаурме
  onGoldenCaught: function() {
    this.stats.goldenCaught++;
    this.checkUnlocks();
    this.save();
  },
  
  // Сохранение
  save: function() {
    var data = {
      current: this.current,
      unlocked: this.unlocked,
      stats: this.stats
    };
    localStorage.setItem('shawarma_skins', JSON.stringify(data));
  },
  
  // Загрузка
  load: function() {
    try {
      var saved = localStorage.getItem('shawarma_skins');
      if (saved) {
        var data = JSON.parse(saved);
        this.current = data.current || 'default';
        this.unlocked = data.unlocked || ['default'];
        this.stats = data.stats || { goldenCaught: 0 };
      }
    } catch (e) {
      console.error('Ошибка загрузки скинов:', e);
    }
  }
};

console.log('✅ skins.js загружен');
