# Hướng Dẫn Sử Dụng Cho Nhân Viên

## Thông Tin Đăng Nhập

### Web Admin (Trang Quản Lý)
- **URL**: http://localhost:3000
- **Username**: `hy123`
- **Password**: `123123`
- **Tên**: Nguyễn Văn Huy
- **Vai trò**: Staff

### Mobile App (Ứng Dụng Di Động)
- **Cài đặt**: `cd frontend/mobile-employee && npm install`
- **Chạy**: `npm start`
- **Username**: `hy123`
- **Password**: `123123`

## Quy Trình Đăng Nhập

### 1. Web Admin
1. Mở trình duyệt, truy cập http://localhost:3000
2. Nhập thông tin:
   - Username: `hy123`
   - Password: `123123`
3. Nhấn "Đăng nhập"
4. Sau khi đăng nhập thành công, bạn sẽ thấy giao diện màu đỏ với 2 tab:
   - **Đặt bàn cho khách**: Quản lý booking
   - **Thanh toán bàn**: Quản lý thanh toán

### 2. Mobile App
1. Cài đặt và chạy ứng dụng
2. Nhập thông tin đăng nhập tương tự
3. Sử dụng 2 tab chính:
   - **Tab 1**: Đặt bàn cho khách
   - **Tab 2**: Thanh toán bàn

## Tính Năng Chính

### 1. ĐẶT BÀN CHO KHÁCH

#### Web Admin:
- Xem danh sách tất cả đặt bàn
- Bộ lọc theo trạng thái
- Thống kê booking
- Xác nhận/hủy đặt bàn
- Tìm kiếm booking

#### Mobile App:
- Danh sách booking với thông tin đầy đủ
- Bộ lọc: Tất cả, Chờ xác nhận, Đã xác nhận, Đã hủy
- Thống kê: Số booking, tổng doanh thu
- Xác nhận/hủy trực tiếp
- Pull-to-refresh

### 2. THANH TOÁN BÀN

#### Web Admin:
- Xem danh sách bàn chưa thanh toán
- Chi tiết đơn hàng từng bàn
- Thực hiện thanh toán
- Thống kê doanh thu
- Bộ lọc bàn

#### Mobile App:
- Danh sách bàn với trạng thái
- Bộ lọc: Tất cả, Chưa thanh toán, Bàn trống
- Xem chi tiết đơn hàng
- Thanh toán trực tiếp
- Thống kê real-time

## Giao Diện

### Màu Sắc
- **Nhân viên**: Màu đỏ (#dc2626) - Phân biệt với khách hàng (màu xanh lá)
- **Khách hàng**: Màu xanh lá (#16a34a)

### Thiết Kế
- **Web Admin**: Desktop-first, nhiều tính năng
- **Mobile App**: Mobile-first, tối ưu cho touch
- **Responsive**: Tương thích mọi thiết bị

## Lưu Ý Quan Trọng

### 1. Khởi Động Hệ Thống
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Web Admin
cd webadmin
npm run dev

# Terminal 3: Mobile App (nếu cần)
cd frontend/mobile-employee
npm start
```

### 2. Test Account
- **Nhân viên**: hy123 / 123123
- **Khách hàng**: Có thể tạo mới hoặc sử dụng account có sẵn

### 3. API Endpoints
- Backend chạy trên: http://localhost:5000
- Web Admin chạy trên: http://localhost:3000
- Mobile App: Expo development server

## Troubleshooting

### Lỗi Đăng Nhập
1. Kiểm tra backend đã chạy chưa
2. Kiểm tra thông tin đăng nhập
3. Kiểm tra kết nối database

### Lỗi API
1. Restart backend server
2. Kiểm tra route đã được thêm chưa
3. Kiểm tra token có hợp lệ không

### Lỗi Giao Diện
1. Hard refresh browser (Ctrl+F5)
2. Clear cache
3. Kiểm tra console errors

## Kết Luận

Hệ thống đã được cấu hình hoàn chỉnh với:
- ✅ Giao diện nhân viên màu đỏ
- ✅ Giao diện khách hàng màu xanh lá
- ✅ 2 tính năng riêng biệt cho nhân viên
- ✅ Test account sẵn sàng sử dụng
- ✅ Web admin và mobile app hoạt động

Sẵn sàng sử dụng! 🎉
