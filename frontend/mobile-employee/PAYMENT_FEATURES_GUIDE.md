# 💳 HƯỚNG DẪN SỬ DỤNG TÍNH NĂNG THANH TOÁN CỌC

## Tổng quan
App nhân viên đã được cập nhật với các tính năng thanh toán cọc mới, bao gồm kiểm tra thanh toán tự động, xác nhận thủ công và mô phỏng webhook.

## 🎯 Các tính năng mới

### 1. **Giao diện QR Code cải tiến**
- ✅ **Header đẹp hơn**: Hiển thị tiêu đề và số tiền cọc rõ ràng
- ✅ **Trạng thái thanh toán**: Hiển thị trạng thái với màu sắc và icon
- ✅ **Layout gọn gàng**: Sử dụng ScrollView, thông tin ngân hàng compact
- ✅ **Responsive**: Tự động điều chỉnh theo màn hình

### 2. **Nút KIỂM TRA** 🔍
- **Chức năng**: Kiểm tra trạng thái thanh toán từ database
- **API**: `GET /api/payment/check-status/:bookingId`
- **Cách hoạt động**:
  - Kiểm tra xem có giao dịch `completed` chưa
  - Hiển thị trạng thái: `paid`, `pending`, `not_paid`
  - Cập nhật UI theo kết quả

### 3. **Nút XÁC NHẬN THỦ CÔNG** ✅
- **Chức năng**: Nhân viên xác nhận thanh toán thủ công
- **API**: `POST /api/payment/confirm-manual/:bookingId`
- **Cách hoạt động**:
  - Tạo giao dịch `completed` trong database
  - Cập nhật trạng thái booking thành `confirmed`
  - Gửi thông báo cho khách hàng và admin
  - Hiển thị dialog xác nhận trước khi thực hiện

### 4. **Nút TEST TỰ ĐỘNG** 🤖
- **Chức năng**: Mô phỏng webhook nhận thanh toán tự động
- **API**: `POST /api/payment/webhook-simulation`
- **Cách hoạt động**:
  - Tạo giao dịch `completed` tự động
  - Cập nhật trạng thái booking
  - Gửi thông báo cho tất cả bên liên quan
  - Chỉ hiển thị khi chưa thanh toán

## 🔄 Quy trình sử dụng

### **Bước 1: Tạo đặt bàn**
1. Nhân viên điền thông tin khách hàng
2. Chọn bàn và món ăn
3. Nhập số tiền cọc (tối thiểu 50,000đ)
4. Nhấn "Tạo đặt bàn"

### **Bước 2: Hiển thị QR Code**
1. Modal QR code tự động hiển thị
2. QR code được tạo từ VietQR API
3. Hiển thị thông tin ngân hàng
4. Trạng thái ban đầu: "Chờ thanh toán"

### **Bước 3: Khách hàng thanh toán**
1. Khách hàng quét QR code
2. Chuyển khoản theo thông tin hiển thị
3. Nhân viên có thể:
   - **KIỂM TRA**: Kiểm tra xem đã nhận tiền chưa
   - **XÁC NHẬN THỦ CÔNG**: Xác nhận khi khách đã chuyển
   - **TEST TỰ ĐỘNG**: Mô phỏng nhận tiền tự động

### **Bước 4: Xác nhận thanh toán**
1. **Tự động**: Hệ thống nhận webhook từ ngân hàng
2. **Thủ công**: Nhân viên xác nhận sau khi khách chuyển tiền
3. **Test**: Sử dụng nút test để mô phỏng

## 📱 Giao diện mới

### **Header**
```
💳 THANH TOÁN CỌC
50,000đ
```

### **Trạng thái thanh toán**
- 🟡 **Chờ thanh toán**: Mặc định
- 🔵 **Đang kiểm tra...**: Khi đang gọi API
- 🟢 **Đã thanh toán**: Khi có giao dịch completed
- 🔴 **Chưa thanh toán**: Khi kiểm tra không có giao dịch

### **Thông tin ngân hàng**
```
🏢 Techcombank
💳 2246811357
👤 DANG GIA HY
📄 Coc ban [Tên bàn]
```

### **Các nút chức năng**
```
[KIỂM TRA] [XÁC NHẬN THỦ CÔNG]
[TEST TỰ ĐỘNG] (chỉ khi chưa thanh toán)
```

## 🔧 API Endpoints

### **1. Kiểm tra trạng thái thanh toán**
```http
GET /api/payment/check-status/:bookingId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paid": true/false,
    "status": "completed|pending|not_paid",
    "transactionId": "...",
    "amount": 50000,
    "paidAt": "2025-09-20T..."
  }
}
```

### **2. Xác nhận thanh toán thủ công**
```http
POST /api/payment/confirm-manual/:bookingId
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50000,
  "transactionType": "deposit"
}
```

**Response:**
```json
{
  "success": true,
  "message": "✅ XÁC NHẬN THANH TOÁN THỦ CÔNG THÀNH CÔNG",
  "data": {
    "transactionId": "...",
    "status": "completed",
    "bookingId": "...",
    "amount": 50000
  }
}
```

### **3. Mô phỏng webhook tự động**
```http
POST /api/payment/webhook-simulation
Content-Type: application/json

{
  "bookingId": "...",
  "amount": 50000,
  "transactionType": "deposit"
}
```

## 🎨 Màu sắc và Styling

### **Màu chính**
- **Primary**: `#007AFF` (xanh dương chính)
- **Success**: `#27ae60` (xanh lá)
- **Warning**: `#f39c12` (vàng)
- **Danger**: `#e74c3c` (đỏ)
- **Info**: `#3498db` (xanh dương)
- **Test**: `#9b59b6` (tím)

### **Border radius**
- Modal: `24px`
- Cards: `12px-16px`
- Buttons: `12px`
- Status indicator: `20px`

## 🔔 Thông báo

### **Cho khách hàng**
- `deposit_confirmed`: "✅ ĐÃ CỌC THÀNH CÔNG"
- `deposit_confirmed_auto`: "✅ ĐÃ CỌC THÀNH CÔNG (TỰ ĐỘNG)"

### **Cho admin**
- `manual_payment_confirmed`: "💰 NHÂN VIÊN XÁC NHẬN THANH TOÁN THỦ CÔNG"
- `auto_payment_confirmed`: "🤖 HỆ THỐNG TỰ ĐỘNG NHẬN THANH TOÁN"

## 🧪 Testing

### **Test thủ công**
1. Tạo đặt bàn
2. Nhấn "XÁC NHẬN THỦ CÔNG"
3. Xác nhận trong dialog
4. Kiểm tra trạng thái chuyển thành "Đã thanh toán"

### **Test tự động**
1. Tạo đặt bàn
2. Nhấn "TEST TỰ ĐỘNG"
3. Kiểm tra trạng thái chuyển thành "Đã thanh toán"
4. Kiểm tra thông báo được gửi

### **Test kiểm tra**
1. Tạo đặt bàn
2. Nhấn "KIỂM TRA"
3. Kiểm tra kết quả trả về
4. Thử lại sau khi xác nhận

## 🚀 Lợi ích

### **Cho nhân viên**
- ✅ Giao diện đẹp, dễ sử dụng
- ✅ Kiểm tra thanh toán nhanh chóng
- ✅ Xác nhận thủ công linh hoạt
- ✅ Test tính năng dễ dàng

### **Cho khách hàng**
- ✅ QR code rõ ràng, dễ quét
- ✅ Thông tin ngân hàng đầy đủ
- ✅ Thông báo kịp thời
- ✅ Trải nghiệm mượt mà

### **Cho quản lý**
- ✅ Theo dõi thanh toán real-time
- ✅ Thông báo tự động
- ✅ Lịch sử giao dịch đầy đủ
- ✅ Báo cáo chi tiết

## 📝 Lưu ý kỹ thuật

1. **Database**: Sử dụng `TransactionHistory` để lưu giao dịch
2. **Status**: `pending` → `completed`
3. **Booking Status**: `pending` → `confirmed`
4. **Notifications**: Tự động gửi cho khách hàng và admin
5. **Error Handling**: Xử lý lỗi đầy đủ với thông báo rõ ràng
6. **Loading States**: Disable buttons khi đang xử lý
7. **Validation**: Kiểm tra dữ liệu đầu vào

## 🎯 Kết luận

Tính năng thanh toán cọc đã được cải thiện đáng kể với:
- ✅ Giao diện đẹp, hiện đại
- ✅ Chức năng đầy đủ, linh hoạt
- ✅ API mạnh mẽ, dễ sử dụng
- ✅ Thông báo real-time
- ✅ Testing dễ dàng
- ✅ UX/UI tối ưu

Nhân viên có thể dễ dàng quản lý thanh toán cọc với các công cụ mới này!
