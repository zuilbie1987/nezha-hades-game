// 全局单例音频引擎，优化口琴簧片音色
class AudioEngine {
  static instance = null;
  ctx = null;
  filter = null;
  distortion = null;

  // 标准C调十孔 1~10孔 吹气频率
  BLOW_FREQS = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
  // 标准C调十孔 1~10孔 吸气频率
  DRAW_FREQS = [293.66, 392.00, 466.16, 587.33, 698.46, 880.00, 932.33, 1174.66, 1396.91, 1760.00];

  constructor() {
    if (AudioEngine.instance) return AudioEngine.instance;
    AudioEngine.instance = this;
  }

  // 解锁音频上下文，初始化滤波器/失真效果器
  unlock() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      // 低通滤波器：模拟口琴腔体中频共鸣
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 3200;
      this.filter.Q.value = 1.2;
      // 轻微失真：模拟金属簧片振动
      this.distortion = this.ctx.createWaveShaper();
      this.distortion.curve = this.makeHarmonicaDistortion(30);
      this.distortion.oversample = '4x';
      // 链路：失真 -> 滤波 -> 输出
      this.distortion.connect(this.filter);
      this.filter.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  // 生成轻微失真曲线，模拟簧片金属质感
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

  // 播放音符，square方波替代三角波，口琴原生质感
  playNote(baseFreq, pitchOffset = 0) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    // 核心修改：square方波，模拟簧片，摒弃哨笛感triangle
    osc.type = 'square';
    osc.frequency.setValueAtTime(baseFreq + pitchOffset, this.ctx.currentTime);

    // 快速起音包络，贴合口琴瞬时发声
    gain.gain.linearRampToValueAtTime(0.24, this.ctx.currentTime + 0.008);

    osc.connect(gain);
    gain.connect(this.distortion);
    osc.start();
    return { osc, gain };
  }

  // 实时平滑修改音高（压音/超吹滑动）
  updatePitch(player, baseFreq, offset) {
    player.osc.frequency.linearRampToValueAtTime(
      baseFreq + offset,
      this.ctx.currentTime + 0.012
    );
  }

  // 平滑停止音符，消除爆音
  stopNote(player) {
    const now = this.ctx.currentTime;
    player.gain.gain.linearRampToValueAtTime(0, now + 0.05);
    setTimeout(() => player.osc.stop(), 80);
  }
}
// 全局唯一实例
const audioEngine = new AudioEngine();