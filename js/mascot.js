/* LINH VẬT HEO ĐẤT – lời nhận xét/gợi ý tự động và câu phản ứng khi ghi khoản. */
(function () {
  const M = App.money;

  // Trả về { mood: happy|warn|bad|idle, lines: [câu nhận xét] }
  function tips(c, data) {
    const st = c.st, L = [];
    let mood = 'happy';
    if (!st.salary) return { mood: 'idle', lines: ['Xin chào! Mình là <b>Heo Đất</b> 🐷. Vào <b>Cài đặt</b> nhập lương để mình tính giúp nha!'] };

    if (c.fund <= 0) {
      mood = 'bad';
      L.push(`Lương chưa đủ trả chi cố định + để dành (thiếu <b>${M.fmt(-c.fund)}</b>). Giảm bớt khoản để dành nhé.`);
    } else if (c.remain < 0) {
      mood = 'bad';
      L.push(`Vượt quỹ <b>${M.fmt(-c.remain)}</b> rồi! Phần này đang ăn vào tiền để dành 😭`);
    } else {
      const diff = c.ideal - c.spent;
      if (diff >= 0) L.push(`Đang tiêu <b>chậm hơn kế hoạch ${M.fmt(diff)}</b>. Giỏi ghê! ✨`);
      else { mood = 'warn'; L.push(`Đang tiêu <b>nhanh hơn kế hoạch ${M.fmt(-diff)}</b>. Từ mai giữ quanh <b>${M.fmt(Math.max(0, c.perDayFromTomorrow))}</b>/ngày nha.`); }
      if (c.todayLeft < 0) mood = 'warn';
      if (c.elapsed >= 3 && c.spent > 0) {
        const end = c.fund - c.projected;
        L.push(end >= 0 ? `Cứ nhịp này, cuối kỳ còn dư khoảng <b>${M.fmt(end)}</b> 🎉`
          : `Cứ nhịp này, cuối kỳ sẽ thiếu khoảng <b>${M.fmt(-end)}</b> 😬`);
      }
      const top = c.cats[0];
      if (top && c.outs.length >= 5 && top[1] / c.spent >= .4) {
        const ct = App.catOf(top[0]);
        L.push(`${ct[1]} ${ct[2]} chiếm <b>${Math.round(top[1] / c.spent * 100)}%</b> số đã tiêu — bớt chỗ này là dễ nhất.`);
      }
    }
    if (c.daysLeft <= 3) L.push(`Còn <b>${c.daysLeft} ngày</b> nữa là lương về! 🤑`);
    if (!App.storage.canFile && data.entries.length && Date.now() - (data.meta.lastExport || 0) > 7 * 864e5)
      L.push('Lâu rồi chưa <b>Lưu ra file</b> — vào Cài đặt bấm 1 cái cho chắc nha 📦');
    return { mood, lines: L };
  }

  const REACT = {
    ok: ['Ghi rồi nha! ✍️', 'Ting ting! Đã vào sổ 🪙', 'Chuẩn bài! 📒'],
    warn: ['Hôm nay hơi quá tay rồi đó 💦', 'Mai tiết chế xíu nha 🙈'],
    over: ['Ối dồi ôi, vượt quỹ tháng rồi! 😱'],
    income: ['Tiền về! Tiền về! 🤑', 'Giàu rồi nha! 💸'],
    settings: ['Đã lưu! Mình tính lại hết rồi nha 🧮'],
    del: ['Xoá rồi, coi như chưa từng tiêu 🫥']
  };
  let hold = 0;
  function react(kind) {
    const arr = REACT[kind] || REACT.ok, b = App.$('bubble'), p = App.$('pig');
    if (!b) return;
    b.innerHTML = arr[Math.floor(Math.random() * arr.length)];
    hold = Date.now() + 3000;
    App.fx.pop(b);
    if (p) { p.classList.remove('wiggle'); void p.offsetWidth; p.classList.add('wiggle'); }
    setTimeout(() => { if (Date.now() >= hold) App.today.showTip(); }, 3100);
  }

  App.mascot = { tips, react, holding: () => Date.now() < hold, clear: () => { hold = 0; } };
})();
