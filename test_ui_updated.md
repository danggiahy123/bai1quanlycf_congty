# 🎨 Giao diện cập nhật - Cafe Management System

## ✅ **Các thay đổi mới:**

### 1. **Xóa khung phía trên "Cafe Management"**
- ❌ **Xóa**: Logo và khung màu xanh phía trên
- ✅ **Thay thế**: Header đơn giản với nền trắng

### 2. **Thông tin user ngắn gọn**
- 👋 **Trước**: "Xin chào" + Tên + (Đăng xuất)
- ✅ **Sau**: "Xin chào {Tên}" + (Đăng xuất)
- 🎨 **Style**: Nút đăng xuất có viền xanh lá

### 3. **Luồng đặt bàn mới**
- 🏠 **Trang chủ** → Nhấn "Bắt đầu đặt bàn"
- 👥 **Nhập số lượng khách** → Trang mới với giao diện đẹp
- 🪑 **Chọn bàn** → Tiếp tục quy trình cũ

## 🎯 **Trang nhập số lượng khách mới:**

### **Tính năng:**
- 📝 **Input số khách** với validation
- ⚡ **Chọn nhanh**: 1, 2, 4, 6, 8, 10 người
- ✅ **Validation**: 1-20 người
- 🎨 **Giao diện đẹp** với icon và màu xanh lá

### **Layout:**
```
┌─────────────────────────────────┐
│ ← Nhập số lượng khách          │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│           👥                   │
│      Số lượng khách            │
│   Vui lòng nhập số lượng        │
│   khách sẽ đến quán             │
│                                │
│   [   4   ] người              │
│                                │
│   Chọn nhanh:                  │
│   [1] [2] [4] [6] [8] [10]     │
│                                │
│   [→ Tiếp tục]                 │
└─────────────────────────────────┘
```

## 🔄 **Luồng hoạt động mới:**

1. **Trang chủ** → "Bắt đầu đặt bàn"
2. **Nhập số khách** → Chọn số lượng (1-20)
3. **Chọn bàn** → Tiếp tục quy trình cũ
4. **Chọn món** → Xác nhận → Thanh toán

## 📱 **Cách test:**

1. **Mở mobile app**: http://localhost:8082
2. **Nhấn "Bắt đầu đặt bàn"**
3. **Test trang nhập số khách**:
   - Nhập số khách bằng tay
   - Chọn nhanh các số có sẵn
   - Test validation (0, 21, v.v.)
4. **Tiếp tục** đến chọn bàn

## 🎨 **Giao diện trang chủ mới:**

```
┌─────────────────────────────────┐
│        Xin chào Nguyễn Văn A   │
│                        [Đăng xuất]│
└─────────────────────────────────┘

┌─────────────────────────────────┐
│           📅                   │
│      ĐẶT BÀN NGAY              │
│   Chọn bàn, chọn món và        │
│   thanh toán dễ dàng           │
│                                │
│   [→ Bắt đầu đặt bàn]          │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 🔔 Thông báo từ quản lý    🔄  │
│ ─────────────────────────────── │
│ 📱 Thông báo 1                  │
│ 📱 Thông báo 2                  │
└─────────────────────────────────┘
```

## ✨ **Cải tiến:**

- 🎯 **Đơn giản hóa** header
- 🚀 **Thêm trang nhập số khách** với UX tốt
- 🎨 **Giao diện nhất quán** với theme xanh lá
- ⚡ **Chọn nhanh** số khách phổ biến
- ✅ **Validation** đầy đủ
