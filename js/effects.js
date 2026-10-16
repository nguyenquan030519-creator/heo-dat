/* HIỆU ỨNG – xu bay, mưa tiền, tem "ĐÃ GHI", số chạy, rung, âm thanh, thông báo. */
(function () {
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const layer = () => App.$('fx-layer');
  const rnd = (a, b) => a + Math.random() * (b - a);
  const point = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const fx = { point };

  function particle(ch, x, y, size) {
    const p = document.createElement('div');
    p.className = 'fx-p'; p.textContent = ch;
    p.style.left = (x - 16) + 'px'; p.style.top = (y - 16) + 'px';
    if (size) p.style.fontSize = size + 'px';
    layer().appendChild(p);
    return p;
  }

  // Xu/tiền bắn ra từ nút Lưu rồi bay vào tờ tiền lớn
  fx.burst = (from, toEl, emojis = ['🪙', '💵', '🪙', '✨'], n = 16) => {
    if (reduce) return;
    const a = from.nodeType ? point(from) : from;
    const b = toEl ? point(toEl) : { x: a.x, y: a.y - 240 };
    for (let i = 0; i < n; i++) {
      const p = particle(emojis[i % emojis.length], a.x, a.y);
      const mx = rnd(-150, 150), my = rnd(-240, -90), dx = b.x - a.x + rnd(-70, 70), dy = b.y - a.y + rnd(-25, 25);
      p.animate([
        { transform: 'translate(0,0) scale(.3)', opacity: 1 },
        { transform: `translate(${mx}px,${my}px) scale(1.25) rotate(${rnd(-180, 180)}deg)`, opacity: 1, offset: .45 },
        { transform: `translate(${dx}px,${dy}px) scale(.5) rotate(${rnd(-360, 360)}deg)`, opacity: 0 }
      ], { duration: rnd(850, 1150), easing: 'cubic-bezier(.2,.7,.3,1)', delay: i * 18, fill: 'forwards' }).onfinish = () => p.remove();
    }
  };

  // Mưa tiền từ trên xuống (khi có thu thêm / lưu cài đặt)
  fx.rain = (emojis = ['💸', '💵', '🤑', '🪙'], n = 30) => {
    if (reduce) return;
    const W = innerWidth, H = innerHeight;
    for (let i = 0; i < n; i++) {
      const p = particle(emojis[i % emojis.length], rnd(10, W - 10), -30, rnd(22, 38));
      p.animate([
        { transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: `translate(${rnd(-60, 60)}px,${H * .5}px) rotate(${rnd(-90, 90)}deg)`, opacity: 1, offset: .5 },
        { transform: `translate(${rnd(-90, 90)}px,${H + 60}px) rotate(${rnd(-200, 200)}deg)`, opacity: .9 }
      ], { duration: rnd(1300, 2200), easing: 'ease-in', delay: rnd(0, 600), fill: 'forwards' }).onfinish = () => p.remove();
    }
  };

  const replay = (el, cls) => { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  fx.shake = el => replay(el, 'shake');
  fx.pop = el => replay(el, 'pop');

  // Tem đóng dấu lên tờ tiền
  fx.stamp = (el, text) => {
    if (!el) return;
    const s = document.createElement('div');
    s.className = 'stamp'; s.textContent = text;
    el.appendChild(s);
    setTimeout(() => s.remove(), 2300);
  };

  // Số chạy từ giá trị cũ sang mới
  fx.countTo = (el, to, format) => {
    const from = el._v; el._v = to;
    if (from == null || from === to || reduce) { el.textContent = format(to); return; }
    cancelAnimationFrame(el._raf);
    const t0 = performance.now(), dur = 750;
    const step = t => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = format(from + (to - from) * e);
      if (k < 1) el._raf = requestAnimationFrame(step);
    };
    el._raf = requestAnimationFrame(step);
  };

  let toastT;
  fx.toast = html => {
    const t = App.$('toast');
    t.innerHTML = html; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
  };

  fx.buzz = pattern => { try { navigator.vibrate && navigator.vibrate(pattern); } catch (e) { } };

  // Âm thanh 8-bit "ting ting" (tắt được trong Cài đặt)
  let ac;
  const SOUNDS = {
    coin: [[988, 0, .08], [1319, .08, .28]],
    income: [[784, 0, .1], [988, .1, .1], [1319, .2, .12], [1568, .32, .35]],
    over: [[330, 0, .16], [247, .16, .35]],
    ok: [[880, 0, .1], [1175, .1, .2]]
  };
  fx.sound = kind => {
    if (!App.data || !App.data.settings.sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const now = ac.currentTime;
      (SOUNDS[kind] || SOUNDS.ok).forEach(([f, t, d]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = kind === 'over' ? 'sawtooth' : 'square';
        o.frequency.value = f;
        g.gain.setValueAtTime(.0001, now + t);
        g.gain.exponentialRampToValueAtTime(.05, now + t + .01);
        g.gain.exponentialRampToValueAtTime(.0001, now + t + d);
        o.connect(g).connect(ac.destination);
        o.start(now + t); o.stop(now + t + d + .02);
      });
    } catch (e) { }
  };

  App.fx = fx;
})();
