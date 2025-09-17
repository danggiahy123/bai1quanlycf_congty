const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cafe_app';

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Kiểm tra xem admin đã tồn tại chưa
    const existingAdmin = await Employee.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin account already exists');
      return;
    }

    // Tạo mật khẩu admin
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);

    // Tạo tài khoản admin
    const admin = new Employee({
      username: 'admin',
      password: hashedPassword,
      fullName: 'Quản trị viên',
      email: 'admin@cafe.com',
      role: 'admin',
      isActive: true
    });

    await admin.save();
    console.log('Admin account created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
