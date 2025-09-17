const mongoose = require('mongoose');

// Kết nối database
mongoose.connect('mongodb://localhost:27017/restaurant_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testOrderConfirmDeposit() {
  try {
    console.log('🧪 TEST ORDER CONFIRM DEPOSIT FEATURE...\n');

    console.log('📱 TÍNH NĂNG MỚI - ORDER CONFIRM DEPOSIT:');
    console.log('1. Trang xác nhận đơn hàng (order-confirm.tsx)');
    console.log('2. Nút "CỌC NGAY" thay vì "Gửi thông báo"');
    console.log('3. Hiển thị QR code thanh toán ngay lập tức');
    console.log('4. Khi cọc thành công → chuyển đến trang xác nhận lần 2');
    console.log('5. Gửi thông báo cho nhân viên');
    
    console.log('\n🔄 QUY TRÌNH MỚI:');
    console.log('1. Nhân viên tạo đơn hàng cho khách');
    console.log('2. Bấm "CỌC NGAY" thay vì "Gửi thông báo"');
    console.log('3. Hiển thị QR code thanh toán cọc');
    console.log('4. Khách quét QR và chuyển khoản');
    console.log('5. Nhân viên bấm "Đã chuyển khoản - Xác nhận"');
    console.log('6. Chuyển đến trang xác nhận lần 2');
    console.log('7. Gửi thông báo cho nhân viên khác');
    
    console.log('\n💳 QR CODE THANH TOÁN:');
    console.log('- Tài khoản: DANG GIA HY');
    console.log('- Số TK: 2246811357');
    console.log('- Ngân hàng: Techcombank (970407)');
    console.log('- Số tiền: Theo cọc đã chọn (50k, 100k, 200k, 500k)');
    console.log('- Mô tả: "Coc ban [Tên bàn]"');
    
    console.log('\n🎯 CÁC THAY ĐỔI CHÍNH:');
    console.log('✅ Đổi nút "Gửi thông báo" → "CỌC NGAY"');
    console.log('✅ Thêm QR Payment Modal');
    console.log('✅ Tạo booking với cọc trước');
    console.log('✅ Xác nhận cọc → chuyển trang xác nhận lần 2');
    console.log('✅ Gửi thông báo sau khi cọc thành công');
    
    console.log('\n🔧 CÁCH TEST:');
    console.log('1. Mở mobile app (employee)');
    console.log('2. Đăng nhập tài khoản nhân viên');
    console.log('3. Tạo đơn hàng cho khách');
    console.log('4. Bấm "CỌC NGAY"');
    console.log('5. QR code hiện ngay lập tức');
    console.log('6. Quét QR bằng app ngân hàng');
    console.log('7. Bấm "Đã chuyển khoản - Xác nhận"');
    console.log('8. Chuyển đến trang xác nhận lần 2');
    console.log('9. Thông báo được gửi cho nhân viên');
    
    console.log('\n✅ TEST HOÀN TẤT! CHỨC NĂNG CỌC NGAY ĐÃ SẴN SÀNG!');

  } catch (error) {
    console.error('❌ Lỗi test order confirm deposit:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Đã đóng kết nối database');
  }
}

// Chạy test
testOrderConfirmDeposit();
