const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function createTestCustomer() {
  console.log('👤 Tạo customer test cho unlimited guests...\n');

  try {
    // Tạo customer mới
    const customerData = {
      username: 'test_customer_unlimited',
      password: '123123',
      fullName: 'Test Customer Unlimited',
      phone: '0123456789',
      email: `test_unlimited_${Date.now()}@example.com`
    };

    console.log('📝 Đang tạo customer...');
    const response = await axios.post(`${API_URL}/api/customers/register`, customerData);
    
    if (response.data.success) {
      console.log('✅ Tạo customer thành công!');
      console.log('📊 Thông tin customer:');
      console.log(`   Username: ${customerData.username}`);
      console.log(`   Password: ${customerData.password}`);
      console.log(`   Email: ${customerData.email}`);
    } else {
      console.log('❌ Tạo customer thất bại:', response.data.message);
    }

  } catch (error) {
    if (error.response?.status === 400 && error.response.data.message.includes('đã tồn tại')) {
      console.log('ℹ️ Customer đã tồn tại, tiếp tục...');
    } else {
      console.error('❌ Lỗi tạo customer:', error.response?.data?.message || error.message);
    }
  }
}

createTestCustomer();
