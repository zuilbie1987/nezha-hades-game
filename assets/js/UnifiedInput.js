// 统一输入控制器：兼容移动端Touch + PC鼠标
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
      const t = e.touches[0];
      this.onStart(t.clientX, t.clientY, e.target);
    }, { passive:false });
    this.wrap.addEventListener('touchmove', e => {
      e.preventDefault();
      const t = e.touches[0];
      this.onMove(t.clientX, t.clientY);
    }, { passive:false });
    this.wrap.addEventListener('touchend', () => this.onEnd());
    this.wrap.addEventListener('touchcancel', () => this.onEnd());
  }

  bindMouse() {
    let mouseDown = false;
    let targetEl = null;

    this.wrap.addEventListener('mousedown', e => {
      mouseDown = true;
      targetEl = e.target;
      this.onStart(e.clientX, e.clientY, targetEl);
    });
    window.addEventListener('mousemove', e => {
      if (!mouseDown) return;
      this.onMove(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', () => {
      if (!mouseDown) return;
      mouseDown = false;
      this.onEnd();
    });
    window.addEventListener('mouseleave', () => {
      if (!mouseDown) return;
      mouseDown = false;
      this.onEnd();
    });
  }
}