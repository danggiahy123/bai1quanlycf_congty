# 🎉 Hướng dẫn tính năng Cọc trước - Mobile App

## 📱 Tính năng mới đã được thêm vào

### 1. **Flow đặt bàn với cọc trước**
- Khách hàng có thể chọn số tiền cọc khi đặt bàn (50k, 100k, 200k, 500k)
- Sau khi xác nhận đặt bàn thành công, nếu có cọc → chuyển đến màn hình thanh toán QR
- Nếu không cọc → thông báo bình thường như cũ

### 2. **Màn hình thanh toán cọc (deposit-payment.tsx)**
- Hiển thị QR code thanh toán giống webadmin
- Thông tin chuyển khoản: Techcombank - DANG GIA HY - 2246811357
- 2 cách xác nhận:
  - **Tự động**: Kiểm tra thanh toán tự động (demo mode)
  - **Thủ công**: Khách hàng tự xác nhận sau khi chuyển khoản

### 3. **Thông báo cho khách hàng**
- Khách hàng nhận thông báo xác nhận cọc thành công
- Thông báo hiển thị trong màn hình "Thông báo" của app

### 4. **Lịch sử giao dịch trong Webadmin**
- Tab "Lịch sử giao dịch" hiển thị tất cả giao dịch cọc
- Thống kê tổng số tiền, số giao dịch thành công
- Filter theo loại giao dịch, trạng thái, ngày

## 🔄 Flow hoạt động

### **Khách hàng đặt bàn:**
1. Chọn bàn → Chọn món → Chọn số tiền cọc (tùy chọn)
2. Xác nhận đặt bàn
3. **Nếu có cọc**: Hiển thị thông báo "ĐẶT BÀN THÀNH CÔNG!" → Tự động chuyển đến màn hình QR payment
4. **Nếu không cọc**: Thông báo chờ xác nhận → Về trang chủ

### **Thanh toán cọc:**
1. Hiển thị QR code với thông tin chuyển khoản
2. Khách hàng quét QR và chuyển khoản
3. Nhấn "KIỂM TRA THANH TOÁN TỰ ĐỘNG" hoặc "XÁC NHẬN THỦ CÔNG"
4. Hệ thống xác nhận cọc và gửi thông báo
5. Chuyển về trang chủ

### **Webadmin quản lý:**
1. Xem lịch sử giao dịch cọc trong tab "Lịch sử giao dịch"
2. Thống kê tổng doanh thu từ cọc
3. Theo dõi trạng thái thanh toán

## 🛠️ API Endpoints được sử dụng

### **Backend APIs:**
- `POST /api/bookings` - Tạo booking với depositAmount
- `POST /api/bookings/:id/confirm-deposit` - Xác nhận thanh toán cọc
- `POST /api/payment/generate-qr` - Tạo QR code thanh toán
- `POST /api/payment/check-payment` - Kiểm tra thanh toán tự động
- `GET /api/payment/history` - Lấy lịch sử giao dịch

### **Mobile App Routes:**
- `/deposit-payment` - Màn hình thanh toán cọc
- `/employee-notifications` - Màn hình thông báo

## 📊 Database Schema

### **Booking Model:**
```javascript
{
  depositAmount: Number, // Số tiền cọc
  status: String, // 'pending', 'confirmed', 'cancelled', 'completed'
  // ... other fields
}
```

### **TransactionHistory Model:**
```javascript
{
  transactionType: 'deposit', // Loại giao dịch
  amount: Number, // Số tiền
  status: 'completed', // Trạng thái
  bankInfo: {
    accountNumber: '2246811357',
    accountName: 'DANG GIA HY',
    bankName: 'Techcombank',
    bankCode: '970407'
  }
  // ... other fields
}
```

## 🎯 Cách test tính năng

### **1. Test đặt bàn có cọc:**
1. Mở mobile app
2. Đăng nhập với tài khoản khách hàng
3. Chọn "Đặt bàn" → Chọn bàn → Chọn món
4. Chọn số tiền cọc (ví dụ: 100.000đ)
5. Xác nhận đặt bàn
6. Sẽ chuyển đến màn hình QR payment

### **2. Test thanh toán cọc:**
1. Trong màn hình QR payment
2. Quét QR code hoặc chuyển khoản thủ công
3. Nhấn "KIỂM TRA THANH TOÁN TỰ ĐỘNG" (demo mode)
4. Hoặc nhấn "XÁC NHẬN THỦ CÔNG"
5. Kiểm tra thông báo trong app

### **3. Test webadmin:**
1. Mở webadmin
2. Đăng nhập với tài khoản admin
3. Vào tab "Lịch sử giao dịch"
4. Xem giao dịch cọc vừa tạo

## 🔧 Cấu hình

### **Thông tin ngân hàng (có thể thay đổi):**
```javascript
// Trong deposit-payment.tsx và webadmin
accountNumber: '2246811357'
accountName: 'DANG GIA HY'
bankCode: '970407' // Techcombank
```

### **Số tiền cọc mặc định:**
```javascript
// Trong booking-confirm.tsx
depositOptions = [
  { label: '50.000đ', value: 50000 },
  { label: '100.000đ', value: 100000 },
  { label: '200.000đ', value: 200000 },
  { label: '500.000đ', value: 500000 }
]
```

## 🚀 Tính năng đã hoàn thành

✅ **Mobile App:**
- Màn hình chọn số tiền cọc khi đặt bàn
- Màn hình QR payment với thông tin chuyển khoản
- Kiểm tra thanh toán tự động (demo mode)
- Xác nhận thanh toán thủ công
- Thông báo cho khách hàng sau khi cọc

✅ **Backend:**
- API tạo booking với depositAmount
- API xác nhận thanh toán cọc
- API tạo QR code thanh toán
- API kiểm tra thanh toán tự động
- Tạo lịch sử giao dịch tự động

✅ **Webadmin:**
- Tab "Lịch sử giao dịch" hiển thị giao dịch cọc
- Thống kê tổng doanh thu và số giao dịch
- Filter và tìm kiếm giao dịch

## 🎉 Kết luận

Tính năng cọc trước đã được tích hợp hoàn chỉnh vào hệ thống:
- **Khách hàng** có thể đặt cọc dễ dàng qua QR code
- **Quản lý** có thể theo dõi lịch sử giao dịch
- **Hệ thống** tự động gửi thông báo và cập nhật trạng thái

Tất cả đã sẵn sàng để sử dụng! 🚀
