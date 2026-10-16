/* NGÀY THÁNG – tính kỳ chi tiêu theo ngày nhận lương. */
(function () {
  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parseIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const dim = (y, m) => new Date(y, m + 1, 0).getDate();
  const payDate = (y, m, pd) => new Date(y, m, Math.min(pd, dim(y, m)));
  const between = (a, b) => Math.round((b - a) / 864e5);
  const today = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };

  // Kỳ = từ ngày nhận lương đến hết ngày trước kỳ lương sau
  function cycleFor(date, payday) {
    const pd = payday || 1;
    let y = date.getFullYear(), m = date.getMonth();
    let start = payDate(y, m, pd);
    if (date < start) { m--; if (m < 0) { m = 11; y--; } start = payDate(y, m, pd); }
    let ny = y, nm = m + 1; if (nm > 11) { nm = 0; ny++; }
    const next = payDate(ny, nm, pd);
    const end = new Date(next.getFullYear(), next.getMonth(), next.getDate() - 1);
    return { start, end, next, total: between(start, end) + 1 };
  }

  const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dm = d => d.getDate() + '/' + (d.getMonth() + 1);
  const label = d => DOW[d.getDay()] + ', ' + dm(d);

  App.dates = { iso, parseIso, between, today, cycleFor, label, dm };
})();
