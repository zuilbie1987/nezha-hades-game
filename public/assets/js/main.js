// 页面入口初始化
window.addEventListener('DOMContentLoaded', () => {
  const unlockBtn = document.getElementById('unlockAudio');
  let harmonica = null;
  const practice = new BluesPractice(audioEngine);

  unlockBtn.addEventListener('click', async () => {
    unlockBtn.disabled = true;
    unlockBtn.classList.remove('error');

    try {
      await audioEngine.unlock();
      unlockBtn.style.display = 'none';
      harmonica = new HarmonicaController(note => practice?.handleHarmonicaNote(note));
      practice.enable();
    } catch (error) {
      console.error(error);
      unlockBtn.textContent = '音频启动失败，请重试';
      unlockBtn.classList.add('error');
      unlockBtn.disabled = false;
    }
  });
});
