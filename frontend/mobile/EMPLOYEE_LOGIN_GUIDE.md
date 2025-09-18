# 📱 Mobile App - Hướng dẫn đăng nhập cho nhân viên

## 🎯 **Quy trình sử dụng:**

### **Bước 1: Mở Mobile App**
- Quét QR code hoặc truy cập: `http://192.168.5.162:8081`
- App sẽ hiển thị màn hình chào mừng

### **Bước 2: Đăng nhập**
- Nhấn nút **"Đăng nhập"**
- Chọn **"Đăng nhập nhân viên"** (thay vì đăng nhập khách hàng)
- Nhập tài khoản nhân viên:
  - **Username**: Tên đăng nhập nhân viên
  - **Password**: Mật khẩu nhân viên

### **Bước 3: Sử dụng giao diện nhân viên**
Sau khi đăng nhập thành công, app sẽ tự động chuyển sang giao diện nhân viên với **4 tính năng chính**:

## 🎨 **4 Tính năng chính cho nhân viên:**

### 1. **Đặt bàn cho khách** 🍽️
- **Màu sắc**: Đỏ (#FF6B6B)
- **Icon**: restaurant
- **Chức năng**: Tạo booking trực tiếp cho khách hàng
- **Tính năng**: Tìm kiếm khách, chọn bàn, nhập thông tin, chọn thời gian

### 2. **Duyệt bàn cho khách** ✅
- **Màu sắc**: Xanh lá (#4ECDC4)
- **Icon**: checkmark-circle
- **Chức năng**: Xác nhận và quản lý đặt bàn của khách
- **Tính năng**: Xem danh sách, xác nhận, hủy đặt bàn

### 3. **Thanh toán bàn** 💳
- **Màu sắc**: Xanh dương (#45B7D1)
- **Icon**: card
- **Chức năng**: Xử lý thanh toán cho các bàn
- **Tính năng**: Xem hóa đơn, xử lý thanh toán, in hóa đơn

### 4. **Order thêm món** ➕
- **Màu sắc**: Xanh nhạt (#96CEB4)
- **Icon**: add-circle
- **Chức năng**: Thêm món ăn cho khách hàng
- **Tính năng**: Chọn bàn, chọn món, cập nhật đơn hàng

## 🔄 **Chuyển đổi giữa các role:**

### **Từ nhân viên → Khách hàng:**
1. Nhấn nút **"Đăng xuất"** (icon log-out)
2. Chọn **"Đăng nhập khách hàng"**
3. Nhập tài khoản khách hàng

### **Từ khách hàng → Nhân viên:**
1. Nhấn nút **"Đăng xuất"** (icon log-out)
2. Chọn **"Đăng nhập nhân viên"**
3. Nhập tài khoản nhân viên

## ✨ **Đặc điểm giao diện:**

### **Giao diện nhân viên:**
- **Header**: Hiển thị tên nhân viên + "Nhân viên nhà hàng"
- **Màu sắc**: Đỏ chủ đạo (#dc2626)
- **Layout**: 4 nút tính năng với màu sắc phân biệt
- **Icon**: Mũi tên chỉ hướng cho từng tính năng

### **Giao diện khách hàng:**
- **Header**: Hiển thị tên khách hàng + "Khách hàng VIP"
- **Màu sắc**: Xanh lá chủ đạo (#16a34a)
- **Layout**: Nút "ĐẶT BÀN NGAY" nổi bật
- **Tính năng**: Đặt bàn, xem thông báo, lịch sử

## 🚀 **Trạng thái hệ thống:**

- ✅ **Backend**: http://192.168.5.162:5000
- ✅ **Mobile App**: http://192.168.5.162:8081
- ✅ **Webadmin**: http://192.168.5.162:5173

## 📋 **Test checklist:**

- [ ] Mở app và thấy màn hình chào mừng
- [ ] Đăng nhập với tài khoản nhân viên
- [ ] Kiểm tra giao diện nhân viên với 4 tính năng
- [ ] Test đặt bàn cho khách
- [ ] Test duyệt bàn cho khách
- [ ] Test thanh toán bàn
- [ ] Test order thêm món
- [ ] Đăng xuất và đăng nhập lại với tài khoản khách hàng
- [ ] Kiểm tra giao diện khách hàng

**Bây giờ bạn có thể sử dụng cùng 1 mobile app cho cả khách hàng và nhân viên!** 🎉
