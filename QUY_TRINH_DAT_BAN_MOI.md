# QUY TRÌNH ĐẶT BÀN MỚI

## Tổng quan
Hệ thống đã được cập nhật để thực hiện quy trình đặt bàn đúng theo yêu cầu:
1. Khách hàng đặt bàn → Nhận thông báo "Đã đặt bàn và chờ xác nhận"
2. Nhân viên nhận thông báo và xác nhận đặt bàn
3. Chỉ sau khi xác nhận mới có thể thanh toán

## Chi tiết quy trình

### 1. Khách hàng đặt bàn
- **API**: `POST /api/bookings`
- **Trạng thái**: `pending`
- **Thông báo gửi**:
  - **Cho khách hàng**: "Đặt bàn thành công! Bạn đã đặt bàn [Tên bàn] cho [Số người] người vào [Ngày] lúc [Giờ]. Tổng tiền: [Số tiền]đ. Đang chờ nhân viên xác nhận."
  - **Cho tất cả nhân viên**: "Đặt bàn mới cần xác nhận. Khách hàng [Tên] đã đặt bàn [Tên bàn] cho [Số người] người vào [Ngày] lúc [Giờ]. Tổng tiền: [Số tiền]đ. Vui lòng xác nhận."

### 2. Nhân viên xác nhận đặt bàn
- **API**: `POST /api/bookings/:id/confirm`
- **Trạng thái**: `pending` → `confirmed`
- **Cập nhật bàn**: `TRỐNG` → `ĐÃ ĐƯỢC ĐẶT`
- **Thông báo gửi**:
  - **Cho khách hàng**: "Đặt bàn đã được xác nhận! Bàn [Tên bàn] đã được xác nhận cho ngày [Ngày] lúc [Giờ]. Bạn có thể thanh toán khi đến nhà hàng."
  - **Cho nhân viên khác**: "Đặt bàn đã được xác nhận. Đặt bàn của khách hàng [Tên] tại bàn [Tên bàn] đã được xác nhận bởi nhân viên."

### 3. Thanh toán (chỉ khi đã xác nhận)
- **API**: `POST /api/orders/by-table/:tableId/pay`
- **Điều kiện**: Booking phải có status = `confirmed`
- **Trạng thái**: `confirmed` → `completed`
- **Cập nhật bàn**: `ĐÃ ĐƯỢC ĐẶT` → `TRỐNG`
- **Thông báo gửi**:
  - **Cho khách hàng**: "Thanh toán hoàn tất. Đơn hàng tại bàn [Tên bàn] đã được thanh toán thành công. Tổng tiền: [Số tiền]đ. Cảm ơn bạn đã sử dụng dịch vụ!"

## Các thay đổi đã thực hiện

### 1. Cập nhật API đặt bàn (`/api/bookings`)
- Thêm thông báo cho khách hàng khi đặt bàn thành công
- Cải thiện thông báo cho nhân viên với thông tin rõ ràng hơn

### 2. Cập nhật API xác nhận (`/api/bookings/:id/confirm`)
- Thêm thông báo cho khách hàng khi đặt bàn được xác nhận
- Thêm thông báo cho nhân viên khác về việc xác nhận
- Cập nhật trạng thái bàn thành "ĐÃ ĐƯỢC ĐẶT"

### 3. Cập nhật API thanh toán (`/api/orders/by-table/:tableId/pay`)
- **Kiểm tra bắt buộc**: Chỉ cho phép thanh toán khi booking có status = `confirmed`
- Cập nhật booking thành `completed` sau khi thanh toán
- Cập nhật trạng thái bàn thành "TRỐNG"

### 4. Cập nhật Model Booking
- Thêm trường `completedAt` để lưu thời gian hoàn thành

### 5. Cập nhật trạng thái bàn
- Chỉ còn 2 trạng thái: `TRỐNG` và `ĐÃ ĐƯỢC ĐẶT`
- Cập nhật tất cả code sử dụng trạng thái cũ

## Kiểm tra quy trình

### Script kiểm tra
```bash
node backend/src/scripts/testBookingFlow.js
```

### Kết quả mong đợi
- Khách hàng đặt bàn → Nhận thông báo "Đã đặt bàn và chờ xác nhận"
- Nhân viên nhận thông báo "Đặt bàn mới cần xác nhận"
- Nhân viên xác nhận → Khách hàng nhận thông báo "Đã được xác nhận"
- Chỉ có thể thanh toán khi booking đã được xác nhận
- Sau khi thanh toán → Booking chuyển thành `completed`, bàn về `TRỐNG`

## Lưu ý quan trọng
- **Không thể thanh toán** nếu booking chưa được xác nhận
- Tất cả thông báo đều được gửi tự động theo quy trình
- Trạng thái bàn được cập nhật tự động theo trạng thái booking
- Hệ thống đảm bảo tính nhất quán dữ liệu

## Các file đã thay đổi
- `backend/src/routes/booking.js` - API đặt bàn và xác nhận
- `backend/src/routes/order.js` - API thanh toán
- `backend/src/models/Booking.js` - Model booking
- `backend/src/models/Table.js` - Model bàn
- `backend/src/scripts/testBookingFlow.js` - Script kiểm tra