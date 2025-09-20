# 📱 QUY TRÌNH SỬ DỤNG APP QUẢN LÝ QUÁN CÀ PHÊ

## 🚀 **BƯỚC 1: KHỞI ĐỘNG HỆ THỐNG**

### **1.1 Cài đặt và khởi động Backend**
```bash
cd backend
npm install
npm start
```
- **URL**: http://192.168.5.162:5000
- **Status**: ✅ Server chạy thành công

### **1.2 Khởi động Mobile App**
```bash
cd frontend/mobile
npm install
npm start
```
- **URL**: http://192.168.5.162:8081
- **QR Code**: Quét để truy cập trên điện thoại

### **1.3 Khởi động Web Admin**
```bash
cd webadmin
npm install
npm run dev
```
- **URL**: http://192.168.5.162:5173
- **Truy cập**: Trên máy tính

---

## 👥 **BƯỚC 2: PHÂN QUYỀN NGƯỜI DÙNG**

### **2.1 Tài khoản Admin (Web)**
- **Truy cập**: http://192.168.5.162:5173
- **Chức năng**: Quản lý toàn bộ hệ thống
- **Tạo tài khoản**: Sử dụng script `createAdmin.js`

### **2.2 Tài khoản Nhân viên (Mobile)**
- **Truy cập**: http://192.168.5.162:8081
- **Chức năng**: Phục vụ khách hàng, quản lý bàn
- **Tạo tài khoản**: Qua Web Admin

### **2.3 Tài khoản Khách hàng (Mobile)**
- **Truy cập**: http://192.168.5.162:8081
- **Chức năng**: Đặt bàn, xem menu, thanh toán
- **Đăng ký**: Tự động khi đặt bàn lần đầu

---

## 🍽️ **BƯỚC 3: QUY TRÌNH CHO KHÁCH HÀNG**

### **3.1 Đăng nhập**
1. Mở mobile app: http://192.168.5.162:8081
2. Chọn **"Đăng nhập khách hàng"**
3. Nhập thông tin hoặc đăng ký mới

### **3.2 Đặt bàn**
1. Nhấn **"ĐẶT BÀN NGAY"** (nút xanh lá nổi bật)
2. Chọn số khách
3. Chọn bàn từ danh sách
4. Chọn ngày và giờ
5. Chọn số tiền cọc (50k, 100k, 200k, 500k)
6. Nhập thông tin liên hệ
7. Xác nhận đặt bàn

### **3.3 Thanh toán cọc**
1. Sau khi đặt bàn thành công → Tự động chuyển đến màn hình thanh toán
2. Quét QR code hoặc chuyển khoản theo thông tin
3. Nhấn **"Kiểm tra thanh toán"** để xác nhận
4. Chờ thông báo xác nhận từ quán

### **3.4 Xem thông báo**
- Thông báo real-time về trạng thái đặt bàn
- Thông báo xác nhận cọc thành công
- Thông báo thay đổi trạng thái bàn

---

## 👨‍💼 **BƯỚC 4: QUY TRÌNH CHO NHÂN VIÊN**

### **4.1 Đăng nhập**
1. Mở mobile app: http://192.168.5.162:8081
2. Chọn **"Đăng nhập nhân viên"**
3. Nhập username/password

### **4.2 4 Tính năng chính**

#### **🍽️ Đặt bàn cho khách**
1. Nhấn nút **"Đặt bàn"** (màu đỏ)
2. Tìm kiếm khách hàng có sẵn hoặc tạo mới
3. Chọn bàn trống
4. Nhập thông tin đặt bàn
5. Xác nhận tạo booking

#### **✅ Duyệt bàn cho khách**
1. Nhấn nút **"Duyệt bàn"** (màu xanh lá)
2. Xem danh sách đặt bàn chờ xác nhận
3. Xem chi tiết thông tin đặt bàn
4. Xác nhận hoặc hủy đặt bàn
5. Thông báo real-time cho khách hàng

#### **💳 Thanh toán bàn**
1. Nhấn nút **"Thanh toán"** (màu xanh dương)
2. Xem danh sách bàn cần thanh toán
3. Xem chi tiết hóa đơn
4. Xử lý thanh toán (tiền mặt/chuyển khoản)
5. Cập nhật trạng thái bàn

#### **➕ Order thêm món**
1. Nhấn nút **"Order"** (màu xanh nhạt)
2. Chọn bàn cần thêm món
3. Xem menu và chọn món ăn
4. Thêm món vào đơn hàng
5. Cập nhật số lượng hoặc xóa món

---

## 🖥️ **BƯỚC 5: QUY TRÌNH CHO ADMIN (WEB)**

### **5.1 Đăng nhập Web Admin**
1. Truy cập: http://192.168.5.162:5173
2. Đăng nhập với tài khoản admin
3. Truy cập dashboard chính

### **5.2 Quản lý Menu**
1. Vào tab **"Menu"**
2. **Thêm món mới**: Nhập tên, giá, hình ảnh, mô tả
3. **Sửa món**: Click vào món cần sửa
4. **Xóa món**: Click nút xóa
5. **Quản lý nguyên liệu**: Thêm nguyên liệu cho từng món

### **5.3 Quản lý Bàn**
1. Vào tab **"Bàn"**
2. **Thêm bàn mới**: Nhập tên, sức chứa, vị trí
3. **Cấu hình bàn**: Thêm tính năng đặc biệt (Wifi, ổ cắm, v.v.)
4. **Quản lý trạng thái**: Bàn trống/đang dùng

### **5.4 Quản lý Đặt bàn**
1. Vào tab **"Đặt bàn"**
2. **Xem tất cả booking**: Theo trạng thái, ngày
3. **Duyệt đặt bàn**: Xác nhận/hủy booking
4. **Thống kê**: Số lượng đặt bàn theo ngày/tuần

### **5.5 Quản lý Thanh toán**
1. Vào tab **"Thanh toán"**
2. **Xem lịch sử giao dịch**: Tất cả giao dịch cọc
3. **Xác nhận thanh toán**: Xác nhận giao dịch thủ công
4. **Thống kê doanh thu**: Theo ngày, tuần, tháng

### **5.6 Quản lý Kho**
1. Vào tab **"Kho"**
2. **Quản lý nguyên liệu**: Thêm/sửa/xóa nguyên liệu
3. **Nhập kho**: Ghi nhận nguyên liệu mới
4. **Xuất kho**: Ghi nhận sử dụng nguyên liệu
5. **Kiểm kê**: Thực hiện kiểm kê định kỳ

### **5.7 Quản lý Nhân viên**
1. Vào tab **"Nhân viên"**
2. **Thêm nhân viên**: Tạo tài khoản mới
3. **Phân quyền**: Cấp quyền truy cập
4. **Quản lý ca làm**: Lịch làm việc

---

## 🔄 **BƯỚC 6: QUY TRÌNH HOẠT ĐỘNG HÀNG NGÀY**

### **6.1 Sáng (8:00-12:00)**
1. **Admin**: Kiểm tra dashboard, xem báo cáo đêm qua
2. **Nhân viên**: Kiểm tra đặt bàn trong ngày
3. **Chuẩn bị**: Kiểm tra menu, nguyên liệu

### **6.2 Trưa (12:00-14:00)**
1. **Khách hàng**: Đặt bàn qua app
2. **Nhân viên**: Duyệt đặt bàn, phục vụ khách
3. **Admin**: Theo dõi hoạt động real-time

### **6.3 Chiều (14:00-18:00)**
1. **Nhân viên**: Order thêm món, thanh toán
2. **Admin**: Quản lý kho, cập nhật menu
3. **Khách hàng**: Thanh toán, rời quán

### **6.4 Tối (18:00-22:00)**
1. **Khách hàng**: Đặt bàn cho ngày mai
2. **Nhân viên**: Dọn dẹp, cập nhật trạng thái bàn
3. **Admin**: Xem báo cáo cuối ngày

---

## 📊 **BƯỚC 7: THEO DÕI VÀ BÁO CÁO**

### **7.1 Dashboard Real-time**
- **Số bàn trống/đang dùng**
- **Đặt bàn chờ xác nhận**
- **Doanh thu trong ngày**
- **Thông báo mới**

### **7.2 Báo cáo hàng ngày**
- **Số lượng đặt bàn**
- **Doanh thu từ cọc**
- **Món ăn bán chạy**
- **Tình trạng kho**

### **7.3 Báo cáo hàng tuần/tháng**
- **Xu hướng đặt bàn**
- **Phân tích khách hàng**
- **Hiệu quả nhân viên**
- **Lợi nhuận chi tiết**

---

## 🚨 **BƯỚC 8: XỬ LÝ SỰ CỐ**

### **8.1 Lỗi thường gặp**
- **App không load**: Kiểm tra kết nối mạng
- **Không nhận thông báo**: Kiểm tra Socket.IO connection
- **Thanh toán không thành công**: Kiểm tra thông tin chuyển khoản

### **8.2 Khôi phục dữ liệu**
- **Backup database**: Hàng ngày
- **Khôi phục từ backup**: Khi cần thiết
- **Kiểm tra logs**: Để tìm nguyên nhân lỗi

---

## ✅ **CHECKLIST KIỂM TRA**

### **Trước khi mở cửa:**
- [ ] Backend server chạy ổn định
- [ ] Mobile app hoạt động bình thường
- [ ] Web admin truy cập được
- [ ] Socket.IO kết nối thành công
- [ ] Database có dữ liệu mẫu

### **Trong giờ hoạt động:**
- [ ] Khách hàng đặt bàn được
- [ ] Nhân viên duyệt bàn được
- [ ] Thanh toán cọc hoạt động
- [ ] Thông báo real-time hoạt động
- [ ] Admin quản lý được

### **Cuối ngày:**
- [ ] Kiểm tra báo cáo doanh thu
- [ ] Cập nhật trạng thái bàn
- [ ] Backup dữ liệu
- [ ] Chuẩn bị cho ngày mai

---

## 🎉 **KẾT LUẬN**

App quản lý quán cà phê đã sẵn sàng sử dụng với đầy đủ tính năng:
- ✅ **Khách hàng**: Đặt bàn, thanh toán, nhận thông báo
- ✅ **Nhân viên**: Phục vụ khách, quản lý bàn, xử lý thanh toán
- ✅ **Admin**: Quản lý toàn bộ hệ thống, báo cáo chi tiết

**Hệ thống hoạt động ổn định và sẵn sàng phục vụ khách hàng!** 🚀
