/* MÀN HÌNH "THÁNG NÀY" – nhiệt kế tiến độ, hoá đơn tháng, tiêu vào đâu, sổ ghi, các kỳ trước. */
(function () {
  const M = App.money, D = App.dates, $ = App.$;

  $('screen-month').innerHTML = `
    <div class="card"><h2>🌡️ Tiến độ tiêu quỹ</h2>
      <div class="thermo" id="m-thermo"><i id="m-bar"></i><b id="m-mark"></b></div>
      <div class="small" id="m-txt"></div></div>
    <div class="receipt"><h2>🧾 Hoá đơn tháng này</h2><div id="m-flow"></div></div>
    <div class="card"><h2>🍩 Tiêu vào đâu</h2><div id="m-cats"></div></div>
    <div class="card"><h2>📒 Sổ ghi trong kỳ</h2><div class="list" id="m-hist"></div></div>
    <div class="card" id="m-pastcard"><h2>🗂️ Các kỳ trước</h2><div id="m-past"></div></div>`;

  const line = (a, b, cls = '') => `<div class="rline ${cls}"><span>${a}</span><span>${b}</span></div>`;

  function render(c) {
    const pct = c.fund > 0 ? Math.min(100, c.spent / c.fund * 100) : 0;
    const ipct = c.fund > 0 ? Math.min(100, c.ideal / c.fund * 100) : 0;
    $('m-bar').style.width = pct + '%';
    $('m-mark').style.left = `calc(${ipct}% - 2px)`;
    $('m-thermo').classList.toggle('warn', c.spent > c.ideal);
    $('m-txt').innerHTML = `Đã tiêu <b>${M.fmt(c.spent)}</b> / ${M.fmt(c.fund)} (${Math.round(pct)}%).<br>Vạch đen = mức nên tiêu tới hôm nay: <b>${M.fmt(c.ideal)}</b>.`;

    $('m-flow').innerHTML =
      line('Lương', M.fmt(c.st.salary)) +
      (c.extra ? line('Thu thêm', '+' + M.fmt(c.extra)) : '') +
      line('Chi cố định', '−' + M.fmt(c.fixedTotal)) +
      (c.st.saving ? line('Để dành', '−' + M.fmt(c.st.saving)) : '') +
      line('Quỹ chi tiêu', M.fmt(c.fund), 'total') +
      line('Đã tiêu', '−' + M.fmt(c.spent)) +
      line('CÒN LẠI', M.fmt(c.remain), 'total');

    const mx = c.cats.length ? c.cats[0][1] : 1;
    $('m-cats').innerHTML = c.cats.length ? c.cats.map(([k, v]) => {
      const ct = App.catOf(k);
      return `<div class="catrow"><span class="n">${ct[1]} ${ct[2]}</span><span class="b"><i style="width:${v / mx * 100}%"></i></span><span class="v">${M.short(v)}</span></div>`;
    }).join('') : '<div class="empty">Chưa có dữ liệu.</div>';

    const days = {};
    c.inCy.forEach(e => (days[e.date] = days[e.date] || []).push(e));
    $('m-hist').innerHTML = Object.keys(days).sort().reverse().map(d => {
      const tot = days[d].filter(e => e.type !== 'in').reduce((a, e) => a + e.amount, 0);
      return `<div class="dayhead"><span>${D.label(D.parseIso(d))}</span><span>${M.fmt(tot)}</span></div>` +
        days[d].sort((a, b) => b.id - a.id).map(e => App.ui.item(e)).join('');
    }).join('') || '<div class="empty">Chưa có khoản nào trong kỳ.</div>';

    $('m-pastcard').hidden = !c.pastList.length;
    $('m-past').innerHTML = c.pastList.map(p =>
      line(`Kỳ từ ${D.dm(p.start)}/${p.start.getFullYear()}`, `tiêu ${M.short(p.out)} · ${p.left >= 0 ? '🟢 dư' : '🔴 âm'} ${M.short(Math.abs(p.left))}`)
    ).join('') + '<div class="small" style="margin-top:6px">Số dư ước tính theo lương & chi cố định hiện tại.</div>';
  }

  App.month = { render };
})();
