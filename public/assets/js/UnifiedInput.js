class UnifiedInput {
  constructor(wrapEl, onStart, onMove, onEnd) {
    this.wrap = wrapEl;
    this.onStart = onStart;
    this.onMove = onMove;
    this.onEnd = onEnd;
    this.bindTouch();
    this.bindMouse();
  }

  bindTouch() {
    this.wrap.addEventListener('touchstart', e => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        this.onStart(t.identifier, t.clientX, t.clientY, e.target);
      }
    }, { passive:false });

    this.wrap.addEventListener('touchmove', e => {
      e.preventDefault();
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        this.onMove(t.identifier, t.clientX, t.clientY);
      }
    }, { passive:false });

    this.wrap.addEventListener('touchend', e => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        this.onEnd(t.identifier);
      }
    });

    this.wrap.addEventListener('touchcancel', e => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        this.onEnd(t.identifier);
      }
    });
  }

  bindMouse() {
    let mouseDown = false;
    const mouseId = 'mouse-0';

    this.wrap.addEventListener('mousedown', e => {
      mouseDown = true;
      this.onStart(mouseId, e.clientX, e.clientY, e.target);
    });

    window.addEventListener('mousemove', e => {
      if (!mouseDown) return;
      this.onMove(mouseId, e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
      if (!mouseDown) return;
      mouseDown = false;
      this.onEnd(mouseId);
    });

    window.addEventListener('mouseleave', () => {
      if (!mouseDown) return;
      mouseDown = false;
      this.onEnd(mouseId);
    });
  }
}
