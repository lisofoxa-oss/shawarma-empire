// Звуковые эффекты через Web Audio API
// Исправлено для мобильных устройств

const SoundManager = {
  audioContext: null,
  isInitialized: false,
  
  // Инициализация (вызывается при первом взаимодействии пользователя)
  init() {
    if (this.isInitialized) return;
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioContext = new AudioContext();
        this.isInitialized = true;
        console.log('✅ AudioContext инициализирован');
      }
    } catch (e) {
      console.log('⚠️ Web Audio API не поддерживается:', e.message);
    }
  },
  
  // Разблокировка аудио на мобильных (нужен user gesture)
  unlock() {
    if (!this.audioContext) {
      this.init();
    }
    
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(function() {});
    }
  },
  
  // Базовая функция для проигрывания звука
  playSound(frequency, duration, type) {
    // Пробуем инициализировать если ещё не сделано
    if (!this.audioContext) {
      this.init();
    }
    
    if (!this.audioContext) return;
    
    // Разблокируем если заблокирован
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(function() {});
      return; // Не играем звук в этот раз
    }
    
    try {
      var oscillator = this.audioContext.createOscillator();
      var gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type || 'sine';
      
      var now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch (e) {
      // Звук не критичен, игнорируем ошибки
    }
  },
  
  // Звук клика по шаурме
  click: function() {
    this.playSound(800, 0.1, 'sine');
  },
  
  // Звук покупки
  purchase: function() {
    var self = this;
    this.playSound(600, 0.15, 'square');
    setTimeout(function() {
      self.playSound(800, 0.15, 'square');
    }, 100);
  },
  
  // Звук достижения
  achievement: function() {
    var self = this;
    this.playSound(523, 0.2, 'sine');
    setTimeout(function() {
      self.playSound(659, 0.2, 'sine');
    }, 150);
    setTimeout(function() {
      self.playSound(784, 0.3, 'sine');
    }, 300);
  }
};

// Алиас для совместимости
var Sounds = SoundManager;

console.log('✅ sounds.js загружен');
