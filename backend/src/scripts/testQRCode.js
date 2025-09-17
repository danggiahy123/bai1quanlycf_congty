const mongoose = require('mongoose');

// Kết nối database
mongoose.connect('mongodb://localhost:27017/restaurant_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testQRCode() {
  try {
    console.log('🧪 TEST QR CODE GENERATION...\n');

    // Test QR code generation API
    const testData = {
      accountNumber: '2246811357',
      accountName: 'DANG GIA HY',
      bankCode: '970407',
      amount: 100000,
      description: 'Test Coc ban 001'
    };

    console.log('📋 Test data:', testData);

    // Tạo QR code URL (giống như trong API)
    const qrCodeUrl = `https://img.vietqr.io/image/${testData.bankCode}-${testData.accountNumber}-compact2.png?amount=${testData.amount}&addInfo=${encodeURIComponent(testData.description)}`;
    
    console.log('\n🔗 QR Code URL:');
    console.log(qrCodeUrl);
    
    console.log('\n📱 Cách test QR code:');
    console.log('1. Mở mobile app');
    console.log('2. Đăng nhập với tài khoản khách hàng');
    console.log('3. Đặt bàn với cọc 100,000đ');
    console.log('4. QR code sẽ hiển thị tự động trong màn hình deposit-payment');
    console.log('5. Quét QR code bằng app ngân hàng để thanh toán');
    
    console.log('\n✅ QR Code test completed!');

  } catch (error) {
    console.error('❌ Lỗi test QR code:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Đã đóng kết nối database');
  }
}

// Chạy test
testQRCode();
