/* GIAO DIỆN DÙNG CHUNG – dòng hiển thị 1 khoản chi/thu (dùng ở Hôm nay & Tháng này). */
(function () {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function item(e, showDate) {
    const c = App.catOf(e.cat), inn = e.type === 'in', M = App.money, D = App.dates;
    const title = e.note ? esc(e.note) : (inn ? 'Thu thêm' : c[2]);
    const sub = (inn ? 'Thu thêm' : c[2]) + (showDate ? ' · ' + D.label(D.parseIso(e.date)) : '');
    return `<div class="item" data-id="${e.id}">
      <div class="ic">${inn ? '💰' : c[1]}</div>
      <div class="t"><b>${title}</b><span class="small">${sub}</span></div>
      <div class="amt ${inn ? 'in' : ''}">${inn ? '+' : '−'}${M.fmt(e.amount)}</div>
      <button class="x" data-del="${e.id}" aria-label="Xoá">✕</button></div>`;
  }

  App.ui = { esc, item };
})();
