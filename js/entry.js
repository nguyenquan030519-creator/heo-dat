/* GHI KHOẢN MỚI – bảng trượt từ dưới lên, bàn phím số, chọn danh mục, hiệu ứng khi lưu. */
(function () {
  const M = App.money, D = App.dates, $ = App.$;
  const sheet = $('sheet'), ov = $('overlay');

  sheet.innerHTML = `
    <div class="grab"></div>
    <div class="toggle" id="e-type"><button data-t="out" class="on">💸 Chi tiêu</button><button data-t="in">💰 Thu thêm</button></div>
    <div class="amount" id="e-amt">0 <small>đ</small></div>
    <div class="amount-hint" id="e-hint">Bấm số · nút <b>000</b> cho nhanh</div>
    <div class="chips" id="e-cats"></div>
    <div class="meta"><input id="e-note" placeholder="Ghi chú (VD: phở sáng)" maxlength="60" autocomplete="off"><input id="e-date" type="date"></div>
    <div class="keypad" id="e-pad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'].map(k => `<button class="key" data-k="${k}">${k}</button>`).join('')}</div>
    <div class="row"><button class="btn ghost" id="e-cancel">Huỷ</button><button class="btn gold" id="e-save">Lưu 🪙</button></div>`;

  let amt = '', type = 'out', cat = 'an', isOpen = false;

  function showAmt() {
    const el = $('e-amt');
    el.innerHTML = (+amt || 0).toLocaleString('vi-VN') + ' <small>đ</small>';
    el.classList.toggle('in', type === 'in');
  }
  function renderCats() {
    $('e-cats').hidden = type === 'in';
    $('e-cats').innerHTML = App.CATS.map(c => `<button class="chip ${c[0] === cat ? 'on' : ''}" data-cat="${c[0]}">${c[1]} ${c[2]}</button>`).join('');
  }
  function setType(t) {
    type = t;
    [...$('e-type').children].forEach(b => b.classList.toggle('on', b.dataset.t === t));
    $('e-type').classList.toggle('in', t === 'in');
    $('e-save').textContent = t === 'in' ? 'Thêm tiền 💰' : 'Lưu 🪙';
    $('e-note').placeholder = t === 'in' ? 'VD: thưởng, freelance' : 'Ghi chú (VD: phở sáng)';
    renderCats(); showAmt();
  }
  function press(k) {
    if (k === '⌫') amt = amt.slice(0, -1);
    else {
      if (!amt && (k === '0' || k === '000')) return;
      if ((amt + k).length > 11) return;
      amt += k;
    }
    showAmt();
    App.fx.pop($('e-amt'));
  }

  function open(t) {
    amt = ''; $('e-note').value = ''; $('e-date').value = D.iso(D.today());
    setType(t || 'out');
    sheet.classList.add('open'); ov.classList.add('open'); isOpen = true;
  }
  function close() { sheet.classList.remove('open'); ov.classList.remove('open'); isOpen = false; }

  function save() {
    const v = +amt;
    if (!v) { App.fx.shake($('e-amt')); App.fx.buzz(60); return; }
    const e = { id: Date.now(), date: $('e-date').value || D.iso(D.today()), amount: v,
      cat: type === 'in' ? 'thu' : cat, note: $('e-note').value.trim(), type };
    const from = App.fx.point($('e-save'));
    close();
    App.go('today');
    App.commit(d => d.entries.push(e));

    const c = App.calc(App.data), hero = $('hero');
    App.themes.react();
    if (type === 'in') {
      App.fx.rain(); App.fx.sound('income'); App.fx.buzz([30, 40, 30]);
      App.mascot.react('income'); App.fx.stamp(hero, '+ TIỀN VỀ');
      App.fx.toast(`💰 +${M.short(v)} · Thu thêm`);
    } else {
      const ct = App.catOf(cat);
      App.fx.burst(from, hero, [ct[1], '🪙', '💵', '✨']);
      App.fx.buzz(25);
      if (c.remain < 0) { App.fx.sound('over'); App.fx.shake(hero); App.mascot.react('over'); }
      else if (c.todayLeft < 0) { App.fx.sound('coin'); App.fx.shake(hero); App.mascot.react('warn'); }
      else { App.fx.sound('coin'); App.mascot.react('ok'); }
      App.fx.stamp(hero, 'ĐÃ GHI');
      App.fx.toast(`${ct[1]} −${M.short(v)} · ${ct[2]}`);
    }
  }

  $('e-pad').onclick = ev => { const b = ev.target.closest('[data-k]'); if (b) press(b.dataset.k); };
  $('e-cats').onclick = ev => { const b = ev.target.closest('[data-cat]'); if (b) { cat = b.dataset.cat; renderCats(); } };
  $('e-type').onclick = ev => { const b = ev.target.closest('[data-t]'); if (b) setType(b.dataset.t); };
  $('e-save').onclick = save;
  $('e-cancel').onclick = close;
  ov.onclick = close;
  $('fab').onclick = () => open();

  // Bàn phím máy tính: số, Backspace, k = 000, m = 000000, Enter lưu, Esc đóng
  document.addEventListener('keydown', ev => {
    if (!isOpen) return;
    if (ev.target === $('e-note') || ev.target === $('e-date')) {
      if (ev.key === 'Enter') save(); else if (ev.key === 'Escape') close();
      return;
    }
    const k = ev.key.toLowerCase();
    if (/^[0-9]$/.test(k)) press(k);
    else if (k === 'backspace') press('⌫');
    else if (k === 'k') press('000');
    else if (k === 'm') { press('000'); press('000'); }
    else if (k === 'enter') save();
    else if (k === 'escape') close();
    else return;
    ev.preventDefault();
  });

  App.entry = { open, close };
})();
