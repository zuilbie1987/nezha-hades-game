// 页面入口初始化
window.addEventListener('DOMContentLoaded', () => {
  const unlockBtn = document.getElementById('unlockAudio');
  let harmonica = null;

  unlockBtn.addEventListener('click', () => {
    audioEngine.unlock();
    unlockBtn.style.display = 'none';
    harmonica = new HarmonicaController();
  });
});