// Работа с Supabase базой данных
// js/supabase.js

var DB = {
  client: null,
  userId: null,
  isReady: false,
  lastSyncTime: 0,
  syncInterval: 10000, // Синхронизация каждые 10 секунд
  
  // Инициализация Supabase клиента
  init: function(supabaseUrl, supabaseKey) {
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
      console.log('⚠️ Supabase не настроен, используем только localStorage');
      return false;
    }
    
    try {
      this.client = supabase.createClient(supabaseUrl, supabaseKey);
      this.isReady = true;
      console.log('✅ Supabase подключен');
      return true;
    } catch (e) {
      console.error('❌ Ошибка подключения к Supabase:', e);
      return false;
    }
  },
  
  // Установить ID пользователя
  setUserId: function(id) {
    this.userId = id;
    console.log('👤 User ID:', id);
  },
  
  // Загрузить данные пользователя из базы
  loadUser: function(callback) {
    if (!this.isReady || !this.userId) {
      callback(null);
      return;
    }
    
    var self = this;
    
    this.client
      .from('users')
      .select('*')
      .eq('id', this.userId)
      .single()
      .then(function(response) {
        if (response.error && response.error.code !== 'PGRST116') {
          console.error('❌ Ошибка загрузки пользователя:', response.error);
          callback(null);
          return;
        }
        
        if (response.data) {
          console.log('📂 Данные загружены из облака');
          // Загружаем здания и улучшения
          self.loadUserBuildings(function(buildings) {
            self.loadUserUpgrades(function(upgrades) {
              self.loadUserAchievements(function(achievements) {
                response.data.buildings = buildings;
                response.data.upgrades = upgrades;
                response.data.achievements = achievements;
                callback(response.data);
              });
            });
          });
        } else {
          console.log('🆕 Новый пользователь');
          callback(null);
        }
      })
      .catch(function(err) {
        console.error('❌ Ошибка:', err);
        callback(null);
      });
  },
  
  // Загрузить здания пользователя
  loadUserBuildings: function(callback) {
    if (!this.isReady || !this.userId) {
      callback([]);
      return;
    }
    
    this.client
      .from('user_buildings')
      .select('building_id, owned')
      .eq('user_id', this.userId)
      .then(function(response) {
        callback(response.data || []);
      })
      .catch(function() {
        callback([]);
      });
  },
  
  // Загрузить улучшения пользователя
  loadUserUpgrades: function(callback) {
    if (!this.isReady || !this.userId) {
      callback([]);
      return;
    }
    
    this.client
      .from('user_upgrades')
      .select('upgrade_id, purchased')
      .eq('user_id', this.userId)
      .then(function(response) {
        callback(response.data || []);
      })
      .catch(function() {
        callback([]);
      });
  },
  
  // Загрузить достижения пользователя
  loadUserAchievements: function(callback) {
    if (!this.isReady || !this.userId) {
      callback([]);
      return;
    }
    
    this.client
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', this.userId)
      .then(function(response) {
        callback(response.data || []);
      })
      .catch(function() {
        callback([]);
      });
  },
  
  // Сохранить/обновить пользователя
  saveUser: function(gameState, userInfo, callback) {
    if (!this.isReady || !this.userId) {
      if (callback) callback(false);
      return;
    }
    
    var self = this;
    var userData = {
      id: this.userId,
      username: userInfo.username || null,
      first_name: userInfo.firstName || null,
      shawarmas: Math.floor(gameState.shawarmas),
      total_shawarmas: Math.floor(gameState.totalShawarmas),
      lifetime_shawarmas: Math.floor(gameState.lifetimeShawarmas),
      per_click: Math.floor(gameState.perClick),
      click_count: gameState.clickCount,
      prestige_level: gameState.prestigeLevel,
      prestige_bonus: gameState.prestigeBonus,
      daily_streak: gameState.dailyStreak,
      last_daily_reward: gameState.lastDailyReward ? new Date(gameState.lastDailyReward).toISOString() : null,
      last_play_time: new Date().toISOString()
    };
    
    this.client
      .from('users')
      .upsert(userData, { onConflict: 'id' })
      .then(function(response) {
        if (response.error) {
          console.error('❌ Ошибка сохранения пользователя:', response.error);
          if (callback) callback(false);
          return;
        }
        
        // Сохраняем здания
        self.saveBuildings(gameState.buildings, function() {
          // Сохраняем улучшения
          self.saveUpgrades(gameState.upgrades, function() {
            // Сохраняем достижения
            self.saveAchievements(gameState.achievements, function() {
              self.lastSyncTime = Date.now();
              if (callback) callback(true);
            });
          });
        });
      })
      .catch(function(err) {
        console.error('❌ Ошибка:', err);
        if (callback) callback(false);
      });
  },
  
  // Сохранить здания
  saveBuildings: function(buildings, callback) {
    if (!this.isReady || !this.userId || !buildings) {
      if (callback) callback();
      return;
    }
    
    var self = this;
    var buildingsData = [];
    
    for (var i = 0; i < buildings.length; i++) {
      if (buildings[i].owned > 0) {
        buildingsData.push({
          user_id: this.userId,
          building_id: buildings[i].id,
          owned: buildings[i].owned
        });
      }
    }
    
    if (buildingsData.length === 0) {
      if (callback) callback();
      return;
    }
    
    this.client
      .from('user_buildings')
      .upsert(buildingsData, { onConflict: 'user_id,building_id' })
      .then(function() {
        if (callback) callback();
      })
      .catch(function() {
        if (callback) callback();
      });
  },
  
  // Сохранить улучшения
  saveUpgrades: function(upgrades, callback) {
    if (!this.isReady || !this.userId || !upgrades) {
      if (callback) callback();
      return;
    }
    
    var upgradesData = [];
    
    for (var i = 0; i < upgrades.length; i++) {
      if (upgrades[i].purchased) {
        upgradesData.push({
          user_id: this.userId,
          upgrade_id: upgrades[i].id,
          purchased: true
        });
      }
    }
    
    if (upgradesData.length === 0) {
      if (callback) callback();
      return;
    }
    
    this.client
      .from('user_upgrades')
      .upsert(upgradesData, { onConflict: 'user_id,upgrade_id' })
      .then(function() {
        if (callback) callback();
      })
      .catch(function() {
        if (callback) callback();
      });
  },
  
  // Сохранить достижения
  saveAchievements: function(achievements, callback) {
    if (!this.isReady || !this.userId || !achievements) {
      if (callback) callback();
      return;
    }
    
    var achievementsData = [];
    
    for (var i = 0; i < achievements.length; i++) {
      if (achievements[i].unlocked) {
        achievementsData.push({
          user_id: this.userId,
          achievement_id: achievements[i].id
        });
      }
    }
    
    if (achievementsData.length === 0) {
      if (callback) callback();
      return;
    }
    
    this.client
      .from('user_achievements')
      .upsert(achievementsData, { onConflict: 'user_id,achievement_id' })
      .then(function() {
        if (callback) callback();
      })
      .catch(function() {
        if (callback) callback();
      });
  },
  
  // Получить лидерборд
  getLeaderboard: function(limit, callback) {
    if (!this.isReady) {
      callback([]);
      return;
    }
    
    this.client
      .from('leaderboard')
      .select('user_id, username, first_name, lifetime_shawarmas, prestige_level')
      .order('lifetime_shawarmas', { ascending: false })
      .limit(limit || 10)
      .then(function(response) {
        callback(response.data || []);
      })
      .catch(function() {
        callback([]);
      });
  },
  
  // Сброс данных при престиже
  resetForPrestige: function(callback) {
    if (!this.isReady || !this.userId) {
      if (callback) callback();
      return;
    }
    
    var self = this;
    
    // Удаляем здания
    this.client
      .from('user_buildings')
      .delete()
      .eq('user_id', this.userId)
      .then(function() {
        // Удаляем улучшения
        self.client
          .from('user_upgrades')
          .delete()
          .eq('user_id', self.userId)
          .then(function() {
            if (callback) callback();
          });
      })
      .catch(function() {
        if (callback) callback();
      });
  }
};

console.log('✅ supabase.js загружен');
