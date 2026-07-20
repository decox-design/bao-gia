/**
 * Decox — Lead relay: nhận lead từ nha-pho.html / can-ho.html rồi ghi 1 dòng vào Lark Sheet.
 *
 * Vì sao cần relay: Lark Open API bắt buộc tenant_access_token (sinh từ App Secret) và
 * không cho gọi thẳng từ trình duyệt (CORS + lộ secret). Apps Script đứng giữa giữ secret.
 *
 * CÀI ĐẶT (làm 1 lần) — xem README.md cùng thư mục.
 * Script Properties cần có:
 *   LARK_APP_ID      — App ID của Lark custom app
 *   LARK_APP_SECRET  — App Secret (chỉ nằm ở đây, không đưa vào HTML)
 *   SHEET_TOKEN      — TFTasxNAuh7ApCt9D5tlBhpsgjh  (lấy từ URL /sheets/<token>)
 *   SHEET_ID         — 4Yyr8R                        (tham số ?sheet=<id>)
 *   LARK_DOMAIN      — open.larksuite.com (bản quốc tế) · open.feishu.cn (bản TQ)
 */

var HEADER = [
  'Thời gian', 'Trang nguồn', 'Họ tên', 'Số điện thoại',
  'Diện tích (m²)', 'Mật độ XD (%)', 'Quy mô / Loại hình',
  'Hạng mục', 'Phân khúc', 'Chi phí dự kiến', 'Ghi chú của khách', 'URL'
];

function doPost(e) {
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.hp) return out({ ok: true });                       // honeypot: bot điền thì bỏ qua
    if (!String(d.phone || '').trim()) return out({ ok: false, error: 'missing phone' });

    appendToLark([
      nowVN(),
      String(d.page || ''),
      String(d.name || ''),
      "'" + String(d.phone || ''),                             // ép text để không mất số 0 đầu
      String(d.area || ''),
      String(d.density || ''),
      String(d.scale || ''),
      String(d.type || ''),
      String(d.tier || ''),
      String(d.cost || ''),
      String(d.note || ''),
      String(d.url || '')
    ]);
    return out({ ok: true });
  } catch (err) {
    console.error(err);
    return out({ ok: false, error: String(err) });
  }
}

/** Mở URL web app trên trình duyệt để kiểm tra cấu hình & quyền. */
function doGet() {
  try {
    getTenantToken();
    return out({ ok: true, msg: 'Lead relay đang chạy, lấy token Lark thành công.' });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function appendToLark(row) {
  var p = props();
  var url = 'https://' + p.LARK_DOMAIN + '/open-apis/sheets/v2/spreadsheets/'
          + p.SHEET_TOKEN + '/values_append?insertDataOption=INSERT_ROWS';
  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json; charset=utf-8',
    headers: { Authorization: 'Bearer ' + getTenantToken() },
    payload: JSON.stringify({
      valueRange: { range: p.SHEET_ID + '!A1:L1', values: [row] }
    }),
    muteHttpExceptions: true
  });
  var body = JSON.parse(res.getContentText() || '{}');
  if (body.code !== 0) throw new Error('Lark API lỗi: ' + res.getContentText());
  return body;
}

/** Token sống 2h — cache lại 90 phút để không gọi lại mỗi lead. */
function getTenantToken() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('lark_tenant_token');
  if (hit) return hit;

  var p = props();
  var res = UrlFetchApp.fetch(
    'https://' + p.LARK_DOMAIN + '/open-apis/auth/v3/tenant_access_token/internal',
    {
      method: 'post',
      contentType: 'application/json; charset=utf-8',
      payload: JSON.stringify({ app_id: p.LARK_APP_ID, app_secret: p.LARK_APP_SECRET }),
      muteHttpExceptions: true
    }
  );
  var body = JSON.parse(res.getContentText() || '{}');
  if (body.code !== 0 || !body.tenant_access_token) {
    throw new Error('Không lấy được tenant_access_token: ' + res.getContentText());
  }
  cache.put('lark_tenant_token', body.tenant_access_token, 5400);
  return body.tenant_access_token;
}

/** Chạy tay 1 lần để ghi dòng tiêu đề vào sheet. */
function setupHeader() {
  appendToLark(HEADER);
}

/** Chạy tay để thử ghi 1 dòng mẫu. */
function testAppend() {
  appendToLark([nowVN(), 'test', 'Nguyễn Văn A', "'0901411489", '80', '', 'Căn hộ (1 sàn)',
                'Hoàn thiện', 'Tiết kiệm', 'từ 480 triệu', 'dòng test', '']);
}

function props() {
  var p = PropertiesService.getScriptProperties().getProperties();
  ['LARK_APP_ID', 'LARK_APP_SECRET', 'SHEET_TOKEN', 'SHEET_ID'].forEach(function (k) {
    if (!p[k]) throw new Error('Thiếu Script Property: ' + k);
  });
  p.LARK_DOMAIN = p.LARK_DOMAIN || 'open.larksuite.com';
  return p;
}

function nowVN() {
  return Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
