// 口琴渲染与交互控制器
class HarmonicaController {
  holeCount = 10;
  activeTouch = null;
  slideThreshold = 18;
  maxPitchShift = 160;
  blowRowEl = document.getElementById('blowRow');
  drawRowEl = document.getElementById('drawRow');

  // 每孔技巧配置：super超吹 / bend压音 / none无进阶
  holeSkillMap = [
    { blow:"super", blowSteps:2, draw:"bend", drawSteps:1 }, // 1孔
    { blow:"none", blowSteps:0, draw:"bend", drawSteps:2 }, // 2孔 双阶压音
    { blow:"none", blowSteps:0, draw:"bend", drawSteps:3 }, // 3孔 三阶压音
    { blow:"none", blowSteps:0, draw:"bend", drawSteps:1 }, // 4孔
    { blow:"none", blowSteps:0, draw:"none", drawSteps:0 }, // 5孔 无进阶
    { blow:"none", blowSteps:0, draw:"bend", drawSteps:1 }, // 6孔
    { blow:"super", blowSteps:2, draw:"none", drawSteps:0 }, //7
    { blow:"super", blowSteps:2, draw:"none", drawSteps:0 }, //8
    { blow:"super", blowSteps:2, draw:"none", drawSteps:0 }, //9
    { blow:"super", blowSteps:3, draw:"none", drawSteps:0 }, //10
  ];

  constructor() {
    this.renderAllHoles();
    this.bindUnifiedInput();
  }

  createHoleWrap(num, type) {
    const wrap = document.createElement('div');
    wrap.className = 'hole-wrap';
    const skill = this.holeSkillMap[num-1];
    const steps = type === "blow" ? skill.blowSteps : skill.drawSteps;
    const skillType = type === "blow" ? skill.blow : skill.draw;

    const ruler = document.createElement('div');
    ruler.className = 'scale-ruler';
    for(let i=0; i<=steps; i++){
      const tick = document.createElement('div');
      const percent = i / steps;
      tick.style.top = `${percent * 100}%`;
      tick.className = i === steps ? "tick tick-whole" : "tick tick-half";
      ruler.appendChild(tick);
      if(i>0){
        const label = document.createElement('div');
        label.className = "tick-label";
        label.style.top = `${percent * 100}%`;
        label.textContent = `${i}半音`;
        ruler.appendChild(label);
      }
    }
    wrap.appendChild(ruler);

    const btn = document.createElement('div');
    btn.className = `hole-btn ${type}-btn`;
    btn.dataset.hole = num;
    btn.dataset.type = type;
    let skillText = "";
    if(skillType === "super") skillText = "可超吹";
    if(skillType === "bend") skillText = "可压音";
    btn.innerHTML = `
      <div class="slide-progress"></div>
      <span class="hole-label">${num}</span>
      <span class="skill-tag">${skillText}</span>
    `;
    wrap.appendChild(btn);
    return wrap;
  }

  renderAllHoles() {
    for(let i=1; i<=this.holeCount; i++){
      const blowWrap = this.createHoleWrap(i, "blow");
      this.blowRowEl.appendChild(blowWrap);
      const drawWrap = this.createHoleWrap(i, "draw");
      this.drawRowEl.appendChild(drawWrap);
    }
  }

  bindUnifiedInput() {
    const wrapDom = document.getElementById('harmonicaWrap');
    new UnifiedInput(
      wrapDom,
      (x, y, target) => this.handleStart(x, y, target),
      (x, y) => this.handleMove(x, y),
      () => this.handleEnd()
    );
  }

  handleStart(x, y, originTarget) {
    const btn = originTarget.closest('.hole-btn');
    if (!btn) return;
    const hole = Number(btn.dataset.hole);
    const type = btn.dataset.type;
    const baseFreq = type === 'blow' 
      ? audioEngine.BLOW_FREQS[hole - 1] 
      : audioEngine.DRAW_FREQS[hole - 1];

    this.activeTouch = {
      btn, hole, type, baseFreq,
      startY: y,
      player: audioEngine.playNote(baseFreq, 0)
    };
  }

  handleMove(x, y) {
    if (!this.activeTouch) return;
    const deltaY = y - this.activeTouch.startY;
    const { btn, type, baseFreq, player } = this.activeTouch;
    const progressBar = btn.querySelector('.slide-progress');

    let pitchOffset = 0;
    let slidePercent = 0;
    const skill = this.holeSkillMap[this.activeTouch.hole - 1];
    const maxStep = type === "blow" ? skill.blowSteps : skill.drawSteps;

    if(maxStep === 0) {
      pitchOffset = 0;
      slidePercent = 0;
    }else if (type === 'blow') {
      if (deltaY < -this.slideThreshold) {
        const rawPercent = Math.min(Math.abs(deltaY) / 100, 1);
        slidePercent = rawPercent;
        pitchOffset = this.maxPitchShift * slidePercent;
      }
    } else {
      if (deltaY > this.slideThreshold) {
        const rawPercent = Math.min(deltaY / 100, 1);
        slidePercent = rawPercent;
        pitchOffset = -this.maxPitchShift * slidePercent;
      }
    }

    audioEngine.updatePitch(player, baseFreq, pitchOffset);
    progressBar.style.height = `${slidePercent * 100}%`;
  }

  handleEnd() {
    if (!this.activeTouch) return;
    audioEngine.stopNote(this.activeTouch.player);
    this.activeTouch.btn.querySelector('.slide-progress').style.height = '0%';
    this.activeTouch = null;
  }
}