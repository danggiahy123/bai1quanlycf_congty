const mongoose = require('mongoose');
const Employee = require('./src/models/Employee');

mongoose.connect('mongodb://localhost:27017/cafe_management');

async function createAdmin() {
  try {
    console.log('🔍 Creating admin user...\n');

    // Kiểm tra xem đã có admin chưa
    const existingAdmin = await Employee.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin already exists:', existingAdmin.fullName);
      return;
    }

    // Tạo admin mới
    const admin = new Employee({
      fullName: 'Admin User',
      username: 'admin',
      email: 'admin@cafe.com',
      phone: '0123456789',
      password: 'admin123', // Mật khẩu mặc định
      role: 'admin',
      isActive: true
    });

    await admin.save();
    console.log('✅ Admin created successfully!');
    console.log('   ID:', admin._id);
    console.log('   Name:', admin.fullName);
    console.log('   Username:', admin.username);
    console.log('   Role:', admin.role);

  } catch (error) {
    console.error('❌ Error creating admin:', error);
    console.error('Error details:', error.message);
  } finally {
    process.exit(0);
  }
}

createAdmin();
