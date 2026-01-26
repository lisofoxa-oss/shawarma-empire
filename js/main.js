// Запуск игры с диагностикой
// Исправлено для совместимости с мобильными устройствами

console.log('🚀 main.js загружен');

// Проверяем доступность всех модулей
function checkModules() {
  var modules = {
    'GameConfig': typeof GameConfig !== 'undefined',
    'SoundManager': typeof SoundManager !== 'undefined',
    'GameStorage': typeof GameStorage !== 'undefined',
    'Game': typeof Game !== 'undefined',
    'UI': typeof UI !== 'undefined'
  };
  
  console.log('📦 Проверка модулей:', modules);
  
  var missing = [];
  for (var key in modules) {
    if (!modules[key]) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Отсутствуют модули:', missing.join(', '));
    
    var appEl = document.getElementById('app');
    if (appEl) {
      appEl.innerHTML = 
        '<div class="flex items-center justify-center min-h-screen p-4">' +
          '<div class="text-center bg-yellow-100 border-2 border-yellow-400 rounded-xl p-6 max-w-md">' +
            '<div class="text-4xl mb-4">⚠️</div>' +
            '<div class="text-xl font-bold text-yellow-800 mb-2">Ошибка загрузки модулей</div>' +
            '<div class="text-sm text-gray-700 mb-3">Не загружены: ' + missing.join(', ') + '</div>' +
            '<button onclick="location.reload()" class="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold">' +
              '🔄 Перезагрузить' +
            '</button>' +
          '</div>' +
        '</div>';
    }
    return false;
  }
  
  return true;
}

// Инициализация игры
function initGame() {
  console.log('📋 DOM загружен, начинаем инициализацию...');
  
  // Проверяем модули
  if (!checkModules()) {
    return;
  }
  
  try {
    // Инициализируем игру
    console.log('🎮 Инициализация игры...');
    Game.init();
    
    // Инициализируем дополнительные системы
    if (typeof Currency !== 'undefined') {
      Currency.init();
    }
    if (typeof Music !== 'undefined') {
      Music.init();
    }
    if (typeof Slicer !== 'undefined') {
      Slicer.init();
    }
    if (typeof Challenges !== 'undefined') {
      Challenges.init();
    }
    if (typeof Skins !== 'undefined') {
      Skins.init();
      // Обновляем отображение скина после загрузки UI
      setTimeout(function() { Skins.updateDisplay(); }, 100);
    }
    if (typeof Referral !== 'undefined') {
      Referral.init();
    }
    
    console.log('✅ Игра успешно запущена!');
    console.log('🌯 Империя Шаурмы готова к игре!');
    console.log('Версия: 2.0.0');
    
    // Telegram WebApp ready
    if (window.Telegram && window.Telegram.WebApp) {
      try {
        window.Telegram.WebApp.ready();
        console.log('📱 Telegram WebApp готов');
      } catch (e) {
        console.log('⚠️ Telegram WebApp.ready() не удался:', e.message);
      }
    }
    
  } catch (error) {
    console.error('💥 Критическая ошибка при инициализации:', error);
    
    var appEl = document.getElementById('app');
    if (appEl) {
      appEl.innerHTML = 
        '<div class="flex items-center justify-center min-h-screen p-4">' +
          '<div class="text-center bg-red-100 border-2 border-red-400 rounded-xl p-6 max-w-md">' +
            '<div class="text-4xl mb-4">💥</div>' +
            '<div class="text-xl font-bold text-red-600 mb-2">Критическая ошибка</div>' +
            '<div class="text-sm text-gray-700 mb-2">' + (error.message || 'Неизвестная ошибка') + '</div>' +
            '<details class="text-left text-xs bg-white p-2 rounded mt-2">' +
              '<summary class="cursor-pointer font-semibold">Подробности</summary>' +
              '<pre class="mt-2 overflow-auto">' + (error.stack || 'Нет стека вызовов') + '</pre>' +
            '</details>' +
            '<button onclick="location.reload()" class="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-bold">' +
              '🔄 Перезагрузить' +
            '</button>' +
          '</div>' +
        '</div>';
    }
  }
}

// Ждём полной загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  // DOM уже загружен
  initGame();
}
