// Отрисовка интерфейса v3.0 с темами
// js/ui.js

var UI = {
  isInitialized: false,
  buyMode: 1,
  currentTheme: 'dark',
  
  // Инициализация темы
  initTheme: function() {
    var saved = localStorage.getItem('shawarma_theme');
    if (saved) {
      this.currentTheme = saved;
    }
    document.documentElement.setAttribute('data-theme', this.currentTheme);
  },
  
  // Переключение темы
  setTheme: function(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('shawarma_theme', theme);
    this.render(true);
  },
  
  // Форматирование чисел
  formatNumber: function(num) {
    if (num === undefined || num === null || isNaN(num)) return '0';
    if (num < 0) return '-' + this.formatNumber(-num);
    
    var suffixes = [
      { value: 1e33, suffix: 'D' },
      { value: 1e30, suffix: 'N' },
      { value: 1e27, suffix: 'Oc' },
      { value: 1e24, suffix: 'Sp' },
      { value: 1e21, suffix: 'Sx' },
      { value: 1e18, suffix: 'Qi' },
      { value: 1e15, suffix: 'Qa' },
      { value: 1e12, suffix: 'T' },
      { value: 1e9, suffix: 'B' },
      { value: 1e6, suffix: 'M' },
      { value: 1e3, suffix: 'K' }
    ];
    
    for (var i = 0; i < suffixes.length; i++) {
      if (num >= suffixes[i].value) {
        var formatted = num / suffixes[i].value;
        if (formatted >= 100) return Math.floor(formatted) + suffixes[i].suffix;
        if (formatted >= 10) return formatted.toFixed(1).replace(/\.0$/, '') + suffixes[i].suffix;
        return formatted.toFixed(2).replace(/\.?0+$/, '') + suffixes[i].suffix;
      }
    }
    
    if (num < 1 && num > 0) return num.toFixed(1);
    return Math.floor(num).toString();
  },
  
  // Обновление счётчиков без перерисовки
  updateCounters: function() {
    var state = Game.state;
    var el;
    
    el = document.getElementById('counter-shawarmas');
    if (el) el.textContent = this.formatNumber(state.shawarmas);
    
    el = document.getElementById('counter-perclick');
    if (el) el.textContent = '+' + this.formatNumber(state.perClick);
    
    el = document.getElementById('counter-persecond');
    if (el) el.textContent = '+' + this.formatNumber(state.perSecond) + '/с';
    
    el = document.getElementById('counter-total');
    if (el) el.textContent = this.formatNumber(state.totalShawarmas);
    
    el = document.getElementById('counter-clicks');
    if (el) el.textContent = state.clickCount;
  },
  
  // Принудительное обновление контента вкладки
  forceUpdateTab: function() {
    var tabContent = document.getElementById('tab-content');
    if (!tabContent) return;
    
    var state = Game.state;
    if (state.currentTab === 'buildings') tabContent.innerHTML = this.renderBuildings();
    else if (state.currentTab === 'upgrades') tabContent.innerHTML = this.renderUpgrades();
    else if (state.currentTab === 'achievements') tabContent.innerHTML = this.renderAchievements();
    else if (state.currentTab === 'orders') tabContent.innerHTML = this.renderOrders();
  },
  
  // Показать всплывающее число
  showFloatingNumber: function(x, y, value, text) {
    var div = document.createElement('div');
    div.className = 'float-number';
    div.textContent = (text || '+') + this.formatNumber(value);
    div.style.left = x + 'px';
    div.style.top = y + 'px';
    document.body.appendChild(div);
    setTimeout(function() { div.remove(); }, 1000);
  },
  
  // Создать частицы
  createParticles: function(x, y, count, emoji) {
    emoji = emoji || '🌯';
    var container = document.getElementById('particles-container');
    if (!container) return;
    
    for (var i = 0; i < count; i++) {
      var particle = document.createElement('div');
      particle.style.cssText = 'position:fixed;font-size:1.5rem;pointer-events:none;z-index:1000;' +
        'left:' + x + 'px;top:' + y + 'px;';
      particle.textContent = emoji;
      
      var angle = (Math.PI * 2 * i) / count;
      var dist = 40 + Math.random() * 40;
      var tx = Math.cos(angle) * dist;
      var ty = Math.sin(angle) * dist;
      
      particle.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: 'translate(' + tx + 'px,' + ty + 'px) scale(0)', opacity: 0 }
      ], { duration: 600, easing: 'ease-out' });
      
      container.appendChild(particle);
      setTimeout(function(p) { return function() { p.remove(); }; }(particle), 600);
    }
  },
  
  // Показать попап достижения
  showAchievementPopup: function(ach) {
    var container = document.getElementById('achievements-container');
    if (!container) return;
    
    var div = document.createElement('div');
    div.className = 'achievement-popup';
    div.innerHTML = 
      '<div style="font-weight:700;font-size:1rem;">' + (ach.emoji || '🏆') + ' ' + ach.name + '</div>' +
      '<div style="font-size:0.8rem;opacity:0.9;margin-top:4px;">' + ach.desc + '</div>' +
      (ach.reward > 0 ? '<div style="font-size:0.85rem;font-weight:700;margin-top:4px;">+' + this.formatNumber(ach.reward) + ' 🌯</div>' : '');
    
    container.appendChild(div);
    
    setTimeout(function() {
      div.style.opacity = '0';
      div.style.transition = 'opacity 0.3s';
      setTimeout(function() { div.remove(); }, 300);
    }, 3000);
  },
  
  // Показать модалку мини-игр
  showMinigamesMenu: function() {
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'minigames-modal';
    modal.innerHTML = 
      '<div class="modal-content">' +
        '<div class="modal-title">🎮 Мини-игры</div>' +
        '<div class="minigames-menu">' +
          '<div class="minigame-card" data-action="start-slicer">' +
            '<div class="minigame-icon">🔪</div>' +
            '<div class="minigame-name">Слайсер</div>' +
            '<div class="minigame-desc">Режь ингредиенты!</div>' +
          '</div>' +
          '<div class="minigame-card" data-action="show-skins">' +
            '<div class="minigame-icon">🎨</div>' +
            '<div class="minigame-name">Скины</div>' +
            '<div class="minigame-desc">Коллекция шаурм</div>' +
          '</div>' +
          '<div class="minigame-card" data-action="show-challenges">' +
            '<div class="minigame-icon">📋</div>' +
            '<div class="minigame-name">Челленджи</div>' +
            '<div class="minigame-desc">Ежедневные задания</div>' +
          '</div>' +
          '<div class="minigame-card" style="opacity:0.5;">' +
            '<div class="minigame-icon">🎰</div>' +
            '<div class="minigame-name">Скоро</div>' +
            '<div class="minigame-desc">В разработке</div>' +
          '</div>' +
        '</div>' +
        '<button class="modal-btn secondary" data-action="close-modal">Закрыть</button>' +
      '</div>';
    
    document.body.appendChild(modal);
    var self = this;
    modal.onclick = function(e) {
      if (e.target === modal || e.target.dataset.action === 'close-modal') {
        modal.remove();
      }
      if (e.target.closest('[data-action="start-slicer"]')) {
        modal.remove();
        if (typeof Slicer !== 'undefined') Slicer.start();
      }
      if (e.target.closest('[data-action="show-skins"]')) {
        modal.remove();
        self.showSkinsMenu();
      }
      if (e.target.closest('[data-action="show-challenges"]')) {
        modal.remove();
        self.showChallengesMenu();
      }
    };
  },
  
  // Показать меню скинов
  showSkinsMenu: function() {
    var self = this;
    if (typeof Skins === 'undefined') return;
    
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'skins-modal';
    
    var html = '<div class="modal-content" style="max-height:80vh;overflow-y:auto;">' +
      '<div class="modal-title">🎨 Коллекция скинов</div>' +
      '<div style="text-align:center;margin-bottom:12px;color:var(--text-secondary);font-size:0.85rem;">' +
        'Разблокировано: ' + Skins.unlocked.length + ' / ' + Skins.list.length +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">';
    
    for (var i = 0; i < Skins.list.length; i++) {
      var skin = Skins.list[i];
      var isUnlocked = Skins.unlocked.indexOf(skin.id) !== -1;
      var isCurrent = Skins.current === skin.id;
      
      var cardStyle = isUnlocked 
        ? (isCurrent ? 'border:2px solid var(--primary);background:rgba(255,107,53,0.15);' : 'border:1px solid var(--border-color);cursor:pointer;')
        : 'border:1px solid var(--border-color);opacity:0.4;cursor:pointer;';
      
      html += '<div class="skin-card" data-skin="' + skin.id + '" style="padding:8px;border-radius:10px;text-align:center;background:var(--bg-card);overflow:hidden;' + cardStyle + '">' +
        '<div style="font-size:2rem;">' + (isUnlocked ? skin.emoji : '🔒') + '</div>' +
        '<div style="font-size:0.7rem;font-weight:700;margin-top:2px;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + skin.name + '</div>' +
        (isCurrent ? '<div style="font-size:0.55rem;color:var(--primary);margin-top:2px;">✓</div>' : '') +
      '</div>';
    }
    
    html += '</div><button class="modal-btn secondary" data-action="close-modal" style="margin-top:12px;">Закрыть</button></div>';
    
    modal.innerHTML = html;
    document.body.appendChild(modal);
    
    modal.onclick = function(e) {
      if (e.target === modal || e.target.dataset.action === 'close-modal') {
        modal.remove();
      }
      var skinCard = e.target.closest('.skin-card');
      if (skinCard && skinCard.dataset.skin) {
        modal.remove();
        self.showSkinDetails(skinCard.dataset.skin);
      }
    };
  },
  
  // Показать детали скина
  showSkinDetails: function(skinId) {
    var self = this;
    var skin = null;
    for (var i = 0; i < Skins.list.length; i++) {
      if (Skins.list[i].id === skinId) {
        skin = Skins.list[i];
        break;
      }
    }
    if (!skin) return;
    
    var isUnlocked = Skins.unlocked.indexOf(skin.id) !== -1;
    var isCurrent = Skins.current === skin.id;
    
    // Прогресс разблокировки
    var progress = 0;
    var target = skin.unlockTarget || 0;
    var progressText = '';
    
    if (!isUnlocked && skin.unlockType !== 'default') {
      switch (skin.unlockType) {
        case 'clicks':
          progress = Game.state.clickCount;
          progressText = this.formatNumber(progress) + ' / ' + this.formatNumber(target) + ' кликов';
          break;
        case 'total':
          progress = Game.state.lifetimeShawarmas;
          progressText = this.formatNumber(progress) + ' / ' + this.formatNumber(target) + ' шаурмы';
          break;
        case 'buildings':
          progress = Game.getTotalBuildings();
          progressText = progress + ' / ' + target + ' зданий';
          break;
        case 'upgrades':
          var upgCount = 0;
          for (var j = 0; j < Game.state.upgrades.length; j++) {
            if (Game.state.upgrades[j].purchased) upgCount++;
          }
          progress = upgCount;
          progressText = progress + ' / ' + target + ' улучшений';
          break;
        case 'prestige':
          progress = Game.state.prestigeLevel;
          progressText = progress + ' / ' + target + ' престиж';
          break;
        case 'golden':
          progress = Skins.stats.goldenCaught;
          progressText = progress + ' / ' + target + ' золотых';
          break;
      }
    }
    
    var pct = target > 0 ? Math.min((progress / target) * 100, 100) : 100;
    
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'skin-detail-modal';
    
    var btnHtml = '';
    if (isUnlocked && !isCurrent) {
      btnHtml = '<button class="modal-btn primary" data-action="select-skin">Выбрать</button>';
    } else if (isCurrent) {
      btnHtml = '<div style="text-align:center;color:var(--success);font-weight:700;padding:12px;">✓ Используется</div>';
    } else {
      btnHtml = '<div style="margin-bottom:12px;">' +
        '<div class="progress-bar" style="height:8px;"><div class="progress-fill" style="width:' + pct + '%;"></div></div>' +
        '<div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;text-align:center;">' + progressText + '</div>' +
      '</div>';
    }
    
    modal.innerHTML = 
      '<div class="modal-content" style="text-align:center;">' +
        '<div style="font-size:5rem;margin-bottom:8px;">' + (isUnlocked ? skin.emoji : '🔒') + '</div>' +
        '<div class="modal-title" style="margin-bottom:4px;">' + skin.name + '</div>' +
        '<div style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:12px;">' + skin.desc + '</div>' +
        '<div style="background:var(--bg-card);border-radius:10px;padding:12px;margin-bottom:12px;">' +
          '<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px;">Как получить:</div>' +
          '<div style="font-size:0.9rem;color:' + (isUnlocked ? 'var(--success)' : 'var(--text-primary)') + ';font-weight:600;">' + 
            (isUnlocked ? '✅ ' : '🎯 ') + skin.unlockDesc + 
          '</div>' +
        '</div>' +
        btnHtml +
        '<button class="modal-btn secondary" data-action="back-to-skins">← Назад к коллекции</button>' +
      '</div>';
    
    document.body.appendChild(modal);
    
    modal.onclick = function(e) {
      if (e.target === modal) {
        modal.remove();
        self.showSkinsMenu();
      }
      if (e.target.dataset.action === 'back-to-skins') {
        modal.remove();
        self.showSkinsMenu();
      }
      if (e.target.dataset.action === 'select-skin') {
        Skins.select(skinId);
        modal.remove();
        self.showSkinsMenu();
      }
    };
  },
  
  // Показать меню челленджей
  showChallengesMenu: function() {
    var self = this;
    if (typeof Challenges === 'undefined') return;
    
    Challenges.checkNewDay();
    
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'challenges-modal';
    
    var timeToReset = Challenges.getTimeToReset();
    var hours = Math.floor(timeToReset / 3600000);
    var minutes = Math.floor((timeToReset % 3600000) / 60000);
    
    var html = '<div class="modal-content">' +
      '<div class="modal-title">📋 Ежедневные челленджи</div>' +
      '<div style="text-align:center;margin-bottom:12px;">' +
        '<span class="timer-badge">Обновление через <span class="time">' + hours + 'ч ' + minutes + 'м</span></span>' +
      '</div>';
    
    if (Challenges.daily.length === 0) {
      html += '<div style="text-align:center;padding:20px;color:var(--text-secondary);">Загрузка челленджей...</div>';
    } else {
      for (var i = 0; i < Challenges.daily.length; i++) {
        var ch = Challenges.daily[i];
        var progress = Challenges.getProgress(ch);
        var isCompleted = progress >= ch.target;
        var pct = Math.min((progress / ch.target) * 100, 100);
        
        var cardBg = ch.claimed ? 'rgba(34,197,94,0.1)' : (isCompleted ? 'rgba(255,215,0,0.1)' : 'var(--bg-card)');
        var cardBorder = ch.claimed ? 'var(--success)' : (isCompleted ? 'var(--secondary)' : 'var(--border-color)');
        
        html += '<div class="challenge-card" style="padding:12px;margin-bottom:8px;border-radius:12px;background:' + cardBg + ';border:1px solid ' + cardBorder + ';">' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<div style="font-size:2rem;">' + ch.icon + '</div>' +
            '<div style="flex:1;">' +
              '<div style="font-weight:700;color:var(--text-primary);">' + ch.name + '</div>' +
              '<div style="font-size:0.8rem;color:var(--text-secondary);">' + ch.desc + '</div>' +
              '<div style="font-size:0.75rem;color:var(--secondary);margin-top:2px;">🎁 +' + self.formatNumber(ch.reward) + '</div>' +
            '</div>' +
          '</div>';
        
        if (ch.claimed) {
          html += '<div style="text-align:center;margin-top:8px;color:var(--success);font-weight:700;font-size:0.85rem;">✓ Выполнено!</div>';
        } else if (isCompleted) {
          html += '<button class="claim-btn" data-challenge="' + ch.id + '" style="margin-top:8px;">Забрать награду!</button>';
        } else {
          html += '<div class="progress-bar" style="margin-top:8px;"><div class="progress-fill" style="width:' + pct + '%;"></div></div>' +
            '<div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;">' + self.formatNumber(progress) + ' / ' + self.formatNumber(ch.target) + '</div>';
        }
        
        html += '</div>';
      }
    }
    
    html += '<button class="modal-btn secondary" data-action="close-modal">Закрыть</button></div>';
    
    modal.innerHTML = html;
    document.body.appendChild(modal);
    
    modal.onclick = function(e) {
      if (e.target === modal || e.target.dataset.action === 'close-modal') {
        modal.remove();
      }
      var claimBtn = e.target.closest('[data-challenge]');
      if (claimBtn) {
        Challenges.claimReward(claimBtn.dataset.challenge);
        modal.remove();
        self.showChallengesMenu(); // Перезагрузить
      }
    };
  },
  
  // Показать лидерборд
  showLeaderboard: function() {
    var self = this;
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'leaderboard-modal';
    modal.innerHTML = 
      '<div class="modal-content leaderboard-modal">' +
        '<div class="modal-title">🏆 Топ игроков</div>' +
        '<div id="leaderboard-list" style="text-align:center;padding:20px;color:var(--text-secondary);">Загрузка...</div>' +
        '<button class="modal-btn secondary" data-action="close-modal">Закрыть</button>' +
      '</div>';
    
    document.body.appendChild(modal);
    
    // Загружаем данные
    if (typeof DB !== 'undefined' && DB.isReady) {
      DB.getLeaderboard(20, function(data) {
        var list = document.getElementById('leaderboard-list');
        if (!list) return;
        
        if (!data || data.length === 0) {
          list.innerHTML = '<div style="padding:20px;color:var(--text-secondary);">Пока нет игроков в рейтинге.<br><span style="font-size:0.8rem;">Играй и попади в топ!</span></div>';
          return;
        }
        
        var html = '';
        for (var i = 0; i < data.length; i++) {
          var player = data[i];
          var rankClass = i === 0 ? 'gold' : (i === 1 ? 'silver' : (i === 2 ? 'bronze' : ''));
          var name = player.first_name || player.username || 'Игрок #' + (player.user_id ? player.user_id.toString().slice(-4) : '???');
          html += '<div class="leaderboard-item">' +
            '<div class="leaderboard-rank ' + rankClass + '">' + (i + 1) + '</div>' +
            '<div class="leaderboard-name">' + name + '</div>' +
            '<div class="leaderboard-score">' + self.formatNumber(player.lifetime_shawarmas || 0) + '</div>' +
          '</div>';
        }
        list.innerHTML = html;
      });
    } else {
      // DB не готов
      var list = document.getElementById('leaderboard-list');
      if (list) {
        list.innerHTML = '<div style="padding:20px;color:var(--text-secondary);">Рейтинг недоступен.<br><span style="font-size:0.8rem;">Облачные сохранения отключены.</span></div>';
      }
    }
    
    modal.onclick = function(e) {
      if (e.target === modal || e.target.dataset.action === 'close-modal') {
        modal.remove();
      }
    };
  },
  
  // Основная отрисовка
  render: function(force) {
    if (this.isInitialized && !force) {
      this.updateCounters();
      return;
    }
    this.isInitialized = true;
    this.initTheme();
    
    var state = Game.state;
    var unlocked = 0;
    for (var i = 0; i < state.achievements.length; i++) {
      if (state.achievements[i].unlocked) unlocked++;
    }
    
    var canPrestige = state.totalShawarmas >= 10000000; // Повышено до 10M
    var cloud = Game.cloudSaveEnabled ? '☁️' : '💾';
    
    var tabContent = '';
    if (state.currentTab === 'buildings') tabContent = this.renderBuildings();
    else if (state.currentTab === 'upgrades') tabContent = this.renderUpgrades();
    else if (state.currentTab === 'achievements') tabContent = this.renderAchievements();
    else if (state.currentTab === 'orders') tabContent = this.renderOrders();
    
    var readyOrders = 0;
    if (typeof Orders !== 'undefined') {
      for (var o = 0; o < Orders.activeOrders.length; o++) {
        if (Orders.activeOrders[o].completed) readyOrders++;
      }
    }
    
    var self = this;
    var tabCls = function(t) {
      return state.currentTab === t ? 'tab-btn active' : 'tab-btn';
    };
    
    // Частицы фона
    var particles = '';
    for (var p = 0; p < 12; p++) {
      particles += '<div class="bg-particle" style="left:' + (Math.random()*100) + '%;animation-delay:-' + (Math.random()*25) + 's;"></div>';
    }
    
    var html = 
      '<div class="game-bg">' + particles + '</div>' +
      '<div style="position:relative;z-index:10;min-height:100vh;padding-bottom:80px;">' +
        
        // Шапка
        '<header class="game-header">' +
          '<div class="header-row">' +
            '<h1 class="header-title">' +
              '<span class="emoji">🌯</span>' +
              '<span class="text">Империя Шаурмы</span>' +
            '</h1>' +
            '<div class="header-btns">' +
              '<span class="cloud-badge">' + cloud + '</span>' +
              '<button data-action="open-minigames" class="header-btn" title="Мини-игры">🎮</button>' +
              (Game.cloudSaveEnabled ? '<button data-action="show-leaderboard" class="header-btn" title="Лидерборд">🏆</button>' : '') +
              (canPrestige ? '<button data-action="open-prestige" class="header-btn golden" title="Престиж">⭐</button>' : '') +
              '<button data-action="show-settings" class="header-btn" title="Настройки">⚙️</button>' +
            '</div>' +
          '</div>' +
          '<div class="stats-grid">' +
            '<div class="stat-card">' +
              '<div id="counter-shawarmas" class="stat-value">' + this.formatNumber(state.shawarmas) + '</div>' +
              '<div class="stat-label">Шаурмы</div>' +
            '</div>' +
            '<div class="stat-card">' +
              '<div id="counter-perclick" class="stat-value">+' + this.formatNumber(state.perClick) + '</div>' +
              '<div class="stat-label">За клик</div>' +
            '</div>' +
            '<div class="stat-card">' +
              '<div id="counter-persecond" class="stat-value">+' + this.formatNumber(state.perSecond) + '/с</div>' +
              '<div class="stat-label">В секунду</div>' +
            '</div>' +
          '</div>' +
          (state.prestigeLevel > 0 ? '<div style="text-align:center;"><span class="prestige-badge">⭐ Престиж ' + state.prestigeLevel + ' (x' + state.prestigeBonus.toFixed(2) + ')</span></div>' : '') +
        '</header>' +
        
        // Кликер
        '<section class="clicker-section">' +
          '<div class="shawarma-container">' +
            '<div class="shawarma-glow"></div>' +
            '<div class="orbit-ring orbit-ring-1"></div>' +
            '<div class="orbit-ring orbit-ring-2"></div>' +
            '<button id="shawarma-btn" data-action="click-shawarma" class="shawarma-btn">🌯</button>' +
          '</div>' +
          '<div class="clicker-stats">' +
            'Всего: <span id="counter-total">' + this.formatNumber(state.totalShawarmas) + '</span> · ' +
            'Кликов: <span id="counter-clicks">' + state.clickCount + '</span>' +
          '</div>' +
        '</section>' +
        
        // Табы
        '<div class="tabs-container">' +
          '<div class="tabs-header">' +
            '<button data-action="switch-tab" data-tab="buildings" class="' + tabCls('buildings') + '">🏪 Магазин</button>' +
            '<button data-action="switch-tab" data-tab="upgrades" class="' + tabCls('upgrades') + '">⚡ Апгрейды</button>' +
            '<button data-action="switch-tab" data-tab="orders" class="' + tabCls('orders') + '">📦' + (readyOrders > 0 ? ' <span class="tab-badge">' + readyOrders + '</span>' : '') + '</button>' +
            '<button data-action="switch-tab" data-tab="achievements" class="' + tabCls('achievements') + '">🏆' + (unlocked > 0 ? ' (' + unlocked + ')' : '') + '</button>' +
          '</div>' +
          '<div id="tab-content" class="tabs-content">' + tabContent + '</div>' +
        '</div>' +
      '</div>';
    
    document.getElementById('app').innerHTML = html;
  },
  
  // Рендер зданий
  renderBuildings: function() {
    var state = Game.state;
    var discount = Game.getBuildingDiscount ? Game.getBuildingDiscount() : 1;
    var self = this;
    
    var html = '<div class="buy-mode-btns">' +
      '<button data-action="set-buy-mode" data-mode="1" class="buy-mode-btn ' + (this.buyMode === 1 ? 'active' : '') + '">x1</button>' +
      '<button data-action="set-buy-mode" data-mode="10" class="buy-mode-btn ' + (this.buyMode === 10 ? 'active' : '') + '">x10</button>' +
      '<button data-action="set-buy-mode" data-mode="100" class="buy-mode-btn ' + (this.buyMode === 100 ? 'active' : '') + '">MAX</button>' +
    '</div>';
    
    for (var i = 0; i < state.buildings.length; i++) {
      var b = state.buildings[i];
      var buyInfo = this.calculateBulkBuy(b, discount, this.buyMode);
      var canBuy = buyInfo.count > 0;
      
      // Бонус за количество зданий (+1% за каждое купленное)
      var quantityBonus = 1 + (b.owned * 0.01);
      var perUnitProduction = b.production * state.prestigeBonus * quantityBonus;
      var totalProduction = b.owned * perUnitProduction;
      
      var cardClass = 'game-card' + (canBuy ? ' affordable' : ' disabled');
      
      html += '<div data-action="buy-building" data-id="' + b.id + '" class="' + cardClass + '">' +
        '<div class="card-icon">' + b.emoji + '</div>' +
        '<div class="card-info">' +
          '<div class="card-title">' + b.name + (buyInfo.count > 1 ? ' <span style="color:var(--success);">(+' + buyInfo.count + ')</span>' : '') + '</div>' +
          '<div class="card-desc">' + b.desc + '</div>' +
          '<div class="card-stats">+' + this.formatNumber(perUnitProduction) + '/с за шт.' + (b.owned > 0 ? ' <span style="color:var(--text-muted);font-size:0.65rem;">(+' + Math.floor(b.owned) + '% бонус)</span>' : '') + '</div>' +
          (b.owned > 0 ? '<div class="card-owned" style="color:var(--accent);">Всего: ' + this.formatNumber(totalProduction) + '/с · Куплено: ' + b.owned + '</div>' : '<div class="card-owned">Куплено: ' + b.owned + '</div>') +
        '</div>' +
        '<div class="card-cost">' +
          '<div class="cost-value">' + this.formatNumber(buyInfo.totalCost) + '</div>' +
          '<div class="cost-label">🌯</div>' +
        '</div>' +
      '</div>';
    }
    
    return html;
  },
  
  // Расчёт стоимости покупки
  calculateBulkBuy: function(building, discount, mode) {
    var state = Game.state;
    var baseCost = building.cost;
    var totalCost = 0;
    var count = 0;
    var tempCost = baseCost;
    
    if (mode === 100) {
      var budget = state.shawarmas;
      while (Math.floor(tempCost * discount) <= budget && count < 500) {
        var cost = Math.floor(tempCost * discount);
        totalCost += cost;
        budget -= cost;
        tempCost = Math.floor(tempCost * 1.15);
        count++;
      }
    } else {
      for (var i = 0; i < mode; i++) {
        totalCost += Math.floor(tempCost * discount);
        tempCost = Math.floor(tempCost * 1.15);
      }
      count = state.shawarmas >= totalCost ? mode : 0;
    }
    
    return { count: count, totalCost: totalCost };
  },
  
  // Рендер улучшений
  renderUpgrades: function() {
    var state = Game.state;
    var self = this;
    
    var clickUpgrades = [];
    var prodUpgrades = [];
    var discountUpgrades = [];
    
    for (var i = 0; i < state.upgrades.length; i++) {
      var u = state.upgrades[i];
      if (u.type === 'click') clickUpgrades.push(u);
      else if (u.type === 'production') prodUpgrades.push(u);
      else if (u.type === 'discount') discountUpgrades.push(u);
    }
    
    var html = '';
    
    // Клик
    html += '<div class="section-header">🖱️ Сила клика</div>';
    for (var j = 0; j < clickUpgrades.length; j++) {
      html += this.renderUpgradeCard(clickUpgrades[j]);
    }
    
    // Производство
    html += '<div class="section-header">⚙️ Производство</div>';
    for (var k = 0; k < prodUpgrades.length; k++) {
      html += this.renderUpgradeCard(prodUpgrades[k]);
    }
    
    // Скидки
    html += '<div class="section-header">💰 Экономия</div>';
    for (var l = 0; l < discountUpgrades.length; l++) {
      html += this.renderUpgradeCard(discountUpgrades[l]);
    }
    
    return html;
  },
  
  renderUpgradeCard: function(u) {
    var state = Game.state;
    var canBuy = !u.purchased && state.shawarmas >= u.cost;
    var cardClass = 'game-card';
    
    if (u.purchased) cardClass += ' purchased';
    else if (canBuy) cardClass += ' affordable';
    else cardClass += ' disabled';
    
    var desc = '';
    if (u.purchased) desc = '✅ Куплено';
    else if (u.type === 'click') desc = '+' + u.clickBonus + ' за клик';
    else if (u.type === 'production') desc = 'x' + u.productionMultiplier + ' производство';
    else desc = '-' + Math.floor((1 - u.buildingDiscount) * 100) + '% стоимость';
    
    return '<div data-action="buy-upgrade" data-id="' + u.id + '" class="' + cardClass + '">' +
      '<div class="card-icon">' + u.emoji + '</div>' +
      '<div class="card-info">' +
        '<div class="card-title">' + u.name + '</div>' +
        '<div class="card-desc">' + desc + '</div>' +
      '</div>' +
      (u.purchased ? '' : '<div class="card-cost"><div class="cost-value">' + this.formatNumber(u.cost) + '</div><div class="cost-label">🌯</div></div>') +
    '</div>';
  },
  
  // Рендер заказов
  renderOrders: function() {
    if (typeof Orders === 'undefined') {
      return '<div style="text-align:center;padding:20px;color:var(--text-secondary);">Загрузка...</div>';
    }
    
    var orders = Orders.activeOrders;
    var timeToRefresh = Orders.getTimeToRefresh();
    var minutes = Math.floor(timeToRefresh / 60000);
    var seconds = Math.floor((timeToRefresh % 60000) / 1000);
    var self = this;
    
    var html = '<div style="text-align:center;margin-bottom:12px;">' +
      '<span class="timer-badge">Новые заказы через <span class="time">' + minutes + ':' + (seconds < 10 ? '0' : '') + seconds + '</span></span>' +
    '</div>';
    
    if (orders.length === 0) {
      html += '<div style="text-align:center;padding:20px;color:var(--text-secondary);">Нет активных заказов</div>';
    } else {
      for (var i = 0; i < orders.length; i++) {
        var order = orders[i];
        var progress = Orders.getProgress(order);
        var pct = Math.min((progress / order.target) * 100, 100);
        var cardClass = 'game-card' + (order.completed ? ' completed' : '');
        
        html += '<div class="' + cardClass + '">' +
          '<div class="card-icon">' + order.customer + '</div>' +
          '<div class="card-info" style="width:100%;">' +
            '<div class="card-title">' + order.desc + '</div>' +
            '<div class="card-desc" style="color:var(--secondary);">🎁 +' + self.formatNumber(order.reward) + ' шаурмы</div>';
        
        if (order.completed) {
          html += '<button data-action="claim-order" data-id="' + order.id + '" class="claim-btn">✅ Забрать награду!</button>';
        } else {
          html += '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%;"></div></div>' +
            '<div class="progress-text">' + self.formatNumber(progress) + ' / ' + self.formatNumber(order.target) + '</div>';
        }
        
        html += '</div></div>';
      }
    }
    
    return html;
  },
  
  // Рендер достижений
  renderAchievements: function() {
    var state = Game.state;
    var totalBuildings = Game.getTotalBuildings ? Game.getTotalBuildings() : 0;
    var self = this;
    
    var unlockedCount = 0;
    for (var i = 0; i < state.achievements.length; i++) {
      if (state.achievements[i].unlocked) unlockedCount++;
    }
    
    var html = '<div style="text-align:center;margin-bottom:12px;">' +
      '<span class="timer-badge">' + unlockedCount + ' / ' + state.achievements.length + ' разблокировано</span>' +
    '</div>';
    
    for (var j = 0; j < state.achievements.length; j++) {
      var ach = state.achievements[j];
      var progress = 0;
      
      if (ach.type === 'total') progress = state.totalShawarmas;
      else if (ach.type === 'clicks') progress = state.clickCount;
      else if (ach.type === 'buildings') progress = totalBuildings;
      else if (ach.type === 'prestige') progress = state.prestigeLevel;
      
      var pct = Math.min((progress / ach.target) * 100, 100);
      var cardClass = 'game-card' + (ach.unlocked ? ' unlocked' : '');
      
      html += '<div class="' + cardClass + '">' +
        '<div class="card-icon">' + (ach.unlocked ? '🏆' : '🔒') + '</div>' +
        '<div class="card-info">' +
          '<div class="card-title">' + ach.name + '</div>' +
          '<div class="card-desc">' + ach.desc + '</div>' +
          (ach.reward > 0 ? '<div style="font-size:0.7rem;color:var(--secondary);margin-top:2px;">🎁 +' + self.formatNumber(ach.reward) + '</div>' : '');
      
      if (!ach.unlocked) {
        html += '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%;"></div></div>' +
          '<div class="progress-text">' + self.formatNumber(progress) + ' / ' + self.formatNumber(ach.target) + '</div>';
      } else {
        html += '<div style="font-size:0.7rem;color:var(--success);margin-top:4px;">✨ Разблокировано!</div>';
      }
      
      html += '</div></div>';
    }
    
    return html;
  },
  
  // Показать настройки
  showSettings: function() {
    var self = this;
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'settings-modal';
    modal.innerHTML = 
      '<div class="modal-content">' +
        '<div class="modal-title">⚙️ Настройки</div>' +
        '<div style="margin-bottom:16px;">' +
          '<div style="font-size:0.85rem;margin-bottom:8px;color:var(--text-secondary);">Тема оформления:</div>' +
          '<div class="theme-picker">' +
            '<button class="theme-btn dark ' + (self.currentTheme === 'dark' ? 'active' : '') + '" data-theme="dark" title="Тёмная"></button>' +
            '<button class="theme-btn light ' + (self.currentTheme === 'light' ? 'active' : '') + '" data-theme="light" title="Светлая"></button>' +
            '<button class="theme-btn neon ' + (self.currentTheme === 'neon' ? 'active' : '') + '" data-theme="neon" title="Неон"></button>' +
          '</div>' +
        '</div>' +
        '<button class="modal-btn primary" data-action="show-referral" style="margin-bottom:8px;">👥 Пригласить друзей</button>' +
        '<button class="modal-btn secondary" data-action="close-modal">Закрыть</button>' +
      '</div>';
    
    document.body.appendChild(modal);
    
    modal.onclick = function(e) {
      if (e.target === modal || e.target.dataset.action === 'close-modal') {
        modal.remove();
      }
      var themeBtn = e.target.closest('.theme-btn');
      if (themeBtn && themeBtn.dataset.theme) {
        self.setTheme(themeBtn.dataset.theme);
        modal.remove();
      }
      if (e.target.dataset.action === 'show-referral') {
        modal.remove();
        self.showReferralMenu();
      }
    };
  },
  
  // Показать меню рефералов
  showReferralMenu: function() {
    var self = this;
    if (typeof Referral === 'undefined') {
      this.showAchievementPopup({
        emoji: '⚠️',
        name: 'Недоступно',
        desc: 'Реферальная система загружается',
        reward: 0
      });
      return;
    }
    
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'referral-modal';
    
    // Следующая веха
    var nextMilestone = null;
    for (var i = 0; i < Referral.rewards.milestones.length; i++) {
      var m = Referral.rewards.milestones[i];
      if (Referral.referralCount < m.count) {
        nextMilestone = m;
        break;
      }
    }
    
    var milestonesHtml = '';
    for (var j = 0; j < Referral.rewards.milestones.length; j++) {
      var milestone = Referral.rewards.milestones[j];
      var achieved = Referral.referralCount >= milestone.count;
      milestonesHtml += '<div style="display:flex;align-items:center;gap:8px;padding:6px;border-radius:8px;' + 
        (achieved ? 'background:rgba(34,197,94,0.15);' : 'opacity:0.5;') + '">' +
        '<span style="font-size:1.2rem;">' + milestone.emoji + '</span>' +
        '<span style="flex:1;font-size:0.8rem;">' + milestone.count + ' друзей</span>' +
        '<span style="font-size:0.75rem;color:var(--secondary);">+' + self.formatNumber(milestone.reward) + '</span>' +
      '</div>';
    }
    
    modal.innerHTML = 
      '<div class="modal-content">' +
        '<div class="modal-title">👥 Пригласи друзей</div>' +
        
        // Статистика
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">' +
          '<div style="background:var(--bg-card);border-radius:12px;padding:12px;text-align:center;">' +
            '<div style="font-size:1.5rem;font-weight:700;color:var(--primary);">' + Referral.referralCount + '</div>' +
            '<div style="font-size:0.7rem;color:var(--text-muted);">Приглашено</div>' +
          '</div>' +
          '<div style="background:var(--bg-card);border-radius:12px;padding:12px;text-align:center;">' +
            '<div style="font-size:1.5rem;font-weight:700;color:var(--secondary);">+' + self.formatNumber(Referral.rewards.perReferral) + '</div>' +
            '<div style="font-size:0.7rem;color:var(--text-muted);">За друга</div>' +
          '</div>' +
        '</div>' +
        
        // Твой код
        '<div style="background:var(--bg-card);border-radius:12px;padding:12px;margin-bottom:12px;text-align:center;">' +
          '<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px;">Твой код:</div>' +
          '<div style="font-size:1.2rem;font-weight:700;color:var(--text-primary);letter-spacing:2px;">' + Referral.myCode + '</div>' +
        '</div>' +
        
        // Награды
        '<div style="background:var(--bg-card);border-radius:12px;padding:12px;margin-bottom:12px;">' +
          '<div style="font-size:0.8rem;font-weight:600;color:var(--text-primary);margin-bottom:8px;">🎁 Награды:</div>' +
          '<div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:4px;">' +
            '• Ты получаешь: <span style="color:var(--secondary);">+' + self.formatNumber(Referral.rewards.forInviter) + '</span> за каждого друга' +
          '</div>' +
          '<div style="font-size:0.75rem;color:var(--text-secondary);">' +
            '• Друг получает: <span style="color:var(--secondary);">+' + self.formatNumber(Referral.rewards.forInvited) + '</span> при старте' +
          '</div>' +
        '</div>' +
        
        // Вехи
        '<div style="background:var(--bg-card);border-radius:12px;padding:12px;margin-bottom:12px;">' +
          '<div style="font-size:0.8rem;font-weight:600;color:var(--text-primary);margin-bottom:8px;">🏆 Вехи:</div>' +
          '<div style="display:flex;flex-direction:column;gap:4px;">' + milestonesHtml + '</div>' +
        '</div>' +
        
        // Кнопки
        '<button class="modal-btn primary" data-action="share-referral" style="margin-bottom:8px;">📤 Поделиться ссылкой</button>' +
        '<button class="modal-btn secondary" data-action="copy-referral" style="margin-bottom:8px;">📋 Скопировать код</button>' +
        '<button class="modal-btn secondary" data-action="close-modal">Закрыть</button>' +
      '</div>';
    
    document.body.appendChild(modal);
    
    modal.onclick = function(e) {
      if (e.target === modal || e.target.dataset.action === 'close-modal') {
        modal.remove();
      }
      if (e.target.dataset.action === 'share-referral') {
        Referral.share();
      }
      if (e.target.dataset.action === 'copy-referral') {
        Referral.copyToClipboard(Referral.myCode);
      }
    };
  }
};

console.log('✅ ui.js v3.1 загружен');
