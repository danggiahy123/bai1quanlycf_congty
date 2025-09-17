# Tính Năng Thanh Toán Bàn

## Tổng Quan
Đã thêm tính năng **THANH TOÁN BÀN** cho nhân viên và cập nhật hiển thị trạng thái bàn cho khách hàng.

## Thay Đổi Cho Khách Hàng (Mobile App)

### Màn Hình Chọn Bàn
- **Trước**: Hiển thị "CHỜ THANH TOÁN", "Đang dùng (chưa thanh toán)", "Trống"
- **Sau**: Chỉ hiển thị:
  - **"Trống"** - Bàn có thể đặt
  - **"Đã có người đặt"** - Bàn đã được đặt (có thể order thêm hoặc thanh toán)

### Tính Năng Order Thêm
- Khách hàng có thể order thêm món cho bàn đã đặt
- Nút "ORDER THÊM" vẫn hoạt động bình thường
- Nút "THANH TOÁN NGAY" chuyển đến màn hình thanh toán

## Thay Đổi Cho Nhân Viên (Web Admin)

### Tab Mới: "Thanh toán bàn"
- Thêm tab mới trong giao diện admin
- Hiển thị danh sách các bàn chưa thanh toán
- Cho phép nhân viên xử lý thanh toán

### Thống Kê
- **Bàn chưa thanh toán**: Số lượng bàn đang occupied
- **Tổng doanh thu**: Tổng tiền từ các bàn chưa thanh toán
- **Tổng bàn**: Tổng số bàn trong hệ thống

### Bộ Lọc
- **Tất cả**: Hiển thị tất cả bàn
- **Chưa thanh toán**: Chỉ hiển thị bàn occupied
- **Bàn trống**: Chỉ hiển thị bàn empty

### Thông Tin Bàn
Mỗi bàn hiển thị:
- Tên bàn và ID
- Trạng thái (Bàn trống / Chưa thanh toán)
- Danh sách món đã order (nếu có)
- Tổng tiền
- Nút "💳 Thanh toán" (chỉ hiện với bàn occupied)

### Quy Trình Thanh Toán
1. Nhân viên chọn bàn cần thanh toán
2. Xem chi tiết đơn hàng
3. Nhấn nút "💳 Thanh toán"
4. Hệ thống:
   - Đánh dấu order là "paid"
   - Chuyển bàn về trạng thái "empty"
   - Cập nhật giao diện

## API Endpoints

### Thanh Toán Order
```
POST /api/orders/by-table/:tableId/pay
```
- Đánh dấu order là đã thanh toán
- Chuyển bàn về trạng thái empty

### Lấy Order Theo Bàn
```
GET /api/orders/by-table/:tableId
```
- Lấy order đang pending của bàn
- Trả về null nếu không có order pending

## Cách Sử Dụng

### Cho Khách Hàng
1. Mở app mobile
2. Chọn "ĐẶT BÀN NGAY"
3. Chọn bàn (chỉ hiện "Trống" hoặc "Đã có người đặt")
4. Nếu bàn đã có người đặt:
   - Có thể "ORDER THÊM"
   - Hoặc "THANH TOÁN NGAY"

### Cho Nhân Viên
1. Đăng nhập web admin
2. Chọn tab "Thanh toán bàn"
3. Xem danh sách bàn chưa thanh toán
4. Chọn bàn cần thanh toán
5. Xem chi tiết đơn hàng
6. Nhấn "💳 Thanh toán"

## Test Tính Năng

Chạy file test:
```bash
node test_payment_feature.js
```

Test này sẽ:
1. Tạo bàn mới
2. Tạo order cho bàn
3. Kiểm tra trạng thái bàn
4. Thực hiện thanh toán
5. Kiểm tra kết quả

## Lưu Ý

- Tính năng này chỉ dành cho nhân viên có quyền truy cập admin
- Sau khi thanh toán, bàn sẽ tự động chuyển về trạng thái trống
- Order sau khi thanh toán sẽ được đánh dấu là "paid"
- Khách hàng không thể đặt bàn đã occupied
