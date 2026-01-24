// Мини-игра Слайсер
// js/slicer.js

var Slicer = {
  // Состояние игры
  active: false,
  score: 0,
  combo: 0,
  maxCombo: 0,
  timeLeft: 0,
  duration: 30000, // 30 секунд
  
  // Ингредиенты
  ingredients: [
    { emoji: '🥒', name: 'Огурец', points: 10, speed: 1 },
    { emoji: '🍅', name: 'Помидор', points: 15, speed: 1.2 },
    { emoji: '🧅', name: 'Лук', points: 10, speed: 1.1 },
    { emoji: '🥬', name: 'Капуста', points: 12, speed: 0.9 },
    { emoji: '🌶️', name: 'Перец', points: 20, speed: 1.5 },
    { emoji: '🥩', name: 'Мясо', points: 30, speed: 1.3 },
    { emoji: '🧀', name: 'Сыр', points: 25, speed: 1.1 },
  ],
  
  // Бомбы (не резать!)
  bombs: [
    { emoji: '💣', name: 'Бомба', penalty: -50 },
    { emoji: '🧨', name: 'Динамит', penalty: -30 },
  ],
  
  // DOM элементы
  container: null,
  gameArea: null,
  scoreEl: null,
  timerEl: null,
  comboEl: null,
  
  // Активные объекты
  activeObjects: [],
  spawnInterval: null,
  gameLoop: null,
  
  // Инициализация
  init: function() {
    console.log('✅ Slicer инициализирован');
  },
  
  // Открыть меню слайсера
  openMenu: function() {
    var self = this;
    
    // Создаём модальное окно
    var modal = document.createElement('div');
    modal.id = 'slicer-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
    
    var bestScore = localStorage.getItem('slicer_best') || 0;
    
    modal.innerHTML = 
      '<div class="bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl p-6 max-w-sm mx-4 text-center text-white shadow-2xl">' +
        '<div class="text-5xl mb-4">🔪</div>' +
        '<h2 class="text-2xl font-bold mb-2">Слайсер</h2>' +
        '<p class="text-sm opacity-90 mb-4">Нарезай ингредиенты свайпом!<br>Избегай бомб 💣</p>' +
        '<div class="bg-white bg-opacity-20 rounded-xl p-3 mb-4">' +
          '<div class="text-sm">Лучший результат</div>' +
          '<div class="text-3xl font-bold">' + bestScore + '</div>' +
        '</div>' +
        '<div class="bg-white bg-opacity-20 rounded-xl p-3 mb-4">' +
          '<div class="text-sm">Награда</div>' +
          '<div class="text-lg">Очки × 10 = 🌯 шаурмы</div>' +
        '</div>' +
        '<div class="flex gap-2">' +
          '<button data-action="close-slicer-menu" class="flex-1 bg-white bg-opacity-30 py-3 rounded-xl font-bold hover:bg-opacity-40">Назад</button>' +
          '<button data-action="start-slicer" class="flex-1 bg-white text-green-600 py-3 rounded-xl font-bold hover:bg-gray-100">Играть!</button>' +
        '</div>' +
      '</div>';
    
    document.body.appendChild(modal);
    
    // Обработчики
    modal.querySelector('[data-action="close-slicer-menu"]').onclick = function() {
      modal.remove();
    };
    
    modal.querySelector('[data-action="start-slicer"]').onclick = function() {
      modal.remove();
      self.start();
    };
  },
  
  // Начать игру
  start: function() {
    var self = this;
    
    this.active = true;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.timeLeft = this.duration;
    this.activeObjects = [];
    
    // Приостанавливаем события
    if (typeof Events !== 'undefined') {
      Events.pauseEvents = true;
      // Убираем золотую шаурму если есть
      if (typeof Game !== 'undefined') {
        Game.removeGoldenShawarma();
      }
    }
    
    // Создаём игровой экран
    this.createGameScreen();
    
    // Спавним объекты
    this.spawnInterval = setInterval(function() {
      self.spawnObject();
    }, 800);
    
    // Игровой цикл
    this.gameLoop = setInterval(function() {
      self.update();
    }, 16);
    
    // Таймер
    var timerInterval = setInterval(function() {
      self.timeLeft -= 100;
      self.updateTimer();
      
      if (self.timeLeft <= 0) {
        clearInterval(timerInterval);
        self.end();
      }
    }, 100);
    
    // Звук начала
    if (typeof SoundManager !== 'undefined') {
      SoundManager.achievement();
    }
  },
  
  // Создать игровой экран
  createGameScreen: function() {
    var self = this;
    
    this.container = document.createElement('div');
    this.container.id = 'slicer-container';
    this.container.className = 'fixed inset-0 bg-gradient-to-b from-sky-400 to-sky-600 z-50';
    
    this.container.innerHTML = 
      '<div class="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-black bg-opacity-30">' +
        '<div class="text-white">' +
          '<div class="text-sm opacity-80">Очки</div>' +
          '<div id="slicer-score" class="text-2xl font-bold">0</div>' +
        '</div>' +
        '<div class="text-white text-center">' +
          '<div id="slicer-combo" class="text-lg font-bold text-yellow-300 opacity-0">COMBO x1</div>' +
        '</div>' +
        '<div class="text-white text-right">' +
          '<div class="text-sm opacity-80">Время</div>' +
          '<div id="slicer-timer" class="text-2xl font-bold">30.0</div>' +
        '</div>' +
      '</div>' +
      '<div id="slicer-game-area" class="absolute inset-0 overflow-hidden" style="top: 70px;"></div>' +
      '<canvas id="slicer-trail" class="absolute inset-0 pointer-events-none" style="top: 70px;"></canvas>';
    
    document.body.appendChild(this.container);
    
    this.gameArea = document.getElementById('slicer-game-area');
    this.scoreEl = document.getElementById('slicer-score');
    this.timerEl = document.getElementById('slicer-timer');
    this.comboEl = document.getElementById('slicer-combo');
    
    // Canvas для следа
    this.canvas = document.getElementById('slicer-trail');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight - 70;
    
    // Обработка свайпов
    this.setupTouchHandlers();
  },
  
  // Настройка обработчиков касаний
  setupTouchHandlers: function() {
    var self = this;
    var isDrawing = false;
    var lastX = 0, lastY = 0;
    var trail = [];
    
    function startDraw(x, y) {
      isDrawing = true;
      lastX = x;
      lastY = y;
      trail = [{x: x, y: y}];
    }
    
    function draw(x, y) {
      if (!isDrawing) return;
      
      // Рисуем след
      self.ctx.beginPath();
      self.ctx.moveTo(lastX, lastY);
      self.ctx.lineTo(x, y);
      self.ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      self.ctx.lineWidth = 5;
      self.ctx.lineCap = 'round';
      self.ctx.stroke();
      
      // Проверяем пересечение с объектами
      self.checkSlice(lastX, lastY, x, y);
      
      trail.push({x: x, y: y});
      lastX = x;
      lastY = y;
      
      // Стираем старый след
      setTimeout(function() {
        self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
        // Перерисовываем последние точки
        if (trail.length > 2) {
          trail.shift();
          self.ctx.beginPath();
          self.ctx.moveTo(trail[0].x, trail[0].y);
          for (var i = 1; i < trail.length; i++) {
            self.ctx.lineTo(trail[i].x, trail[i].y);
          }
          self.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          self.ctx.lineWidth = 3;
          self.ctx.stroke();
        }
      }, 50);
    }
    
    function endDraw() {
      isDrawing = false;
      trail = [];
      setTimeout(function() {
        self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
      }, 100);
    }
    
    // Touch events
    this.gameArea.addEventListener('touchstart', function(e) {
      e.preventDefault();
      var touch = e.touches[0];
      var rect = self.gameArea.getBoundingClientRect();
      startDraw(touch.clientX - rect.left, touch.clientY - rect.top);
    });
    
    this.gameArea.addEventListener('touchmove', function(e) {
      e.preventDefault();
      var touch = e.touches[0];
      var rect = self.gameArea.getBoundingClientRect();
      draw(touch.clientX - rect.left, touch.clientY - rect.top);
    });
    
    this.gameArea.addEventListener('touchend', endDraw);
    
    // Mouse events (для десктопа)
    this.gameArea.addEventListener('mousedown', function(e) {
      var rect = self.gameArea.getBoundingClientRect();
      startDraw(e.clientX - rect.left, e.clientY - rect.top);
    });
    
    this.gameArea.addEventListener('mousemove', function(e) {
      var rect = self.gameArea.getBoundingClientRect();
      draw(e.clientX - rect.left, e.clientY - rect.top);
    });
    
    this.gameArea.addEventListener('mouseup', endDraw);
    this.gameArea.addEventListener('mouseleave', endDraw);
  },
  
  // Спавн объекта
  spawnObject: function() {
    if (!this.active) return;
    
    var self = this;
    var isBomb = Math.random() < 0.15; // 15% шанс бомбы
    
    var obj;
    if (isBomb) {
      obj = this.bombs[Math.floor(Math.random() * this.bombs.length)];
      obj = {
        emoji: obj.emoji,
        isBomb: true,
        penalty: obj.penalty,
        points: 0,
        speed: 1.2
      };
    } else {
      var ing = this.ingredients[Math.floor(Math.random() * this.ingredients.length)];
      obj = {
        emoji: ing.emoji,
        isBomb: false,
        points: ing.points,
        speed: ing.speed
      };
    }
    
    // Создаём элемент
    var el = document.createElement('div');
    el.className = 'absolute text-5xl select-none transition-transform';
    el.innerHTML = obj.emoji;
    el.style.filter = 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))';
    
    // Случайная начальная позиция (снизу)
    var startX = 50 + Math.random() * (window.innerWidth - 100);
    var startY = window.innerHeight;
    
    el.style.left = startX + 'px';
    el.style.top = startY + 'px';
    
    // Параметры полёта
    var velocityX = (Math.random() - 0.5) * 8;
    var velocityY = -15 - Math.random() * 5;
    var gravity = 0.3;
    var rotation = 0;
    var rotationSpeed = (Math.random() - 0.5) * 10;
    
    this.gameArea.appendChild(el);
    
    var objData = {
      el: el,
      x: startX,
      y: startY - 70, // Учитываем отступ
      vx: velocityX,
      vy: velocityY,
      rotation: rotation,
      rotationSpeed: rotationSpeed,
      sliced: false,
      isBomb: obj.isBomb,
      points: obj.points,
      penalty: obj.penalty || 0
    };
    
    this.activeObjects.push(objData);
  },
  
  // Обновление игры
  update: function() {
    var toRemove = [];
    
    for (var i = 0; i < this.activeObjects.length; i++) {
      var obj = this.activeObjects[i];
      
      if (obj.sliced) continue;
      
      // Физика
      obj.vy += 0.3; // Гравитация
      obj.x += obj.vx;
      obj.y += obj.vy;
      obj.rotation += obj.rotationSpeed;
      
      obj.el.style.left = obj.x + 'px';
      obj.el.style.top = obj.y + 'px';
      obj.el.style.transform = 'rotate(' + obj.rotation + 'deg)';
      
      // Удаляем если вышел за экран
      if (obj.y > window.innerHeight + 100) {
        toRemove.push(i);
        // Сброс комбо если пропустили ингредиент (не бомбу)
        if (!obj.isBomb && !obj.sliced) {
          this.combo = 0;
          this.updateCombo();
        }
      }
    }
    
    // Удаляем
    for (var j = toRemove.length - 1; j >= 0; j--) {
      var idx = toRemove[j];
      if (this.activeObjects[idx].el.parentNode) {
        this.activeObjects[idx].el.remove();
      }
      this.activeObjects.splice(idx, 1);
    }
  },
  
  // Проверка пересечения линии с объектом
  checkSlice: function(x1, y1, x2, y2) {
    for (var i = 0; i < this.activeObjects.length; i++) {
      var obj = this.activeObjects[i];
      if (obj.sliced) continue;
      
      // Проверяем пересечение (простая проверка расстояния до линии)
      var objCenterX = obj.x + 25;
      var objCenterY = obj.y + 25;
      var hitRadius = 40;
      
      // Расстояние от центра объекта до линии
      var dist = this.pointToLineDistance(objCenterX, objCenterY, x1, y1, x2, y2);
      
      if (dist < hitRadius) {
        this.sliceObject(obj);
      }
    }
  },
  
  // Расстояние от точки до отрезка
  pointToLineDistance: function(px, py, x1, y1, x2, y2) {
    var A = px - x1;
    var B = py - y1;
    var C = x2 - x1;
    var D = y2 - y1;
    
    var dot = A * C + B * D;
    var lenSq = C * C + D * D;
    var param = lenSq !== 0 ? dot / lenSq : -1;
    
    var xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    var dx = px - xx;
    var dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  },
  
  // Разрезать объект
  sliceObject: function(obj) {
    obj.sliced = true;
    
    if (obj.isBomb) {
      // Бомба!
      this.score = Math.max(0, this.score + obj.penalty);
      this.combo = 0;
      this.updateCombo();
      
      // Эффект взрыва
      obj.el.innerHTML = '💥';
      obj.el.style.fontSize = '80px';
      obj.el.style.transition = 'all 0.3s';
      obj.el.style.transform = 'scale(2)';
      obj.el.style.opacity = '0';
      
      // Вибрация
      if (typeof Game !== 'undefined' && Game.isTelegram && Game.tg && Game.tg.HapticFeedback) {
        try { Game.tg.HapticFeedback.notificationOccurred('error'); } catch(e) {}
      }
      
      // Экран трясётся
      this.container.style.animation = 'shake 0.3s';
      var self = this;
      setTimeout(function() {
        self.container.style.animation = '';
      }, 300);
      
    } else {
      // Ингредиент
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      
      var comboBonus = Math.floor(this.combo / 5); // +1 за каждые 5 комбо
      var points = obj.points + comboBonus;
      this.score += points;
      
      this.updateCombo();
      
      // Эффект разрезания
      this.createSliceEffect(obj);
      
      // Звук
      if (typeof SoundManager !== 'undefined') {
        SoundManager.click();
      }
      
      // Вибрация
      if (typeof Game !== 'undefined' && Game.isTelegram && Game.tg && Game.tg.HapticFeedback) {
        try { Game.tg.HapticFeedback.impactOccurred('light'); } catch(e) {}
      }
    }
    
    this.updateScore();
    
    // Удаляем элемент
    var el = obj.el;
    setTimeout(function() {
      if (el.parentNode) el.remove();
    }, 300);
  },
  
  // Эффект разрезания
  createSliceEffect: function(obj) {
    var x = obj.x + 25;
    var y = obj.y + 25;
    
    // Две половинки
    for (var i = 0; i < 2; i++) {
      var half = document.createElement('div');
      half.className = 'absolute text-4xl';
      half.innerHTML = obj.el.innerHTML;
      half.style.left = x + 'px';
      half.style.top = y + 'px';
      half.style.transition = 'all 0.5s ease-out';
      half.style.clipPath = i === 0 ? 'inset(0 50% 0 0)' : 'inset(0 0 0 50%)';
      
      this.gameArea.appendChild(half);
      
      // Анимация разлёта
      var self = this;
      (function(el, dir) {
        setTimeout(function() {
          el.style.transform = 'translate(' + (dir * 50) + 'px, 100px) rotate(' + (dir * 45) + 'deg)';
          el.style.opacity = '0';
        }, 10);
        setTimeout(function() { el.remove(); }, 500);
      })(half, i === 0 ? -1 : 1);
    }
    
    // Показываем очки
    var pointsEl = document.createElement('div');
    pointsEl.className = 'absolute text-2xl font-bold text-white';
    pointsEl.style.cssText = 'left:' + x + 'px;top:' + y + 'px;text-shadow:2px 2px 0 #000;transition:all 0.5s;';
    pointsEl.innerHTML = '+' + obj.points;
    this.gameArea.appendChild(pointsEl);
    
    setTimeout(function() {
      pointsEl.style.transform = 'translateY(-50px)';
      pointsEl.style.opacity = '0';
    }, 10);
    setTimeout(function() { pointsEl.remove(); }, 500);
    
    // Скрываем оригинал
    obj.el.style.opacity = '0';
  },
  
  // Обновить счёт
  updateScore: function() {
    if (this.scoreEl) {
      this.scoreEl.textContent = this.score;
    }
  },
  
  // Обновить таймер
  updateTimer: function() {
    if (this.timerEl) {
      this.timerEl.textContent = (this.timeLeft / 1000).toFixed(1);
      
      // Мигаем когда мало времени
      if (this.timeLeft <= 5000) {
        this.timerEl.style.color = '#ff4444';
        this.timerEl.style.animation = 'pulse 0.5s infinite';
      }
    }
  },
  
  // Обновить комбо
  updateCombo: function() {
    if (this.comboEl) {
      if (this.combo >= 3) {
        this.comboEl.textContent = 'COMBO x' + this.combo;
        this.comboEl.style.opacity = '1';
        this.comboEl.style.transform = 'scale(1.2)';
        var self = this;
        setTimeout(function() {
          if (self.comboEl) self.comboEl.style.transform = 'scale(1)';
        }, 100);
      } else {
        this.comboEl.style.opacity = '0';
      }
    }
  },
  
  // Конец игры
  end: function() {
    this.active = false;
    
    // Останавливаем интервалы
    if (this.spawnInterval) clearInterval(this.spawnInterval);
    if (this.gameLoop) clearInterval(this.gameLoop);
    
    // Сохраняем лучший результат
    var bestScore = parseInt(localStorage.getItem('slicer_best') || '0');
    var isNewBest = this.score > bestScore;
    if (isNewBest) {
      localStorage.setItem('slicer_best', this.score);
    }
    
    // Награда
    // Награда = очки × 2 (раньше было ×10, слишком много)
    var reward = Math.floor(this.score * 2);
    if (typeof Game !== 'undefined') {
      Game.state.shawarmas += reward;
      Game.state.totalShawarmas += reward;
      Game.state.lifetimeShawarmas += reward;
    }
    
    // Показываем результат
    var self = this;
    
    var resultScreen = document.createElement('div');
    resultScreen.className = 'absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center';
    resultScreen.innerHTML = 
      '<div class="bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl p-6 max-w-sm mx-4 text-center text-white">' +
        '<div class="text-5xl mb-2">' + (isNewBest ? '🏆' : '🔪') + '</div>' +
        '<h2 class="text-2xl font-bold mb-4">' + (isNewBest ? 'Новый рекорд!' : 'Игра окончена!') + '</h2>' +
        '<div class="space-y-3 mb-4">' +
          '<div class="bg-white bg-opacity-20 rounded-xl p-3">' +
            '<div class="text-sm opacity-80">Очки</div>' +
            '<div class="text-3xl font-bold">' + this.score + '</div>' +
          '</div>' +
          '<div class="bg-white bg-opacity-20 rounded-xl p-3">' +
            '<div class="text-sm opacity-80">Макс. комбо</div>' +
            '<div class="text-2xl font-bold">' + this.maxCombo + '</div>' +
          '</div>' +
          '<div class="bg-yellow-400 text-yellow-900 rounded-xl p-3">' +
            '<div class="text-sm">Награда</div>' +
            '<div class="text-2xl font-bold">+' + reward + ' 🌯</div>' +
          '</div>' +
        '</div>' +
        '<div class="flex gap-2">' +
          '<button data-action="slicer-exit" class="flex-1 bg-white bg-opacity-30 py-3 rounded-xl font-bold">Выйти</button>' +
          '<button data-action="slicer-retry" class="flex-1 bg-white text-green-600 py-3 rounded-xl font-bold">Ещё раз</button>' +
        '</div>' +
      '</div>';
    
    this.container.appendChild(resultScreen);
    
    // Звук
    if (typeof SoundManager !== 'undefined') {
      SoundManager.achievement();
    }
    
    // Обработчики
    resultScreen.querySelector('[data-action="slicer-exit"]').onclick = function() {
      self.cleanup();
    };
    
    resultScreen.querySelector('[data-action="slicer-retry"]').onclick = function() {
      self.cleanup();
      self.start();
    };
  },
  
  // Очистка
  cleanup: function() {
    if (this.spawnInterval) clearInterval(this.spawnInterval);
    if (this.gameLoop) clearInterval(this.gameLoop);
    
    if (this.container && this.container.parentNode) {
      this.container.remove();
    }
    
    this.container = null;
    this.gameArea = null;
    this.scoreEl = null;
    this.timerEl = null;
    this.comboEl = null;
    this.activeObjects = [];
    this.active = false;
    
    // Возобновляем события
    if (typeof Events !== 'undefined') {
      Events.pauseEvents = false;
    }
    
    // Обновляем UI
    if (typeof UI !== 'undefined') {
      UI.updateCounters();
    }
  }
};

console.log('✅ slicer.js загружен');
