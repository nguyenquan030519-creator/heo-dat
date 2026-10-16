/* CẤU HÌNH CHUNG – danh mục chi tiêu. Muốn thêm/đổi danh mục: sửa mảng CATS. */
window.App = window.App || {};

// [mã, biểu tượng, tên hiển thị]
App.CATS = [
  ['an', '🍜', 'Ăn uống'],
  ['cafe', '🧋', 'Cà phê/Trà sữa'],
  ['dichuyen', '🛵', 'Di chuyển'],
  ['muasam', '🛍️', 'Mua sắm'],
  ['giaitri', '🎮', 'Giải trí'],
  ['suckhoe', '💊', 'Sức khỏe'],
  ['qua', '🎁', 'Quà/Gia đình'],
  ['khac', '📦', 'Khác']
];

App.catOf = id => App.CATS.find(c => c[0] === id) || App.CATS[App.CATS.length - 1];
App.$ = id => document.getElementById(id);
