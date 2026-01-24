// Отрисовка интерфейса v2.0
// js/ui.js

var UI = {
  isInitialized: false,
  
  formatNumber: function(num) {
    if (num === undefined || num === null || isNaN(num)) return '0';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
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
    var indicator = document.getElementById('combo-indicator');
    
    if (count < 3) {
      // Скрываем при низком комбо
      if (indicator) indicator.style.opacity = '0';
      return;
    }
    
    if (!indicator) {
      // Создаём индикатор если его нет
      indicator = document.createElement('div');
      indicator.id = 'combo-indicator';
      indicator.className = 'fixed top-32 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold shadow-lg z-30 transition-all';
      document.body.appendChild(indicator);
    }
    
    indicator.style.opacity = '1';
    indicator.innerHTML = '🔥 КОМБО x' + multiplier.toFixed(1) + ' (' + count + ')';
    
    // Эффект пульсации при высоком комбо
    if (multiplier >= 3) {
      indicator.style.transform = 'translateX(-50%) scale(1.1)';
      setTimeout(function() {
        indicator.style.transform = 'translateX(-50%) scale(1)';
      }, 100);
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
        html += '<div class="flex items-center gap-3 p-3 rounded-xl border-2 ' + bg + '">' +
          '<div class="text-2xl w-10 text-center">' + medal + '</div>' +
          '<div class="flex-1"><div class="font-bold">' + (l.first_name || l.username || 'Игрок') + '</div>' +
          '<div class="text-xs text-gray-500">' + this.formatNumber(l.lifetime_shawarmas) + ' 🌯</div></div>' +
          (l.prestige_level > 0 ? '<div class="text-purple-600 font-bold">⭐' + l.prestige_level + '</div>' : '') +
          '</div>';
      }
      html += '</div>';
    }
    content.innerHTML = html;
    modal.classList.remove('hidden');
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
  
  renderBuildings: function() {
    var state = Game.state;
    var discount = Game.getBuildingDiscount();
    var html = '<div class="space-y-2">';
    
    for (var i = 0; i < state.buildings.length; i++) {
      var b = state.buildings[i];
      var cost = Math.floor(b.cost * discount);
      var canBuy = state.shawarmas >= cost;
      var cls = canBuy
        ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-400 cursor-pointer shadow-md'
        : 'bg-gray-100 border-2 border-gray-300 opacity-50 cursor-not-allowed';
      
      html += '<button data-action="buy-building" data-id="' + b.id + '" ' + (canBuy ? '' : 'disabled') +
        ' class="w-full p-3 rounded-xl text-left ' + cls + '">' +
        '<div class="flex justify-between items-center">' +
          '<div class="flex items-center gap-3">' +
            '<span class="text-3xl">' + b.emoji + '</span>' +
            '<div>' +
              '<div class="font-bold">' + b.name + '</div>' +
              '<div class="text-xs text-gray-500">' + b.desc + '</div>' +
              '<div class="text-sm text-orange-600">+' + this.formatNumber(b.production * state.prestigeBonus) + '/с</div>' +
              '<div class="text-xs text-gray-400">Куплено: ' + b.owned + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="text-right">' +
            '<div class="text-orange-600 font-bold">' + this.formatNumber(cost) + '</div>' +
            '<div class="text-xs text-gray-500">🌯</div>' +
          '</div>' +
        '</div>' +
      '</button>';
    }
    
    return html + '</div>';
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
              '<div class="bg-orange-500 h-2 rounded-full" style="width:' + pct + '%"></div></div>' +
              '<div class="text-xs text-gray-500 mt-1">' + this.formatNumber(progress) + '/' + this.formatNumber(a.target) + '</div></div>') +
          '</div>' +
        '</div>' +
      '</div>';
    }
    
    return html + '</div>';
  }
};

console.log('✅ ui.js загружен');
