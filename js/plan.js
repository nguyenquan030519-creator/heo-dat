/* KẾ HOẠCH TIẾT KIỆM – so sánh gửi ngân hàng / mua vàng / để tiền mặt
   theo giá NGƯỜI DÙNG TỰ NHẬP (có nút mở nhanh trang tra giá). Chỉ là mô phỏng, không dự đoán giá.
   Dữ liệu lưu ở App.data.plan (tự tạo nếu chưa có). */
(function () {
  const M = App.money, D = App.dates, $ = App.$;

  // Nút tra giá nhanh – đổi link ở đây
  const LINKS = [
    ['🟡 Giá vàng SJC', 'https://sjc.com.vn/'],
    ['🔎 Giá vàng hôm nay', 'https://www.google.com/search?q=gi%C3%A1+v%C3%A0ng+h%C3%B4m+nay'],
    ['🏦 Lãi suất tiết kiệm', 'https://www.google.com/search?q=l%C3%A3i+su%E1%BA%A5t+g%E1%BB%ADi+ti%E1%BA%BFt+ki%E1%BB%87m+12+th%C3%A1ng+h%C3%B4m+nay'],
    ['📊 Lạm phát (CPI)', 'https://www.google.com/search?q=l%E1%BA%A1m+ph%C3%A1t+CPI+Vi%E1%BB%87t+Nam+m%E1%BB%9Bi+nh%E1%BA%A5t']
  ];
  const GROW = [-10, 0, 5, 10, 20];           // giả định vàng %/năm
  const COL = { bank: '#14a06a', gold: '#d99a00', cash: '#ef4b4b' };

  const blank = () => ({ monthly: null, start: 0, goal: 0, months: 12, rate: null, goldBuy: 0, goldSell: 0, goldGrow: 0, infl: null, updatedAt: 0 });
  const P = () => {
    const d = App.data;
    if (!d.plan) d.plan = blank();
    return d.plan;
  };
  const monthlyOf = p => (p.monthly == null ? (App.data.settings.saving || 0) : p.monthly); // trống = lấy theo Cài đặt
  const pct = v => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
  const fmtIn = n => (n ? n.toLocaleString('vi-VN') : '');

  $('screen-plan').innerHTML = `
    <div class="card plan-intro"><h2>🎯 Kế hoạch tiết kiệm</h2>
      <div class="small">So sánh 3 cách giữ tiền theo giá <b>bạn tự nhập</b>. Đây là mô phỏng "nếu… thì…", <b>không phải lời khuyên đầu tư</b>.</div></div>

    <div class="card"><h2>💰 Tiền để dành</h2>
      <div class="pgrid">
        <div><label for="p-monthly">Mỗi tháng để dành</label><input id="p-monthly" placeholder="VD: 3tr" autocomplete="off"></div>
        <div><label for="p-start">Đã có sẵn</label><input id="p-start" placeholder="VD: 10tr" autocomplete="off"></div>
        <div><label for="p-goal">Mục tiêu (tuỳ chọn)</label><input id="p-goal" placeholder="VD: 50tr" autocomplete="off"></div>
        <div><label for="p-months">Trong bao nhiêu tháng</label><input id="p-months" type="number" inputmode="numeric" min="1" max="120" placeholder="12"></div>
      </div>
    </div>

    <div class="card"><h2>📈 Giá thị trường <span class="p-upd" id="p-upd"></span></h2>
      <div class="small">Bấm nút để tra giá mới nhất, rồi gõ vào ô bên dưới.</div>
      <div class="p-links">${LINKS.map(([t, u]) => `<a class="btn sm ghost" href="${u}" target="_blank" rel="noopener">${t}</a>`).join('')}</div>
      <label for="p-rate">Lãi suất gửi tiết kiệm (%/năm)</label>
      <input id="p-rate" inputmode="decimal" placeholder="VD: 5" autocomplete="off">
      <div class="pgrid">
        <div><label for="p-gbuy">Giá bạn MUA vàng /lượng</label><input id="p-gbuy" placeholder="tiệm bán ra" autocomplete="off"></div>
        <div><label for="p-gsell">Giá BÁN lại /lượng</label><input id="p-gsell" placeholder="tiệm mua vào" autocomplete="off"></div>
      </div>
      <label>Giả định giá vàng mỗi năm</label>
      <div class="chips p-grow" id="p-grow">${GROW.map(v => `<button class="chip" data-grow="${v}">${v > 0 ? '+' : ''}${v}%</button>`).join('')}</div>
      <label for="p-infl">Lạm phát (%/năm, tuỳ chọn)</label>
      <input id="p-infl" inputmode="decimal" placeholder="VD: 3.5" autocomplete="off">
    </div>

    <div class="card"><h2>⚖️ Sau <span id="p-n">12</span> tháng bạn có</h2>
      <div id="p-res"></div>
      <div class="p-chart" id="p-chart"></div>
    </div>

    <div class="card p-tips"><h2>🐷 Heo Đất nhận xét</h2><div id="p-tips"></div></div>`;

  /* ---------- Mô phỏng từng tháng ----------
     Đầu mỗi tháng bỏ thêm tiền, cuối tháng tính giá trị.
     Ngân hàng: lãi nhập gốc hàng tháng (ước tính). Vàng: mua theo giá MUA, định giá theo giá BÁN lại. */
  function simulate(p) {
    const N = Math.max(1, Math.min(120, p.months | 0 || 12));
    const r = (p.rate || 0) / 100, g = (p.goldGrow || 0) / 100, inf = (p.infl || 0) / 100;
    const hasGold = p.goldBuy > 0 && p.goldSell > 0, mo = monthlyOf(p);
    const gf = k => Math.pow(1 + g, k / 12);
    let bank = p.start, put = p.start, real = p.start, units = hasGold ? p.start / p.goldBuy : 0;
    const rows = [{ m: 0, put, bank, gold: hasGold ? units * p.goldSell : null, real }];
    for (let k = 1; k <= N; k++) {
      bank = (bank + mo) * (1 + r / 12);
      if (hasGold) units += mo / (p.goldBuy * gf(k - 1));
      put += mo;
      real = (real + mo) / Math.pow(1 + inf, 1 / 12);
      rows.push({ m: k, put, bank, gold: hasGold ? units * p.goldSell * gf(k) : null, real });
    }
    return { N, rows, last: rows[N], hasGold, hasRate: p.rate != null, hasInfl: p.infl != null && p.infl !== 0 };
  }
  const reachAt = (rows, key, goal) => { const r = rows.find(x => x[key] != null && x[key] >= goal); return r ? r.m : null; };

  /* ---------- Biểu đồ LỜI / LỖ so với tiền bỏ vào (SVG, nhãn đặt ngay cuối đường) ---------- */
  function chart(s) {
    const W = 340, H = 190, L = 8, R = 104, T = 14, B = 22;
    const series = [
      { name: 'Ngân hàng', col: COL.bank, on: s.hasRate, f: r => r.bank - r.put },
      { name: 'Vàng', col: COL.gold, on: s.hasGold, f: r => r.gold - r.put },
      { name: 'Tiền mặt', col: COL.cash, on: s.hasInfl, f: r => r.real - r.put, dash: '3 4' }
    ].filter(x => x.on);
    const vals = s.rows.flatMap(r => series.map(x => x.f(r))).concat(0);
    let max = Math.max(...vals), min = Math.min(...vals);
    const pad = (max - min) * .1 || 1; max += pad; min -= pad;
    const X = m => L + (W - L - R) * m / s.N;
    const Y = v => T + (H - T - B) * (1 - (v - min) / (max - min));
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Biểu đồ lời lỗ">`;
    svg += `<line x1="${L}" y1="${Y(0)}" x2="${W - R}" y2="${Y(0)}" stroke="currentColor" stroke-opacity=".45" stroke-width="2" stroke-dasharray="5 5"/>`;
    [0, Math.round(s.N / 2), s.N].forEach(m => { svg += `<text x="${X(m)}" y="${H - 6}" font-size="10" text-anchor="middle" fill="currentColor" opacity=".6">${m === 0 ? 'Nay' : 'T' + m}</text>`; });
    const labels = [{ y: Y(0), name: 'Hoà vốn', col: 'currentColor' }];
    series.forEach(x => {
      const pts = s.rows.map(r => `${X(r.m).toFixed(1)},${Y(x.f(r)).toFixed(1)}`).join(' ');
      svg += `<polyline points="${pts}" fill="none" stroke="${x.col}" stroke-width="${x.dash ? 2.5 : 4}" stroke-linecap="round" stroke-linejoin="round" ${x.dash ? `stroke-dasharray="${x.dash}"` : ''}/>`;
      const v = x.f(s.last);
      labels.push({ y: Y(v), name: `${x.name} ${v >= 0 ? '+' : ''}${M.short(v)}`, col: x.col });
    });
    labels.sort((a, b) => a.y - b.y);
    for (let i = 1; i < labels.length; i++) if (labels[i].y - labels[i - 1].y < 13) labels[i].y = labels[i - 1].y + 13;
    labels.forEach(l => { svg += `<text x="${W - R + 4}" y="${l.y + 4}" font-size="10.5" font-weight="800" fill="${l.col}">${l.name}</text>`; });
    return svg + '</svg>';
  }

  function resultRow(ico, name, val, put, col, extra) {
    const diff = val - put;
    return `<div class="p-row"><div class="p-ico" style="background:${col}">${ico}</div>
      <div class="p-t"><b>${name}</b><span class="small">${extra || ''}</span></div>
      <div class="p-v"><b>${M.fmt(val)}</b><span class="${diff >= 0 ? 'up' : 'down'}">${diff >= 0 ? '+' : '−'}${M.fmt(Math.abs(diff))}</span></div></div>`;
  }

  function render() {
    if (!App.data) return;
    const p = P(), s = simulate(p), last = s.last;
    $('p-n').textContent = s.N;
    $('p-upd').textContent = p.updatedAt ? '· cập nhật ' + D.label(new Date(p.updatedAt)) : '· chưa nhập';
    $('p-grow').querySelectorAll('[data-grow]').forEach(b => b.classList.toggle('on', +b.dataset.grow === (p.goldGrow || 0)));

    let res = `<div class="small p-put">Tổng tiền bạn bỏ vào: <b>${M.fmt(last.put)}</b></div>`;
    if (s.hasRate) res += resultRow('🏦', 'Gửi ngân hàng', last.bank, last.put, COL.bank, `lãi ${p.rate}%/năm`);
    if (s.hasGold) res += resultRow('🟡', 'Mua vàng', last.gold, last.put, COL.gold, `nếu vàng ${p.goldGrow > 0 ? '+' : ''}${p.goldGrow || 0}%/năm · tính theo giá bán lại`);
    res += resultRow('💵', 'Để tiền mặt', last.put, last.put, COL.cash, s.hasInfl ? `sức mua chỉ còn ~${M.fmt(last.real)}` : 'không sinh lời');
    $('p-res').innerHTML = res;
    $('p-chart').innerHTML = (s.hasRate || s.hasGold) ? '<div class="small">Lời / lỗ so với tiền bỏ vào, theo từng tháng:</div>' + chart(s) : '';

    // Nhận xét
    const T = [];
    if (!s.hasRate && !s.hasGold) T.push('Bấm các nút 🔎 ở trên để tra <b>lãi suất</b> và <b>giá vàng</b>, gõ vào là mình so sánh ngay.');
    if (s.hasGold) {
      const loss = p.goldBuy - p.goldSell, be = (p.goldBuy / p.goldSell - 1) * 100;
      if (loss > 0) T.push(`Vàng: mua xong bán ngay là lỗ <b>${M.fmt(loss)}/lượng</b> (${(loss / p.goldBuy * 100).toFixed(1)}%). Giá phải tăng ít nhất <b>${be.toFixed(1)}%</b> mới hoà vốn.`);
      else T.push('Giá bán lại đang ≥ giá mua — kiểm tra lại 2 ô giá vàng nhé (thường giá mua cao hơn).');
    }
    if (s.hasRate && s.hasGold) {
      const d = last.bank - last.gold;
      T.push(Math.abs(d) < 1000 ? 'Với giả định này, ngân hàng và vàng gần như bằng nhau.'
        : `Với giả định vàng <b>${p.goldGrow > 0 ? '+' : ''}${p.goldGrow || 0}%/năm</b>, ${d > 0 ? 'gửi ngân hàng' : 'mua vàng'} hơn <b>${M.fmt(Math.abs(d))}</b> sau ${s.N} tháng. Thử bấm các mức % khác để xem kết quả đổi thế nào.`);
    }
    if (p.goal > 0) {
      [['bank', 'Gửi ngân hàng', s.hasRate], ['gold', 'Mua vàng', s.hasGold], ['put', 'Để tiền mặt', true]].forEach(([k, n, on]) => {
        if (!on) return;
        const m = reachAt(s.rows, k, p.goal);
        T.push(m != null ? `🎯 ${n}: đạt mục tiêu sau <b>${m} tháng</b>.` : `🎯 ${n}: chưa đạt mục tiêu trong ${s.N} tháng.`);
      });
      const i = (p.rate || 0) / 1200, N = s.N;
      const grow = Math.pow(1 + i, N), fv = i ? ((grow - 1) / i) * (1 + i) : N;
      const need = (p.goal - p.start * grow) / fv;
      if (need > monthlyOf(p)) T.push(`Muốn chắc chắn đạt mục tiêu trong ${N} tháng (gửi ngân hàng), cần để dành khoảng <b>${M.fmt(need)}/tháng</b>.`);
    }
    if (s.hasRate) T.push('Gửi có kỳ hạn mà <b>rút trước hạn</b> thường chỉ được lãi không kỳ hạn (rất thấp) — chọn kỳ hạn khớp lúc cần tiền.');
    if (p.updatedAt && Date.now() - p.updatedAt > 30 * 864e5) T.push('⏰ Giá đã nhập hơn 30 ngày — nên tra lại.');
    $('p-tips').innerHTML = T.map(t => `<p>${t}</p>`).join('');
  }

  function loadForm() {
    const p = P();
    $('p-monthly').value = fmtIn(monthlyOf(p)); $('p-start').value = fmtIn(p.start); $('p-goal').value = fmtIn(p.goal);
    $('p-months').value = p.months || 12;
    $('p-rate').value = p.rate ?? ''; $('p-infl').value = p.infl ?? '';
    $('p-gbuy').value = fmtIn(p.goldBuy); $('p-gsell').value = fmtIn(p.goldSell);
  }

  const MONEY = { 'p-monthly': 'monthly', 'p-start': 'start', 'p-goal': 'goal', 'p-gbuy': 'goldBuy', 'p-gsell': 'goldSell' };
  const MARKET = ['p-rate', 'p-gbuy', 'p-gsell', 'p-infl'];
  $('screen-plan').addEventListener('change', e => {
    const id = e.target.id, v = e.target.value;
    App.commit(() => {
      const p = P();
      if (id === 'p-monthly') { const n = M.parse(v); p.monthly = v.trim() === '' || isNaN(n) ? null : n; e.target.value = fmtIn(monthlyOf(p)); }
      else if (MONEY[id]) { const n = M.parse(v); p[MONEY[id]] = isNaN(n) ? 0 : n; e.target.value = fmtIn(p[MONEY[id]]); }
      else if (id === 'p-months') p.months = Math.max(1, Math.min(120, parseInt(v, 10) || 12));
      else if (id === 'p-rate') p.rate = pct(v);
      else if (id === 'p-infl') p.infl = pct(v);
      if (MARKET.includes(id)) p.updatedAt = Date.now();
    });
  });
  $('screen-plan').addEventListener('click', e => {
    const b = e.target.closest('[data-grow]'); if (!b) return;
    App.commit(() => { P().goldGrow = +b.dataset.grow; });
    App.fx.pop($('p-res'));
  });

  App.plan = { render, loadForm };
})();
