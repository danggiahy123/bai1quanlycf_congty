# Hướng dẫn Quy trình Đặt bàn Mới

## Quy trình đã được sửa theo yêu cầu:

### 1. Đặt bàn ngay (home.tsx / index.tsx)
- Người dùng nhấn nút "ĐẶT BÀN NGAY"
- Chuyển đến màn hình chọn số khách

### 2. Số khách (select-guests.tsx)
- Người dùng chọn số lượng khách (1-8 người)
- Có thể nhập số khách thủ công
- Chuyển đến màn hình chọn bàn

### 3. Chọn bàn (select-table.tsx)
- Hiển thị danh sách bàn có sẵn
- Người dùng chọn bàn phù hợp với số khách
- Chuyển đến màn hình chọn món

### 4. Chọn món (select-items.tsx)
- Hiển thị menu các món ăn/đồ uống
- Người dùng chọn món và số lượng
- Hiển thị tổng tiền
- Chuyển đến màn hình chọn ngày giờ

### 5. Chọn ngày giờ (select-datetime.tsx)
- Người dùng chọn ngày đặt bàn (không được trong quá khứ)
- Chọn giờ đặt bàn (nếu chọn ngày hôm nay thì giờ phải trong tương lai)
- Chuyển đến màn hình chọn cọc

### 6. Chọn cọc (select-deposit.tsx)
- Người dùng chọn số tiền cọc (tối thiểu 50,000đ)
- Các tùy chọn: 50k, 100k, 200k, 500k
- Hiển thị thông tin thanh toán
- Chuyển đến màn hình xác nhận đặt bàn

### 7. Xác nhận đặt bàn (order-confirm.tsx)
- Hiển thị tóm tắt đơn hàng
- Thông tin bàn, số khách, ngày giờ, món ăn, tiền cọc
- Người dùng xác nhận và tạo booking
- Chuyển đến màn hình thanh toán QR

### 8. Thanh toán QR (payment.tsx)
- Hiển thị QR code thanh toán cọc
- Thông tin chuyển khoản: DANG GIA HY - 2246811357 - Techcombank
- Người dùng quét QR và chuyển khoản
- Nhấn "Đã chuyển khoản - Xác nhận"
- Chuyển đến màn hình thành công

### 9. Gửi đơn đặt bàn (booking-success.tsx)
- Hiển thị thông báo thành công
- Thông tin booking: mã đặt bàn, bàn, tiền cọc
- Lưu ý quan trọng cho khách hàng
- Nút "Về trang chủ" và "Xem chi tiết"

## Các thay đổi chính:

1. **Thêm bước chọn ngày giờ** giữa chọn món và chọn cọc
2. **Sửa thứ tự** từ chọn cọc → xác nhận thành chọn cọc → xác nhận đặt bàn → thanh toán QR
3. **Tách riêng màn hình thanh toán QR** thay vì tích hợp trong xác nhận
4. **Thêm màn hình thành công** để hoàn tất quy trình
5. **Cập nhật navigation** trong _layout.tsx

## Luồng dữ liệu:

```
home → select-guests → select-table → select-items → select-datetime → select-deposit → order-confirm → payment → booking-success
```

## Các file đã được sửa:

- `select-items.tsx`: Chuyển từ `/booking-confirm` sang `/select-datetime`
- `select-deposit.tsx`: Chuyển từ `/select-items` sang `/order-confirm`
- `order-confirm.tsx`: Chuyển từ hiển thị QR sang chuyển đến `/payment`
- `payment.tsx`: Thêm logic nhận thông tin booking và xác nhận thanh toán
- `booking-success.tsx`: Màn hình mới hiển thị kết quả thành công
- `_layout.tsx`: Thêm các màn hình mới vào navigation

