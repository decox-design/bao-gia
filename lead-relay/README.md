# Lead form Báo giá → Google Sheet (Formlead Decox)

Form "Nhận báo giá" của `nha-pho.html` & `can-ho.html` đổ về Google Sheet **Formlead Decox**,
dùng chung Apps Script đang phục vụ các form khác của website — nhưng **tách riêng**, không đụng
các form cũ.

> Trước đây bản này đổ về Lark Sheet (file `BaoGia` cũ + `lead-relay/Code.gs`). Đã chuyển sang
> Google Sheet theo yêu cầu. `Code.gs` (Lark) giữ lại để tham khảo, không còn dùng.

## Kiến trúc

```
Form (nha-pho/can-ho.html) --POST {type:'baogia',...}--> Apps Script doPost --> luuBaoGia() --> tab "Báo giá"
                                                          (route theo type)
```

Apps Script "Formlead Decox" route theo `data.type`:
- `type === 'duan'`   → sheet **Dự án**   (form cũ — KHÔNG đụng)
- `type === 'baogia'` → **luuBaoGia()** trong `BaoGia.gs` → tab **Báo giá** (12 cột) ← MỚI
- mặc định            → sheet **Website** (form cũ — KHÔNG đụng)

## Đã làm trong Apps Script (project Formlead Decox)

1. **Thêm file `BaoGia.gs`** — hàm `luuBaoGia(data, ss)` ghi 1 dòng 12 cột vào tab "Báo giá"
   (tự tạo tab + dòng tiêu đề nếu chưa có); `setupBaoGia()` để tạo tab thủ công nếu muốn.
2. **Thêm 1 dòng route** trong `Mã.gs`, ngay sau `var type = data.type || 'website';`:
   ```js
   if (type === 'baogia') return luuBaoGia(data, ss);
   ```
   Mọi dòng cũ giữ nguyên — 2 nhánh `website`/`duan` không đổi.

Bản đồng bộ của 2 file này: `lead-relay/BaoGia.gs` và (Mã.gs) là bản gốc + đúng 1 dòng route.

## CÒN LẠI — bạn làm (deploy đang lỗi UI phía Google, retry sau)

1. Mở project → **Deploy → New deployment → Web app**
   - Execute as: **Me** · Who has access: **Anyone** → **Deploy**
   - (Nếu hiện "Something went wrong" thì reload trang, chờ ~10s rồi thử lại — lỗi tạm thời của Google.)
   - Đây là deployment MỚI, deployment của form cũ vẫn nguyên (pin version cũ) nên form cũ không ảnh hưởng.
   - *Hoặc* nếu muốn dùng CHUNG 1 URL với các form khác của site: **Manage deployments → (deployment hiện có)
     → ✏️ → Version: New version → Deploy**. Cách này an toàn (thay đổi chỉ là thêm nhánh `baogia`)
     và sau khi merge site chỉ có 1 endpoint.
2. Copy **Web app URL** (`.../exec`) → dán vào `var LEAD_ENDPOINT = ''` ở **cả** `nha-pho.html` và `can-ho.html`.
   (Gửi mình URL, mình dán + test + push giúp.)

## Cột tab "Báo giá"

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Thời gian | Trang nguồn | Họ tên | Số điện thoại | Diện tích (m²) | Mật độ XD (%) | Quy mô / Loại hình | Hạng mục | Phân khúc | Chi phí dự kiến | Ghi chú của khách | URL |

Cột F (mật độ) chỉ nhà phố; số điện thoại có `'` đầu để không mất số 0.

## Payload form gửi lên

```json
{ "type": "baogia", "page": "Nhà phố", "name": "...", "phone": "09...",
  "area": 80, "density": 70, "scale": "3 tầng", "hangmuc": "Hoàn thiện cơ bản",
  "tier": "Tiết kiệm", "cost": "từ 1,30 tỷ", "note": "...", "url": "...", "hp": "" }
```
`hp` = honeypot (bot điền thì bỏ qua). Hoạt động cả trước & sau khi merge vào website — chỉ là 1 HTTP POST tới URL cố định.
