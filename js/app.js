/* KHỞI ĐỘNG & ĐIỀU PHỐI – nạp dữ liệu, chuyển tab, lưu, xoá khoản, thanh trạng thái lưu trữ. */
(function () {
  const A = App, $ = A.$, S = A.storage;

  A.save = () => { A.data.meta.updatedAt = Date.now(); S.save(A.data); };
  A.commit = fn => { fn(A.data); A.save(); A.render(); };
  A.replaceData = d => { A.data = d; A.save(); A.render(); };

  A.render = () => {
    const c = A.calc(A.data), D = A.dates;
    A.themes.apply(A.data.settings.theme);
    A.themes.renderPicker();
    $('h-cycle').textContent = A.data.settings.salary
      ? `Kỳ ${D.dm(c.cy.start)} – ${D.dm(c.cy.end)} · ngày ${c.elapsed}/${c.cy.total}` : 'Chi tiêu tháng';
    A.today.render(c);
    A.month.render(c);
    A.settings.render(c);
    if (A.plan) A.plan.render(c);
    renderStorePill();
  };

  function renderStorePill() {
    const p = $('h-store');
    p.textContent = S.status === 'file' ? '📁 Đã lưu file'
      : S.status === 'locked' ? '🔒 Mở file'
      : S.status === 'nofile' ? '⚠️ Chưa có file' : '📱 Lưu trên máy';
    p.classList.toggle('alert', S.status === 'locked' || S.status === 'nofile');
    $('banner').hidden = S.status !== 'locked';
  }
  A.onStorageChange = () => { renderStorePill(); A.settings.render(); };

  A.reconnect = async () => {
    try {
      A.data = await S.reconnect(A.data);
      A.save(); A.render();
      A.fx.toast('Đã mở sổ chi tiêu 📁');
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      alert('Không mở được file: ' + (e && e.message ? e.message : e));
    }
  };

  A.go = tab => {
    ['today', 'month', 'plan', 'settings'].forEach(t => { $('screen-' + t).hidden = t !== tab; });
    document.querySelectorAll('#nav [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    $('fab').hidden = tab === 'settings' || tab === 'plan';
    if (tab === 'settings') A.settings.loadForm();
    if (tab === 'plan') A.plan.loadForm();
    window.scrollTo(0, 0);
  };

  $('nav').onclick = e => { const b = e.target.closest('[data-tab]'); if (b) A.go(b.dataset.tab); };
  $('h-store').onclick = () => A.go('settings');
  $('banner-btn').onclick = () => A.reconnect();

  // Xoá 1 khoản (ở bất kỳ danh sách nào)
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-del]'); if (!b) return;
    if (!confirm('Xoá khoản này?')) return;
    const row = b.closest('.item');
    const done = () => { A.commit(d => { d.entries = d.entries.filter(x => String(x.id) !== b.dataset.del); }); A.mascot.react('del'); };
    if (row) { row.classList.add('poof'); setTimeout(done, 280); } else done();
  });

  // Tự cập nhật khi sang ngày mới (để app mở qua đêm vẫn đúng)
  let lastDay = A.dates.iso(new Date());
  setInterval(() => { const d = A.dates.iso(new Date()); if (d !== lastDay) { lastDay = d; A.render(); } }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) A.render(); });

  (async function init() {
    A.data = await S.load();
    A.render();
    if (!A.data.settings.salary || S.status === 'nofile') A.go('settings');
    if (location.protocol.startsWith('http') && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => { });
    }
  })();
})();
