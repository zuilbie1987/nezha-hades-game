class HarmonicaController {
  holeCount = 10;
  activeTouches = new Map();
  gridEl = document.getElementById('keyboardGrid');
  pixelsPerSemitone = 45; // 滑动多少像素改变一个半音

  holeSkillMap = [
    { blow: [{ semitones: 3, label: '超吹' }], draw: [{ semitones: -1, label: '吸压' }] },
    { blow: [], draw: [{ semitones: -1, label: '吸压' }, { semitones: -2, label: '吸压' }] },
    { blow: [], draw: [{ semitones: -1, label: '吸压' }, { semitones: -2, label: '吸压' }, { semitones: -3, label: '吸压' }] },
    { blow: [{ semitones: 3, label: '超吹' }], draw: [{ semitones: -1, label: '吸压' }] },
    { blow: [{ semitones: 2, label: '超吹' }], draw: [] },
    { blow: [{ semitones: 3, label: '超吹' }], draw: [{ semitones: -1, label: '吸压' }] },
    { blow: [], draw: [{ semitones: 2, label: '超吸' }] },
    { blow: [{ semitones: -1, label: '吹压' }], draw: [] },
    { blow: [{ semitones: -1, label: '吹压' }], draw: [{ semitones: 3, label: '超吸' }] },
    { blow: [{ semitones: -1, label: '吹压' }, { semitones: -2, label: '吹压' }], draw: [{ semitones: 4, label: '超吸' }] },
  ];

  constructor(onNoteStart = null) {
    this.onNoteStart = onNoteStart;
    this.renderKeyboard();
    this.bindUnifiedInput();
    window.addEventListener('blur', () => this.stopAll());
    window.addEventListener('pagehide', () => this.stopAll());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stopAll();
    });
  }

  renderKeyboard() {
    this.gridEl.innerHTML = '';
    
    for (let i = 1; i <= this.holeCount; i++) {
      const col = document.createElement('div');
      col.className = 'hole-col';
      col.dataset.colHole = i;
      const skill = this.holeSkillMap[i - 1];

      // 上方槽位：超吹或超吸
      for (let step = 4; step >= 1; step--) {
        const blowSkill = skill.blow.find(item => item.semitones === step);
        const drawSkill = skill.draw.find(item => item.semitones === step);
        const upperSkill = blowSkill || drawSkill;
        col.appendChild(upperSkill
          ? this.createButton(i, blowSkill ? 'blow' : 'draw', step, upperSkill.label)
          : this.createSpacer());
      }

      // 槽位 3: 吹气
      col.appendChild(this.createButton(i, 'blow', 0, '吹'));
      // 槽位 4: 吸气
      col.appendChild(this.createButton(i, 'draw', 0, '吸'));

      // 下方槽位：吸气压音或吹气压音
      for (let step = 1; step <= 3; step++) {
        const blowSkill = skill.blow.find(item => item.semitones === -step);
        const drawSkill = skill.draw.find(item => item.semitones === -step);
        const lowerSkill = blowSkill || drawSkill;
        col.appendChild(lowerSkill
          ? this.createButton(i, blowSkill ? 'blow' : 'draw', -step, lowerSkill.label)
          : this.createSpacer());
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
    if (this.activeTouches.has(touchId)) return;

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
      currentSemitones: originSemitones,
      colEl: btn.closest('.hole-col'),
      player: audioEngine.playNote(baseFreq, originSemitones)
    };
    this.activeTouches.set(touchId, touchData);
    this.onNoteStart?.({ hole, type, semitones: originSemitones });
  }

  handleMove(touchId, y) {
    const touchData = this.activeTouches.get(touchId);
    if (!touchData) return;

    const { startY, originSemitones, type, hole, baseFreq, player, colEl } = touchData;
    const deltaY = y - startY;

    // 滑动方向统一：向上滑动 deltaY为负数，向下滑动 deltaY为正数。
    let shift = -deltaY / this.pixelsPerSemitone;
    let currentSemitones = originSemitones + shift;

    // 获取当前孔位和呼吸方向的技巧范围，限制滑动极值(Clamp)
    const skill = this.holeSkillMap[hole - 1];
    const availableSemitones = [0, ...skill[type].map(item => item.semitones)];
    const minSemitones = Math.min(...availableSemitones);
    const maxSemitones = Math.max(...availableSemitones);
    currentSemitones = Math.max(minSemitones, Math.min(currentSemitones, maxSemitones));

    // 1. 发送平滑频率给音频引擎
    audioEngine.updatePitch(player, baseFreq, currentSemitones);

    // 2. 视觉反馈：按当前仍在触摸的音符统一刷新，避免多点触摸互相清除状态
    touchData.currentSemitones = currentSemitones;
    this.refreshColumnVisual(colEl);
  }

  handleEnd(touchId) {
    const touchData = this.activeTouches.get(touchId);
    if (!touchData) return;
    
    this.activeTouches.delete(touchId);
    audioEngine.stopNote(touchData.player);
    this.refreshColumnVisual(touchData.colEl);
  }

  refreshColumnVisual(colEl) {
    colEl.querySelectorAll('.note-btn').forEach(btn => btn.classList.remove('active'));

    for (const touchData of this.activeTouches.values()) {
      if (touchData.colEl !== colEl) continue;

      const buttons = [...colEl.querySelectorAll(`.note-btn[data-type="${touchData.type}"]`)];
      const nearestButton = buttons.reduce((nearest, button) => {
        if (!nearest) return button;
        const buttonDistance = Math.abs(Number(button.dataset.semitones) - touchData.currentSemitones);
        const nearestDistance = Math.abs(Number(nearest.dataset.semitones) - touchData.currentSemitones);
        return buttonDistance < nearestDistance ? button : nearest;
      }, null);
      nearestButton?.classList.add('active');
    }
  }

  stopAll() {
    for (const touchId of [...this.activeTouches.keys()]) {
      this.handleEnd(touchId);
    }
  }
}
