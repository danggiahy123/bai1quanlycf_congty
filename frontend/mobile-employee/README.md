# Employee Mobile App

Ứng dụng mobile dành cho nhân viên nhà hàng với 2 tính năng chính:

## Tính Năng

### 1. ĐẶT BÀN CHO KHÁCH
- Xem danh sách đặt bàn
- Xác nhận/hủy đặt bàn
- Thống kê đặt bàn theo trạng thái
- Bộ lọc: Tất cả, Chờ xác nhận, Đã xác nhận, Đã hủy

### 2. THANH TOÁN BÀN
- Xem danh sách bàn chưa thanh toán
- Xem chi tiết đơn hàng của từng bàn
- Thực hiện thanh toán
- Thống kê doanh thu
- Bộ lọc: Tất cả, Chưa thanh toán, Bàn trống

## Cài Đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Khởi chạy ứng dụng:
```bash
npm start
```

## Giao Diện

- **Màu chủ đạo**: Đỏ (#dc2626) - phù hợp với giao diện nhân viên
- **Thiết kế**: Material Design với các card và button rõ ràng
- **Responsive**: Tối ưu cho mobile

## API

Ứng dụng kết nối với backend API tại `http://localhost:5000`:
- `/api/bookings` - Quản lý đặt bàn
- `/api/tables` - Quản lý bàn
- `/api/orders` - Quản lý đơn hàng
- `/api/employees/login` - Đăng nhập nhân viên
