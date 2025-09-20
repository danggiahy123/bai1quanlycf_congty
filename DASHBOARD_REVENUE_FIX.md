# Hướng dẫn sửa lỗi biểu đồ doanh thu trong Dashboard WebAdmin

## Vấn đề
Biểu đồ doanh thu trong dashboard webadmin không hiển thị dữ liệu, hiển thị "Không có dữ liệu doanh thu".

## Nguyên nhân
1. Thiếu dữ liệu trong database
2. Token authentication chưa được cấu hình đúng
3. Server backend chưa chạy

## Giải pháp đã thực hiện

### 1. Tạo dữ liệu test doanh thu
```bash
cd backend
node src/scripts/createRevenueTestData.js
```

### 2. Tạo token admin
```bash
cd backend  
node src/scripts/createAdminToken.js
```

### 3. Khởi động backend server
```bash
cd backend
npm start
```

### 4. Khởi động webadmin
```bash
cd webadmin
npm run dev
```

## Cách sử dụng

### Bước 1: Đăng nhập webadmin
1. Mở trình duyệt và truy cập `http://localhost:4173` (hoặc port mà Vite đang chạy)
2. Mở Developer Console (F12)
3. Chạy các lệnh sau để set token:

```javascript
// Set token (sử dụng token mới được tạo)
localStorage.setItem("token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YzhlNWUxZDFiMzRhMjkxZjc1ZTkzOSIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTgzMzk1MTYsImV4cCI6MTc1ODQyNTkxNn0.PgPp_DqqNjGdDtuOZPbsEFLVq03A2rPIpKhtUST6L4g")

// Set user info
localStorage.setItem("user", '{"id":"68c8e5e1d1b34a291f75e939","username":"admin","role":"admin"}')
```

4. Refresh trang (F5)

### Bước 2: Kiểm tra Dashboard
1. Truy cập mục "Dashboard" 
2. Biểu đồ doanh thu sẽ hiển thị dữ liệu cho 7 ngày qua
3. Có thể chuyển đổi giữa view "Ngày", "Tuần", "Tháng"

## Cải tiến đã thực hiện

### Dashboard Component
- ✅ Thêm loading state cho biểu đồ
- ✅ Hiển thị giá trị doanh thu trên mỗi cột
- ✅ Cải thiện tooltip với thông tin chi tiết
- ✅ Thêm handling cho trường hợp không có dữ liệu
- ✅ Thêm console.log để debug API responses

### Backend API
- ✅ Kiểm tra và xác nhận API `/api/dashboard/revenue` hoạt động đúng
- ✅ Kiểm tra và xác nhận API `/api/dashboard/stats` hoạt động đúng  
- ✅ Kiểm tra và xác nhận API `/api/dashboard/top-items` hoạt động đúng

### Test Data
- ✅ Tạo dữ liệu test với 29 orders đã thanh toán
- ✅ Dữ liệu phân bố trong 7 ngày gần đây
- ✅ Tổng doanh thu test: 4.507.281 VND

## Kiểm tra debug

### Mở Console để xem logs
Trong Developer Console sẽ thấy:
```
Dashboard API responses: {
  stats: {...},
  revenue: [...], 
  topItems: [...],
  activities: [...]
}
```

Nếu có lỗi, sẽ thấy:
```
Error fetching dashboard data: {...}
Error details: {...}
```

### Test API trực tiếp
```bash
cd backend
node src/scripts/testRevenueAPI.js
```

## Kết quả mong đợi
- Biểu đồ doanh thu hiển thị 7 cột cho 7 ngày gần đây
- Mỗi cột hiển thị giá trị doanh thu
- Tooltip hiển thị ngày, doanh thu và số đơn hàng
- Có thể chuyển đổi giữa các view: Ngày/Tuần/Tháng
- Tổng doanh thu hôm nay: ~400.786 VND
- Tổng doanh thu toàn bộ: ~4.507.281 VND

## Ghi chú
- Token có thời hạn 24h, sau đó cần tạo lại
- Dữ liệu test sẽ được cập nhật khi chạy lại script `createRevenueTestData.js`
- Để reset dữ liệu, chạy lại script tạo dữ liệu test
