// Система сохранения и загрузки игры
// Переименовано в GameStorage чтобы не конфликтовать с браузерным Storage API

var GameStorage = {
  userId: null,
  storageKey: 'shawarma_game_',
  
  // Инициализация
  init: function(userId) {
    this.userId = userId || 'default';
    console.log('✅ GameStorage инициализирован для пользователя:', this.userId);
  },
  
  // Получить ключ хранилища
  getKey: function() {
    return this.storageKey + this.userId;
  },
  
  // Проверка доступности localStorage
  isAvailable: function() {
    try {
      var test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },
  
  // Сохранение игры
  save: function(gameState) {
    if (!this.isAvailable()) {
      console.warn('⚠️ localStorage недоступен');
      return false;
    }
    
    try {
      var saveData = {
        shawarmas: gameState.shawarmas || 0,
        totalShawarmas: gameState.totalShawarmas || 0,
        lifetimeShawarmas: gameState.lifetimeShawarmas || 0,
        perClick: gameState.perClick || 1,
        clickCount: gameState.clickCount || 0,
        prestigeLevel: gameState.prestigeLevel || 0,
        prestigeBonus: gameState.prestigeBonus || 1,
        lastPlayTime: Date.now(),
        dailyStreak: gameState.dailyStreak || 0,
        lastDailyReward: gameState.lastDailyReward || 0,
        buildings: [],
        upgrades: [],
        achievements: []
      };
      
      // Сохраняем здания
      if (gameState.buildings && gameState.buildings.length) {
        for (var i = 0; i < gameState.buildings.length; i++) {
          var b = gameState.buildings[i];
          saveData.buildings.push({ 
            id: b.id, 
            owned: b.owned, 
            cost: b.cost 
          });
        }
      }
      
      // Сохраняем улучшения
      if (gameState.upgrades && gameState.upgrades.length) {
        for (var j = 0; j < gameState.upgrades.length; j++) {
          var u = gameState.upgrades[j];
          saveData.upgrades.push({ 
            id: u.id, 
            purchased: u.purchased 
          });
        }
      }
      
      // Сохраняем достижения
      if (gameState.achievements && gameState.achievements.length) {
        for (var k = 0; k < gameState.achievements.length; k++) {
          var a = gameState.achievements[k];
          saveData.achievements.push({ 
            id: a.id, 
            unlocked: a.unlocked 
          });
        }
      }
      
      localStorage.setItem(this.getKey(), JSON.stringify(saveData));
      return true;
    } catch (error) {
      console.error('❌ Ошибка сохранения:', error);
      return false;
    }
  },
  
  // Загрузка игры
  load: function() {
    if (!this.isAvailable()) {
      console.warn('⚠️ localStorage недоступен');
      return null;
    }
    
    try {
      var saved = localStorage.getItem(this.getKey());
      if (saved) {
        return JSON.parse(saved);
      }
      return null;
    } catch (error) {
      console.error('❌ Ошибка загрузки:', error);
      return null;
    }
  },
  
  // Очистка сохранения
  clear: function() {
    if (!this.isAvailable()) {
      return false;
    }
    
    try {
      localStorage.removeItem(this.getKey());
      return true;
    } catch (error) {
      console.error('❌ Ошибка очистки:', error);
      return false;
    }
  }
};

// Алиас для совместимости (если где-то использовался Storage)
var Storage = GameStorage;

console.log('✅ storage.js загружен');
