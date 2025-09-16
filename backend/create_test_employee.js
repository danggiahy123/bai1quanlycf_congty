const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('./src/models/Employee');

async function createTestEmployee() {
  try {
    // Kết nối MongoDB
    await mongoose.connect('mongodb://localhost:27017/restaurant_management');
    console.log('✅ Kết nối MongoDB thành công');

    // Kiểm tra xem nhân viên đã tồn tại chưa
    const existingEmployee = await Employee.findOne({ username: 'hy123' });
    if (existingEmployee) {
      console.log('⚠️  Nhân viên hy123 đã tồn tại');
      console.log('   - ID:', existingEmployee._id);
      console.log('   - Tên:', existingEmployee.fullName);
      console.log('   - Vai trò:', existingEmployee.role);
      return;
    }

    // Mã hóa mật khẩu
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('123123', saltRounds);

    // Tạo nhân viên mới
    const employee = new Employee({
      username: 'hy123',
      password: hashedPassword,
      fullName: 'Nguyễn Văn Huy',
      email: 'hy123@example.com',
      phone: '0123456789',
      role: 'staff',
      isActive: true
    });

    await employee.save();
    console.log('✅ Tạo nhân viên test thành công:');
    console.log('   - Username: hy123');
    console.log('   - Password: 123123');
    console.log('   - Tên:', employee.fullName);
    console.log('   - Vai trò:', employee.role);
    console.log('   - ID:', employee._id);

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Đã ngắt kết nối MongoDB');
  }
}

createTestEmployee();
