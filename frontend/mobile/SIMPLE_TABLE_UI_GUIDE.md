# 🎨 GIAO DIỆN CHỌN BÀN ĐƠN GIẢN

## 📱 Thiết kế mới

Giao diện chọn bàn đã được làm lại với thiết kế đơn giản, 1 màu chủ đạo và khung rõ ràng:

### ✅ **Đặc điểm chính:**

1. **Màu sắc đơn giản** 🎨
   - Màu chủ đạo: **#007bff** (xanh dương)
   - Nền: **#f5f5f5** (xám nhạt)
   - Chữ: **#333** (đen đậm)

2. **Khung bàn rõ ràng** 📦
   - **Bàn trống**: Khung xanh dương (#007bff)
   - **Bàn đã đặt**: Khung đỏ (#dc3545)
   - **Bàn đã chọn**: Khung xanh lá (#28a745)

3. **Layout đơn giản** 📐
   - Grid 2 cột (47% mỗi bàn)
   - Chiều cao cố định: 120px
   - Padding đồng nhất: 15px
   - Border radius: 8px

### 🎯 **Thông tin hiển thị:**

#### **Bàn trống:**
```
┌─────────────────┐
│   BÀN 1         │
│   TRỐNG         │
└─────────────────┘
```

#### **Bàn đã đặt:**
```
┌─────────────────┐
│   BÀN 2         │
│   BÀN ĐÃ ĐẶT    │
│   ĐÃ ĐẶT        │
└─────────────────┘
```

#### **Bàn đã chọn:**
```
┌─────────────────┐
│   BÀN 3         │
│   TRỐNG         │
│   ✓ ĐÃ CHỌN     │
└─────────────────┘
```

### 🔧 **Các thay đổi chính:**

1. **Loại bỏ thông tin phức tạp:**
   - ❌ VIP badge
   - ❌ Thông tin chi tiết (số người, vị trí, giá)
   - ❌ Features icons
   - ❌ Warnings

2. **Chỉ giữ lại thông tin cần thiết:**
   - ✅ Tên bàn
   - ✅ Trạng thái (TRỐNG/BÀN ĐÃ ĐẶT)
   - ✅ Action text (ĐÃ CHỌN/ĐÃ ĐẶT/XEM BILL)

3. **Màu sắc thống nhất:**
   - Tất cả bàn đều dùng màu xanh dương làm chủ đạo
   - Chỉ thay đổi màu khung theo trạng thái
   - Chữ màu đen đậm để dễ đọc

### 📱 **Trải nghiệm người dùng:**

1. **Dễ nhìn** 👀
   - Giao diện sạch sẽ, không rối mắt
   - Thông tin quan trọng được highlight
   - Màu sắc nhất quán

2. **Dễ sử dụng** 👆
   - Chỉ cần nhìn là biết bàn nào trống/đã đặt
   - Không cần đọc nhiều thông tin phụ
   - Touch target lớn, dễ bấm

3. **Tải nhanh** ⚡
   - Ít element, ít style phức tạp
   - Render nhanh hơn
   - Tiết kiệm băng thông

### 🎨 **Màu sắc chi tiết:**

```css
/* Màu chủ đạo */
Primary: #007bff (xanh dương)
Success: #28a745 (xanh lá)
Danger: #dc3545 (đỏ)
Background: #f5f5f5 (xám nhạt)
Text: #333 (đen đậm)
Border: #e0e0e0 (xám)

/* Bàn trống */
Border: #007bff (xanh dương)
Background: #fff (trắng)

/* Bàn đã đặt */
Border: #dc3545 (đỏ)
Background: #f8f9fa (xám rất nhạt)

/* Bàn đã chọn */
Border: #28a745 (xanh lá)
Background: #f8f9fa (xám rất nhạt)
```

### 🚀 **Kết quả:**

✅ **Giao diện đơn giản, dễ sử dụng**
✅ **Màu sắc nhất quán, chuyên nghiệp**
✅ **Thông tin rõ ràng, không rối mắt**
✅ **Tải nhanh, mượt mà**
✅ **Phù hợp với mọi lứa tuổi**

**Giao diện chọn bàn mới đã sẵn sàng sử dụng!** 🎉
