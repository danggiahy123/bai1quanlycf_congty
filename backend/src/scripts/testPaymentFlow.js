const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testPaymentFlow() {
  try {
    console.log('🧪 Bắt đầu test flow thanh toán...\n');

    // 1. Tạo QR code thanh toán
    console.log('1️⃣ Tạo QR code thanh toán...');
    const qrResponse = await axios.post(`${API_URL}/api/payment/generate-qr`, {
      accountNumber: '2246811357',
      accountName: 'DANG GIA HY',
      bankCode: '970407',
      amount: 50000,
      description: 'Test payment flow'
    });

    if (qrResponse.data.success) {
      console.log('✅ QR code tạo thành công');
      console.log('📱 QR Code URL:', qrResponse.data.data.qrCode);
      console.log('💰 Số tiền:', qrResponse.data.data.accountInfo.amount.toLocaleString('vi-VN') + 'đ');
    } else {
      console.log('❌ Lỗi tạo QR code:', qrResponse.data.message);
      return;
    }

    // 2. Kiểm tra bàn có sẵn sàng thanh toán không
    console.log('\n2️⃣ Kiểm tra bàn có sẵn sàng thanh toán...');
    const tablesResponse = await axios.get(`${API_URL}/api/tables`);
    const occupiedTables = tablesResponse.data.filter(table => table.status === 'occupied');
    
    if (occupiedTables.length === 0) {
      console.log('⚠️ Không có bàn nào đang occupied để test thanh toán');
      console.log('💡 Hãy tạo booking trước để test');
      return;
    }

    const testTable = occupiedTables[0];
    console.log(`✅ Tìm thấy bàn ${testTable.name} (ID: ${testTable._id}) đang occupied`);

    // 3. Test API thanh toán
    console.log(`\n3️⃣ Test thanh toán cho bàn ${testTable.name}...`);
    try {
      const paymentResponse = await axios.post(`${API_URL}/api/orders/by-table/${testTable._id}/pay`);
      console.log('✅ Thanh toán thành công!');
      console.log('📊 Dữ liệu trả về:', paymentResponse.data);
    } catch (paymentError) {
      if (paymentError.response?.status === 400) {
        console.log('⚠️ Lỗi thanh toán:', paymentError.response.data.error);
        console.log('💡 Có thể bàn này chưa có order hoặc booking chưa được confirm');
      } else {
        console.log('❌ Lỗi thanh toán:', paymentError.message);
      }
    }

    // 4. Kiểm tra trạng thái bàn sau thanh toán
    console.log('\n4️⃣ Kiểm tra trạng thái bàn sau thanh toán...');
    const updatedTablesResponse = await axios.get(`${API_URL}/api/tables`);
    const updatedTable = updatedTablesResponse.data.find(table => table._id === testTable._id);
    console.log(`📋 Trạng thái bàn ${updatedTable.name}: ${updatedTable.status}`);

    console.log('\n🎉 Test hoàn thành!');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error.message);
  }
}

// Chạy test
testPaymentFlow();
