# Lead form Báo giá → Google Sheet (Formlead Decox)

Form "Nhận báo giá" của `nha-pho.html` & `can-ho.html` gửi lead về **cùng** Google Apps Script
web app mà các form khác của website đang dùng — **không thêm code, không đụng gì** phía Apps Script.

## Cách hoạt động

Form POST (no-cors) một JSON tới endpoint có sẵn:

```
LEAD_ENDPOINT = https://script.google.com/macros/s/AKfycbxiLOOCCQnTcA_mMMq-dp-t4tiPRQCO8gzgt0KAaA5j2G55CKS8bTzmCV41e2bnwCaE2Q/exec
```

Đây đúng là web app "Formlead Decox" (lấy từ `GOOGLE_SCRIPT_URL` trong source decoxdesign.com).
Apps Script route theo `data.type`:
- `type: 'website'` → ghi sheet **Website** — báo giá dùng nhánh này.
- `type: 'duan'`    → ghi sheet **Dự án** (form ảnh dự án — không liên quan).

Vì đi qua nhánh `website` có sẵn nên **không cần deploy lại**, không cần sheet mới, không cần chỉnh Apps Script.

## Payload form gửi

```json
{
  "type": "website",
  "Ten": "<họ tên>",
  "Dienthoai": "<số điện thoại>",
  "Noidung": "<toàn bộ thông số máy tính + link trang>",
  "Nguon": "Báo giá nhà phố"   // hoặc "Báo giá căn hộ"
}
```

- `Noidung` = nội dung ô "Diện tích & nhu cầu" (đã tự điền: diện tích, mật độ/loại hình, quy mô,
  hạng mục, phân khúc, chi phí dự kiến) + dòng `— Trang: <url>`.
- `Nguon` để phân biệt lead báo giá với lead khác trong sheet Website (lọc theo cột Nguồn).
- `Thoigian` không gửi → Apps Script tự điền giờ server (`dd/MM/yyyy HH:mm:ss`, giờ VN) — đúng
  như khi các form khác của site để trống.

Sheet **Website** có 5 cột: `Ten | Dienthoai | Thoigian | Noidung | Nguon`.

## Chỗ đã nối trong code

`var LEAD_ENDPOINT = '...'` ở đầu khối `<script>` của [nha-pho.html](../nha-pho.html) và
[can-ho.html](../can-ho.html). Đổi web app URL thì sửa 1 dòng này ở cả 2 file.

Hoạt động cả trước & sau khi merge vào website — chỉ là 1 HTTP POST tới URL cố định.

---

*Trước đây bản này từng thử đổ về Lark Sheet qua Apps Script relay riêng (file `Code.gs`, `BaoGia.gs`)
— đã bỏ, chuyển sang dùng chung endpoint Google Sheet có sẵn của site.*
