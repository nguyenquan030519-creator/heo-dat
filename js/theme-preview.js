/* Xem nền toàn màn hình bằng chính scene đang dùng, không nhân đôi ảnh/timer. */
(function () {
  let dialog;
  function open() {
    if (!dialog) {
      dialog = document.createElement('dialog'); dialog.id = 'theme-preview';
      dialog.setAttribute('aria-label', 'Xem thử hình nền và biểu cảm');
      dialog.innerHTML = '<div class="scene-toolbar"><b id="scene-title"></b><p id="scene-hint"></p><div class="scene-buttons"><button class="btn gold" data-act>Diễn thử</button><button class="btn ghost" data-pause aria-pressed="false">Tạm dừng</button><button class="btn ghost" data-close>Đóng</button></div></div>';
      document.body.append(dialog);
      dialog.querySelector('[data-act]').onclick = () => App.themeMotion.play();
      dialog.querySelector('[data-pause]').onclick = () => {
        App.themeMotion.pause(!App.themeMotion.paused()); update();
      };
      dialog.querySelector('[data-close]').onclick = () => dialog.close();
      dialog.addEventListener('close', () => document.documentElement.classList.remove('scene-preview'));
    }
    const t = App.themes.list.find(t => t.id === document.documentElement.dataset.theme);
    dialog.querySelector('#scene-title').textContent = t.name;
    document.documentElement.classList.add('scene-preview');
    update(); dialog.showModal(); App.themeMotion.play();
  }
  function update() {
    const paused = App.themeMotion.paused(), reduced = App.themeMotion.reduced();
    dialog.querySelector('[data-pause]').textContent = paused ? 'Tiếp tục' : 'Tạm dừng';
    dialog.querySelector('[data-pause]').setAttribute('aria-pressed', String(paused));
    dialog.querySelector('[data-act]').disabled = paused || reduced;
    dialog.querySelector('#scene-hint').textContent = reduced ? 'Thiết bị đang bật giảm chuyển động.' : 'Một màn diễn ngắn, rồi nhân vật nghỉ. Chuyển động cũng xuất hiện khi ghi khoản.';
  }
  document.addEventListener('click', e => { if (e.target.closest('[data-scene-preview]')) open(); });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
    if (dialog?.open) update();
  });
})();
