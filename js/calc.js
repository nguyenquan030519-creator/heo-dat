/* TÍNH TOÁN – mọi con số của app đều ra từ hàm App.calc(data). */
(function () {
  App.calc = function (data) {
    const D = App.dates, st = data.settings, today = D.today();
    const cy = D.cycleFor(today, st.payday);
    const tIso = D.iso(today), sIso = D.iso(cy.start), eIso = D.iso(cy.end);
    const sum = arr => arr.reduce((s, e) => s + e.amount, 0);

    const inCy = data.entries.filter(e => e.date >= sIso && e.date <= eIso);
    const outs = inCy.filter(e => e.type !== 'in');
    const fixedTotal = st.fixed.reduce((s, f) => s + f.amount, 0);
    const extra = sum(inCy.filter(e => e.type === 'in'));         // thu thêm trong kỳ
    const spent = sum(outs);                                        // đã tiêu trong kỳ
    const spentToday = sum(outs.filter(e => e.date === tIso));

    const fund = st.salary + extra - fixedTotal - st.saving;        // quỹ chi tiêu linh hoạt
    const remain = fund - spent;                                    // quỹ còn lại
    const daysLeft = D.between(today, cy.end) + 1;                  // tính cả hôm nay
    const elapsed = cy.total - daysLeft + 1;                        // hôm nay là ngày thứ mấy

    const dailyToday = (fund - (spent - spentToday)) / daysLeft;    // hạn mức hôm nay
    const todayLeft = dailyToday - spentToday;                      // hôm nay còn được tiêu
    const perDayFromTomorrow = daysLeft > 1 ? remain / (daysLeft - 1) : remain;
    const baseDaily = fund / cy.total;                              // mức chia đều ban đầu
    const ideal = baseDaily * elapsed;                              // lẽ ra nên tiêu tới hết hôm nay
    const projected = spent / elapsed * cy.total;                   // dự báo cả kỳ

    const byCat = {};
    outs.forEach(e => { byCat[e.cat] = (byCat[e.cat] || 0) + e.amount; });
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

    // Các kỳ trước (ước tính theo lương & chi cố định hiện tại)
    const past = {};
    data.entries.forEach(e => {
      if (e.date >= sIso) return;
      const k = D.iso(D.cycleFor(D.parseIso(e.date), st.payday).start);
      past[k] = past[k] || { out: 0, inn: 0 };
      if (e.type === 'in') past[k].inn += e.amount; else past[k].out += e.amount;
    });
    const pastList = Object.keys(past).sort().reverse().slice(0, 6).map(k => ({
      start: D.parseIso(k), out: past[k].out,
      left: st.salary + past[k].inn - fixedTotal - st.saving - past[k].out
    }));

    return { st, today, tIso, cy, inCy, outs, fixedTotal, extra, spent, spentToday, fund, remain,
      daysLeft, elapsed, dailyToday, todayLeft, perDayFromTomorrow, baseDaily, ideal, projected, cats, pastList };
  };
})();
