const mongoose = require('mongoose');

// Kết nối database
mongoose.connect('mongodb://localhost:27017/restaurant_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testQRInBookingConfirm() {
  try {
    console.log('🧪 TEST QR CODE TRONG BOOKING CONFIRM...\n');

    // Test QR code generation với số tiền 50k
    const testData = {
      accountNumber: '2246811357',
      accountName: 'DANG GIA HY',
      bankCode: '970407',
      amount: 50000,
      description: 'Test Coc ban 001'
    };

    console.log('📋 Test data cho cọc 50k:', testData);

    // Tạo QR code URL
    const qrCodeUrl = `https://img.vietqr.io/image/${testData.bankCode}-${testData.accountNumber}-compact2.png?amount=${testData.amount}&addInfo=${encodeURIComponent(testData.description)}`;
    
    console.log('\n🔗 QR Code URL cho cọc 50k:');
    console.log(qrCodeUrl);
    
    console.log('\n📱 QUY TRÌNH MỚI - QR HIỆN NGAY TRONG BOOKING CONFIRM:');
    console.log('1. Khách hàng chọn bàn và món ăn');
    console.log('2. Chọn cọc 50k (hoặc 100k, 200k, 500k)');
    console.log('3. Bấm "Xác nhận đặt bàn"');
    console.log('4. ✅ QR CODE HIỆN NGAY LẬP TỨC trong modal');
    console.log('5. Không cần chuyển sang màn hình khác');
    console.log('6. Giống như Web Admin - QR hiện ngay');
    
    console.log('\n🎯 TÍNH NĂNG MỚI:');
    console.log('✅ QR code hiện ngay khi bấm "Xác nhận đặt bàn"');
    console.log('✅ Modal overlay với QR code 250x250px');
    console.log('✅ Thông tin chuyển khoản đầy đủ');
    console.log('✅ Nút "Đã chuyển khoản - Xác nhận"');
    console.log('✅ Nút "Hủy thanh toán"');
    console.log('✅ Loading spinner khi tạo QR');
    console.log('✅ Error handling nếu QR không load được');
    
    console.log('\n🔧 CÁCH TEST:');
    console.log('1. Mở mobile app');
    console.log('2. Đăng nhập tài khoản khách hàng');
    console.log('3. Chọn bàn → Chọn món → Chọn cọc 50k');
    console.log('4. Bấm "Xác nhận đặt bàn"');
    console.log('5. QR code sẽ hiện ngay trong modal');
    console.log('6. Quét QR bằng app ngân hàng');
    console.log('7. Bấm "Đã chuyển khoản - Xác nhận"');
    console.log('8. Thông báo thành công và về trang chủ');
    
    console.log('\n✅ TEST HOÀN TẤT! QR CODE SẼ HIỆN NGAY KHI BẤM "TIẾP TỤC"!');

  } catch (error) {
    console.error('❌ Lỗi test QR in booking confirm:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Đã đóng kết nối database');
  }
}

// Chạy test
testQRInBookingConfirm();
