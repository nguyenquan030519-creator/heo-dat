/* LƯU TRỮ
   - Máy tính Chrome/Edge: ghi thẳng vào 1 file .json trên máy (File System Access API).
   - Điện thoại / trình duyệt khác: lưu trong bộ nhớ app (IndexedDB, xin giữ vĩnh viễn)
     + nút "Lưu ra file" để có bản file thật.
   Luôn giữ 1 bản đệm trong IndexedDB để mở app là thấy ngay. */
(function () {
  const DB = 'heodat', STORE = 'kv';
  let dbp = null;
  function idb() {
    if (!dbp) dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function get(k) {
    try {
      const db = await idb();
      return await new Promise((res, rej) => {
        const r = db.transaction(STORE).objectStore(STORE).get(k);
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
      });
    } catch (e) { return undefined; }
  }
  async function set(k, v) {
    try {
      const db = await idb();
      await new Promise((res, rej) => {
        const t = db.transaction(STORE, 'readwrite');
        t.objectStore(STORE).put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error);
      });
    } catch (e) { /* bỏ qua */ }
  }

  const isPhone = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const canFile = !isPhone && 'showSaveFilePicker' in window && 'showOpenFilePicker' in window && window.isSecureContext;
  const TYPES = [{ description: 'Dữ liệu chi tiêu', accept: { 'application/json': ['.json'] } }];

  let handle = null, fileOk = false, timer = null;
  const S = { canFile, isPhone, status: canFile ? 'nofile' : 'device', fileName: '', persisted: false };

  S.blank = () => ({
    version: 2,
    settings: { salary: 0, payday: 1, saving: 0, fixed: [], sound: true, theme: 'classic' },
    entries: [],
    meta: { lastExport: 0, updatedAt: 0 }
  });
  S.normalize = d => {
    if (!d || !d.settings || !Array.isArray(d.entries)) return null;
    const b = S.blank();
    d.settings = Object.assign(b.settings, d.settings);
    d.meta = Object.assign(b.meta, d.meta || {});
    d.version = 2;
    return d;
  };
  const newer = (a, b) => (!a ? b : !b ? a : (a.meta.updatedAt >= b.meta.updatedAt ? a : b));

  async function readFile() {            // null nếu file trống; ném lỗi nếu sai định dạng
    const txt = await (await handle.getFile()).text();
    if (!txt.trim()) return null;
    const d = S.normalize(JSON.parse(txt));
    if (!d) throw new Error('File này không phải dữ liệu chi tiêu');
    return d;
  }
  async function writeFile(data) {
    if (!fileOk || !handle) return;
    try {
      const w = await handle.createWritable();
      await w.write(JSON.stringify(data, null, 1));
      await w.close();
    } catch (e) {
      fileOk = false; S.status = 'locked';
      if (App.onStorageChange) App.onStorageChange();
    }
  }

  S.load = async () => {
    let d = S.normalize(await get('data'));
    if (!d) { try { d = S.normalize(JSON.parse(localStorage.getItem('chitieu-v1'))); } catch (e) { } } // dữ liệu bản cũ
    if (!d) d = S.blank();
    try { if (navigator.storage && navigator.storage.persist) S.persisted = await navigator.storage.persist(); } catch (e) { }
    if (canFile) {
      handle = await get('fileHandle');
      if (handle) {
        S.fileName = handle.name;
        let p = 'prompt';
        try { p = await handle.queryPermission({ mode: 'readwrite' }); } catch (e) { }
        if (p === 'granted') {
          try { d = newer(await readFile(), d); fileOk = true; S.status = 'file'; } catch (e) { S.status = 'locked'; }
        } else S.status = 'locked';
      }
    }
    return d;
  };

  S.save = data => {
    set('data', data);
    if (fileOk) { clearTimeout(timer); timer = setTimeout(() => writeFile(data), 250); }
  };

  // Máy tính: mở lại quyền ghi file (cần 1 cú bấm của người dùng)
  S.reconnect = async cache => {
    if (!handle) return cache;
    const p = await handle.requestPermission({ mode: 'readwrite' });
    if (p !== 'granted') throw new Error('Chưa được cho phép mở file');
    const fd = await readFile();
    fileOk = true; S.status = 'file';
    return newer(fd, cache);
  };

  S.createFile = async data => {
    const h = await window.showSaveFilePicker({ suggestedName: 'chitieu-data.json', types: TYPES });
    handle = h; await set('fileHandle', h);
    fileOk = true; S.status = 'file'; S.fileName = h.name;
    await writeFile(data);
  };

  S.openFile = async () => {               // trả về dữ liệu trong file, hoặc null nếu file trống
    const [h] = await window.showOpenFilePicker({ types: TYPES });
    if ((await h.requestPermission({ mode: 'readwrite' })) !== 'granted') throw new Error('Chưa được cho phép ghi file');
    const prev = handle; handle = h;
    let d;
    try { d = await readFile(); } catch (e) { handle = prev; throw e; }
    await set('fileHandle', h);
    fileOk = true; S.status = 'file'; S.fileName = h.name;
    return d;
  };

  // Điện thoại: xuất file (chia sẻ vào Files/Drive/Zalo... hoặc tải về)
  S.exportFile = async data => {
    const name = 'chitieu-data-' + App.dates.iso(new Date()) + '.json';
    const file = new File([JSON.stringify(data, null, 1)], name, { type: 'application/json' });
    if (isPhone && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Dữ liệu chi tiêu' });
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(file); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }
  };

  App.storage = S;
})();
