// Система сохранения и загрузки игры

const Storage = {
  userId: null,
  
  // Инициализация
  init(userId) {
    this.userId = userId;
  },
  
  // Сохранение игры
  save(gameState) {
    try {
      const saveData = {
        shawarmas: gameState.shawarmas,
        totalShawarmas: gameState.totalShawarmas,
        lifetimeShawarmas: gameState.lifetimeShawarmas,
        perClick: gameState.perClick,
        clickCount: gameState.clickCount,
        prestigeLevel: gameState.prestigeLevel,
        prestigeBonus: gameState.prestigeBonus,
        lastPlayTime: Date.now(),
        dailyStreak: gameState.dailyStreak,
        lastDailyReward: gameState.lastDailyReward,
        buildings: gameState.buildings.map(b => ({ 
          id: b.id, 
          owned: b.owned, 
          cost: b.cost 
        })),
        upgrades: gameState.upgrades.map(u => ({ 
          id: u.id, 
          purchased: u.purchased 
        })),
        achievements: gameState.achievements.map(a => ({ 
          id: a.id, 
          unlocked: a.unlocked 
        }))
      };
      
      localStorage.setItem('shawarma_game_' + this.userId, JSON.stringify(saveData));
      return true;
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      return false;
    }
  },
  
  // Загрузка игры
  load() {
    try {
      const saved = localStorage.getItem('shawarma_game_' + this.userId);
      if (saved) {
        return JSON.parse(saved);
      }
      return null;
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      return null;
    }
  },
  
  // Очистка сохранения (для престижа или сброса)
  clear() {
    try {
      localStorage.removeItem('shawarma_game_' + this.userId);
      return true;
    } catch (error) {
      console.error('Ошибка очистки:', error);
      return false;
    }
  }
};
