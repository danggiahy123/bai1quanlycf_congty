# 🔔 HỆ THỐNG THÔNG BÁO CỌC THÀNH CÔNG

## 📋 Tổng quan

Hệ thống thông báo đã được cập nhật để gửi thông báo real-time khi khách hàng cọc thành công:

### ✅ **Tính năng đã implement:**

1. **Thông báo cho khách hàng** 📱
   - Thông báo "✅ Cọc bàn thành công!" 
   - Hiển thị số tiền cọc và tên bàn
   - Real-time qua Socket.IO

2. **Thông báo cho nhân viên** 👥
   - Thông báo "💰 Khách hàng đã cọc thành công"
   - Hiển thị tên khách, số tiền, tên bàn
   - Real-time qua Socket.IO

3. **Socket.IO Integration** 🔌
   - Kết nối real-time giữa backend và mobile apps
   - Auto-reconnect khi mất kết nối
   - Room-based messaging (customer/employee)

## 🚀 Cách test hệ thống

### **Bước 1: Khởi động hệ thống**

```bash
# Backend (Terminal 1)
cd backend && npm start

# Mobile App Khách hàng (Terminal 2)  
cd frontend/mobile && npm start

# Mobile App Nhân viên (Terminal 3)
cd frontend/mobile-employee && npm start
```

### **Bước 2: Test flow cọc thành công**

1. **Mở Mobile App Khách hàng**
   - Quét QR code từ Terminal 2
   - Đăng nhập với tài khoản khách hàng

2. **Đặt bàn với cọc**
   - Chọn bàn và thời gian
   - Chọn cọc 50,000 VND
   - Tạo QR code thanh toán

3. **Mở Mobile App Nhân viên**
   - Quét QR code từ Terminal 3
   - Đăng nhập với tài khoản nhân viên
   - Vào tab "Thông báo"

4. **Xác nhận thanh toán cọc**
   - Admin xác nhận thanh toán qua webadmin
   - Hoặc sử dụng API: `POST /api/payment/confirm-payment`

### **Bước 3: Kiểm tra thông báo**

#### **Trên Mobile App Khách hàng:**
- ✅ Thông báo "✅ Cọc bàn thành công!" xuất hiện
- ✅ Hiển thị số tiền cọc và tên bàn
- ✅ Badge "💰 CỌC THÀNH CÔNG" màu vàng

#### **Trên Mobile App Nhân viên:**
- ✅ Thông báo "💰 Khách hàng đã cọc thành công" xuất hiện
- ✅ Hiển thị tên khách, số tiền, tên bàn
- ✅ Badge "Cọc tiền" với icon cash

## 🔧 Các file đã được cập nhật

### **Backend:**
- `backend/src/routes/payment.js` - Thêm tạo thông báo và Socket.IO
- `backend/src/models/Notification.js` - Đã có sẵn

### **Mobile App Khách hàng:**
- `frontend/mobile/hooks/useSocket.ts` - Hook Socket.IO
- `frontend/mobile/app/index.tsx` - Thêm Socket.IO listeners và UI

### **Mobile App Nhân viên:**
- `frontend/mobile-employee/hooks/useSocket.ts` - Hook Socket.IO  
- `frontend/mobile-employee/app/notifications.tsx` - Thêm Socket.IO listeners

## 📱 Giao diện thông báo

### **Khách hàng:**
```
┌─────────────────────────────────┐
│ ✅ Cọc bàn thành công!          │
│ Bạn đã cọc 50,000đ cho bàn 3    │
│ thành công. Bàn đã được xác nhận!│
│ [💰 CỌC THÀNH CÔNG]            │
└─────────────────────────────────┘
```

### **Nhân viên:**
```
┌─────────────────────────────────┐
│ 💰 Khách hàng đã cọc thành công │
│ Khách Nguyễn Văn A đã cọc       │
│ 50,000đ cho bàn 3               │
│ [Cọc tiền]                      │
└─────────────────────────────────┘
```

## 🐛 Troubleshooting

### **Không nhận được thông báo:**
1. Kiểm tra Socket.IO connection trong console
2. Đảm bảo backend đang chạy trên port 5000
3. Kiểm tra network connection

### **Thông báo không real-time:**
1. Refresh app để reload notifications
2. Kiểm tra Socket.IO events trong console
3. Restart backend server

## 🎉 Kết quả

✅ **Khách hàng** nhận thông báo ngay khi cọc thành công
✅ **Nhân viên** nhận thông báo real-time về cọc thành công  
✅ **Socket.IO** hoạt động ổn định với auto-reconnect
✅ **UI** hiển thị đẹp với badge và icon phù hợp

**Hệ thống thông báo cọc thành công đã hoàn thành!** 🎊
