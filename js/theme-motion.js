/* Một bộ hẹn giờ cho nền đang chọn. Không RAF/interval, không đổi layout mỗi frame. */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)');
  let scene, actors = [], generation = 0, idleTimer, endTimer, stopped = false;
  const allowed = () => !reduce.matches && !document.hidden && !stopped;
  function clearTimers() { clearTimeout(idleTimer); clearTimeout(endTimer); }
  function reset() {
    actors.forEach(a => a.classList.remove('perform', 'face-on'));
  }
  function schedule(delay) {
    clearTimeout(idleTimer);
    if (allowed() && actors.length) idleTimer = setTimeout(play, delay ?? (mobile.matches ? 18000 : 12000));
  }
  function play() {
    if (!allowed() || !actors.length || scene?.classList.contains('playing')) return;
    clearTimers();
    scene.classList.add('playing');
    actors.forEach(a => {
      a.classList.add('perform');
      if (a.dataset.faceReady === 'yes') a.classList.add('face-on');
    });
    endTimer = setTimeout(() => {
      reset(); scene?.classList.remove('playing'); schedule();
    }, 2400);
  }
  function stop() {
    generation++; clearTimers(); reset();
    scene?.classList.remove('playing'); actors = []; scene = null;
  }
  function mount(el, theme) {
    stop(); scene = el; actors = [...el.children];
    const token = generation;
    const acts = App.themeActs[theme] || [];
    actors.forEach((actor, i) => {
      delete actor.dataset.faceReady;
      const act = acts[i] || { move: 'hop' };
      actor.dataset.move = act.move;
      actor.style.setProperty('--actor-delay', (i * 180) + 'ms');
      if (act.face && !reduce.matches) {
        const face = new Image(); face.alt = ''; face.decoding = 'async';
        face.className = 'actor-face'; face.src = act.face;
        face.decode().then(() => {
          if (token !== generation) return;
          actor.append(face); actor.dataset.faceReady = 'yes';
        }).catch(() => { /* Base image stays usable if an expression is unavailable. */ });
      }
    });
    scene.classList.toggle('motion-off', !allowed());
    schedule(1800);
  }
  function suspend() {
    clearTimers(); reset(); scene?.classList.remove('playing');
    if (scene) scene.classList.toggle('motion-off', !allowed());
    schedule();
  }
  document.addEventListener('visibilitychange', suspend);
  reduce.addEventListener('change', () => {
    // Remount to load expression lazily if reduced motion has just been disabled.
    if (scene) { const el = scene; const theme = document.documentElement.dataset.theme;
      el.querySelectorAll('.actor-face').forEach(img => img.remove());
      mount(el, theme);
    }
    suspend();
  });
  App.themeMotion = { mount, stop, play, reduced: () => reduce.matches,
    pause(value) { stopped = value; suspend(); }, paused: () => stopped };
})();
