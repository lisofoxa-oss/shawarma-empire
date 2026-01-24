// Отрисовка интерфейса
// Исправлено для совместимости с мобильными устройствами

var UI = {
  lastRenderTime: 0,
  renderThrottle: 500,
  isInitialized: false,
  
  // Форматирование чисел
  formatNumber: function(num) {
    if (num === undefined || num === null || isNaN(num)) return '0';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return Math.floor(num).toString();
  },
  
  // Обновить только счётчики
  updateCounters: function() {
    var state = Game.state;
    
    var shawarmasEl = document.getElementById('counter-shawarmas');
    var perClickEl = document.getElementById('counter-perclick');
    var perSecondEl = document.getElementById('counter-persecond');
    
    if (shawarmasEl) shawarmasEl.textContent = this.formatNumber(state.shawarmas);
    if (perClickEl) perClickEl.textContent = '+' + this.formatNumber(state.perClick);
    if (perSecondEl) perSecondEl.textContent = '+' + this.formatNumber(state.perSecond) + '/с';
    
    var totalEl = document.getElementById('counter-total');
    var lifetimeEl = document.getElementById('counter-lifetime');
    var clicksEl = document.getElementById('counter-clicks');
    
    if (totalEl) totalEl.textContent = this.formatNumber(state.totalShawarmas);
    if (lifetimeEl) lifetimeEl.textContent = this.formatNumber(state.lifetimeShawarmas);
    if (clicksEl) clicksEl.textContent = state.clickCount;
  },
  
  // Обновить состояние кнопок
  updateButtonStates: function() {
    var state = Game.state;
    var self = this;
    var discount = Game.getBuildingDiscount();
    
    // Обновляем кнопки зданий
    var buildingBtns = document.querySelectorAll('[data-action="buy-building"]');
    for (var i = 0; i < buildingBtns.length; i++) {
      var btn = buildingBtns[i];
      var buildingId = parseInt(btn.dataset.id, 10);
      var building = Game.findBuilding(buildingId);
      if (!building) continue;
      
      var finalCost = Math.floor(building.cost * discount);
      var canBuy = state.shawarmas >= finalCost;
      
      if (canBuy) {
        btn.disabled = false;
        btn.className = 'w-full p-3 rounded-xl text-left transition-all transform bg-gradient-to-r from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 border-2 border-orange-400 cursor-pointer shadow-md hover:shadow-xl hover:scale-102 active:scale-98';
      } else {
        btn.disabled = true;
        btn.className = 'w-full p-3 rounded-xl text-left transition-all transform bg-gray-100 border-2 border-gray-300 opacity-50 cursor-not-allowed';
      }
    }
    
    // Обновляем кнопки улучшений
    var upgradeBtns = document.querySelectorAll('[data-action="buy-upgrade"]');
    for (var j = 0; j < upgradeBtns.length; j++) {
      var uBtn = upgradeBtns[j];
      var upgradeId = parseInt(uBtn.dataset.id, 10);
      var upgrade = Game.findUpgrade(upgradeId);
      if (!upgrade) continue;
      
      if (upgrade.purchased) {
        uBtn.disabled = true;
        uBtn.className = 'w-full p-3 rounded-xl text-left transition-all transform bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 cursor-default';
      } else if (state.shawarmas >= upgrade.cost) {
        uBtn.disabled = false;
        uBtn.className = 'w-full p-3 rounded-xl text-left transition-all transform bg-gradient-to-r from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 border-2 border-orange-400 cursor-pointer shadow-md hover:shadow-xl hover:scale-102 active:scale-98';
      } else {
        uBtn.disabled = true;
        uBtn.className = 'w-full p-3 rounded-xl text-left transition-all transform bg-gray-100 border-2 border-gray-300 opacity-50 cursor-not-allowed';
      }
    }
  },
  
  // Принудительное обновление таба
  forceUpdateTab: function() {
    var state = Game.state;
    var tabContent = document.getElementById('tab-content');
    
    if (!tabContent) return;
    
    if (state.currentTab === 'buildings') {
      tabContent.innerHTML = this.renderBuildings();
    } else if (state.currentTab === 'upgrades') {
      tabContent.innerHTML = this.renderUpgrades();
    } else if (state.currentTab === 'achievements') {
      tabContent.innerHTML = this.renderAchievements();
    }
  },
  
  // Показать всплывающее число
  showFloatingNumber: function(x, y, value) {
    var div = document.createElement('div');
    div.className = 'float-number fixed text-3xl font-bold text-orange-600 z-50';
    div.textContent = '+' + this.formatNumber(value);
    div.style.left = x + 'px';
    div.style.top = y + 'px';
    div.style.textShadow = '2px 2px 4px rgba(0,0,0,0.3)';
    document.body.appendChild(div);
    setTimeout(function() {
      if (div.parentNode) div.parentNode.removeChild(div);
    }, 1000);
  },
  
  // Создать частицы
  createParticles: function(x, y, count, emoji) {
    var container = document.getElementById('particles-container');
    if (!container) return;
    
    emoji = emoji || '🌯';
    
    for (var i = 0; i < count; i++) {
      var particle = document.createElement('div');
      particle.className = 'particle fixed text-2xl';
      particle.textContent = emoji;
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      
      var angle = (Math.PI * 2 * i) / count;
      var distance = 50 + Math.random() * 50;
      var tx = Math.cos(angle) * distance;
      var ty = Math.sin(angle) * distance;
      
      particle.style.setProperty('--tx', tx + 'px');
      particle.style.setProperty('--ty', ty + 'px');
      
      container.appendChild(particle);
      
      (function(p) {
        setTimeout(function() {
          if (p.parentNode) p.parentNode.removeChild(p);
        }, 800);
      })(particle);
    }
  },
  
  // Показать всплывающее уведомление
  showAchievementPopup: function(ach) {
    var container = document.getElementById('achievements-container');
    if (!container) return;
    
    var self = this;
    var div = document.createElement('div');
    div.className = 'achievement-popup bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-lg shadow-2xl max-w-xs';
    
    var rewardText = ach.reward > 0 ? '<div class="text-sm font-bold mt-1">+' + this.formatNumber(ach.reward) + ' 🌯</div>' : '';
    var title = ach.reward > 0 ? 'Достижение!' : 'Уведомление';
    var achEmoji = ach.emoji || '🏆';
    
    div.innerHTML = '<div class="font-bold text-lg">' + achEmoji + ' ' + title + '</div>' +
      '<div class="font-semibold">' + ach.name + '</div>' +
      '<div class="text-sm opacity-90">' + ach.desc + '</div>' +
      rewardText;
    
    container.appendChild(div);
    
    setTimeout(function() {
      div.style.opacity = '0';
      div.style.transition = 'opacity 0.5s';
      setTimeout(function() {
        if (div.parentNode) div.parentNode.removeChild(div);
      }, 500);
    }, 3000);
  },
  
  // Основная отрисовка интерфейса
  render: function(force) {
    if (this.isInitialized && !force) {
      this.updateCounters();
      return;
    }
    
    this.isInitialized = true;
    
    var state = Game.state;
    var unlockedAchievements = 0;
    for (var i = 0; i < state.achievements.length; i++) {
      if (state.achievements[i].unlocked) unlockedAchievements++;
    }
    var canPrestige = state.totalShawarmas >= 1000000;
    
    var prestigeBtn = canPrestige 
      ? '<button data-action="open-prestige" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-bold text-sm golden-shine">⭐ Престиж</button>' 
      : '';
    
    var browserModeNotice = !Game.isTelegram 
      ? '<div class="text-center text-xs opacity-75 mb-2">🌐 Режим браузера</div>' 
      : '';
    
    var prestigeStatus = state.prestigeLevel > 0 
      ? '<div class="text-center mt-2 text-sm bg-purple-600 bg-opacity-50 rounded-lg py-1">⭐ Престиж: ' + state.prestigeLevel + ' (x' + state.prestigeBonus.toFixed(2) + ' множитель)</div>' 
      : '';
    
    var tabContent = '';
    if (state.currentTab === 'buildings') {
      tabContent = this.renderBuildings();
    } else if (state.currentTab === 'upgrades') {
      tabContent = this.renderUpgrades();
    } else if (state.currentTab === 'achievements') {
      tabContent = this.renderAchievements();
    }
    
    var buildingsTabClass = state.currentTab === 'buildings' 
      ? 'bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-lg' 
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    var upgradesTabClass = state.currentTab === 'upgrades' 
      ? 'bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-lg' 
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    var achievementsTabClass = state.currentTab === 'achievements' 
      ? 'bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-lg' 
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    
    var achievementsLabel = unlockedAchievements > 0 ? '(' + unlockedAchievements + ')' : 'Награды';
    
    var appEl = document.getElementById('app');
    if (appEl) {
      appEl.innerHTML = 
        '<div class="min-h-screen pb-20">' +
          '<!-- Шапка -->' +
          '<div class="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white p-4 shadow-lg sticky top-0 z-50">' +
            '<div class="flex justify-between items-center mb-2">' +
              '<h1 class="text-3xl font-bold">🌯 Империя Шаурмы</h1>' +
              prestigeBtn +
            '</div>' +
            browserModeNotice +
            '<div class="grid grid-cols-3 gap-2 text-center">' +
              '<div class="bg-white bg-opacity-20 rounded-lg p-2">' +
                '<div id="counter-shawarmas" class="text-2xl font-bold">' + this.formatNumber(state.shawarmas) + '</div>' +
                '<div class="text-xs opacity-90">Шаурмы</div>' +
              '</div>' +
              '<div class="bg-white bg-opacity-20 rounded-lg p-2">' +
                '<div id="counter-perclick" class="text-lg font-bold">+' + this.formatNumber(state.perClick) + '</div>' +
                '<div class="text-xs opacity-90">За клик</div>' +
              '</div>' +
              '<div class="bg-white bg-opacity-20 rounded-lg p-2">' +
                '<div id="counter-persecond" class="text-lg font-bold">+' + this.formatNumber(state.perSecond) + '/с</div>' +
                '<div class="text-xs opacity-90">В секунду</div>' +
              '</div>' +
            '</div>' +
            prestigeStatus +
          '</div>' +
          
          '<div class="max-w-2xl mx-auto p-4 space-y-4">' +
            '<!-- Кликер -->' +
            '<div class="bg-white rounded-2xl p-8 shadow-xl relative overflow-hidden">' +
              '<div class="flex justify-center relative z-10">' +
                '<button id="shawarma-btn" data-action="click-shawarma" class="text-9xl transform hover:scale-105 active:scale-95 transition-transform cursor-pointer select-none filter drop-shadow-2xl">' +
                  '🌯' +
                '</button>' +
              '</div>' +
              '<p class="text-center text-gray-600 mt-4 font-semibold">Нажми на шаурму!</p>' +
              '<div class="text-center text-sm text-gray-500 mt-2 space-y-1">' +
                '<div>Всего создано: <span id="counter-total">' + this.formatNumber(state.totalShawarmas) + '</span></div>' +
                '<div>За всё время: <span id="counter-lifetime">' + this.formatNumber(state.lifetimeShawarmas) + '</span> | Кликов: <span id="counter-clicks">' + state.clickCount + '</span></div>' +
              '</div>' +
            '</div>' +
            
            '<!-- Табы и контент -->' +
            '<div class="bg-white rounded-2xl shadow-xl overflow-hidden">' +
              '<div class="grid grid-cols-3 gap-0 border-b-2 border-gray-200">' +
                '<button data-action="switch-tab" data-tab="buildings" class="p-3 font-semibold transition-all ' + buildingsTabClass + '">' +
                  '🏪 Магазин' +
                '</button>' +
                '<button data-action="switch-tab" data-tab="upgrades" class="p-3 font-semibold transition-all ' + upgradesTabClass + '">' +
                  '⚡ Улучшения' +
                '</button>' +
                '<button data-action="switch-tab" data-tab="achievements" class="p-3 font-semibold transition-all ' + achievementsTabClass + '">' +
                  '🏆 ' + achievementsLabel +
                '</button>' +
              '</div>' +
              '<div id="tab-content" class="p-4 max-h-96 overflow-y-auto">' +
                tabContent +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    }
  },
  
  // Отрисовка магазина зданий
  renderBuildings: function() {
    var state = Game.state;
    var self = this;
    var discount = Game.getBuildingDiscount();
    var html = '<div class="space-y-2">';
    
    for (var i = 0; i < state.buildings.length; i++) {
      var building = state.buildings[i];
      var finalCost = Math.floor(building.cost * discount);
      var canBuy = state.shawarmas >= finalCost;
      
      var btnClass = canBuy
        ? 'bg-gradient-to-r from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 border-2 border-orange-400 cursor-pointer shadow-md hover:shadow-xl hover:scale-102 active:scale-98'
        : 'bg-gray-100 border-2 border-gray-300 opacity-50 cursor-not-allowed';
      
      var discountText = discount < 1 
        ? '<div class="text-xs text-green-600 font-semibold">-' + Math.floor((1 - discount) * 100) + '%</div>' 
        : '';
      
      html += '<button data-action="buy-building" data-id="' + building.id + '" ' + 
        (canBuy ? '' : 'disabled') + 
        ' class="w-full p-3 rounded-xl text-left transition-all transform ' + btnClass + '">' +
        '<div class="flex justify-between items-center pointer-events-none">' +
          '<div class="flex items-center gap-3 flex-1">' +
            '<div class="text-4xl filter drop-shadow-lg">' + building.emoji + '</div>' +
            '<div class="flex-1">' +
              '<div class="font-bold text-lg">' + building.name + '</div>' +
              '<div class="text-xs text-gray-600">' + building.desc + '</div>' +
              '<div class="text-sm text-orange-600 font-semibold mt-1">+' + this.formatNumber(building.production * state.prestigeBonus) + '/с</div>' +
              '<div class="text-xs text-gray-500">Куплено: ' + building.owned + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="text-right">' +
            '<div class="text-orange-600 font-bold text-xl">' + this.formatNumber(finalCost) + '</div>' +
            '<div class="text-xs text-gray-500">🌯</div>' +
            discountText +
          '</div>' +
        '</div>' +
      '</button>';
    }
    
    html += '</div>';
    return html;
  },
  
  // Отрисовка улучшений
  renderUpgrades: function() {
    var state = Game.state;
    var self = this;
    
    var clickUpgrades = [];
    var productionUpgrades = [];
    var discountUpgrades = [];
    
    for (var i = 0; i < state.upgrades.length; i++) {
      var u = state.upgrades[i];
      if (u.type === 'click') clickUpgrades.push(u);
      else if (u.type === 'production') productionUpgrades.push(u);
      else if (u.type === 'discount') discountUpgrades.push(u);
    }
    
    var html = '<div class="space-y-4">';
    
    // Сила клика
    html += '<div><h3 class="font-bold text-lg mb-2 text-orange-600 flex items-center gap-2">🖱️ Сила клика</h3><div class="space-y-2">';
    for (var j = 0; j < clickUpgrades.length; j++) {
      html += this.renderUpgradeButton(clickUpgrades[j]);
    }
    html += '</div></div>';
    
    // Производство
    html += '<div><h3 class="font-bold text-lg mb-2 text-orange-600 flex items-center gap-2">⚙️ Производство</h3><div class="space-y-2">';
    for (var k = 0; k < productionUpgrades.length; k++) {
      html += this.renderUpgradeButton(productionUpgrades[k]);
    }
    html += '</div></div>';
    
    // Экономия
    html += '<div><h3 class="font-bold text-lg mb-2 text-orange-600 flex items-center gap-2">💰 Экономия</h3><div class="space-y-2">';
    for (var l = 0; l < discountUpgrades.length; l++) {
      html += this.renderUpgradeButton(discountUpgrades[l]);
    }
    html += '</div></div>';
    
    html += '</div>';
    return html;
  },
  
  // Отрисовка кнопки улучшения
  renderUpgradeButton: function(upgrade) {
    var state = Game.state;
    
    var btnClass, descText;
    
    if (upgrade.purchased) {
      btnClass = 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 cursor-default';
      descText = '✅ Куплено';
    } else if (state.shawarmas >= upgrade.cost) {
      btnClass = 'bg-gradient-to-r from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 border-2 border-orange-400 cursor-pointer shadow-md hover:shadow-xl hover:scale-102 active:scale-98';
    } else {
      btnClass = 'bg-gray-100 border-2 border-gray-300 opacity-50 cursor-not-allowed';
    }
    
    if (!upgrade.purchased) {
      if (upgrade.type === 'click') {
        descText = '+' + upgrade.clickBonus + ' за клик';
      } else if (upgrade.type === 'production') {
        descText = 'x' + upgrade.productionMultiplier + ' производство';
      } else {
        descText = Math.floor((1 - upgrade.buildingDiscount) * 100) + '% скидка';
      }
    }
    
    var costText = !upgrade.purchased 
      ? '<div class="text-orange-600 font-bold text-lg">' + this.formatNumber(upgrade.cost) + ' 🌯</div>' 
      : '';
    
    return '<button data-action="buy-upgrade" data-id="' + upgrade.id + '" ' +
      ((upgrade.purchased || state.shawarmas < upgrade.cost) ? 'disabled' : '') +
      ' class="w-full p-3 rounded-xl text-left transition-all transform ' + btnClass + '">' +
      '<div class="flex justify-between items-center pointer-events-none">' +
        '<div class="flex items-center gap-3">' +
          '<div class="text-3xl filter drop-shadow-lg">' + upgrade.emoji + '</div>' +
          '<div>' +
            '<div class="font-semibold text-lg">' + upgrade.name + '</div>' +
            '<div class="text-sm text-gray-600">' + descText + '</div>' +
          '</div>' +
        '</div>' +
        costText +
      '</div>' +
    '</button>';
  },
  
  // Отрисовка достижений
  renderAchievements: function() {
    var state = Game.state;
    var self = this;
    var totalBuildings = Game.getTotalBuildings();
    
    var unlockedCount = 0;
    for (var i = 0; i < state.achievements.length; i++) {
      if (state.achievements[i].unlocked) unlockedCount++;
    }
    
    var html = '<div class="space-y-3">' +
      '<div class="text-center p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl">' +
        '<div class="text-lg font-bold text-orange-600">' + unlockedCount + ' / ' + state.achievements.length + '</div>' +
        '<div class="text-sm text-gray-600">Разблокировано достижений</div>' +
      '</div>';
    
    for (var j = 0; j < state.achievements.length; j++) {
      var ach = state.achievements[j];
      
      var progress = 0;
      if (ach.type === 'total') progress = state.totalShawarmas;
      else if (ach.type === 'clicks') progress = state.clickCount;
      else if (ach.type === 'buildings') progress = totalBuildings;
      else if (ach.type === 'prestige') progress = state.prestigeLevel;
      
      var percent = Math.min((progress / ach.target) * 100, 100);
      
      var achClass = ach.unlocked 
        ? 'bg-gradient-to-r from-yellow-100 via-orange-100 to-yellow-100 border-2 border-yellow-500 shadow-lg' 
        : 'bg-gray-50 border-2 border-gray-300 hover:border-gray-400';
      
      var achIcon = ach.unlocked ? '🏆' : '🔒';
      var achNameClass = ach.unlocked ? 'text-orange-600' : '';
      
      var progressBar = !ach.unlocked 
        ? '<div class="mt-2">' +
            '<div class="flex justify-between text-xs text-gray-600 mb-1">' +
              '<span>' + this.formatNumber(progress) + ' / ' + this.formatNumber(ach.target) + '</span>' +
              '<span class="font-semibold">' + percent.toFixed(0) + '%</span>' +
            '</div>' +
            '<div class="w-full bg-gray-300 rounded-full h-3 overflow-hidden">' +
              '<div class="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all duration-500 shadow-inner" style="width: ' + percent + '%"></div>' +
            '</div>' +
          '</div>'
        : '<div class="text-green-600 font-bold mt-1 flex items-center gap-1">✨ Разблокировано!</div>';
      
      html += '<div class="p-4 rounded-xl transition-all ' + achClass + '">' +
        '<div class="flex items-start gap-3">' +
          '<div class="text-4xl filter drop-shadow-lg">' + achIcon + '</div>' +
          '<div class="flex-1">' +
            '<div class="font-bold text-lg ' + achNameClass + '">' + ach.name + '</div>' +
            '<div class="text-sm text-gray-600">' + ach.desc + '</div>' +
            '<div class="text-sm font-semibold text-orange-600 mt-1">🎁 Награда: +' + this.formatNumber(ach.reward) + ' 🌯</div>' +
            progressBar +
          '</div>' +
        '</div>' +
      '</div>';
    }
    
    html += '</div>';
    return html;
  }
};

console.log('✅ ui.js загружен');
