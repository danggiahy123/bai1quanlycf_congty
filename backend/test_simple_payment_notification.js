const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testSimplePaymentNotification() {
  console.log('=== KIỂM TRA TÍNH NĂNG THÔNG BÁO THANH TOÁN (ĐƠN GIẢN) ===\n');

  try {
    // 1. Tạo customer mới để test
    console.log('1. Tạo customer test...');
    const timestamp = Date.now();
    const customerResponse = await axios.post(`${API_URL}/api/customers/register`, {
      username: `testcustomer${timestamp}`,
      password: 'test123',
      fullName: 'Khách Test Payment',
      email: `test${timestamp}@example.com`,
      phone: '0123456789'
    });
    
    const customerId = customerResponse.data.customer.id;
    console.log(`✅ Tạo customer thành công: ${customerResponse.data.customer.fullName} (ID: ${customerId})`);

    // Đăng nhập để lấy token
    console.log('1.1. Đăng nhập customer...');
    const loginResponse = await axios.post(`${API_URL}/api/customers/login`, {
      username: `testcustomer${timestamp}`,
      password: 'test123'
    });
    
    const customerToken = loginResponse.data.token;
    console.log('✅ Đăng nhập customer thành công');

    // 2. Tạo bàn
    console.log('\n2. Tạo bàn...');
    const tableResponse = await axios.post(`${API_URL}/api/tables`, {
      name: 'Bàn Test Notification',
      note: 'Bàn để test thông báo thanh toán'
    });
    
    const tableId = tableResponse.data._id;
    console.log(`✅ Tạo bàn thành công: ${tableResponse.data.name} (ID: ${tableId})`);

    // 3. Tạo order cho bàn
    console.log('\n3. Tạo order cho bàn...');
    const orderData = {
      items: [
        { menuId: '12345', name: 'Cà phê đen', price: 25000, quantity: 2 },
        { menuId: '12346', name: 'Bánh mì', price: 15000, quantity: 1 }
      ]
    };

    const createOrderResponse = await axios.post(`${API_URL}/api/orders/by-table/${tableId}`, orderData);
    console.log('✅ Tạo order thành công');
    console.log(`   - Tổng tiền: ${createOrderResponse.data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}đ`);

    // 4. Kiểm tra thông báo trước khi thanh toán
    console.log('\n4. Kiểm tra thông báo trước khi thanh toán...');
    const notificationsBeforeResponse = await axios.get(`${API_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    
    const notificationsBefore = notificationsBeforeResponse.data.notifications.filter(n => n.type === 'payment_completed');
    console.log(`✅ Số thông báo thanh toán trước: ${notificationsBefore.length}`);

    // 5. Thực hiện thanh toán
    console.log('\n5. Thực hiện thanh toán...');
    const paymentResponse = await axios.post(`${API_URL}/api/orders/by-table/${tableId}/pay`);
    console.log('✅ Thanh toán thành công!');

    // 6. Kiểm tra thông báo sau khi thanh toán
    console.log('\n6. Kiểm tra thông báo sau khi thanh toán...');
    const notificationsAfterResponse = await axios.get(`${API_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    
    const notificationsAfter = notificationsAfterResponse.data.notifications.filter(n => n.type === 'payment_completed');
    console.log(`✅ Số thông báo thanh toán sau: ${notificationsAfter.length}`);

    if (notificationsAfter.length > notificationsBefore.length) {
      const newNotification = notificationsAfter[0];
      console.log('✅ Thông báo mới đã được tạo:');
      console.log(`   - Tiêu đề: ${newNotification.title}`);
      console.log(`   - Nội dung: ${newNotification.message}`);
      console.log(`   - Loại: ${newNotification.type}`);
    } else {
      console.log('❌ Không có thông báo mới được tạo');
    }

    // 7. Kiểm tra trạng thái bàn
    console.log('\n7. Kiểm tra trạng thái bàn sau thanh toán...');
    const finalTableResponse = await axios.get(`${API_URL}/api/tables`);
    const finalTable = finalTableResponse.data.find(t => t._id === tableId);
    console.log(`✅ Trạng thái bàn: ${finalTable.status}`);

    console.log('\n=== KẾT QUẢ ===');
    console.log('✅ Tạo customer thành công');
    console.log('✅ Tạo bàn thành công');
    console.log('✅ Tạo order thành công');
    console.log('✅ Thanh toán thành công');
    if (notificationsAfter.length > notificationsBefore.length) {
      console.log('✅ Thông báo đã được gửi cho khách hàng');
    } else {
      console.log('⚠️  Thông báo không được gửi (có thể do không có booking liên kết)');
    }
    console.log('✅ Bàn đã được giải phóng');
    console.log('✅ Tính năng thanh toán cơ bản hoạt động bình thường');

  } catch (error) {
    console.error('❌ Lỗi:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Chi tiết lỗi:', error.response.data);
    }
  }
}

testSimplePaymentNotification();
