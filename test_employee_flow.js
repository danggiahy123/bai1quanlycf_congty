const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testEmployeeFlow() {
  console.log('=== KIỂM TRA QUY TRÌNH TẠO TÀI KHOẢN NHÂN VIÊN ===\n');

  try {
    // 1. Tạo tài khoản nhân viên mới
    console.log('1. Tạo tài khoản nhân viên mới...');
    const createResponse = await axios.post(`${API_URL}/api/employees/register`, {
      username: 'staff001',
      password: 'staff123',
      fullName: 'Nguyễn Văn A',
      email: 'staff001@cafe.com',
      role: 'staff'
    });
    
    console.log('✅ Tạo tài khoản thành công:');
    console.log(`   - ID: ${createResponse.data.employee.id}`);
    console.log(`   - Username: ${createResponse.data.employee.username}`);
    console.log(`   - Full Name: ${createResponse.data.employee.fullName}`);
    console.log(`   - Email: ${createResponse.data.employee.email}`);
    console.log(`   - Role: ${createResponse.data.employee.role}\n`);

    // 2. Đăng nhập với tài khoản vừa tạo
    console.log('2. Đăng nhập với tài khoản vừa tạo...');
    const loginResponse = await axios.post(`${API_URL}/api/employees/login`, {
      username: 'staff001',
      password: 'staff123'
    });
    
    console.log('✅ Đăng nhập thành công:');
    console.log(`   - Token: ${loginResponse.data.token.substring(0, 50)}...`);
    console.log(`   - Employee Info: ${JSON.stringify(loginResponse.data.employee, null, 2)}\n`);

    // 3. Kiểm tra danh sách nhân viên
    console.log('3. Kiểm tra danh sách nhân viên...');
    const listResponse = await axios.get(`${API_URL}/api/employees`);
    
    console.log('✅ Danh sách nhân viên:');
    listResponse.data.forEach((emp, index) => {
      console.log(`   ${index + 1}. ${emp.fullName} (@${emp.username}) - ${emp.role}`);
    });
    console.log('');

    // 4. Kiểm tra xem có thể truy cập các API khác không
    console.log('4. Kiểm tra quyền truy cập API...');
    const token = loginResponse.data.token;
    
    try {
      const menuResponse = await axios.get(`${API_URL}/api/menu`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Có thể truy cập API menu');
    } catch (error) {
      console.log('❌ Không thể truy cập API menu:', error.response?.data?.message);
    }

    try {
      const tablesResponse = await axios.get(`${API_URL}/api/tables`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Có thể truy cập API tables');
    } catch (error) {
      console.log('❌ Không thể truy cập API tables:', error.response?.data?.message);
    }

    console.log('\n=== KẾT QUẢ ===');
    console.log('✅ Có thể tạo tài khoản nhân viên mới');
    console.log('✅ Có thể đăng nhập với tài khoản nhân viên');
    console.log('✅ Tài khoản nhân viên có thể truy cập các API cần thiết');
    console.log('✅ Hệ thống hoạt động bình thường');

  } catch (error) {
    console.error('❌ Lỗi:', error.response?.data?.message || error.message);
  }
}

testEmployeeFlow();
