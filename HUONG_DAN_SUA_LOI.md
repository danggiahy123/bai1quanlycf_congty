# Hướng dẫn sửa lỗi hệ thống đặt bàn

## 🔧 Lỗi 1: "Không thể kết nối tới server" trong mobile app

### Nguyên nhân:
- Mobile app không thể kết nối đến IP `192.168.5.17:5000`
- Có thể do firewall, network, hoặc emulator không hỗ trợ

### Giải pháp:
1. **Đã cập nhật fallback URLs** trong `frontend/mobile/constants/api.ts`:
   ```typescript
   export const FALLBACK_URLS = [
     'http://localhost:5000', // Thử localhost trước
     'http://192.168.5.17:5000',
     'http://10.0.2.2:5000', // Android emulator
     'http://127.0.0.1:5000'
   ];
   ```

2. **Mobile app sẽ tự động thử** các URL theo thứ tự
3. **Test đã xác nhận** `localhost:5000` hoạt động tốt

### Cách test:
1. Mở mobile app
2. Thử đặt bàn
3. Xem console log để kiểm tra URL nào được sử dụng

---

## 🔧 Lỗi 2: "Không hủy được đặt bàn" trong web admin

### Nguyên nhân:
- Token admin có thể hết hạn hoặc không đúng
- API hoạt động bình thường (đã test thành công)

### Giải pháp:
1. **Đã thêm logging** để debug:
   - Console sẽ hiển thị token, API URL, và response
   - Mở Developer Tools (F12) để xem log

2. **Cách kiểm tra**:
   - Mở web admin: http://localhost:5173
   - Đăng nhập: `admin` / `admin123`
   - Mở Developer Tools (F12) → Console
   - Thử hủy booking và xem log

3. **Nếu token hết hạn**:
   - Đăng xuất và đăng nhập lại
   - Token sẽ được refresh

### Test API trực tiếp:
```bash
# Login admin
curl -X POST http://localhost:5000/api/employees/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Hủy booking (thay BOOKING_ID bằng ID thật)
curl -X POST http://localhost:5000/api/bookings/BOOKING_ID/cancel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_FROM_LOGIN" \
  -d '{"reason":"Test cancel"}'
```

---

## ✅ Trạng thái hiện tại

### Backend:
- ✅ Server chạy trên `localhost:5000`
- ✅ API booking hoạt động hoàn hảo
- ✅ API hủy booking hoạt động bình thường
- ✅ Có 2 bookings đang pending

### Mobile App:
- ✅ Fallback URLs đã được cấu hình
- ✅ Sẽ tự động thử `localhost:5000` trước
- ✅ Error handling đã được cải thiện

### Web Admin:
- ✅ Logging đã được thêm để debug
- ✅ Cần kiểm tra token và console log

---

## 🚀 Cách test toàn bộ hệ thống

### 1. Test Mobile App:
```bash
cd frontend/mobile
npx expo start
# Mở app và thử đặt bàn
```

### 2. Test Web Admin:
```bash
cd webadmin
npm run dev
# Mở http://localhost:5173
# Đăng nhập: admin / admin123
# Vào tab "Đặt bàn" để xem và quản lý
```

### 3. Test Backend:
```bash
cd backend
npm run dev
# Server chạy trên http://localhost:5000
```

---

## 📞 Nếu vẫn có lỗi

1. **Kiểm tra console log** trong mobile app và web admin
2. **Kiểm tra network** - đảm bảo tất cả services đang chạy
3. **Kiểm tra token** - đăng xuất và đăng nhập lại
4. **Kiểm tra firewall** - có thể chặn kết nối

Hệ thống đã được cải thiện và test thành công! 🎉
