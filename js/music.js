// Система фоновой музыки
// js/music.js

var Music = {
  enabled: false,
  volume: 0.3,
  audioContext: null,
  gainNode: null,
  isPlaying: false,
  currentLoop: null,
  
  // Инициализация
  init: function() {
    this.load();
    console.log('✅ Music система инициализирована');
  },
  
  // Создание аудио контекста (нужен клик пользователя)
  createContext: function() {
    if (this.audioContext) return true;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.volume;
      return true;
    } catch (e) {
      console.log('Web Audio не поддерживается');
      return false;
    }
  },
  
  // Генеративная расслабляющая музыка
  playGenerativeMusic: function() {
    if (!this.createContext()) return;
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    var ctx = this.audioContext;
    var gain = this.gainNode;
    var self = this;
    
    // Аккорды (мажорные, расслабляющие)
    var chords = [
      [261.63, 329.63, 392.00], // C мажор
      [293.66, 369.99, 440.00], // D мажор  
      [329.63, 415.30, 493.88], // E минор
      [349.23, 440.00, 523.25], // F мажор
      [392.00, 493.88, 587.33], // G мажор
      [440.00, 554.37, 659.25], // A минор
    ];
    
    var chordIndex = 0;
    var noteIndex = 0;
    
    function playNote() {
      if (!self.enabled || !self.isPlaying) return;
      
      var chord = chords[chordIndex];
      var freq = chord[noteIndex];
      
      // Создаём осциллятор
      var osc = ctx.createOscillator();
      var noteGain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      osc.connect(noteGain);
      noteGain.connect(gain);
      
      // Плавное затухание
      var now = ctx.currentTime;
      noteGain.gain.setValueAtTime(0.15, now);
      noteGain.gain.exponentialRampToValueAtTime(0.01, now + 2);
      
      osc.start(now);
      osc.stop(now + 2);
      
      // Следующая нота
      noteIndex++;
      if (noteIndex >= chord.length) {
        noteIndex = 0;
        chordIndex = (chordIndex + 1) % chords.length;
      }
      
      // Интервал между нотами (случайный для естественности)
      var interval = 800 + Math.random() * 400;
      self.currentLoop = setTimeout(playNote, interval);
    }
    
    // Добавляем мягкий пэд (фоновый гул)
    function playPad() {
      if (!self.enabled || !self.isPlaying) return;
      
      var chord = chords[chordIndex];
      
      for (var i = 0; i < chord.length; i++) {
        var osc = ctx.createOscillator();
        var padGain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = chord[i] / 2; // Октавой ниже
        
        osc.connect(padGain);
        padGain.connect(gain);
        
        var now = ctx.currentTime;
        padGain.gain.setValueAtTime(0, now);
        padGain.gain.linearRampToValueAtTime(0.05, now + 1);
        padGain.gain.linearRampToValueAtTime(0, now + 4);
        
        osc.start(now);
        osc.stop(now + 4);
      }
      
      setTimeout(playPad, 4000);
    }
    
    playNote();
    setTimeout(playPad, 1000);
  },
  
  // Включить музыку
  play: function() {
    this.enabled = true;
    this.save();
    this.playGenerativeMusic();
  },
  
  // Выключить музыку
  stop: function() {
    this.enabled = false;
    this.isPlaying = false;
    this.save();
    
    if (this.currentLoop) {
      clearTimeout(this.currentLoop);
      this.currentLoop = null;
    }
  },
  
  // Переключить
  toggle: function() {
    if (this.enabled) {
      this.stop();
    } else {
      this.play();
    }
    return this.enabled;
  },
  
  // Установить громкость (0-1)
  setVolume: function(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
    this.save();
  },
  
  // Сохранение
  save: function() {
    localStorage.setItem('shawarma_music', JSON.stringify({
      enabled: this.enabled,
      volume: this.volume
    }));
  },
  
  // Загрузка
  load: function() {
    try {
      var saved = localStorage.getItem('shawarma_music');
      if (saved) {
        var data = JSON.parse(saved);
        this.enabled = data.enabled || false;
        this.volume = data.volume !== undefined ? data.volume : 0.3;
      }
    } catch (e) {}
  },
  
  // Автозапуск при первом клике (если была включена)
  tryAutoplay: function() {
    if (this.enabled && !this.isPlaying) {
      this.play();
    }
  }
};

console.log('✅ music.js загружен');
