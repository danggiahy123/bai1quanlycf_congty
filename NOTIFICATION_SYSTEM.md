# Hệ thống Thông báo - Quản lý Quán Cà phê

## Tổng quan
Hệ thống thông báo cho phép quản lý gửi thông báo đến khách hàng về việc xác nhận hoặc hủy đặt bàn. Khách hàng có thể xem, đánh dấu đã đọc và xóa thông báo trong ứng dụng mobile.

## Tính năng chính

### 1. Thông báo tự động
- **Xác nhận bàn**: Tự động gửi thông báo khi admin xác nhận đặt bàn
- **Hủy bàn**: Tự động gửi thông báo khi admin hủy đặt bàn với lý do
- **Nhắc nhở**: Thông báo nhắc nhở khách hàng (có thể mở rộng)

### 2. Giao diện Mobile
- Hiển thị thông báo trên trang chủ
- Badge hiển thị số thông báo chưa đọc
- Đánh dấu đã đọc khi nhấn vào thông báo
- Xóa thông báo không cần thiết
- Pull-to-refresh để cập nhật thông báo mới

### 3. Quản lý thông báo
- Phân loại thông báo theo loại (confirmed, cancelled, reminder)
- Lưu trữ lịch sử thông báo
- Đếm số thông báo chưa đọc
- Phân trang cho danh sách thông báo

## Cấu trúc Database

### Model Notification
```javascript
{
  user: ObjectId,           // ID khách hàng
  type: String,             // Loại thông báo
  title: String,            // Tiêu đề
  message: String,          // Nội dung
  bookingId: ObjectId,      // ID booking (optional)
  isRead: Boolean,          // Đã đọc chưa
  readAt: Date,             // Thời gian đọc
  createdAt: Date,          // Thời gian tạo
  updatedAt: Date           // Thời gian cập nhật
}
```

## API Endpoints

### GET /api/notifications
Lấy danh sách thông báo của user
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `page`, `limit`
- **Response**: `{ notifications, pagination, unreadCount }`

### PUT /api/notifications/:id/read
Đánh dấu thông báo đã đọc
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ message }`

### PUT /api/notifications/read-all
Đánh dấu tất cả thông báo đã đọc
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ message }`

### DELETE /api/notifications/:id
Xóa thông báo
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ message }`

### POST /api/notifications
Tạo thông báo mới (cho admin)
- **Body**: `{ user, type, title, message, bookingId }`
- **Response**: `{ message, notification }`

## Cách sử dụng

### 1. Chạy Backend
```bash
cd backend
npm install
npm start
```

### 2. Chạy Mobile App
```bash
cd frontend/mobile
npm install
npx expo start
```

### 3. Tạo thông báo mẫu
```bash
cd backend
node src/scripts/createSampleNotifications.js
```

### 4. Test hệ thống
```bash
cd backend
node src/scripts/testNotifications.js
```

## Luồng hoạt động

1. **Khách hàng đặt bàn** → Booking được tạo với status "pending"
2. **Admin xác nhận** → Booking status = "confirmed" + Tạo thông báo "booking_confirmed"
3. **Admin hủy bàn** → Booking status = "cancelled" + Tạo thông báo "booking_cancelled"
4. **Khách hàng mở app** → Hiển thị thông báo mới với badge số lượng
5. **Khách hàng nhấn thông báo** → Đánh dấu đã đọc
6. **Khách hàng xóa thông báo** → Xóa khỏi danh sách

## Tùy chỉnh

### Thêm loại thông báo mới
1. Cập nhật enum trong `Notification.js`:
```javascript
type: {
  type: String,
  enum: ['booking_confirmed', 'booking_cancelled', 'booking_reminder', 'new_type'],
  required: true
}
```

2. Cập nhật icon và màu sắc trong `NotificationCard.tsx`

### Thay đổi giao diện
- Chỉnh sửa styles trong `home.tsx` và `NotificationCard.tsx`
- Thay đổi số thông báo hiển thị (hiện tại: 5)
- Tùy chỉnh màu sắc và layout

## Troubleshooting

### Lỗi thường gặp
1. **Thông báo không hiển thị**: Kiểm tra token authentication
2. **API không hoạt động**: Kiểm tra server đã chạy chưa
3. **Database lỗi**: Kiểm tra kết nối MongoDB

### Debug
```bash
# Xem log server
cd backend
npm run dev

# Xem log mobile
cd frontend/mobile
npx expo start --clear
```

## Mở rộng tương lai

1. **Push Notifications**: Tích hợp FCM/APNs
2. **Email Notifications**: Gửi email khi có thông báo
3. **SMS Notifications**: Gửi SMS cho thông báo quan trọng
4. **Real-time Updates**: Sử dụng WebSocket
5. **Notification Templates**: Tạo template cho các loại thông báo
6. **Analytics**: Thống kê tỷ lệ đọc thông báo
