const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testEmployeeLogin() {
  console.log('=== TEST ĐĂNG NHẬP NHÂN VIÊN ===\n');

  try {
    // Test đăng nhập với thông tin hy123/123123
    console.log('1. Đăng nhập nhân viên...');
    console.log('   - Username: hy123');
    console.log('   - Password: 123123');
    
    const response = await axios.post(`${API_URL}/api/employees/login`, {
      username: 'hy123',
      password: '123123'
    });

    console.log('✅ Đăng nhập thành công!');
    console.log('   - Token:', response.data.token.substring(0, 20) + '...');
    console.log('   - Nhân viên:', response.data.employee.fullName);
    console.log('   - Vai trò:', response.data.employee.role);
    console.log('   - Email:', response.data.employee.email);
    console.log('   - Phone:', response.data.employee.phone);

    // Test truy cập API với token
    console.log('\n2. Test truy cập API với token...');
    const headers = { Authorization: `Bearer ${response.data.token}` };
    
    // Test lấy danh sách bàn
    const tablesResponse = await axios.get(`${API_URL}/api/tables`, { headers });
    console.log(`✅ Lấy danh sách bàn: ${tablesResponse.data.length} bàn`);

    // Test lấy danh sách booking
    const bookingsResponse = await axios.get(`${API_URL}/api/bookings`, { headers });
    console.log(`✅ Lấy danh sách booking: ${bookingsResponse.data.bookings.length} booking`);

    // Test lấy danh sách menu
    const menuResponse = await axios.get(`${API_URL}/api/menu`, { headers });
    console.log(`✅ Lấy danh sách menu: ${menuResponse.data.length} món`);

    console.log('\n=== KẾT QUẢ ===');
    console.log('✅ Đăng nhập nhân viên thành công');
    console.log('✅ Token hoạt động bình thường');
    console.log('✅ Có thể truy cập tất cả API');
    console.log('✅ Sẵn sàng sử dụng web admin và mobile app');

  } catch (error) {
    console.error('❌ Lỗi:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Chi tiết lỗi:', error.response.data);
    }
  }
}

testEmployeeLogin();
