// Мини-игра Нарезка
// js/chopper.js
// Один большой ингредиент - режь на максимум полосок!

var Chopper = {
  active: false,
  score: 0,
  slices: 0,
  timeLeft: 0,
  duration: 10000, // 10 секунд на один ингредиент
  round: 0,
  totalRounds: 5,
  totalSlices: 0,
  
  // Ингредиенты для нарезки
  ingredients: [
    { emoji: '🥒', name: 'Огурец', color: '#4ade80', minSlices: 5 },
    { emoji: '🍅', name: 'Помидор', color: '#ef4444', minSlices: 4 },
    { emoji: '🥕', name: 'Морковь', color: '#fb923c', minSlices: 6 },
    { emoji: '🧅', name: 'Лук', color: '#d8b4fe', minSlices: 4 },
    { emoji: '🥩', name: 'Мясо', color: '#f87171', minSlices: 5 },
    { emoji: '🧀', name: 'Сыр', color: '#fde047', minSlices: 4 },
  ],
  
  currentIngredient: null,
  container: null,
  sliceLines: [],
  
  // Инициализация
  init: function() {
    console.log('✅ Chopper инициализирован');
  },
  
  // Открыть меню
  openMenu: function() {
    var self = this;
    
    var modal = document.createElement('div');
    modal.id = 'chopper-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
    
    var bestScore = localStorage.getItem('chopper_best') || 0;
    
    modal.innerHTML = 
      '<div class="bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl p-6 max-w-sm mx-4 text-center text-white shadow-2xl">' +
        '<div class="text-5xl mb-4">🥒</div>' +
        '<h2 class="text-2xl font-bold mb-2">Нарезка</h2>' +
        '<p class="text-sm opacity-90 mb-4">Нарежь ингредиент на максимум кусочков!<br>5 раундов по 10 секунд</p>' +
        '<div class="bg-white bg-opacity-20 rounded-xl p-3 mb-4">' +
          '<div class="text-sm">Лучший результат</div>' +
          '<div class="text-3xl font-bold">' + bestScore + ' полосок</div>' +
        '</div>' +
        '<div class="bg-white bg-opacity-20 rounded-xl p-3 mb-4">' +
          '<div class="text-sm">Награда</div>' +
          '<div class="text-lg">Полоски × 20 = 🌯 шаурмы</div>' +
        '</div>' +
        '<div class="flex gap-2">' +
          '<button data-action="close" class="flex-1 bg-white bg-opacity-30 py-3 rounded-xl font-bold hover:bg-opacity-40">Назад</button>' +
          '<button data-action="start" class="flex-1 bg-white text-orange-600 py-3 rounded-xl font-bold hover:bg-gray-100">Играть!</button>' +
        '</div>' +
      '</div>';
    
    document.body.appendChild(modal);
    
    modal.querySelector('[data-action="close"]').onclick = function() {
      modal.remove();
    };
    
    modal.querySelector('[data-action="start"]').onclick = function() {
      modal.remove();
      self.startGame();
    };
  },
  
  // Начать игру
  startGame: function() {
    this.active = true;
    this.round = 0;
    this.totalSlices = 0;
    
    // Приостанавливаем события
    if (typeof Events !== 'undefined') {
      Events.pauseEvents = true;
    }
    if (typeof Game !== 'undefined') {
      Game.removeGoldenShawarma();
    }
    
    this.startRound();
  },
  
  // Начать раунд
  startRound: function() {
    var self = this;
    this.round++;
    this.slices = 0;
    this.timeLeft = this.duration;
    this.sliceLines = [];
    
    // Выбираем случайный ингредиент
    this.currentIngredient = this.ingredients[Math.floor(Math.random() * this.ingredients.length)];
    
    this.createGameScreen();
    
    // Таймер
    var timerInterval = setInterval(function() {
      self.timeLeft -= 100;
      self.updateTimer();
      
      if (self.timeLeft <= 0) {
        clearInterval(timerInterval);
        self.endRound();
      }
    }, 100);
    
    // Звук
    if (typeof SoundManager !== 'undefined') {
      SoundManager.click();
    }
  },
  
  // Создать экран игры
  createGameScreen: function() {
    var self = this;
    var ing = this.currentIngredient;
    
    this.container = document.createElement('div');
    this.container.id = 'chopper-container';
    this.container.className = 'fixed inset-0 z-50';
    this.container.style.background = 'linear-gradient(to bottom, #1e3a5f, #0f172a)';
    
    this.container.innerHTML = 
      '<div class="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">' +
        '<div class="text-white">' +
          '<div class="text-sm opacity-80">Раунд</div>' +
          '<div class="text-2xl font-bold">' + this.round + '/' + this.totalRounds + '</div>' +
        '</div>' +
        '<div class="text-white text-center">' +
          '<div class="text-sm opacity-80">Полосок</div>' +
          '<div id="chopper-slices" class="text-3xl font-bold text-yellow-400">0</div>' +
        '</div>' +
        '<div class="text-white text-right">' +
          '<div class="text-sm opacity-80">Время</div>' +
          '<div id="chopper-timer" class="text-2xl font-bold">10.0</div>' +
        '</div>' +
      '</div>' +
      '<div class="absolute inset-0 flex items-center justify-center" style="top: 80px; bottom: 100px;">' +
        '<div id="chopper-board" class="relative bg-amber-100 rounded-3xl shadow-2xl" style="width: 280px; height: 400px; background: linear-gradient(135deg, #d4a574, #c4956a);">' +
          '<div class="absolute inset-4 rounded-2xl overflow-hidden" style="background: ' + ing.color + ';">' +
            '<div id="chopper-ingredient" class="w-full h-full flex items-center justify-center text-9xl select-none">' +
              ing.emoji +
            '</div>' +
            '<div id="chopper-slices-container" class="absolute inset-0 pointer-events-none"></div>' +
          '</div>' +
          '<canvas id="chopper-canvas" class="absolute inset-4 rounded-2xl" style="touch-action: none;"></canvas>' +
        '</div>' +
      '</div>' +
      '<div class="absolute bottom-4 left-4 right-4 text-center text-white">' +
        '<div class="text-lg font-bold">' + ing.emoji + ' ' + ing.name + '</div>' +
        '<div class="text-sm opacity-70">Проведи линии чтобы нарезать!</div>' +
      '</div>';
    
    document.body.appendChild(this.container);
    
    // Настраиваем canvas
    this.canvas = document.getElementById('chopper-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    var board = document.getElementById('chopper-board');
    this.canvas.width = board.clientWidth - 32;
    this.canvas.height = board.clientHeight - 32;
    
    this.setupTouchHandlers();
  },
  
  // Обработчики касаний
  setupTouchHandlers: function() {
    var self = this;
    var isDrawing = false;
    var startX = 0, startY = 0;
    
    function getPos(e) {
      var rect = self.canvas.getBoundingClientRect();
      var x, y;
      if (e.touches) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }
      return {x: x, y: y};
    }
    
    function startDraw(e) {
      e.preventDefault();
      isDrawing = true;
      var pos = getPos(e);
      startX = pos.x;
      startY = pos.y;
    }
    
    function draw(e) {
      if (!isDrawing) return;
      e.preventDefault();
      
      var pos = getPos(e);
      
      // Рисуем линию предпросмотра
      self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
      self.drawExistingLines();
      
      self.ctx.beginPath();
      self.ctx.moveTo(startX, startY);
      self.ctx.lineTo(pos.x, pos.y);
      self.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      self.ctx.lineWidth = 3;
      self.ctx.setLineDash([10, 5]);
      self.ctx.stroke();
      self.ctx.setLineDash([]);
    }
    
    function endDraw(e) {
      if (!isDrawing) return;
      isDrawing = false;
      
      var pos;
      if (e.changedTouches) {
        var rect = self.canvas.getBoundingClientRect();
        pos = {
          x: e.changedTouches[0].clientX - rect.left,
          y: e.changedTouches[0].clientY - rect.top
        };
      } else {
        pos = getPos(e);
      }
      
      // Проверяем длину линии (минимум 50px)
      var dx = pos.x - startX;
      var dy = pos.y - startY;
      var length = Math.sqrt(dx*dx + dy*dy);
      
      if (length >= 50) {
        self.addSlice(startX, startY, pos.x, pos.y);
      }
      
      self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
      self.drawExistingLines();
    }
    
    this.canvas.addEventListener('touchstart', startDraw);
    this.canvas.addEventListener('touchmove', draw);
    this.canvas.addEventListener('touchend', endDraw);
    
    this.canvas.addEventListener('mousedown', startDraw);
    this.canvas.addEventListener('mousemove', draw);
    this.canvas.addEventListener('mouseup', endDraw);
    this.canvas.addEventListener('mouseleave', function() {
      isDrawing = false;
      self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
      self.drawExistingLines();
    });
  },
  
  // Добавить разрез
  addSlice: function(x1, y1, x2, y2) {
    // Проверяем пересечения с существующими линиями
    // Линии не должны пересекаться слишком близко
    var tooClose = false;
    for (var i = 0; i < this.sliceLines.length; i++) {
      var line = this.sliceLines[i];
      var dist = this.lineDistance(x1, y1, x2, y2, line.x1, line.y1, line.x2, line.y2);
      if (dist < 15) {
        tooClose = true;
        break;
      }
    }
    
    if (!tooClose) {
      this.sliceLines.push({x1: x1, y1: y1, x2: x2, y2: y2});
      this.slices++;
      this.updateSlicesDisplay();
      
      // Звук
      if (typeof SoundManager !== 'undefined') {
        SoundManager.click();
      }
      
      // Вибрация
      if (typeof Game !== 'undefined' && Game.isTelegram && Game.tg && Game.tg.HapticFeedback) {
        try { Game.tg.HapticFeedback.impactOccurred('light'); } catch(e) {}
      }
    }
    
    this.drawExistingLines();
  },
  
  // Расстояние между линиями (упрощённое - между центрами)
  lineDistance: function(x1, y1, x2, y2, x3, y3, x4, y4) {
    var cx1 = (x1 + x2) / 2;
    var cy1 = (y1 + y2) / 2;
    var cx2 = (x3 + x4) / 2;
    var cy2 = (y3 + y4) / 2;
    
    var dx = cx1 - cx2;
    var dy = cy1 - cy2;
    
    return Math.sqrt(dx*dx + dy*dy);
  },
  
  // Рисуем существующие линии
  drawExistingLines: function() {
    for (var i = 0; i < this.sliceLines.length; i++) {
      var line = this.sliceLines[i];
      
      this.ctx.beginPath();
      this.ctx.moveTo(line.x1, line.y1);
      this.ctx.lineTo(line.x2, line.y2);
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 3;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
      
      // Тень для эффекта глубины
      this.ctx.beginPath();
      this.ctx.moveTo(line.x1 + 2, line.y1 + 2);
      this.ctx.lineTo(line.x2 + 2, line.y2 + 2);
      this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    }
  },
  
  // Обновить счётчик
  updateSlicesDisplay: function() {
    var el = document.getElementById('chopper-slices');
    if (el) {
      el.textContent = this.slices;
      el.style.transform = 'scale(1.3)';
      setTimeout(function() {
        el.style.transform = 'scale(1)';
      }, 100);
    }
  },
  
  // Обновить таймер
  updateTimer: function() {
    var el = document.getElementById('chopper-timer');
    if (el) {
      el.textContent = (this.timeLeft / 1000).toFixed(1);
      if (this.timeLeft <= 3000) {
        el.style.color = '#ff4444';
      }
    }
  },
  
  // Конец раунда
  endRound: function() {
    this.totalSlices += this.slices;
    
    // Анимация результата
    var self = this;
    var resultDiv = document.createElement('div');
    resultDiv.className = 'absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center';
    resultDiv.innerHTML = 
      '<div class="text-center text-white">' +
        '<div class="text-6xl mb-4">' + this.currentIngredient.emoji + '</div>' +
        '<div class="text-4xl font-bold text-yellow-400 mb-2">+' + this.slices + ' полосок!</div>' +
        '<div class="text-xl">Всего: ' + this.totalSlices + '</div>' +
      '</div>';
    
    this.container.appendChild(resultDiv);
    
    // Звук
    if (typeof SoundManager !== 'undefined') {
      SoundManager.achievement();
    }
    
    setTimeout(function() {
      if (self.container && self.container.parentNode) {
        self.container.remove();
      }
      
      if (self.round < self.totalRounds) {
        self.startRound();
      } else {
        self.endGame();
      }
    }, 1500);
  },
  
  // Конец игры
  endGame: function() {
    this.active = false;
    
    // Сохраняем рекорд
    var bestScore = parseInt(localStorage.getItem('chopper_best') || '0');
    var isNewBest = this.totalSlices > bestScore;
    if (isNewBest) {
      localStorage.setItem('chopper_best', this.totalSlices);
    }
    
    // Награда
    var reward = this.totalSlices * 20;
    if (typeof Game !== 'undefined') {
      Game.state.shawarmas += reward;
      Game.state.totalShawarmas += reward;
      Game.state.lifetimeShawarmas += reward;
    }
    
    // Возобновляем события
    if (typeof Events !== 'undefined') {
      Events.pauseEvents = false;
    }
    
    var self = this;
    
    var resultScreen = document.createElement('div');
    resultScreen.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
    resultScreen.innerHTML = 
      '<div class="bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl p-6 max-w-sm mx-4 text-center text-white">' +
        '<div class="text-5xl mb-2">' + (isNewBest ? '🏆' : '🥒') + '</div>' +
        '<h2 class="text-2xl font-bold mb-4">' + (isNewBest ? 'Новый рекорд!' : 'Отлично!') + '</h2>' +
        '<div class="space-y-3 mb-4">' +
          '<div class="bg-white bg-opacity-20 rounded-xl p-3">' +
            '<div class="text-sm opacity-80">Всего полосок</div>' +
            '<div class="text-4xl font-bold">' + this.totalSlices + '</div>' +
          '</div>' +
          '<div class="bg-yellow-400 text-yellow-900 rounded-xl p-3">' +
            '<div class="text-sm">Награда</div>' +
            '<div class="text-2xl font-bold">+' + reward + ' 🌯</div>' +
          '</div>' +
        '</div>' +
        '<div class="flex gap-2">' +
          '<button data-action="exit" class="flex-1 bg-white bg-opacity-30 py-3 rounded-xl font-bold">Выйти</button>' +
          '<button data-action="retry" class="flex-1 bg-white text-orange-600 py-3 rounded-xl font-bold">Ещё раз</button>' +
        '</div>' +
      '</div>';
    
    document.body.appendChild(resultScreen);
    
    if (typeof SoundManager !== 'undefined') {
      SoundManager.achievement();
    }
    
    resultScreen.querySelector('[data-action="exit"]').onclick = function() {
      resultScreen.remove();
      if (typeof UI !== 'undefined') UI.updateCounters();
    };
    
    resultScreen.querySelector('[data-action="retry"]').onclick = function() {
      resultScreen.remove();
      self.startGame();
    };
  }
};

console.log('✅ chopper.js загружен');
