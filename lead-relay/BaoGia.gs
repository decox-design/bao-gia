/**
 * Lead form BÁO GIÁ (trang bao gia: nha-pho.html / can-ho.html).
 *
 * TÁCH RIÊNG khoi cac form khac: chi chay khi doPost nhan type === 'baogia'.
 * Cac nhanh 'website' / 'duan' trong Mã.gs KHONG bi dung toi.
 * Ghi vao tab rieng "Báo giá" trong cung spreadsheet Formlead Decox (tu tao neu chua co).
 *
 * Cach noi: trong doPost, ngay sau dong `var type = data.type || 'website';` them:
 *     if (type === 'baogia') return luuBaoGia(data, ss);
 */
var BAOGIA_SHEET = 'Báo giá';
var BAOGIA_HEADER = [
  'Thời gian', 'Trang nguồn', 'Họ tên', 'Số điện thoại',
  'Diện tích (m²)', 'Mật độ XD (%)', 'Quy mô / Loại hình',
  'Hạng mục', 'Phân khúc', 'Chi phí dự kiến', 'Ghi chú của khách', 'URL'
];

function luuBaoGia(data, ss) {
  if (data.hp) return jsonResponse({ status: 'success' });        // honeypot: bot dien thi bo qua

  var phone = String(data.phone || data.Dienthoai || '').trim();
  if (!phone) return jsonResponse({ status: 'error', message: 'Thiếu số điện thoại' });

  var sh = ss.getSheetByName(BAOGIA_SHEET) || taoSheetBaoGia(ss);

  sh.appendRow([
    data.thoigian || Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss'),
    data.page    || '',
    data.name    || data.Ten || '',
    "'" + phone,                                                  // ep text de khong mat so 0 dau
    data.area    || '',
    data.density || '',
    data.scale   || '',
    data.hangmuc || '',
    data.tier    || '',
    data.cost    || '',
    data.note    || data.Noidung || '',
    data.url     || ''
  ]);

  return jsonResponse({ status: 'success', message: 'Đã ghi báo giá' });
}

function taoSheetBaoGia(ss) {
  var sh = ss.insertSheet(BAOGIA_SHEET);
  sh.appendRow(BAOGIA_HEADER);
  sh.getRange(1, 1, 1, BAOGIA_HEADER.length).setFontWeight('bold');
  sh.setFrozenRows(1);
  return sh;
}

/** Chay tay 1 lan neu muon tao san tab "Báo giá" voi dong tieu de (khong bat buoc — luuBaoGia tu tao). */
function setupBaoGia() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(BAOGIA_SHEET)) taoSheetBaoGia(ss);
}
