# Hướng Dẫn Mobile App - 2 Loại Tài Khoản

## Tổng Quan

Mobile app giờ đây hỗ trợ 2 loại tài khoản với giao diện và tính năng khác nhau:

- **Khách hàng**: Màu xanh lá (#16a34a) - Sử dụng dịch vụ
- **Nhân viên**: Màu đỏ (#dc2626) - Quản lý nhà hàng

## Quy Trình Đăng Nhập

### 1. Mở Ứng Dụng
- Chạy: `cd frontend/mobile && npm start`
- Quét QR code hoặc mở trên thiết bị

### 2. Chọn Loại Tài Khoản
- **Khách hàng** (màu xanh lá): Để đặt bàn, xem menu
- **Nhân viên** (màu đỏ): Để quản lý booking và thanh toán

### 3. Nhập Thông Tin
- **Username**: `hy123`
- **Password**: `123123`
- Nhấn "Đăng nhập"

## Giao Diện Theo Loại Tài Khoản

### 🔵 KHÁCH HÀNG (Màu Xanh Lá)

**Trang chủ hiển thị:**
- Header với thông tin khách hàng (màu xanh lá)
- 2 tính năng chính:
  - **Đặt bàn**: Chuyển đến màn hình chọn ngày giờ
  - **Xem menu**: Chuyển đến màn hình chọn món

**Tính năng:**
- Đặt bàn cho bữa ăn
- Xem và đặt món ăn
- Thanh toán
- Nhận thông báo

### 🔴 NHÂN VIÊN (Màu Đỏ)

**Trang chủ hiển thị:**
- Header với thông tin nhân viên (màu đỏ)
- 2 tính năng chính:
  - **Đặt bàn cho khách**: Quản lý booking
  - **Thanh toán bàn**: Quản lý thanh toán

**Tính năng 1: Đặt bàn cho khách**
- Xem danh sách tất cả booking
- Bộ lọc: Tất cả, Chờ xác nhận, Đã xác nhận, Đã hủy
- Thống kê: Số booking, tổng doanh thu
- Xác nhận/hủy booking trực tiếp
- Pull-to-refresh

**Tính năng 2: Thanh toán bàn**
- Xem danh sách bàn với trạng thái
- Bộ lọc: Tất cả, Chưa thanh toán, Bàn trống
- Xem chi tiết đơn hàng từng bàn
- Thực hiện thanh toán trực tiếp
- Thống kê doanh thu real-time

## Cấu Trúc Màn Hình

```
Mobile App
├── login.tsx              # Đăng nhập (2 loại tài khoản)
├── index.tsx              # Trang chủ (khác nhau theo loại tài khoản)
├── employee-bookings.tsx  # Quản lý booking (nhân viên)
├── employee-payments.tsx  # Quản lý thanh toán (nhân viên)
├── select-datetime.tsx    # Đặt bàn (khách hàng)
├── select-items.tsx       # Xem menu (khách hàng)
└── ... (các màn hình khác)
```

## Màu Sắc & Theme

### Khách Hàng
- **Màu chủ đạo**: Xanh lá (#16a34a)
- **Màu phụ**: Xanh lá nhạt (#22c55e)
- **Icon**: Person, calendar, menu
- **Mục đích**: Sử dụng dịch vụ

### Nhân Viên
- **Màu chủ đạo**: Đỏ (#dc2626)
- **Màu phụ**: Đỏ nhạt (#ef4444)
- **Icon**: Person-circle, restaurant, card
- **Mục đích**: Quản lý nhà hàng

## Test Account

### Nhân Viên
- **Username**: `hy123`
- **Password**: `123123`
- **Tên**: Nguyễn Văn Huy
- **Vai trò**: Staff

### Khách Hàng
- Tạo mới hoặc sử dụng account có sẵn
- Có thể đăng ký từ màn hình đăng nhập

## Tính Năng Nổi Bật

### 1. Phân Biệt Rõ Ràng
- Màu sắc khác nhau cho từng loại tài khoản
- Giao diện tối ưu cho từng vai trò
- Tính năng phù hợp với nhu cầu

### 2. Responsive Design
- Tối ưu cho mobile
- Touch-friendly interface
- Pull-to-refresh
- Loading states

### 3. Real-time Updates
- Tự động cập nhật dữ liệu
- Thông báo real-time
- Sync giữa các màn hình

## Troubleshooting

### Lỗi Đăng Nhập
1. Kiểm tra backend đã chạy chưa
2. Kiểm tra thông tin đăng nhập
3. Kiểm tra loại tài khoản đã chọn đúng chưa

### Lỗi Giao Diện
1. Restart app
2. Clear cache
3. Kiểm tra console errors

### Lỗi API
1. Kiểm tra kết nối internet
2. Kiểm tra backend server
3. Kiểm tra token có hợp lệ không

## Kết Luận

✅ **Hoàn thành 100%** yêu cầu:
- Mobile app với 2 loại đăng nhập
- Giao diện khách hàng màu xanh lá
- Giao diện nhân viên màu đỏ
- 2 tính năng riêng cho nhân viên
- Test account sẵn sàng sử dụng

Mobile app giờ đây phục vụ cả khách hàng và nhân viên với trải nghiệm tối ưu! 📱🎉
