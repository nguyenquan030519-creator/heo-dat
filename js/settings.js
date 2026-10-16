/* MÀN HÌNH "CÀI ĐẶT" – lương, ngày lương, để dành, chi cố định, âm thanh, nơi lưu dữ liệu. */
(function () {
  const M = App.money, D = App.dates, $ = App.$, S = App.storage, esc = App.ui.esc;

  $('screen-settings').innerHTML = `
    <div class="card welcome" id="st-welcome"><div class="pig-sm">🐷</div>
      <div><b>Chào bạn, mình là Heo Đất!</b><br>Nhập lương, ngày lương và các khoản cố định, phần còn lại để mình tính.</div></div>
    <div class="card" id="st-store"></div>
    <div class="card" id="st-theme"></div>
    <div class="card"><h2>💵 Thu nhập</h2>
      <label for="st-salary">Lương hàng tháng</label>
      <input id="st-salary" placeholder="VD: 15tr" autocomplete="off"><div class="preview" id="st-salary-p"></div>
      <label for="st-payday">Ngày nhận lương (1–31)</label>
      <input id="st-payday" type="number" inputmode="numeric" min="1" max="31" placeholder="VD: 5">
      <label for="st-saving">Muốn để dành mỗi tháng</label>
      <input id="st-saving" placeholder="VD: 2tr (bỏ trống nếu không)" autocomplete="off"><div class="preview" id="st-saving-p"></div>
    </div>
    <div class="card"><h2>📌 Chi cố định hàng tháng</h2>
      <div class="small">Tiền nhà, điện thoại, Netflix, gym… — trừ sẵn khỏi lương.</div>
      <div class="list" id="st-fixed"></div>
      <div class="row fx-row">
        <input id="st-fx-name" placeholder="Tên khoản">
        <input id="st-fx-amt" placeholder="VD: 260k" class="fx-amt">
        <button class="btn sm" id="st-fx-add">＋</button>
      </div>
    </div>
    <div class="card"><label class="switch"><span>🔊 Âm thanh khi ghi</span><input type="checkbox" id="st-sound"></label></div>
    <button class="btn gold block" id="st-save">💾 Lưu cài đặt</button>
    <input type="file" id="st-import" accept=".json,application/json" hidden>`;

  let fixed = [];

  function preview(inp, out) {
    $(inp).addEventListener('input', () => {
      const v = M.parse($(inp).value);
      $(out).textContent = $(inp).value ? (isNaN(v) ? 'Không hiểu số tiền này' : '= ' + M.fmt(v)) : '';
    });
  }
  preview('st-salary', 'st-salary-p');
  preview('st-saving', 'st-saving-p');

  function loadForm() {
    const st = App.data.settings;
    $('st-salary').value = st.salary ? st.salary.toLocaleString('vi-VN') : '';
    $('st-payday').value = st.salary ? st.payday : '';
    $('st-saving').value = st.saving ? st.saving.toLocaleString('vi-VN') : '';
    $('st-sound').checked = !!st.sound;
    $('st-salary-p').textContent = $('st-saving-p').textContent = '';
    fixed = st.fixed.map(f => ({ ...f }));
    renderFixed();
  }

  function renderFixed() {
    const tot = fixed.reduce((a, f) => a + f.amount, 0);
    $('st-fixed').innerHTML = fixed.map((f, i) =>
      `<div class="item"><div class="ic">📌</div><div class="t"><b>${esc(f.name)}</b></div><div class="amt">${M.fmt(f.amount)}</div><button class="x" data-fx="${i}" aria-label="Xoá">✕</button></div>`
    ).join('') + (fixed.length ? `<div class="rline total"><span>Tổng</span><span>${M.fmt(tot)}</span></div>` : '');
  }

  $('st-fixed').onclick = e => { const b = e.target.closest('[data-fx]'); if (b) { fixed.splice(+b.dataset.fx, 1); renderFixed(); } };
  $('st-fx-add').onclick = () => {
    const n = $('st-fx-name').value.trim(), a = M.parse($('st-fx-amt').value);
    if (!n || !a || isNaN(a)) { App.fx.shake($('st-fx-add').parentNode); return; }
    fixed.push({ name: n, amount: a });
    $('st-fx-name').value = $('st-fx-amt').value = '';
    renderFixed(); $('st-fx-name').focus();
  };
  $('st-fx-amt').addEventListener('keydown', e => { if (e.key === 'Enter') $('st-fx-add').click(); });

  $('st-save').onclick = () => {
    const sal = M.parse($('st-salary').value), sv = M.parse($('st-saving').value) || 0;
    let pd = parseInt($('st-payday').value, 10);
    if (!(pd >= 1 && pd <= 31)) pd = 1;
    if (!sal || isNaN(sal)) { App.fx.shake($('st-salary')); App.fx.toast('Nhập lương trước nha (VD: 15tr) 🙏'); return; }
    App.commit(d => { d.settings = { salary: sal, payday: pd, saving: isNaN(sv) ? 0 : sv, fixed, sound: $('st-sound').checked }; });
    App.go('today');
    App.fx.rain(['✨', '🪙', '💵', '🎉'], 22);
    App.fx.sound('ok');
    App.mascot.react('settings');
  };

  /* ---- Nơi lưu dữ liệu ---- */
  function renderStore() {
    const d = App.data, name = esc(S.fileName || 'chitieu-data.json');
    let h;
    if (S.canFile && S.status === 'file') {
      h = `<div class="store-status"><span class="big">📁</span><div><b>Đang lưu vào file ${name}</b>
        <div class="small">Mỗi lần ghi, file trên máy này tự cập nhật.</div></div></div>
        <div class="btns"><button class="btn sm ghost" data-act="open">📂 Mở file khác</button><button class="btn sm ghost" data-act="create">📄 Tạo file mới</button></div>`;
    } else if (S.canFile && S.status === 'locked') {
      h = `<div class="store-status"><span class="big">🔒</span><div><b>Cần mở lại file ${name}</b>
        <div class="small">Trình duyệt hỏi lại quyền mỗi lần mở app. Bấm nút dưới, chọn <b>"Cho phép mọi lần truy cập"</b> nếu có.</div></div></div>
        <div class="btns"><button class="btn sm" data-act="reconnect">🔓 Mở lại file</button><button class="btn sm ghost" data-act="open">📂 Chọn file khác</button></div>`;
    } else if (S.canFile) {
      h = `<div class="store-status"><span class="big">⚠️</span><div><b>Chưa có file dữ liệu</b>
        <div class="small">Bấm <b>Tạo file dữ liệu</b>, lưu vào thư mục <b>Spendings</b>. Từ đó mọi khoản tự ghi vào file đó trên máy này.</div></div></div>
        <div class="btns"><button class="btn sm" data-act="create">📄 Tạo file dữ liệu</button><button class="btn sm ghost" data-act="open">📂 Mở file có sẵn</button></div>`;
    } else {
      const last = d.meta.lastExport ? D.label(new Date(d.meta.lastExport)) : 'chưa lần nào';
      h = `<div class="store-status"><span class="big">📱</span><div><b>Dữ liệu nằm trong máy này</b>
        <div class="small">Trình duyệt ${S.isPhone ? 'điện thoại' : 'này'} không cho web tự ghi file, nên dữ liệu nằm trong bộ nhớ của app${S.persisted ? ' (đã khoá, không tự xoá)' : ''}.
        Bấm <b>Lưu ra file</b> để có bản file thật trong máy. Lần gần nhất: <b>${last}</b>.</div></div></div>
        <div class="btns"><button class="btn sm" data-act="export">📦 Lưu ra file</button><button class="btn sm ghost" data-act="import">📥 Nhập từ file</button></div>`;
    }
    $('st-store').innerHTML = '<h2>🗄️ Nơi lưu dữ liệu</h2>' + h;
  }

  $('st-store').onclick = async ev => {
    const b = ev.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act;
    try {
      if (act === 'create') {
        await S.createFile(App.data); App.render();
        App.fx.rain(['📁', '✨', '🪙'], 18); App.fx.toast('Đã tạo file! Từ giờ tự lưu vào đó 📁');
      } else if (act === 'open') {
        const d = await S.openFile();
        if (d) { App.replaceData(d); loadForm(); App.fx.toast('Đã mở ' + esc(S.fileName) + ' 📂'); }
        else { App.save(); App.render(); App.fx.toast('File trống — đã ghi dữ liệu hiện tại vào'); }
      } else if (act === 'reconnect') {
        await App.reconnect();
      } else if (act === 'export') {
        await S.exportFile(App.data);
        App.data.meta.lastExport = Date.now(); App.save(); App.render();
        App.fx.toast('Đã lưu ra file 📦');
      } else if (act === 'import') {
        $('st-import').click();
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      alert('Không làm được: ' + (e && e.message ? e.message : e));
    }
  };

  $('st-import').onchange = async ev => {
    const f = ev.target.files[0]; ev.target.value = '';
    if (!f) return;
    try {
      const d = S.normalize(JSON.parse(await f.text()));
      if (!d) throw 0;
      if (confirm('Thay toàn bộ dữ liệu hiện tại bằng file này?')) { App.replaceData(d); loadForm(); App.fx.toast('Đã nhập dữ liệu ✅'); }
    } catch (e) { alert('File này không phải dữ liệu chi tiêu.'); }
  };

  function render() {
    $('st-welcome').hidden = !!App.data.settings.salary;
    renderStore();
  }

  App.settings = { render, loadForm };
})();
