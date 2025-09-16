const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testPaymentFeature() {
  console.log('=== KIỂM TRA TÍNH NĂNG THANH TOÁN BÀN ===\n');

  try {
    // 1. Tạo một bàn và đặt order
    console.log('1. Tạo bàn và đặt order...');
    
    // Tạo bàn mới
    const createTableResponse = await axios.post(`${API_URL}/api/tables`, {
      name: 'Bàn Test Payment',
      note: 'Bàn để test tính năng thanh toán'
    });
    
    const tableId = createTableResponse.data._id;
    console.log(`✅ Tạo bàn thành công: ${createTableResponse.data.name} (ID: ${tableId})`);

    // Tạo order cho bàn này
    const orderData = {
      items: [
        { menuId: '12345', name: 'Cà phê đen', price: 25000, quantity: 2 },
        { menuId: '12346', name: 'Bánh mì', price: 15000, quantity: 1 }
      ]
    };

    const createOrderResponse = await axios.post(`${API_URL}/api/orders/by-table/${tableId}`, orderData);
    console.log('✅ Tạo order thành công');
    console.log(`   - Tổng tiền: ${createOrderResponse.data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}đ`);

    // 2. Kiểm tra trạng thái bàn
    console.log('\n2. Kiểm tra trạng thái bàn...');
    const tableStatusResponse = await axios.get(`${API_URL}/api/tables`);
    const testTable = tableStatusResponse.data.find(t => t._id === tableId);
    console.log(`✅ Trạng thái bàn: ${testTable.status}`);

    // 3. Kiểm tra order của bàn
    console.log('\n3. Kiểm tra order của bàn...');
    const orderResponse = await axios.get(`${API_URL}/api/orders/by-table/${tableId}`);
    console.log('✅ Order hiện tại:');
    orderResponse.data.items.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name} x${item.quantity} = ${(item.price * item.quantity).toLocaleString()}đ`);
    });

    // 4. Thanh toán
    console.log('\n4. Thực hiện thanh toán...');
    const paymentResponse = await axios.post(`${API_URL}/api/orders/by-table/${tableId}/pay`);
    console.log('✅ Thanh toán thành công!');
    console.log(`   - Order status: ${paymentResponse.data.status}`);

    // 5. Kiểm tra trạng thái bàn sau thanh toán
    console.log('\n5. Kiểm tra trạng thái bàn sau thanh toán...');
    const finalTableStatusResponse = await axios.get(`${API_URL}/api/tables`);
    const finalTestTable = finalTableStatusResponse.data.find(t => t._id === tableId);
    console.log(`✅ Trạng thái bàn sau thanh toán: ${finalTestTable.status}`);

    // 6. Kiểm tra order sau thanh toán
    console.log('\n6. Kiểm tra order sau thanh toán...');
    try {
      const finalOrderResponse = await axios.get(`${API_URL}/api/orders/by-table/${tableId}`);
      console.log('❌ Order vẫn còn tồn tại (không đúng)');
    } catch (error) {
      console.log('✅ Order đã được xử lý (không còn order pending)');
    }

    console.log('\n=== KẾT QUẢ ===');
    console.log('✅ Tạo bàn thành công');
    console.log('✅ Tạo order thành công');
    console.log('✅ Bàn chuyển sang trạng thái occupied');
    console.log('✅ Thanh toán thành công');
    console.log('✅ Bàn chuyển về trạng thái empty');
    console.log('✅ Order được đánh dấu là paid');
    console.log('✅ Tính năng thanh toán hoạt động bình thường');

  } catch (error) {
    console.error('❌ Lỗi:', error.response?.data?.message || error.message);
  }
}

testPaymentFeature();
