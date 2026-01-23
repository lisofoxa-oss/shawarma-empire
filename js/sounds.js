// Звуковые эффекты через Web Audio API

const Sounds = {
  audioContext: null,
  
  // Инициализация
  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('Web Audio API не поддерживается');
    }
  },
  
  // Базовая функция для проигрывания звука
  playSound(frequency, duration, type = 'sine') {
    if (!this.audioContext) return;
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      // Звук не критичен, игнорируем ошибки
    }
  },
  
  // Звук клика по шаурме
  click() {
    this.playSound(800, 0.1, 'sine');
  },
  
  // Звук покупки
  purchase() {
    this.playSound(600, 0.15, 'square');
    setTimeout(() => this.playSound(800, 0.15, 'square'), 100);
  },
  
  // Звук достижения
  achievement() {
    this.playSound(523, 0.2, 'sine');
    setTimeout(() => this.playSound(659, 0.2, 'sine'), 150);
    setTimeout(() => this.playSound(784, 0.3, 'sine'), 300);
  }
};
