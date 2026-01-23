// Отрисовка интерфейса

const UI = {
  lastRenderTime: 0,
  renderThrottle: 500, // Рендерим раз в 500мс
  isInitialized: false,
  
  // Форматирование чисел
  formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return Math.floor(num).toString();
  },
  
  // Обновить только счётчики (без перерисовки всего)
  updateCounters() {
    const state = Game.state;
    
    const shawarmasEl = document.getElementById('counter-shawarmas');
    const perClickEl = document.getElementById('counter-perclick');
    const perSecondEl = document.getElementById('counter-persecond');
    
    if (shawarmasEl) shawarmasEl.textContent = this.formatNumber(state.shawarmas);
    if (perClickEl) perClickEl.textContent = '+' + this.formatNumber(state.perClick);
    if (perSecondEl) perSecondEl.textContent = '+' + this.formatNumber(state.perSecond) + '/с';
    
    const totalEl = document.getElementById('counter-total');
    const lifetimeEl = document.getElementById('counter-lifetime');
    const clicksEl = document.getElementById('counter-clicks');
    
    if (totalEl) totalEl.textContent = this.formatNumber(state.totalShawarmas);
    if (lifetimeEl) lifetimeEl.textContent = this.formatNumber(state.lifetimeShawarmas);
    if (clicksEl) clicksEl.textContent = state.clickCount;
  },
  
  // Показать всплывающее число при клике
  showFloatingNumber(x, y, value) {
    const div = document.createElement('div');
    div.className = 'float-number fixed text-3xl font-bold text-orange-600 z-50';
    div.textContent = '+' + this.formatNumber(value);
    div.style.left = x + 'px';
    div.style.top = y + 'px';
    div.style.textShadow = '2px 2px 4px rgba(0,0,0,0.3)';
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 1000);
  },
  
  // Создать частицы
  createParticles(x, y, count, emoji = '🌯') {
    const container = document.getElementById('particles-container');
    
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle fixed text-2xl';
      particle.textContent = emoji;
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      
      const angle = (Math.PI * 2 * i) / count;
      const distance = 50 + Math.random() * 50;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      
      particle.style.setProperty('--tx', tx + 'px');
      particle.style.setProperty('--ty', ty + 'px');
      
      container.appendChild(particle);
      setTimeout(() => particle.remove(), 800);
    }
  },
  
  // Показать всплывающее уведомление о достижении
  showAchievementPopup(ach) {
    const container = document.getElementById('achievements-container');
    const div = document.createElement('div');
    div.className = 'achievement-popup bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-lg shadow-2xl max-w-xs';
    div.innerHTML = `
      <div class="font-bold text-lg">${ach.emoji || '🏆'} ${ach.reward > 0 ? 'Достижение!' : 'Уведомление'}</div>
      <div class="font-semibold">${ach.name}</div>
      <div class="text-sm opacity-90">${ach.desc}</div>
      ${ach.reward > 0 ? `<div class="text-sm font-bold mt-1">+${this.formatNumber(ach.reward)} 🌯</div>` : ''}
    `;
    container.appendChild(div);
    
    setTimeout(() => {
      div.style.opacity = '0';
      div.style.transition = 'opacity 0.5s';
      setTimeout(() => div.remove(), 500);
    }, 3000);
  },
  
  // Основная отрисовка интерфейса (только при смене таба или первой загрузке)
  render(force = false) {
    // Если уже инициализировано и не force - только обновляем счётчики
    if (this.isInitialized && !force) {
      this.updateCounters();
      return;
    }
    
    this.isInitialized = true;
    
    const state = Game.state;
    const unlockedAchievements = state.achievements.filter(a => a.unlocked).length;
    const canPrestige = state.totalShawarmas >= 1000000;
    
    document.getElementById('app').innerHTML = `
      <div class="min-h-screen pb-20">
        <!-- Шапка -->
        <div class="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white p-4 shadow-lg sticky top-0 z-50">
          <div class="flex justify-between items-center mb-2">
            <h1 class="text-3xl font-bold">🌯 Империя Шаурмы</h1>
            ${canPrestige ? '<button data-action="open-prestige" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-bold text-sm golden-shine">⭐ Престиж</button>' : ''}
          </div>
          ${!Game.isTelegram ? '<div class="text-center text-xs opacity-75 mb-2">🌐 Режим браузера</div>' : ''}
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="bg-white bg-opacity-20 rounded-lg p-2">
              <div id="counter-shawarmas" class="text-2xl font-bold">${this.formatNumber(state.shawarmas)}</div>
              <div class="text-xs opacity-90">Шаурмы</div>
            </div>
            <div class="bg-white bg-opacity-20 rounded-lg p-2">
              <div id="counter-perclick" class="text-lg font-bold">+${this.formatNumber(state.perClick)}</div>
              <div class="text-xs opacity-90">За клик</div>
            </div>
            <div class="bg-white bg-opacity-20 rounded-lg p-2">
              <div id="counter-persecond" class="text-lg font-bold">+${this.formatNumber(state.perSecond)}/с</div>
              <div class="text-xs opacity-90">В секунду</div>
            </div>
          </div>
          ${state.prestigeLevel > 0 ? `<div class="text-center mt-2 text-sm bg-purple-600 bg-opacity-50 rounded-lg py-1">⭐ Престиж: ${state.prestigeLevel} (x${state.prestigeBonus.toFixed(2)} множитель)</div>` : ''}
        </div>

        <div class="max-w-2xl mx-auto p-4 space-y-4">
          <!-- Кликер -->
          <div class="bg-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
            <div class="flex justify-center relative z-10">
              <button id="shawarma-btn" data-action="click-shawarma" class="text-9xl transform hover:scale-105 active:scale-95 transition-transform cursor-pointer select-none filter drop-shadow-2xl">
                🌯
              </button>
            </div>
            <p class="text-center text-gray-600 mt-4 font-semibold">Нажми на шаурму!</p>
            <div class="text-center text-sm text-gray-500 mt-2 space-y-1">
              <div>Всего создано: <span id="counter-total">${this.formatNumber(state.totalShawarmas)}</span></div>
              <div>За всё время: <span id="counter-lifetime">${this.formatNumber(state.lifetimeShawarmas)}</span> | Кликов: <span id="counter-clicks">${state.clickCount}</span></div>
            </div>
          </div>

          <!-- Табы и контент -->
          <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div class="grid grid-cols-3 gap-0 border-b-2 border-gray-200">
              <button data-action="switch-tab" data-tab="buildings" class="p-3 font-semibold transition-all ${state.currentTab === 'buildings' ? 'bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
                🏪 Магазин
              </button>
              <button data-action="switch-tab" data-tab="upgrades" class="p-3 font-semibold transition-all ${state.currentTab === 'upgrades' ? 'bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
                ⚡ Улучшения
              </button>
              <button data-action="switch-tab" data-tab="achievements" class="p-3 font-semibold transition-all ${state.currentTab === 'achievements' ? 'bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
                🏆 ${unlockedAchievements > 0 ? `(${unlockedAchievements})` : 'Награды'}
              </button>
            </div>

            <div id="tab-content" class="p-4 max-h-96 overflow-y-auto">
              ${state.currentTab === 'buildings' ? this.renderBuildings() : ''}
              ${state.currentTab === 'upgrades' ? this.renderUpgrades() : ''}
              ${state.currentTab === 'achievements' ? this.renderAchievements() : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  },
  
  // Обновить контент таба (без перерисовки всего)
  updateTabContent() {
    const state = Game.state;
    const tabContent = document.getElementById('tab-content');
    
    if (!tabContent) return;
    
    if (state.currentTab === 'buildings') {
      tabContent.innerHTML = this.renderBuildings();
    } else if (state.currentTab === 'upgrades') {
      tabContent.innerHTML = this.renderUpgrades();
    } else if (state.currentTab === 'achievements') {
      tabContent.innerHTML = this.renderAchievements();
    }
  },
  
  // Отрисовка магазина зданий
  renderBuildings() {
    const state = Game.state;
    
    return `
      <div class="space-y-2">
        ${state.buildings.map(building => {
          const discount = state.upgrades
            .filter(u => u.purchased && u.type === 'discount')
            .reduce((disc, u) => disc * u.buildingDiscount, 1);
          const finalCost = Math.floor(building.cost * discount);
          const canBuy = state.shawarmas >= finalCost;
          
          return `
            <button
              data-action="buy-building"
              data-id="${building.id}"
              ${!canBuy ? 'disabled' : ''}
              class="w-full p-3 rounded-xl text-left transition-all transform ${
                canBuy
                  ? 'bg-gradient-to-r from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 border-2 border-orange-400 cursor-pointer shadow-md hover:shadow-xl hover:scale-102 active:scale-98'
                  : 'bg-gray-100 border-2 border-gray-300 opacity-50 cursor-not-allowed'
              }"
            >
              <div class="flex justify-between items-center pointer-events-none">
                <div class="flex items-center gap-3 flex-1">
                  <div class="text-4xl filter drop-shadow-lg">${building.emoji}</div>
                  <div class="flex-1">
                    <div class="font-bold text-lg">${building.name}</div>
                    <div class="text-xs text-gray-600">${building.desc}</div>
                    <div class="text-sm text-orange-600 font-semibold mt-1">+${this.formatNumber(building.production * state.prestigeBonus)}/с</div>
                    <div class="text-xs text-gray-500">Куплено: ${building.owned}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-orange-600 font-bold text-xl">${this.formatNumber(finalCost)}</div>
                  <div class="text-xs text-gray-500">🌯</div>
                  ${discount < 1 ? '<div class="text-xs text-green-600 font-semibold">-' + Math.floor((1 - discount) * 100) + '%</div>' : ''}
                </div>
              </div>
            </button>
          `;
        }).join('')}
      </div>
    `;
  },
  
  // Отрисовка улучшений
  renderUpgrades() {
    const state = Game.state;
    const clickUpgrades = state.upgrades.filter(u => u.type === 'click');
    const productionUpgrades = state.upgrades.filter(u => u.type === 'production');
    const discountUpgrades = state.upgrades.filter(u => u.type === 'discount');
    
    return `
      <div class="space-y-4">
        <div>
          <h3 class="font-bold text-lg mb-2 text-orange-600 flex items-center gap-2">
            🖱️ Сила клика
          </h3>
          <div class="space-y-2">
            ${clickUpgrades.map(u => this.renderUpgradeButton(u)).join('')}
          </div>
        </div>
        
        <div>
          <h3 class="font-bold text-lg mb-2 text-orange-600 flex items-center gap-2">
            ⚙️ Производство
          </h3>
          <div class="space-y-2">
            ${productionUpgrades.map(u => this.renderUpgradeButton(u)).join('')}
          </div>
        </div>
        
        <div>
          <h3 class="font-bold text-lg mb-2 text-orange-600 flex items-center gap-2">
            💰 Экономия
          </h3>
          <div class="space-y-2">
            ${discountUpgrades.map(u => this.renderUpgradeButton(u)).join('')}
          </div>
        </div>
      </div>
    `;
  },
  
  // Отрисовка кнопки улучшения
  renderUpgradeButton(upgrade) {
    const state = Game.state;
    
    return `
      <button
        data-action="buy-upgrade"
        data-id="${upgrade.id}"
        ${upgrade.purchased || state.shawarmas < upgrade.cost ? 'disabled' : ''}
        class="w-full p-3 rounded-xl text-left transition-all transform ${
          upgrade.purchased
            ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 cursor-default'
            : state.shawarmas >= upgrade.cost
            ? 'bg-gradient-to-r from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 border-2 border-orange-400 cursor-pointer shadow-md hover:shadow-xl hover:scale-102 active:scale-98'
            : 'bg-gray-100 border-2 border-gray-300 opacity-50 cursor-not-allowed'
        }"
      >
        <div class="flex justify-between items-center pointer-events-none">
          <div class="flex items-center gap-3">
            <div class="text-3xl filter drop-shadow-lg">${upgrade.emoji}</div>
            <div>
              <div class="font-semibold text-lg">${upgrade.name}</div>
              <div class="text-sm text-gray-600">
                ${upgrade.purchased ? '✅ Куплено' : 
                  upgrade.type === 'click' ? `+${upgrade.clickBonus} за клик` :
                  upgrade.type === 'production' ? `x${upgrade.productionMultiplier} производство` :
                  `${Math.floor((1 - upgrade.buildingDiscount) * 100)}% скидка`
                }
              </div>
            </div>
          </div>
          ${!upgrade.purchased ? `<div class="text-orange-600 font-bold text-lg">${this.formatNumber(upgrade.cost)} 🌯</div>` : ''}
        </div>
      </button>
    `;
  },
  
  // Отрисовка достижений
  renderAchievements() {
    const state = Game.state;
    const totalBuildings = state.buildings.reduce((sum, b) => sum + b.owned, 0);
    
    return `
      <div class="space-y-3">
        <div class="text-center p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl">
          <div class="text-lg font-bold text-orange-600">
            ${state.achievements.filter(a => a.unlocked).length} / ${state.achievements.length}
          </div>
          <div class="text-sm text-gray-600">Разблокировано достижений</div>
        </div>
        ${state.achievements.map(ach => {
          let progress = 0;
          if (ach.type === 'total') progress = state.totalShawarmas;
          if (ach.type === 'clicks') progress = state.clickCount;
          if (ach.type === 'buildings') progress = totalBuildings;
          if (ach.type === 'prestige') progress = state.prestigeLevel;
          
          const percent = Math.min((progress / ach.target) * 100, 100);
          
          return `
            <div class="p-4 rounded-xl transition-all ${ach.unlocked ? 'bg-gradient-to-r from-yellow-100 via-orange-100 to-yellow-100 border-2 border-yellow-500 shadow-lg' : 'bg-gray-50 border-2 border-gray-300 hover:border-gray-400'}">
              <div class="flex items-start gap-3">
                <div class="text-4xl filter drop-shadow-lg">${ach.unlocked ? '🏆' : '🔒'}</div>
                <div class="flex-1">
                  <div class="font-bold text-lg ${ach.unlocked ? 'text-orange-600' : ''}">${ach.name}</div>
                  <div class="text-sm text-gray-600">${ach.desc}</div>
                  <div class="text-sm font-semibold text-orange-600 mt-1">🎁 Награда: +${this.formatNumber(ach.reward)} 🌯</div>
                  ${!ach.unlocked ? `
                    <div class="mt-2">
                      <div class="flex justify-between text-xs text-gray-600 mb-1">
                        <span>${this.formatNumber(progress)} / ${this.formatNumber(ach.target)}</span>
                        <span class="font-semibold">${percent.toFixed(0)}%</span>
                      </div>
                      <div class="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                        <div class="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all duration-500 shadow-inner" style="width: ${percent}%"></div>
                      </div>
                    </div>
                  ` : '<div class="text-green-600 font-bold mt-1 flex items-center gap-1">✨ Разблокировано!</div>'}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
};
