# Cập nhật giao diện QR Code thanh toán cọc - App Nhân viên

## Tổng quan
Đã cải thiện giao diện trang QR CODE THANH TOÁN CỌC trong app nhân viên với thiết kế đẹp hơn, gọn hơn và thêm các tính năng mới.

## Các cải tiến chính

### 1. Giao diện đẹp hơn và gọn hơn
- **Header cải tiến**: Hiển thị tiêu đề và số tiền cọc rõ ràng
- **Layout tối ưu**: Sử dụng ScrollView để tránh tràn màn hình
- **Thiết kế hiện đại**: Bo góc, shadow, màu sắc hài hòa
- **QR Code container**: Có background và border đẹp mắt

### 2. Trạng thái thanh toán trực quan
- **Status indicator**: Hiển thị trạng thái thanh toán với màu sắc và icon
- **Các trạng thái**:
  - 🟡 Chờ thanh toán (mặc định)
  - 🔵 Đang kiểm tra...
  - 🟢 Đã thanh toán
  - 🔴 Chưa thanh toán

### 3. Nút KIỂM TRA
- **Chức năng**: Kiểm tra trạng thái thanh toán từ server
- **UI**: Nút xanh dương với icon refresh
- **Trạng thái**: Disable khi đang kiểm tra hoặc đã thanh toán
- **Loading**: Hiển thị "Đang kiểm tra..." khi đang xử lý

### 4. Nút XÁC NHẬN THỦ CÔNG
- **Chức năng**: Xác nhận thanh toán thủ công khi khách hàng đã chuyển khoản
- **UI**: Nút xanh lá với icon checkmark
- **Xác nhận**: Có dialog xác nhận trước khi thực hiện
- **Trạng thái**: Disable khi đang xử lý hoặc đã thanh toán

### 5. Thông tin ngân hàng compact
- **Layout mới**: Hiển thị thông tin ngân hàng dạng danh sách với icon
- **Thông tin**:
  - 🏢 Ngân hàng: Techcombank
  - 💳 Số tài khoản: 2246811357
  - 👤 Chủ tài khoản: DANG GIA HY
  - 📄 Nội dung: Coc ban [Tên bàn]

### 6. Cải tiến UX
- **Nút đóng**: Chỉ hiển thị nút "Hoàn thành" khi đã thanh toán
- **Loading states**: Sử dụng ActivityIndicator thay vì custom spinner
- **Error handling**: Hiển thị lỗi với icon và message rõ ràng
- **Responsive**: Tự động điều chỉnh kích thước theo màn hình

## Cấu trúc code

### State mới
```typescript
const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'paid' | 'failed'>('pending');
const [checkingPayment, setCheckingPayment] = useState(false);
```

### Functions mới
- `checkPaymentStatus()`: Kiểm tra trạng thái thanh toán
- `confirmPaymentManually()`: Xác nhận thanh toán thủ công

### API endpoints cần thiết
- `GET /api/payment/check-status/:bookingId`: Kiểm tra trạng thái thanh toán
- `POST /api/payment/confirm-manual/:bookingId`: Xác nhận thanh toán thủ công

## Cách sử dụng

1. **Tạo đặt bàn**: Nhân viên tạo đặt bàn như bình thường
2. **Hiển thị QR**: Modal QR code tự động hiển thị sau khi tạo đặt bàn
3. **Kiểm tra thanh toán**: Nhấn nút "KIỂM TRA" để kiểm tra trạng thái
4. **Xác nhận thủ công**: Nếu khách đã chuyển khoản, nhấn "XÁC NHẬN THỦ CÔNG"
5. **Hoàn thành**: Sau khi thanh toán, nhấn "Hoàn thành" để đóng modal

## Màu sắc và styling

### Màu chính
- Primary: `#007AFF` (màu xanh dương chính)
- Success: `#27ae60` (xanh lá cho thành công)
- Warning: `#f39c12` (vàng cho đang xử lý)
- Danger: `#e74c3c` (đỏ cho lỗi)
- Info: `#3498db` (xanh dương cho thông tin)

### Border radius
- Modal: `24px`
- Cards: `12px-16px`
- Buttons: `12px`
- Status indicator: `20px`

## Responsive design
- Modal width: `92%` của màn hình
- QR Code size: `200x200px`
- Buttons: Flex layout với gap `12px`
- Padding: `16px-20px` tùy theo section

## Lưu ý kỹ thuật

1. **API Integration**: Cần implement các API endpoints cho kiểm tra và xác nhận thanh toán
2. **Error Handling**: Có xử lý lỗi cho tất cả các API calls
3. **Loading States**: Disable buttons khi đang xử lý để tránh spam
4. **Memory Management**: Cleanup states khi đóng modal
5. **Accessibility**: Sử dụng proper touch targets và contrast ratios

## Kết luận

Giao diện QR Code thanh toán cọc đã được cải thiện đáng kể với:
- ✅ Thiết kế đẹp hơn, hiện đại hơn
- ✅ Layout gọn gàng, dễ sử dụng
- ✅ Thêm nút KIỂM TRA và XÁC NHẬN THỦ CÔNG
- ✅ Trạng thái thanh toán trực quan
- ✅ UX/UI được tối ưu hóa
- ✅ Code structure rõ ràng, dễ maintain
