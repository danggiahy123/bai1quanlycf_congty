const mongoose = require('mongoose');
const Employee = require('./backend/src/models/Employee');

mongoose.connect('mongodb://localhost:27017/cafe_management');

async function createTestEmployee() {
  try {
    console.log('🔍 Creating test employee...\n');

    // Kiểm tra xem đã có nhân viên test chưa
    const existingEmployee = await Employee.findOne({ username: 'staff1' });
    if (existingEmployee) {
      console.log('✅ Test employee already exists:', existingEmployee.fullName);
      console.log('   Username:', existingEmployee.username);
      console.log('   Role:', existingEmployee.role);
      return;
    }

    // Tạo nhân viên test mới
    const employee = new Employee({
      fullName: 'Nhân viên Test',
      username: 'staff1',
      email: 'staff1@cafe.com',
      phone: '0987654321',
      password: '123456', // Mật khẩu mặc định
      role: 'staff',
      isActive: true
    });

    await employee.save();
    console.log('✅ Test employee created successfully!');
    console.log('   ID:', employee._id);
    console.log('   Name:', employee.fullName);
    console.log('   Username:', employee.username);
    console.log('   Password:', employee.password);
    console.log('   Role:', employee.role);

  } catch (error) {
    console.error('❌ Error creating test employee:', error);
    console.error('Error details:', error.message);
  } finally {
    process.exit(0);
  }
}

createTestEmployee();
