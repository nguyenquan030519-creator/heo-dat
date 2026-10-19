/* Áp dụng nền + ô chọn. Catalogue, chuyển động và xem thử nằm ở file riêng. */
(function () {
  const list = App.themeCatalog;
  const find = id => list.find(t => t.id === id) || list[0];
  let scene, current, pickerTheme;
  function apply(id) {
    const t = find(id);
    if (current === t.id) return;
    current = t.id;
    const root = document.documentElement;
    root.dataset.theme = t.id;
    root.classList.toggle('cinematic', !!t.cinematic);
    root.classList.toggle('has-scene', !!(t.left || t.right));
    if (!scene) {
      scene = document.createElement('div');
      scene.id = 'scene'; scene.setAttribute('aria-hidden', 'true');
      // Mobile: this becomes an in-flow stage between the header and content.
      // Desktop/preview keep the same node fixed via CSS, without duplicate images.
      document.querySelector('.top').after(scene);
    }
    App.themeMotion.stop();
    scene.replaceChildren();
    [t.left, t.right].forEach((src, i) => {
      if (!src) return;
      const actor = document.createElement('div');
      actor.className = 'scene-actor ' + (i ? 'sc-r' : 'sc-l');
      const img = new Image(); img.alt = ''; img.decoding = 'async';
      img.src = src; img.className = 'actor-base'; actor.append(img);
      scene.append(actor);
    });
    App.themeMotion.mount(scene, t.id);
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = t.color;
  }
  const thumb = src => src.includes('/portraits/') ? src.replace('/portraits/', '/thumbs/') : src;
  function renderPicker() {
    const box = App.$('st-theme');
    if (!box) return;
    const cur = find(App.data.settings.theme).id;
    if (pickerTheme === cur && box.querySelector('.themes')) return;
    pickerTheme = cur;
    box.innerHTML = '<h2>🎨 Hình nền</h2><div class="themes">' + list.map(t => `
      <button class="theme-tile ${t.id === cur ? 'on' : ''}" aria-pressed="${t.id === cur}" data-pick="${t.id}" style="--sw:${t.sw}">
        <span class="thumbs">${t.left ? `<img loading="lazy" decoding="async" src="${thumb(t.left)}" alt=""><img loading="lazy" decoding="async" src="${thumb(t.right)}" alt="">` : `<span class="ti">${t.ico}</span>`}</span>
        <b>${t.name}</b><small>${t.sub}</small>
      </button>`).join('') + '</div><div class="theme-actions"><button class="btn ghost" data-scene-preview>Xem thử nền &amp; biểu cảm</button></div>';
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-pick]');
    if (!b) return;
    const id = b.dataset.pick;
    App.commit(d => { d.settings.theme = id; });
    // renderPicker replaces the buttons; restore keyboard focus after selection.
    document.querySelector(`[data-pick="${id}"]`)?.focus({ preventScroll: true });
    App.fx.sound('ok'); App.fx.buzz(20);
    App.fx.toast('🎨 Đã đổi sang: ' + find(id).name);
  });
  App.themes = { list, apply, renderPicker, react: () => App.themeMotion.play() };
})();
