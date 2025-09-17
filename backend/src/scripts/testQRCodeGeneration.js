const mongoose = require('mongoose');

// Kết nối database
mongoose.connect('mongodb://localhost:27017/restaurant_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testQRCodeGeneration() {
  try {
    console.log('🧪 TEST QR CODE GENERATION...\n');

    // Test data
    const testData = {
      accountNumber: '2246811357',
      accountName: 'DANG GIA HY',
      bankCode: '970407',
      amount: 50000,
      description: 'Test Coc ban Bàn 1'
    };

    console.log('📋 Test data:', testData);

    // Tạo QR code URL trực tiếp
    const qrCodeUrl = `https://img.vietqr.io/image/${testData.bankCode}-${testData.accountNumber}-compact2.png?amount=${testData.amount}&addInfo=${encodeURIComponent(testData.description)}`;
    
    console.log('\n🔗 QR Code URL:');
    console.log(qrCodeUrl);
    
    // Test API endpoint
    console.log('\n🔧 Test API endpoint:');
    console.log('POST /api/payment/generate-qr');
    console.log('Body:', JSON.stringify(testData, null, 2));
    
    // Test với fetch
    try {
      const response = await fetch('http://localhost:5000/api/payment/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('\n✅ API Response:', result);
        
        if (result.success) {
          console.log('✅ QR Code từ API:', result.data.qrCode);
        } else {
          console.log('❌ API Error:', result.message);
        }
      } else {
        console.log('❌ HTTP Error:', response.status, response.statusText);
      }
    } catch (fetchError) {
      console.log('❌ Fetch Error:', fetchError.message);
    }
    
    console.log('\n📱 CÁCH SỬA LỖI QR CODE:');
    console.log('1. Kiểm tra kết nối internet');
    console.log('2. Kiểm tra API server có chạy không');
    console.log('3. Sử dụng fallback URL trực tiếp');
    console.log('4. Kiểm tra console log để debug');
    
    console.log('\n🔧 DEBUG STEPS:');
    console.log('1. Mở Developer Tools');
    console.log('2. Xem Console tab');
    console.log('3. Tìm log "🔄 Đang tạo QR code"');
    console.log('4. Kiểm tra "🔗 QR Code URL"');
    console.log('5. Xem có lỗi API không');
    
    console.log('\n✅ QR CODE FALLBACK ĐÃ ĐƯỢC THÊM!');

  } catch (error) {
    console.error('❌ Lỗi test QR code generation:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Đã đóng kết nối database');
  }
}

// Chạy test
testQRCodeGeneration();
