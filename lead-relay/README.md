# Lead relay → Lark Sheet

Đổ dữ liệu form "Nhận báo giá" của `nha-pho.html` & `can-ho.html` vào sheet:
`https://decox-design-center.sg.larksuite.com/sheets/TFTasxNAuh7ApCt9D5tlBhpsgjh?sheet=4Yyr8R`

Trình duyệt **không** gọi thẳng Lark được (API bắt buộc token sinh từ App Secret + chặn CORS),
nên Apps Script đứng giữa: page → Apps Script Web App → Lark API.

```
Form (HTML tĩnh) --POST JSON--> Apps Script Web App --values_append--> Lark Sheet
                                 (giữ App Secret)
```

## 1. Tạo Lark custom app

1. Vào https://open.larksuite.com/app → **Create custom app**, đặt tên vd `Decox Lead Relay`.
2. Tab **Credentials & Basic Info**: copy **App ID** và **App Secret** (giữ kín, chỉ dán vào bước 3).
3. Tab **Permissions & Scopes**: thêm `sheets:spreadsheet` (hoặc `drive:drive`) → **Create version & publish**,
   chờ admin workspace duyệt.
4. Mở file sheet trên → **Share** → thêm chính app vừa tạo làm cộng tác viên quyền **Edit**
   (gõ tên app trong ô mời). Thiếu bước này API sẽ trả `permission denied`.

> ⚠️ **Add app báo "Failed to invite members"?**
> App chỉ add được vào tài liệu **cùng tenant với app**. File có badge `External` (được chia sẻ
> chéo tổ chức) sẽ luôn báo lỗi này dù scope đã cấp đủ.
> Cách xử lý: tạo sheet mới ngay trong Drive của tenant mình → add app vào sheet mới đó →
> đổi `SHEET_TOKEN` / `SHEET_ID` theo URL mới. Sheet cũ nếu vẫn cần thì dùng công thức tham chiếu
> hoặc copy dữ liệu sang sau.
> Nếu sheet mới cũng lỗi → admin workspace đang chặn app làm cộng tác viên tài liệu, phải nhờ admin
> mở, hoặc cấp **Range of access** cho app trong Permissions & Scopes.

## 2. Tạo Apps Script project

1. https://script.google.com → **New project**, đặt tên `Decox Lead Relay`.
2. Dán toàn bộ nội dung `Code.gs` trong thư mục này vào file `Code.gs`.

## 3. Khai báo Script Properties

Project Settings (⚙) → **Script Properties** → Add:

| Property | Value |
|---|---|
| `LARK_APP_ID` | App ID ở bước 1 |
| `LARK_APP_SECRET` | App Secret ở bước 1 |
| `SHEET_TOKEN` | `TFTasxNAuh7ApCt9D5tlBhpsgjh` |
| `SHEET_ID` | `4Yyr8R` |
| `LARK_DOMAIN` | `open.larksuite.com` |

> App Secret **chỉ** nằm ở đây. Không bao giờ đưa vào file HTML — page là public, ai cũng xem được source.

## 4. Kiểm tra & deploy

1. Chọn hàm `checkAccess` → **Run** (lần đầu Google hỏi cấp quyền → Allow).
   Log phải in ra tên file + danh sách sheetId. Lỗi ở đây là do quyền/token, xử lý trước khi đi tiếp.
2. Chọn hàm `setupHeader` → **Run**. Sheet sẽ có dòng tiêu đề 12 cột.
3. Chọn `testAppend` → **Run** → sheet có thêm 1 dòng test. Xoá dòng test sau khi xong.
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - → copy **Web app URL** (dạng `https://script.google.com/macros/s/AKfy…/exec`)
5. Mở URL đó trên trình duyệt: thấy `{"ok":true,...}` là xong.

## 5. Nối vào 2 page

Trong `nha-pho.html` và `can-ho.html`, tìm dòng:

```js
var LEAD_ENDPOINT = '';   // ← dán Web app URL của Apps Script vào đây
```

dán URL ở bước 4 (mục 5.4) vào. Xong — submit form là sheet có dòng mới.

Mỗi lần sửa `Code.gs` phải **Deploy → Manage deployments → Edit → New version** thì bản live mới đổi.

## Cột trong sheet

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Thời gian | Trang nguồn | Họ tên | Số điện thoại | Diện tích (m²) | Mật độ XD (%) | Quy mô / Loại hình | Hạng mục | Phân khúc | Chi phí dự kiến | Ghi chú của khách | URL |

- Cột F (mật độ) chỉ có ở nhà phố, căn hộ để trống.
- Số điện thoại ghi kèm dấu `'` đầu để Lark không cắt số 0.

## Lưu ý

- Web app để **Anyone** nên URL là public: người khác biết URL có thể bắn dữ liệu rác. Form đã có
  honeypot chặn bot đơn giản; nếu bị spam thật thì thêm reCAPTCHA hoặc kiểm tra `Referer` trong `doPost`.
- Page gửi bằng `sendBeacon`/`fetch no-cors` → không đọc được phản hồi, form luôn hiện "Cảm ơn".
  Muốn báo lỗi cho khách khi ghi thất bại thì phải đổi sang `fetch` thường + bật CORS (Apps Script
  không set được header CORS, khi đó cần Cloudflare Worker thay vì Apps Script).
