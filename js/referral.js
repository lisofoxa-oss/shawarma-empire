// Реферальная система с облачной синхронизацией
// js/referral.js

var Referral = {
  // Реферальный код игрока (8 символов)
  myCode: null,
  
  // Код загружен из облака?
  codeFromCloud: false,
  
  // Кто пригласил (код реферера)
  referredBy: null,
  
  // Сколько людей пригласил
  referralCount: 0,
  
  // Получена ли награда за приглашение
  rewardClaimed: false,
  
  // Награды
  rewards: {
    forInviter: 5000,      // Награда пригласившему
    forInvited: 2500,      // Награда приглашённому
    perReferral: 1000,     // Бонус за каждого реферала
    milestones: [          // Вехи
      { count: 5, reward: 10000, emoji: '🥉' },
      { count: 10, reward: 25000, emoji: '🥈' },
      { count: 25, reward: 100000, emoji: '🥇' },
      { count: 50, reward: 500000, emoji: '💎' },
      { count: 100, reward: 2000000, emoji: '👑' }
    ]
  },
  
  // Достигнутые вехи
  claimedMilestones: [],
  
  // Инициализация
  init: function() {
    this.load();
    
    // Пытаемся загрузить код из облака
    this.loadFromCloud();
    
    console.log('✅ Referral система инициализирована');
  },
  
  // Загрузить код из облака
  loadFromCloud: function() {
    var self = this;
    
    if (typeof DB === 'undefined' || !DB.isReady || !DB.userId) {
      // Облако недоступно - генерируем локальный код
      if (!this.myCode) {
        this.generateCode();
      }
      this.checkStartParam();
      return;
    }
    
    // Запрашиваем код из базы
    DB.client
      .from('users')
      .select('referral_code')
      .eq('id', DB.userId)
      .single()
      .then(function(response) {
        if (response.data && response.data.referral_code) {
          // Код уже есть в базе - используем его
          self.myCode = response.data.referral_code;
          self.codeFromCloud = true;
          self.save();
          console.log('📥 Реферальный код загружен из облака:', self.myCode);
        } else {
          // Кода нет в базе - генерируем новый уникальный
          self.generateUniqueCode(function(code) {
            self.myCode = code;
            self.save();
            // Код сохранится в базу при следующем saveUser
            console.log('🆕 Создан новый реферальный код:', self.myCode);
          });
        }
        
        // Проверяем start параметр после загрузки кода
        self.checkStartParam();
        
        // Загружаем статистику рефералов
        self.loadReferralStats();
      })
      .catch(function(err) {
        console.error('Ошибка загрузки реферального кода:', err);
        if (!self.myCode) {
          self.generateCode();
        }
        self.checkStartParam();
      });
  },
  
  // Генерация уникального кода с проверкой в базе
  generateUniqueCode: function(callback) {
    var self = this;
    var code = this.createRandomCode();
    
    if (typeof DB === 'undefined' || !DB.isReady) {
      callback(code);
      return;
    }
    
    // Проверяем что такого кода нет в базе
    DB.client
      .from('users')
      .select('id')
      .eq('referral_code', code)
      .then(function(response) {
        if (response.data && response.data.length > 0) {
          // Код уже существует - генерируем новый
          console.log('⚠️ Код уже существует, генерируем новый...');
          self.generateUniqueCode(callback);
        } else {
          // Код уникален
          callback(code);
        }
      })
      .catch(function() {
        // Ошибка - просто используем сгенерированный код
        callback(code);
      });
  },
  
  // Создать случайный код
  createRandomCode: function() {
    // SH + 8 символов (без похожих: 0/O, 1/I/L)
    var chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    var code = 'SH';
    for (var i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },
  
  // Простая генерация кода (для оффлайн режима)
  generateCode: function() {
    if (this.myCode) return;
    this.myCode = this.createRandomCode();
    this.save();
  },
  
  // Загрузить статистику рефералов из базы
  loadReferralStats: function() {
    var self = this;
    
    if (typeof DB === 'undefined' || !DB.isReady || !this.myCode) {
      return;
    }
    
    // Считаем сколько пользователей имеют наш код как referred_by
    DB.client
      .from('users')
      .select('id', { count: 'exact' })
      .eq('referred_by', this.myCode)
      .then(function(response) {
        if (response.count !== null && response.count !== undefined) {
          var oldCount = self.referralCount;
          self.referralCount = response.count;
          
          // Если появились новые рефералы - даём награду
          if (self.referralCount > oldCount) {
            var newReferrals = self.referralCount - oldCount;
            self.giveReferralReward(newReferrals);
          }
          
          self.save();
          console.log('📊 Рефералов:', self.referralCount);
        }
      })
      .catch(function(err) {
        console.log('Не удалось загрузить статистику рефералов:', err);
      });
  },
  
  // Дать награду за новых рефералов
  giveReferralReward: function(count) {
    var reward = this.rewards.perReferral * count;
    
    if (typeof Game !== 'undefined') {
      Game.state.shawarmas += reward;
      Game.state.totalShawarmas += reward;
      Game.state.lifetimeShawarmas += reward;
    }
    
    if (typeof UI !== 'undefined') {
      UI.showAchievementPopup({
        emoji: '👥',
        name: count + ' новых друзей!',
        desc: 'Спасибо за приглашения',
        reward: reward
      });
    }
    
    // Проверяем вехи
    this.checkMilestones();
  },
  
  // Проверка start параметра из Telegram
  checkStartParam: function() {
    // Уже есть реферер
    if (this.referredBy) return;
    
    try {
      var refCode = null;
      
      // Telegram WebApp передаёт start параметр
      if (typeof Game !== 'undefined' && Game.isTelegram && Game.tg) {
        var initData = Game.tg.initDataUnsafe;
        if (initData && initData.start_param) {
          refCode = initData.start_param;
        }
      }
      
      // Также проверяем URL параметр (для браузера)
      if (!refCode) {
        var urlParams = new URLSearchParams(window.location.search);
        refCode = urlParams.get('ref') || urlParams.get('start');
      }
      
      // Применяем реферальный код
      if (refCode && refCode !== this.myCode && refCode.startsWith('SH')) {
        this.applyReferral(refCode);
      }
    } catch (e) {
      console.log('Referral check error:', e);
    }
  },
  
  // Применить реферальный код
  applyReferral: function(code) {
    if (this.referredBy) return false;
    if (code === this.myCode) return false;
    if (!code.startsWith('SH')) return false;
    
    var self = this;
    
    // Проверяем что такой код существует в базе
    if (typeof DB !== 'undefined' && DB.isReady) {
      DB.client
        .from('users')
        .select('id')
        .eq('referral_code', code)
        .single()
        .then(function(response) {
          if (response.data) {
            // Код существует - применяем
            self.referredBy = code;
            self.rewardClaimed = false;
            self.save();
            self.saveReferredByToCloud(code);
            self.claimInvitedReward();
          } else {
            console.log('⚠️ Реферальный код не найден:', code);
          }
        })
        .catch(function() {
          // Ошибка - всё равно применяем локально
          self.referredBy = code;
          self.save();
          self.claimInvitedReward();
        });
    } else {
      // Оффлайн - просто применяем
      this.referredBy = code;
      this.save();
      this.claimInvitedReward();
    }
    
    return true;
  },
  
  // Сохранить referred_by в облако
  saveReferredByToCloud: function(code) {
    if (typeof DB === 'undefined' || !DB.isReady || !DB.userId) return;
    
    DB.client
      .from('users')
      .update({ referred_by: code })
      .eq('id', DB.userId)
      .then(function() {
        console.log('✅ Реферер сохранён в облако');
      })
      .catch(function(err) {
        console.error('Ошибка сохранения реферера:', err);
      });
  },
  
  // Забрать награду приглашённого
  claimInvitedReward: function() {
    if (this.rewardClaimed || !this.referredBy) return;
    
    this.rewardClaimed = true;
    
    if (typeof Game !== 'undefined') {
      Game.state.shawarmas += this.rewards.forInvited;
      Game.state.totalShawarmas += this.rewards.forInvited;
      Game.state.lifetimeShawarmas += this.rewards.forInvited;
      Game.saveGame();
    }
    
    if (typeof UI !== 'undefined') {
      UI.showAchievementPopup({
        emoji: '🎁',
        name: 'Бонус за приглашение!',
        desc: 'Тебя пригласил друг',
        reward: this.rewards.forInvited
      });
    }
    
    this.save();
  },
  
  // Проверить вехи
  checkMilestones: function() {
    for (var i = 0; i < this.rewards.milestones.length; i++) {
      var milestone = this.rewards.milestones[i];
      
      if (this.referralCount >= milestone.count && 
          this.claimedMilestones.indexOf(milestone.count) === -1) {
        
        this.claimedMilestones.push(milestone.count);
        
        if (typeof Game !== 'undefined') {
          Game.state.shawarmas += milestone.reward;
          Game.state.totalShawarmas += milestone.reward;
          Game.state.lifetimeShawarmas += milestone.reward;
        }
        
        if (typeof UI !== 'undefined') {
          UI.showAchievementPopup({
            emoji: milestone.emoji,
            name: 'Веха рефералов!',
            desc: milestone.count + ' друзей приглашено',
            reward: milestone.reward
          });
        }
      }
    }
    
    this.save();
  },
  
  // Получить ссылку для приглашения
  getInviteLink: function() {
    var botUsername = 'ShawarmaEmpireBot'; // Замени на своего бота
    return 'https://t.me/' + botUsername + '?start=' + this.myCode;
  },
  
  // Получить текст для шаринга
  getShareText: function() {
    return '🌯 Присоединяйся к Империи Шаурмы!\n\n' +
           'Построй свою империю фастфуда!\n' +
           '🎁 Бонус ' + this.rewards.forInvited + ' шаурмы при старте!\n\n' +
           this.getInviteLink();
  },
  
  // Поделиться ссылкой
  share: function() {
    var self = this;
    
    // Telegram share
    if (typeof Game !== 'undefined' && Game.isTelegram && Game.tg) {
      try {
        Game.tg.openTelegramLink('https://t.me/share/url?url=' + 
          encodeURIComponent(this.getInviteLink()) + 
          '&text=' + encodeURIComponent('🌯 Присоединяйся к Империи Шаурмы! Бонус при старте!'));
        return;
      } catch (e) {
        console.log('Telegram share failed:', e);
      }
    }
    
    // Fallback - копируем в буфер
    this.copyToClipboard(this.getShareText());
  },
  
  // Копировать в буфер
  copyToClipboard: function(text) {
    var self = this;
    
    // Пробуем современный API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        self.showCopySuccess();
      }).catch(function() {
        self.fallbackCopy(text);
      });
    } else {
      self.fallbackCopy(text);
    }
  },
  
  // Fallback копирование
  fallbackCopy: function(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
      document.execCommand('copy');
      this.showCopySuccess();
    } catch (e) {
      console.error('Copy failed:', e);
    }
    
    document.body.removeChild(textarea);
  },
  
  // Показать успех копирования
  showCopySuccess: function() {
    if (typeof UI !== 'undefined') {
      UI.showAchievementPopup({
        emoji: '📋',
        name: 'Скопировано!',
        desc: 'Код в буфере обмена',
        reward: 0
      });
    }
  },
  
  // Сохранение в localStorage
  save: function() {
    var data = {
      myCode: this.myCode,
      codeFromCloud: this.codeFromCloud,
      referredBy: this.referredBy,
      referralCount: this.referralCount,
      rewardClaimed: this.rewardClaimed,
      claimedMilestones: this.claimedMilestones
    };
    localStorage.setItem('shawarma_referral', JSON.stringify(data));
  },
  
  // Загрузка из localStorage
  load: function() {
    try {
      var saved = localStorage.getItem('shawarma_referral');
      if (saved) {
        var data = JSON.parse(saved);
        this.myCode = data.myCode || null;
        this.codeFromCloud = data.codeFromCloud || false;
        this.referredBy = data.referredBy || null;
        this.referralCount = data.referralCount || 0;
        this.rewardClaimed = data.rewardClaimed || false;
        this.claimedMilestones = data.claimedMilestones || [];
      }
    } catch (e) {
      console.error('Ошибка загрузки рефералов:', e);
    }
  }
};

console.log('✅ referral.js v2.0 загружен');