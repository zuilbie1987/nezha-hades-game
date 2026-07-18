class HarmonicaController {
  holeCount = 10;
  activeTouches = new Map(); // 改用Map存储多根手指独立触摸
  slideThreshold = 18;
  maxPitchShift = 160;
  blowRowEl = document.getElementById('blowRow');
  drawRowEl = document.getElementById('drawRow');

  holeSkillMap = [
    { blow:"super", blowSteps:2, draw:"bend", drawSteps:1 },
    { blow:"none", blowSteps:0, draw:"bend", drawSteps:2 },
    { blow:"none", blowSteps:0, draw:"bend", drawSteps:3 },
    { blow:"none", blowSteps:0, draw:"bend", drawSteps:1 },
    { blow:"none", blowSteps:0, draw:"none", drawSteps:0 },
    { blow:"none", blowSteps:0, draw:"bend", drawSteps:1 },
    { blow:"super", blowSteps:2, draw:"none", drawSteps:0 },
    { blow:"super", blowSteps:2, draw:"none", drawSteps:0 },
    { blow:"super", blowSteps:2, draw:"none", drawSteps:0 },
    { blow:"super", blowSteps:3, draw:"none", drawSteps:0 },
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

    // 新增：给支持技巧的孔添加高亮外框class
    if(skillType === 'super') wrap.classList.add('super-frame');
    if(skillType === 'bend') wrap.classList.add('bend-frame');

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
      (touchId, x, y, target) => this.handleStart(touchId, x, y, target),
      (touchId, x, y) => this.handleMove(touchId, x, y),
      (touchId) => this.handleEnd(touchId)
    );
  }

  handleStart(touchId, x, y, originTarget) {
    const btn = originTarget.closest('.hole-btn');
    if (!btn) return;
    const hole = Number(btn.dataset.hole);
    const type = btn.dataset.type;
    const baseFreq = type === 'blow'
      ? audioEngine.BLOW_FREQS[hole - 1]
      : audioEngine.DRAW_FREQS[hole - 1];

    const touchData = {
      btn, hole, type, baseFreq,
      startY: y,
      player: audioEngine.playNote(baseFreq, 0)
    };
    this.activeTouches.set(touchId, touchData);
  }

  handleMove(touchId, x, y) {
    const touchData = this.activeTouches.get(touchId);
    if (!touchData) return;
    const deltaY = y - touchData.startY;
    const { btn, type, baseFreq, player } = touchData;
    const progressBar = btn.querySelector('.slide-progress');

    let pitchOffset = 0;
    let slidePercent = 0;
    const skill = this.holeSkillMap[touchData.hole - 1];
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

  handleEnd(touchId) {
    const touchData = this.activeTouches.get(touchId);
    if (!touchData) return;
    audioEngine.stopNote(touchData.player);
    touchData.btn.querySelector('.slide-progress').style.height = '0%';
    this.activeTouches.delete(touchId);
  }
}