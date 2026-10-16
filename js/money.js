/* TIỀN – đọc số tiền gõ tắt (45k, 1.2tr, 50.000) và định dạng hiển thị. */
(function () {
  function parse(str) {
    if (str == null) return 0;
    const s = String(str).toLowerCase().replace(/\s|đ|vnd/g, '');
    if (!s) return 0;
    const m = s.match(/^([\d.,]+)(k|nghìn|ngàn|tr|triệu|m)?$/);
    if (!m) return NaN;
    const suf = m[2];
    if (suf) {
      const num = parseFloat(m[1].replace(',', '.'));
      if (isNaN(num)) return NaN;
      return Math.round(num * (suf === 'k' || suf === 'nghìn' || suf === 'ngàn' ? 1e3 : 1e6));
    }
    return parseInt(m[1].replace(/[.,]/g, ''), 10) || 0;
  }

  const fmt = n => Math.round(n).toLocaleString('vi-VN') + ' đ';

  function short(n) {
    const a = Math.abs(n), sg = n < 0 ? '-' : '';
    if (a >= 1e6) return sg + (+(a / 1e6).toFixed(a >= 1e7 ? 1 : 2)).toLocaleString('vi-VN') + 'tr';
    if (a >= 1e3) return sg + Math.round(a / 1e3) + 'k';
    return sg + Math.round(a) + 'đ';
  }

  App.money = { parse, fmt, short };
})();
