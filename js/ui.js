// Отрисовка интерфейса v2.0
// js/ui.js

var UI = {
  isInitialized: false,
  
  formatNumber: function(num) {
    if (num === undefined || num === null || isNaN(num)) return '0';
    if (num < 0) return '-' + this.formatNumber(-num);
    
    var suffixes = [
      { value: 1e33, suffix: 'D' },   // Decillion
      { value: 1e30, suffix: 'N' },   // Nonillion
      { value: 1e27, suffix: 'Oc' },  // Octillion
      { value: 1e24, suffix: 'Sp' },  // Septillion
      { value: 1e21, suffix: 'Sx' },  // Sextillion
      { value: 1e18, suffix: 'Qi' },  // Quintillion
      { value: 1e15, suffix: 'Qa' },  // Quadrillion
      { value: 1e12, suffix: 'T' },   // Trillion
      { value: 1e9, suffix: 'B' },    // Billion
      { value: 1e6, suffix: 'M' },    // Million
      { value: 1e3, suffix: 'K' }     // Thousand
    ];
    
    for (var i = 0; i < suffixes.length; i++) {
      if (num >= suffixes[i].value) {
        var formatted = num / suffixes[i].value;
        // Показываем 2 знака после запятой, но убираем лишние нули
        if (formatted >= 100) {
          return Math.floor(formatted) + suffixes[i].suffix;
        } else if (formatted >= 10) {
          return formatted.toFixed(1).replace(/\.0$/, '') + suffixes[i].suffix;
        } else {
          return formatted.toFixed(2).replace(/\.?0+$/, '') + suffixes[i].suffix;
        }
      }
    }
    
    return Math.floor(num).toString();
  },
  
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
    
    el = document.getElementById('counter-lifetime');
    if (el) el.textContent = this.formatNumber(state.lifetimeShawarmas);
    
    el = document.getElementById('counter-clicks');
    if (el) el.textContent = state.clickCount;
  },
  
  updateButtonStates: function() {
    var state = Game.state;
    var discount = Game.getBuildingDiscount();
    var btns, i, btn, id, item, cost, canBuy;
    
    btns = document.querySelectorAll('[data-action="buy-building"]');
    for (i = 0; i < btns.length; i++) {
      btn = btns[i];
      id = parseInt(btn.dataset.id, 10);
      item = Game.findBuilding(id);
      if (!item) continue;
      cost = Math.floor(item.cost * discount);
      canBuy = state.shawarmas >= cost;
      btn.disabled = !canBuy;
      btn.className = canBuy
        ? 'w-full p-3 rounded-xl text-left bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-400 cursor-pointer shadow-md'
        : 'w-full p-3 rounded-xl text-left bg-gray-100 border-2 border-gray-300 opacity-50 cursor-not-allowed';
    }
    
    btns = document.querySelectorAll('[data-action="buy-upgrade"]');
    for (i = 0; i < btns.length; i++) {
      btn = btns[i];
      id = parseInt(btn.dataset.id, 10);
      item = Game.findUpgrade(id);
      if (!item) continue;
      if (item.purchased) {
        btn.disabled = true;
        btn.className = 'w-full p-3 rounded-xl text-left bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400';
      } else if (state.shawarmas >= item.cost) {
        btn.disabled = false;
        btn.className = 'w-full p-3 rounded-xl text-left bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-400 cursor-pointer shadow-md';
      } else {
        btn.disabled = true;
        btn.className = 'w-full p-3 rounded-xl text-left bg-gray-100 border-2 border-gray-300 opacity-50 cursor-not-allowed';
      }
    }
  },
  
  forceUpdateTab: function() {
    var el = document.getElementById('tab-content');
    if (!el) return;
    var tab = Game.state.currentTab;
    if (tab === 'buildings') el.innerHTML = this.renderBuildings();
    else if (tab === 'upgrades') el.innerHTML = this.renderUpgrades();
    else if (tab === 'achievements') el.innerHTML = this.renderAchievements();
  },
  
  showFloatingNumber: function(x, y, value, suffix) {
    var div = document.createElement('div');
    var hasCombo = suffix && suffix !== '';
    var colorClass = hasCombo ? 'text-yellow-500' : 'text-orange-600';
    var sizeClass = hasCombo ? 'text-4xl' : 'text-3xl';
    
    div.className = 'float-number fixed font-bold z-50 ' + sizeClass + ' ' + colorClass;
    div.textContent = '+' + this.formatNumber(value) + (suffix ? ' ' + suffix : '');
    div.style.cssText = 'left:' + x + 'px;top:' + y + 'px;text-shadow:2px 2px 4px rgba(0,0,0,0.3)';
    document.body.appendChild(div);
    setTimeout(function() { div.remove(); }, 1000);
  },
  
  // Обновление индикатора комбо
  updateComboIndicator: function(count, multiplier) {
    var self = this;
    var indicator = document.getElementById('combo-indicator');
    
    // Очищаем предыдущий таймер скрытия
    if (this.comboHideTimeout) {
      clearTimeout(this.comboHideTimeout);
    }
    
    if (count < 3) {
      // Скрываем при низком комбо
      if (indicator) {
        indicator.style.opacity = '0';
        indicator.style.transform = 'translateX(-50%) scale(0.8)';
      }
      return;
    }
    
    if (!indicator) {
      // Создаём индикатор если его нет
      indicator = document.createElement('div');
      indicator.id = 'combo-indicator';
      indicator.className = 'fixed left-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold shadow-lg z-30';
      indicator.style.cssText = 'transition: all 0.3s ease; transform: translateX(-50%); top: 140px;';
      document.body.appendChild(indicator);
    }
    
    indicator.style.opacity = '1';
    indicator.style.transform = 'translateX(-50%) scale(1)';
    indicator.innerHTML = '🔥 x' + multiplier.toFixed(1);
    
    // Эффект пульсации при высоком комбо
    if (multiplier >= 3) {
      indicator.style.transform = 'translateX(-50%) scale(1.15)';
      setTimeout(function() {
        if (indicator) indicator.style.transform = 'translateX(-50%) scale(1)';
      }, 100);
    }
    
    // Автоскрытие через 1.5 секунды бездействия
    this.comboHideTimeout = setTimeout(function() {
      if (indicator) {
        indicator.style.opacity = '0';
        indicator.style.transform = 'translateX(-50%) scale(0.8)';
      }
    }, 1500);
  },
  
  comboHideTimeout: null,
  
  // Показать уведомление о событии
  showEventNotification: function(event) {
    var notification = document.createElement('div');
    notification.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 text-center';
    notification.innerHTML = 
      '<div class="bg-gradient-to-r ' + event.color + ' text-white px-8 py-6 rounded-2xl shadow-2xl animate-bounce">' +
        '<div class="text-5xl mb-2">' + event.emoji + '</div>' +
        '<div class="text-2xl font-bold">' + event.name + '</div>' +
        '<div class="text-lg opacity-90">' + event.desc + '</div>' +
      '</div>';
    
    document.body.appendChild(notification);
    
    // Анимация исчезновения
    setTimeout(function() {
      notification.style.transition = 'all 0.5s ease';
      notification.style.opacity = '0';
      notification.style.transform = 'translate(-50%, -50%) scale(0.5)';
      setTimeout(function() {
        notification.remove();
      }, 500);
    }, 2000);
  },
  
  // Отрисовка активных эффектов
  renderActiveEffects: function(effects) {
    var container = document.getElementById('active-effects');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'active-effects';
      container.className = 'fixed top-28 left-1/2 transform -translate-x-1/2 z-40 flex gap-2';
      document.body.appendChild(container);
    }
    
    if (effects.length === 0) {
      container.innerHTML = '';
      return;
    }
    
    var html = '';
    var now = Date.now();
    
    for (var i = 0; i < effects.length; i++) {
      var e = effects[i];
      var remaining = Math.max(0, Math.ceil((e.endsAt - now) / 1000));
      
      html += '<div class="bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">' +
        '<span>' + e.emoji + '</span>' +
        '<span>' + remaining + 'с</span>' +
      '</div>';
    }
    
    container.innerHTML = html;
    
    // Обновляем каждую секунду
    if (effects.length > 0) {
      var self = this;
      setTimeout(function() {
        if (typeof Events !== 'undefined') {
          self.renderActiveEffects(Events.activeEffects);
        }
      }, 1000);
    }
  },
  
  createParticles: function(x, y, count, emoji) {
    var container = document.getElementById('particles-container');
    if (!container) return;
    emoji = emoji || '🌯';
    for (var i = 0; i < count; i++) {
      var p = document.createElement('div');
      p.className = 'particle fixed text-2xl';
      p.textContent = emoji;
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      var angle = (Math.PI * 2 * i) / count;
      var dist = 50 + Math.random() * 50;
      p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
      container.appendChild(p);
      (function(el) { setTimeout(function() { el.remove(); }, 800); })(p);
    }
  },
  
  showAchievementPopup: function(ach) {
    var container = document.getElementById('achievements-container');
    if (!container) return;
    var div = document.createElement('div');
    div.className = 'achievement-popup bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-lg shadow-2xl max-w-xs';
    var reward = ach.reward > 0 ? '<div class="text-sm font-bold mt-1">+' + this.formatNumber(ach.reward) + ' 🌯</div>' : '';
    div.innerHTML = '<div class="font-bold text-lg">' + (ach.emoji || '🏆') + ' ' + (ach.reward > 0 ? 'Достижение!' : '') + '</div>' +
      '<div class="font-semibold">' + ach.name + '</div>' +
      '<div class="text-sm opacity-90">' + ach.desc + '</div>' + reward;
    container.appendChild(div);
    setTimeout(function() {
      div.style.opacity = '0';
      div.style.transition = 'opacity 0.5s';
      setTimeout(function() { div.remove(); }, 500);
    }, 3000);
  },
  
  showLeaderboard: function(leaders) {
    var modal = document.getElementById('leaderboard-modal');
    var content = document.getElementById('leaderboard-content');
    if (!modal || !content) return;
    
    var html = '';
    if (!leaders || leaders.length === 0) {
      html = '<div class="text-gray-500 py-8">Пока нет игроков</div>';
    } else {
      html = '<div class="space-y-2">';
      for (var i = 0; i < leaders.length; i++) {
        var l = leaders[i];
        var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.';
        var isMe = Game.userInfo.id == l.user_id;
        var bg = isMe ? 'bg-orange-100 border-orange-400' : 'bg-gray-50 border-gray-200';
        // Анонимные имена
        var displayName = isMe ? 'Ты' : 'Игрок ' + (i + 1);
        html += '<div class="flex items-center gap-3 p-3 rounded-xl border-2 ' + bg + '">' +
          '<div class="text-2xl w-10 text-center">' + medal + '</div>' +
          '<div class="flex-1"><div class="font-bold">' + displayName + '</div>' +
          '<div class="text-xs text-gray-500">' + this.formatNumber(l.lifetime_shawarmas) + ' 🌯</div></div>' +
          (l.prestige_level > 0 ? '<div class="text-purple-600 font-bold">⭐' + l.prestige_level + '</div>' : '') +
          '</div>';
      }
      html += '</div>';
    }
    content.innerHTML = html;
    modal.classList.remove('hidden');
  },
  
  // Меню мини-игр
  openMinigamesMenu: function() {
    var modal = document.createElement('div');
    modal.id = 'minigames-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    var slicerBest = localStorage.getItem('slicer_best') || 0;
    var chopperBest = localStorage.getItem('chopper_best') || 0;
    
    modal.innerHTML = 
      '<div class="bg-white rounded-3xl p-6 max-w-sm mx-4 max-h-[90vh] overflow-y-auto">' +
        '<div class="text-center mb-4">' +
          '<div class="text-4xl mb-2">🎮</div>' +
          '<h2 class="text-2xl font-bold text-gray-800">Мини-игры</h2>' +
          '<p class="text-gray-500 text-sm">Играй и получай бонусы!</p>' +
        '</div>' +
        '<div class="space-y-3">' +
          // Слайсер
          '<button data-action="open-slicer" class="w-full p-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-xl text-left hover:from-green-500 hover:to-emerald-600 transition-all">' +
            '<div class="flex items-center gap-3">' +
              '<div class="text-4xl">🔪</div>' +
              '<div class="flex-1">' +
                '<div class="font-bold text-lg">Слайсер</div>' +
                '<div class="text-sm opacity-90">Лови и режь ингредиенты!</div>' +
                '<div class="text-xs opacity-75">Рекорд: ' + slicerBest + '</div>' +
              '</div>' +
              '<div class="text-2xl">▶</div>' +
            '</div>' +
          '</button>' +
          // Нарезка
          '<button data-action="open-chopper" class="w-full p-4 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-xl text-left hover:from-orange-500 hover:to-red-600 transition-all">' +
            '<div class="flex items-center gap-3">' +
              '<div class="text-4xl">🥒</div>' +
              '<div class="flex-1">' +
                '<div class="font-bold text-lg">Нарезка</div>' +
                '<div class="text-sm opacity-90">Нарежь на максимум кусочков!</div>' +
                '<div class="text-xs opacity-75">Рекорд: ' + chopperBest + ' полосок</div>' +
              '</div>' +
              '<div class="text-2xl">▶</div>' +
            '</div>' +
          '</button>' +
          // Дуэли (скоро)
          '<div class="w-full p-4 bg-gray-100 text-gray-400 rounded-xl text-left opacity-60">' +
            '<div class="flex items-center gap-3">' +
              '<div class="text-4xl">⚔️</div>' +
              '<div class="flex-1">' +
                '<div class="font-bold text-lg">Дуэли</div>' +
                '<div class="text-sm">Соревнуйся с другими!</div>' +
                '<div class="text-xs">🔒 Скоро</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          // Рулетка (скоро)
          '<div class="w-full p-4 bg-gray-100 text-gray-400 rounded-xl text-left opacity-60">' +
            '<div class="flex items-center gap-3">' +
              '<div class="text-4xl">🎰</div>' +
              '<div class="flex-1">' +
                '<div class="font-bold text-lg">Рулетка</div>' +
                '<div class="text-sm">Испытай удачу!</div>' +
                '<div class="text-xs">🔒 Скоро</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<button data-action="close-minigames" class="w-full mt-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300">Закрыть</button>' +
      '</div>';
    
    document.body.appendChild(modal);
    
    // Обработчики
    modal.querySelector('[data-action="close-minigames"]').onclick = function() {
      modal.remove();
    };
    
    modal.querySelector('[data-action="open-slicer"]').onclick = function() {
      modal.remove();
      if (typeof Slicer !== 'undefined') {
        Slicer.openMenu();
      }
    };
    
    modal.querySelector('[data-action="open-chopper"]').onclick = function() {
      modal.remove();
      if (typeof Chopper !== 'undefined') {
        Chopper.openMenu();
      }
    };
    
    // Закрыть по клику на фон
    modal.onclick = function(e) {
      if (e.target === modal) modal.remove();
    };
  },
  
  render: function(force) {
    if (this.isInitialized && !force) {
      this.updateCounters();
      return;
    }
    this.isInitialized = true;
    
    var state = Game.state;
    var unlocked = 0;
    for (var i = 0; i < state.achievements.length; i++) {
      if (state.achievements[i].unlocked) unlocked++;
    }
    
    var canPrestige = state.totalShawarmas >= 1000000;
    var cloud = Game.cloudSaveEnabled ? '☁️' : '💾';
    var tabContent = '';
    if (state.currentTab === 'buildings') tabContent = this.renderBuildings();
    else if (state.currentTab === 'upgrades') tabContent = this.renderUpgrades();
    else if (state.currentTab === 'achievements') tabContent = this.renderAchievements();
    
    var tabCls = function(t) {
      return state.currentTab === t 
        ? 'bg-gradient-to-b from-orange-500 to-orange-600 text-white' 
        : 'bg-gray-100 text-gray-700';
    };
    
    var html = '<div class="min-h-screen pb-20">' +
      '<div class="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white p-4 shadow-lg sticky top-0 z-30">' +
        '<div class="flex justify-between items-center mb-2">' +
          '<h1 class="text-2xl font-bold">🌯 Империя Шаурмы</h1>' +
          '<div class="flex gap-2">' +
            '<span title="' + (Game.cloudSaveEnabled ? 'Облако' : 'Локально') + '">' + cloud + '</span>' +
            '<button data-action="open-minigames" class="bg-green-500 hover:bg-green-600 px-2 py-1 rounded text-sm">🎮</button>' +
            (Game.cloudSaveEnabled ? '<button data-action="show-leaderboard" class="bg-yellow-500 hover:bg-yellow-600 px-2 py-1 rounded text-sm">🏆</button>' : '') +
            (canPrestige ? '<button data-action="open-prestige" class="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-sm golden-shine">⭐</button>' : '') +
          '</div>' +
        '</div>' +
        '<div class="grid grid-cols-3 gap-2 text-center">' +
          '<div class="bg-white bg-opacity-20 rounded-lg p-2">' +
            '<div id="counter-shawarmas" class="text-xl font-bold">' + this.formatNumber(state.shawarmas) + '</div>' +
            '<div class="text-xs">Шаурмы</div>' +
          '</div>' +
          '<div class="bg-white bg-opacity-20 rounded-lg p-2">' +
            '<div id="counter-perclick" class="font-bold">+' + this.formatNumber(state.perClick) + '</div>' +
            '<div class="text-xs">За клик</div>' +
          '</div>' +
          '<div class="bg-white bg-opacity-20 rounded-lg p-2">' +
            '<div id="counter-persecond" class="font-bold">+' + this.formatNumber(state.perSecond) + '/с</div>' +
            '<div class="text-xs">В секунду</div>' +
          '</div>' +
        '</div>' +
        (state.prestigeLevel > 0 ? '<div class="text-center mt-2 text-sm bg-purple-600 bg-opacity-50 rounded py-1">⭐ Престиж ' + state.prestigeLevel + ' (x' + state.prestigeBonus.toFixed(2) + ')</div>' : '') +
      '</div>' +
      '<div class="max-w-2xl mx-auto p-4 space-y-4">' +
        '<div class="bg-white rounded-2xl p-6 shadow-xl text-center">' +
          '<button id="shawarma-btn" data-action="click-shawarma" class="text-8xl select-none cursor-pointer transform hover:scale-105 active:scale-95 transition-transform">🌯</button>' +
          '<p class="text-gray-600 mt-2 font-semibold">Нажми на шаурму!</p>' +
          '<div class="text-sm text-gray-500 mt-2">' +
            'Всего: <span id="counter-total">' + this.formatNumber(state.totalShawarmas) + '</span> | ' +
            'За всё время: <span id="counter-lifetime">' + this.formatNumber(state.lifetimeShawarmas) + '</span> | ' +
            'Кликов: <span id="counter-clicks">' + state.clickCount + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="bg-white rounded-2xl shadow-xl overflow-hidden">' +
          '<div class="grid grid-cols-3 border-b-2 border-gray-200">' +
            '<button data-action="switch-tab" data-tab="buildings" class="p-3 font-semibold ' + tabCls('buildings') + '">🏪 Магазин</button>' +
            '<button data-action="switch-tab" data-tab="upgrades" class="p-3 font-semibold ' + tabCls('upgrades') + '">⚡ Апгрейды</button>' +
            '<button data-action="switch-tab" data-tab="achievements" class="p-3 font-semibold ' + tabCls('achievements') + '">🏆 ' + (unlocked > 0 ? '(' + unlocked + ')' : '') + '</button>' +
          '</div>' +
          '<div id="tab-content" class="p-4 max-h-80 overflow-y-auto">' + tabContent + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
    
    
    document.getElementById('app').innerHTML = html;
  },
  
  // Режим покупки зданий (1, 10, max)
  buyMode: 1,
  
  renderBuildings: function() {
    var state = Game.state;
    var discount = Game.getBuildingDiscount();
    var self = this;
    
    // Кнопки режима покупки
    var html = '<div class="flex gap-2 mb-3 justify-center">' +
      '<button data-action="set-buy-mode" data-mode="1" class="px-3 py-1 rounded-lg text-sm font-bold ' + 
        (this.buyMode === 1 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700') + '">x1</button>' +
      '<button data-action="set-buy-mode" data-mode="10" class="px-3 py-1 rounded-lg text-sm font-bold ' + 
        (this.buyMode === 10 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700') + '">x10</button>' +
      '<button data-action="set-buy-mode" data-mode="100" class="px-3 py-1 rounded-lg text-sm font-bold ' + 
        (this.buyMode === 100 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700') + '">MAX</button>' +
    '</div>';
    
    html += '<div class="space-y-2">';
    
    for (var i = 0; i < state.buildings.length; i++) {
      var b = state.buildings[i];
      var buyInfo = this.calculateBulkBuy(b, discount, this.buyMode);
      var canBuy = buyInfo.count > 0;
      var cls = canBuy
        ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-400 cursor-pointer shadow-md'
        : 'bg-gray-100 border-2 border-gray-300 opacity-50 cursor-not-allowed';
      
      html += '<button data-action="buy-building" data-id="' + b.id + '" ' + (canBuy ? '' : 'disabled') +
        ' class="w-full p-3 rounded-xl text-left ' + cls + '">' +
        '<div class="flex justify-between items-center">' +
          '<div class="flex items-center gap-3">' +
            '<span class="text-3xl">' + b.emoji + '</span>' +
            '<div>' +
              '<div class="font-bold">' + b.name + (buyInfo.count > 1 ? ' <span class="text-green-600">(+' + buyInfo.count + ')</span>' : '') + '</div>' +
              '<div class="text-xs text-gray-500">' + b.desc + '</div>' +
              '<div class="text-sm text-orange-600">+' + this.formatNumber(b.production * state.prestigeBonus) + '/с каждое</div>' +
              '<div class="text-xs text-gray-400">Куплено: ' + b.owned + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="text-right">' +
            '<div class="text-orange-600 font-bold">' + this.formatNumber(buyInfo.totalCost) + '</div>' +
            '<div class="text-xs text-gray-500">🌯</div>' +
          '</div>' +
        '</div>' +
      '</button>';
    }
    
    return html + '</div>';
  },
  
  // Расчёт стоимости покупки нескольких зданий
  calculateBulkBuy: function(building, discount, mode) {
    var state = Game.state;
    var baseCost = building.cost;
    var totalCost = 0;
    var count = 0;
    var tempCost = baseCost;
    
    if (mode === 100) {
      // MAX - покупаем сколько можем
      var budget = state.shawarmas;
      while (Math.floor(tempCost * discount) <= budget && count < 1000) {
        var cost = Math.floor(tempCost * discount);
        totalCost += cost;
        budget -= cost;
        tempCost = Math.floor(tempCost * 1.15);
        count++;
      }
    } else {
      // x1 или x10
      for (var i = 0; i < mode; i++) {
        totalCost += Math.floor(tempCost * discount);
        tempCost = Math.floor(tempCost * 1.15);
        count++;
      }
      // Проверяем можем ли купить
      if (totalCost > state.shawarmas) {
        count = 0;
        totalCost = Math.floor(baseCost * discount); // Показываем цену 1 штуки
      }
    }
    
    if (count === 0) {
      totalCost = Math.floor(baseCost * discount);
    }
    
    return { count: count, totalCost: totalCost };
  },
  
  renderUpgrades: function() {
    var state = Game.state;
    var html = '<div class="space-y-2">';
    
    for (var i = 0; i < state.upgrades.length; i++) {
      var u = state.upgrades[i];
      var cls, desc;
      
      if (u.purchased) {
        cls = 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400';
        desc = '✅ Куплено';
      } else if (state.shawarmas >= u.cost) {
        cls = 'bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-400 cursor-pointer shadow-md';
      } else {
        cls = 'bg-gray-100 border-2 border-gray-300 opacity-50 cursor-not-allowed';
      }
      
      if (!u.purchased) {
        if (u.type === 'click') desc = '+' + u.clickBonus + ' за клик';
        else if (u.type === 'production') desc = 'x' + u.productionMultiplier + ' производство';
        else desc = '-' + Math.floor((1 - u.buildingDiscount) * 100) + '% стоимость';
      }
      
      html += '<button data-action="buy-upgrade" data-id="' + u.id + '" ' +
        (u.purchased || state.shawarmas < u.cost ? 'disabled' : '') +
        ' class="w-full p-3 rounded-xl text-left ' + cls + '">' +
        '<div class="flex justify-between items-center">' +
          '<div class="flex items-center gap-3">' +
            '<span class="text-2xl">' + u.emoji + '</span>' +
            '<div>' +
              '<div class="font-bold">' + u.name + '</div>' +
              '<div class="text-sm text-gray-600">' + desc + '</div>' +
            '</div>' +
          '</div>' +
          (u.purchased ? '' : '<div class="text-orange-600 font-bold">' + this.formatNumber(u.cost) + ' 🌯</div>') +
        '</div>' +
      '</button>';
    }
    
    return html + '</div>';
  },
  
  renderAchievements: function() {
    var state = Game.state;
    var totalBuildings = Game.getTotalBuildings();
    var unlocked = 0;
    for (var j = 0; j < state.achievements.length; j++) {
      if (state.achievements[j].unlocked) unlocked++;
    }
    
    var html = '<div class="space-y-2">' +
      '<div class="text-center p-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl">' +
        '<span class="font-bold text-orange-600">' + unlocked + '/' + state.achievements.length + '</span> достижений' +
      '</div>';
    
    for (var i = 0; i < state.achievements.length; i++) {
      var a = state.achievements[i];
      var progress = 0;
      if (a.type === 'total') progress = state.totalShawarmas;
      else if (a.type === 'clicks') progress = state.clickCount;
      else if (a.type === 'buildings') progress = totalBuildings;
      else if (a.type === 'prestige') progress = state.prestigeLevel;
      
      var pct = Math.min((progress / a.target) * 100, 100);
      var bg = a.unlocked ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-500' : 'bg-gray-50 border-gray-200';
      
      html += '<div class="p-3 rounded-xl border-2 ' + bg + '">' +
        '<div class="flex items-center gap-3">' +
          '<span class="text-3xl">' + (a.unlocked ? '🏆' : '🔒') + '</span>' +
          '<div class="flex-1">' +
            '<div class="font-bold">' + a.name + '</div>' +
            '<div class="text-xs text-gray-600">' + a.desc + '</div>' +
            '<div class="text-xs text-orange-600">🎁 +' + this.formatNumber(a.reward) + '</div>' +
            (a.unlocked ? '<div class="text-green-600 text-xs font-bold">✨ Получено!</div>' :
              '<div class="mt-1"><div class="w-full bg-gray-300 rounded-full h-2">' +
              '<div data-ach-bar="' + a.id + '" class="bg-orange-500 h-2 rounded-full transition-all duration-300" style="width:' + pct + '%"></div></div>' +
              '<div data-ach-text="' + a.id + '" class="text-xs text-gray-500 mt-1">' + this.formatNumber(progress) + '/' + this.formatNumber(a.target) + '</div></div>') +
          '</div>' +
        '</div>' +
      '</div>';
    }
    
    return html + '</div>';
  },
  
  // Обновление прогресса достижений (без перерисовки всего)
  updateAchievementsProgress: function() {
    var state = Game.state;
    var totalBuildings = Game.getTotalBuildings();
    
    for (var i = 0; i < state.achievements.length; i++) {
      var a = state.achievements[i];
      if (a.unlocked) continue;
      
      var progress = 0;
      if (a.type === 'total') progress = state.totalShawarmas;
      else if (a.type === 'clicks') progress = state.clickCount;
      else if (a.type === 'buildings') progress = totalBuildings;
      else if (a.type === 'prestige') progress = state.prestigeLevel;
      
      var pct = Math.min((progress / a.target) * 100, 100);
      
      // Находим элементы по data-атрибутам
      var progressBar = document.querySelector('[data-ach-bar="' + a.id + '"]');
      var progressText = document.querySelector('[data-ach-text="' + a.id + '"]');
      
      if (progressBar) {
        progressBar.style.width = pct + '%';
      }
      if (progressText) {
        progressText.textContent = this.formatNumber(progress) + '/' + this.formatNumber(a.target);
      }
    }
  }
};

console.log('✅ ui.js загружен');
