/* MÀN HÌNH "HÔM NAY" – tờ tiền lớn, Heo Đất nhận xét, 4 thẻ số liệu, danh sách hôm nay. */
(function () {
  const M = App.money, $ = App.$;

  $('screen-today').innerHTML = `
    <div class="bill" id="hero">
      <span class="seal">₫</span>
      <div class="bill-lbl">Hôm nay còn được tiêu</div>
      <div class="bill-amt" id="t-left">0 đ</div>
      <div class="bill-note" id="t-note"></div>
    </div>
    <div class="mascot">
      <div class="pig" id="pig">🐷<span class="mood" id="mood"></span></div>
      <div class="bubble" id="bubble"></div>
    </div>
    <div class="stats">
      <div class="sticker"><div class="ico">🧾</div><div class="lbl">Đã tiêu hôm nay</div><div class="val" id="t-today"></div></div>
      <div class="sticker"><div class="ico">💰</div><div class="lbl">Quỹ tháng còn</div><div class="val" id="t-remain"></div></div>
      <div class="sticker"><div class="ico">📆</div><div class="lbl">Từ mai mỗi ngày</div><div class="val" id="t-tmr"></div></div>
      <div class="sticker"><div class="ico">⏳</div><div class="lbl">Tới ngày lương</div><div class="val" id="t-days"></div></div>
    </div>
    <div class="card"><h2>Hôm nay đã ghi</h2><div class="list" id="t-list"></div></div>`;

  const MOOD = { happy: '✨', warn: '💦', bad: '🔥', idle: '👋' };
  let tip = { mood: 'idle', lines: [] }, idx = 0;

  function showTip() {
    if (App.mascot.holding()) return;
    const n = tip.lines.length;
    $('bubble').innerHTML = (tip.lines[idx % n] || '') + (n > 1 ? `<div class="dots">${idx % n + 1}/${n} · chạm để xem tiếp</div>` : '');
  }

  function render(c) {
    const hero = $('hero'), noSalary = !c.st.salary;
    const bad = !noSalary && (c.remain < 0 || c.fund <= 0), warn = !noSalary && !bad && c.todayLeft < 0;
    hero.classList.toggle('bad', bad);
    hero.classList.toggle('warn', warn);

    App.fx.countTo($('t-left'), noSalary || bad ? 0 : Math.max(0, c.todayLeft), M.fmt);
    $('t-note').textContent =
      noSalary ? 'Chưa có lương — vào Cài đặt nhé' :
      c.fund <= 0 ? 'Lương chưa đủ cho chi cố định + để dành' :
      c.remain < 0 ? `Đã vượt quỹ tháng ${M.fmt(-c.remain)}` :
      warn ? `Quá hạn mức hôm nay ${M.fmt(-c.todayLeft)} — mai tự giảm bớt` :
      `Hạn mức hôm nay: ${M.fmt(c.dailyToday)}`;

    App.fx.countTo($('t-today'), c.spentToday, M.fmt);
    App.fx.countTo($('t-remain'), c.remain, M.fmt);
    App.fx.countTo($('t-tmr'), Math.max(0, c.perDayFromTomorrow), M.fmt);
    if (c.daysLeft <= 1) $('t-tmr').textContent = 'Mai lương về 🎉';
    $('t-days').textContent = c.daysLeft + ' ngày';

    tip = App.mascot.tips(c, App.data);
    $('mood').textContent = MOOD[tip.mood];
    if (idx >= tip.lines.length) idx = 0;
    showTip();

    const list = c.inCy.filter(e => e.date === c.tIso).sort((a, b) => b.id - a.id);
    $('t-list').innerHTML = list.length ? list.map(e => App.ui.item(e)).join('')
      : '<div class="empty">Chưa ghi khoản nào hôm nay.<br>Bấm nút <b>+</b> vàng để ghi nhé!</div>';
  }

  const next = () => { idx++; App.mascot.clear(); showTip(); App.fx.pop($('pig')); };
  $('pig').onclick = next;
  $('bubble').onclick = next;

  App.today = { render, showTip };
})();
