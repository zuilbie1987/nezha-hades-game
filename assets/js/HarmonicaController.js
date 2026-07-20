class HarmonicaController {
  holeCount = 10;
  activeTouches = new Map();
  gridEl = document.getElementById('keyboardGrid');
  pixelsPerSemitone = 45; // 滑动多少像素改变一个半音

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
    this.renderKeyboard();
    this.bindUnifiedInput();
  }

  renderKeyboard() {
    this.gridEl.innerHTML = '';
    
    for (let i = 1; i <= this.holeCount; i++) {
      const col = document.createElement('div');
      col.className = 'hole-col';
      col.dataset.colHole = i;
      const skill = this.holeSkillMap[i - 1];

      // 槽位 0-2: 超吹 (最多3个，从上到下 +3, +2, +1)
      for (let step = 3; step >= 1; step--) {
        if (skill.blow === 'super' && step <= skill.blowSteps) {
          col.appendChild(this.createButton(i, 'blow', step, '超吹'));
        } else {
          col.appendChild(this.createSpacer());
        }
      }

      // 槽位 3: 吹气
      col.appendChild(this.createButton(i, 'blow', 0, '吹'));
      // 槽位 4: 吸气
      col.appendChild(this.createButton(i, 'draw', 0, '吸'));

      // 槽位 5-7: 压音 (最多3个，从上到下 -1, -2, -3)
      for (let step = 1; step <= 3; step++) {
        if (skill.draw === 'bend' && step <= skill.drawSteps) {
          col.appendChild(this.createButton(i, 'draw', -step, '压音'));
        } else {
          col.appendChild(this.createSpacer());
        }
      }
      this.gridEl.appendChild(col);
    }
  }

  createSpacer() {
    const spacer = document.createElement('div');
    spacer.className = 'note-spacer';
    return spacer;
  }

  createButton(hole, type, semitones, label) {
    const btn = document.createElement('div');
    const isBase = semitones === 0;
    btn.className = `note-btn ${type} ${isBase ? 'base' : 'skill'}`;
    btn.dataset.hole = hole;
    btn.dataset.type = type;
    btn.dataset.semitones = semitones;
    
    let text = isBase ? hole : Math.abs(semitones);
    btn.innerHTML = `${text}<div class="note-sub">${label}</div>`;
    return btn;
  }

  bindUnifiedInput() {
    const wrapDom = document.getElementById('harmonicaWrap');
    new UnifiedInput(
      wrapDom,
      (touchId, x, y, target) => this.handleStart(touchId, y, target),
      (touchId, x, y) => this.handleMove(touchId, y),
      (touchId) => this.handleEnd(touchId)
    );
  }

  handleStart(touchId, y, originTarget) {
    const btn = originTarget.closest('.note-btn');
    if (!btn) return;
    
    const hole = Number(btn.dataset.hole);
    const type = btn.dataset.type;
    const originSemitones = Number(btn.dataset.semitones);

    const baseFreq = type === 'blow' 
      ? audioEngine.BLOW_FREQS[hole - 1] 
      : audioEngine.DRAW_FREQS[hole - 1];

    btn.classList.add('active');

    const touchData = {
      hole, type, baseFreq, originSemitones,
      startY: y,
      colEl: btn.closest('.hole-col'),
      player: audioEngine.playNote(baseFreq, originSemitones)
    };
    this.activeTouches.set(touchId, touchData);
  }

  handleMove(touchId, y) {
    const touchData = this.activeTouches.get(touchId);
    if (!touchData) return;

    const { startY, originSemitones, type, hole, baseFreq, player, colEl } = touchData;
    const deltaY = y - startY;

    // 滑动方向统一：向上滑动 deltaY为负数，向下滑动 deltaY为正数。
    let shift = -deltaY / this.pixelsPerSemitone;
    let currentSemitones = originSemitones + shift;

    // 获取当前孔位的物理极限，限制滑动极值(Clamp)
    const skill = this.holeSkillMap[hole - 1];
    const maxSuper = skill.blow === 'super' ? skill.blowSteps : 0;
    const maxBend = skill.draw === 'bend' ? skill.drawSteps : 0;

    if (type === 'blow') {
      currentSemitones = Math.max(0, Math.min(currentSemitones, maxSuper));
    } else {
      currentSemitones = Math.max(-maxBend, Math.min(currentSemitones, 0));
    }

    // 1. 发送平滑频率给音频引擎
    audioEngine.updatePitch(player, baseFreq, currentSemitones);

    // 2. 视觉反馈：点亮滑动到达的最接近的整数方块
    const nearestIntSemitone = Math.round(currentSemitones);
    const buttons = colEl.querySelectorAll(`.note-btn[data-type="${type}"]`);
    
    buttons.forEach(b => {
      if (Number(b.dataset.semitones) === nearestIntSemitone) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  handleEnd(touchId) {
    const touchData = this.activeTouches.get(touchId);
    if (!touchData) return;
    
    audioEngine.stopNote(touchData.player);
    // 移除该列所有的 active 状态
    touchData.colEl.querySelectorAll('.note-btn').forEach(b => b.classList.remove('active'));
    this.activeTouches.delete(touchId);
  }
}