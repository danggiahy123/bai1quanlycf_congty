# Hướng dẫn sử dụng tính năng tài khoản nhân viên

## Tổng quan
Đã thêm tính năng quản lý tài khoản nhân viên trong hệ thống quản lý quán cà phê.

## Cài đặt

### 1. Backend
```bash
cd backend
npm install
```

### 2. Web Admin
```bash
cd webadmin
npm install
```

### 3. Mobile App
```bash
cd frontend/mobile
npm install
```

## Chạy ứng dụng

### 1. Tạo tài khoản admin
```bash
cd backend
npm run create-admin
```
Tài khoản admin mặc định:
- Username: `admin`dă
- Password: `admin123`

### 2. Khởi động Backend
```bash
cd backend
npm run dev
```
Server sẽ chạy tại: http://localhost:5000

### 3. Khởi động Web Admin
```bash
cd webadmin
npm run dev
```
Truy cập: http://localhost:5173

### 4. Khởi động Mobile App
```bash
cd frontend/mobile
npm start
```

## Sử dụng

### Web Admin
1. Truy cập http://localhost:5173
2. Đăng nhập với tài khoản admin:
   - Username: `admin`
   - Password: `admin123`
3. Sau khi đăng nhập, có 3 tab:
   - **Món**: Quản lý menu như trước
   - **Bàn**: Quản lý bàn như trước  
   - **Nhân viên**: Quản lý tài khoản nhân viên
4. Trong tab "Nhân viên":
   - Xem danh sách nhân viên
   - Thêm nhân viên mới (chỉ admin mới có thể tạo)
   - Sửa thông tin nhân viên
   - Xóa nhân viên (soft delete)
5. Nhấn "Đăng xuất" để thoát

### Mobile App
1. Mở ứng dụng mobile
2. Đăng nhập với tài khoản nhân viên đã tạo từ web admin:
   - Nhập tên đăng nhập
   - Nhập mật khẩu
   - Nhấn "Đăng nhập"
3. Sau khi đăng nhập, có thể sử dụng các tính năng order như trước
4. Nhấn "Đăng xuất" để thoát

## API Endpoints

### Đăng ký nhân viên
```
POST /api/employees/register
Content-Type: application/json

{
  "username": "string",
  "password": "string", 
  "fullName": "string",
  "email": "string",
  "role": "staff" | "admin"
}
```

### Đăng nhập
```
POST /api/employees/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

### Lấy danh sách nhân viên
```
GET /api/employees
```

## Lưu ý
- Mật khẩu được mã hóa bằng bcrypt
- Token JWT có thời hạn 24 giờ
- Thông tin đăng nhập được lưu trong localStorage (web) và AsyncStorage (mobile)
- Cần có MongoDB đang chạy để lưu trữ dữ liệu

## Troubleshooting
- Nếu không kết nối được API, kiểm tra backend có đang chạy không
- Nếu lỗi đăng nhập, kiểm tra tên đăng nhập và mật khẩu
- Nếu lỗi kết nối database, kiểm tra MongoDB có đang chạy không
