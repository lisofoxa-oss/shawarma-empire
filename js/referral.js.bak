// Реферальная система
// js/referral.js

var Referral = {
  // Реферальный код игрока
  myCode: null,
  
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
    this.generateCode();
    this.checkStartParam();
    console.log('✅ Referral система инициализирована');
  },
  
  // Генерация уникального кода
  generateCode: function() {
    if (this.myCode) return;
    
    // Используем Telegram ID если есть
    if (typeof Game !== 'undefined' && Game.userInfo && Game.userInfo.id) {
      this.myCode = 'SH' + Game.userInfo.id;
    } else {
      // Генерируем случайный код
      var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      this.myCode = 'SH';
      for (var i = 0; i < 6; i++) {
        this.myCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    this.save();
  },
  
  // Проверка start параметра из Telegram
  checkStartParam: function() {
    // Уже есть реферер
    if (this.referredBy) return;
    
    try {
      // Telegram WebApp передаёт start параметр
      if (typeof Game !== 'undefined' && Game.isTelegram && Game.tg) {
        var initData = Game.tg.initDataUnsafe;
        if (initData && initData.start_param) {
          var refCode = initData.start_param;
          // Не своя ссылка
          if (refCode !== this.myCode && refCode.startsWith('SH')) {
            this.applyReferral(refCode);
          }
        }
      }
      
      // Также проверяем URL параметр (для браузера)
      var urlParams = new URLSearchParams(window.location.search);
      var refFromUrl = urlParams.get('ref') || urlParams.get('start');
      if (refFromUrl && !this.referredBy && refFromUrl !== this.myCode) {
        this.applyReferral(refFromUrl);
      }
    } catch (e) {
      console.log('Referral check error:', e);
    }
  },
  
  // Применить реферальный код
  applyReferral: function(code) {
    if (this.referredBy) return false;
    if (code === this.myCode) return false;
    
    this.referredBy = code;
    this.rewardClaimed = false;
    this.save();
    
    // Даём награду приглашённому
    this.claimInvitedReward();
    
    // Уведомляем сервер (если есть облако)
    this.notifyServer(code);
    
    return true;
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
  
  // Уведомить сервер о реферале
  notifyServer: function(inviterCode) {
    // Если есть Supabase - записываем реферал
    if (typeof DB !== 'undefined' && DB.isReady) {
      // Можно добавить запись в БД
      console.log('Referral recorded:', inviterCode, '->', this.myCode);
    }
  },
  
  // Добавить реферала (вызывается когда кто-то использовал твой код)
  addReferral: function() {
    this.referralCount++;
    
    // Награда за реферала
    if (typeof Game !== 'undefined') {
      Game.state.shawarmas += this.rewards.perReferral;
      Game.state.totalShawarmas += this.rewards.perReferral;
      Game.state.lifetimeShawarmas += this.rewards.perReferral;
    }
    
    // Проверяем вехи
    this.checkMilestones();
    
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
  },
  
  // Получить ссылку для приглашения
  getInviteLink: function() {
    // Для Telegram бота
    var botUsername = 'ShawarmaEmpireBot'; // Замени на свой
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
    var text = this.getShareText();
    
    // Telegram share
    if (typeof Game !== 'undefined' && Game.isTelegram && Game.tg) {
      try {
        Game.tg.openTelegramLink('https://t.me/share/url?url=' + 
          encodeURIComponent(this.getInviteLink()) + 
          '&text=' + encodeURIComponent('🌯 Присоединяйся к Империи Шаурмы! Бонус при старте!'));
        return;
      } catch (e) {}
    }
    
    // Fallback - копируем в буфер
    this.copyToClipboard(text);
  },
  
  // Копировать в буфер
  copyToClipboard: function(text) {
    try {
      navigator.clipboard.writeText(text).then(function() {
        if (typeof UI !== 'undefined') {
          UI.showAchievementPopup({
            emoji: '📋',
            name: 'Скопировано!',
            desc: 'Ссылка в буфере обмена',
            reward: 0
          });
        }
      });
    } catch (e) {
      // Fallback для старых браузеров
      var textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (typeof UI !== 'undefined') {
        UI.showAchievementPopup({
          emoji: '📋',
          name: 'Скопировано!',
          desc: 'Ссылка в буфере обмена',
          reward: 0
        });
      }
    }
  },
  
  // Сохранение
  save: function() {
    var data = {
      myCode: this.myCode,
      referredBy: this.referredBy,
      referralCount: this.referralCount,
      rewardClaimed: this.rewardClaimed,
      claimedMilestones: this.claimedMilestones
    };
    localStorage.setItem('shawarma_referral', JSON.stringify(data));
  },
  
  // Загрузка
  load: function() {
    try {
      var saved = localStorage.getItem('shawarma_referral');
      if (saved) {
        var data = JSON.parse(saved);
        this.myCode = data.myCode || null;
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

console.log('✅ referral.js загружен');
