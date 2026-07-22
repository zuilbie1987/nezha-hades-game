class AudioEngine {
  static instance = null;
  ctx = null;
  filter = null;
  distortion = null;
  compressor = null;

  BLOW_FREQS = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
  DRAW_FREQS = [293.66, 392.00, 493.88, 587.33, 698.46, 880.00, 987.77, 1174.66, 1396.91, 1760.00];

  constructor() {
    if (AudioEngine.instance) return AudioEngine.instance;
    AudioEngine.instance = this;
  }

  async unlock() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error('当前浏览器不支持 Web Audio API');

      this.ctx = new AudioContextClass();
      
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 3200;
      this.filter.Q.value = 1.2;
      
      this.distortion = this.ctx.createWaveShaper();
      this.distortion.curve = this.makeHarmonicaDistortion(30);
      this.distortion.oversample = '4x';

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -24;
      this.compressor.knee.value = 30;
      this.compressor.ratio.value = 12;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;

      this.distortion.connect(this.filter);
      this.filter.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
    }
    if (this.ctx.state !== 'running') {
      let timeoutId;
      try {
        await Promise.race([
          this.ctx.resume(),
          new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('音频引擎启动超时')), 2000);
          }),
        ]);
      } finally {
        clearTimeout(timeoutId);
      }
    }
    if (this.ctx.state !== 'running') throw new Error('音频引擎未能启动');
  }

  makeHarmonicaDistortion(amount) {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2 / samples) - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  calculateFreqBySemitone(baseFreq, semitones) {
    return baseFreq * Math.pow(2, semitones / 12);
  }

  playNote(baseFreq, semitones = 0) {
    if (!this.ctx || this.ctx.state !== 'running') {
      throw new Error('请先开启音频引擎');
    }

    const targetFreq = this.calculateFreqBySemitone(baseFreq, semitones);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(targetFreq, this.ctx.currentTime);

    gain.gain.linearRampToValueAtTime(0.24, this.ctx.currentTime + 0.008);

    osc.connect(gain);
    gain.connect(this.distortion);
    osc.start();
    return { osc, gain, baseFreq };
  }

  updatePitch(player, baseFreq, semitones) {
    const targetFreq = this.calculateFreqBySemitone(baseFreq, semitones);
    player.osc.frequency.linearRampToValueAtTime(
      targetFreq,
      this.ctx.currentTime + 0.012
    );
  }

  stopNote(player) {
    if (!player || player.stopped) return;
    player.stopped = true;

    const now = this.ctx.currentTime;
    player.gain.gain.cancelScheduledValues(now);
    player.gain.gain.setValueAtTime(player.gain.gain.value, now);
    player.gain.gain.linearRampToValueAtTime(0, now + 0.05);
    player.osc.stop(now + 0.05);
    player.osc.addEventListener('ended', () => {
      player.osc.disconnect();
      player.gain.disconnect();
    }, { once: true });
  }
}
const audioEngine = new AudioEngine();
