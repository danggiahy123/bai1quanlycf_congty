require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_management';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function createAdminToken() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Tìm admin user
    const admin = await Employee.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ No admin user found. Please create admin first.');
      return;
    }

    // Tạo token cho admin
    const token = jwt.sign(
      {
        id: admin._id,
        username: admin.username,
        role: admin.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('🔑 Admin Token:');
    console.log(token);
    console.log('\n📱 To test in webadmin:');
    console.log('1. Open browser console');
    console.log('2. Run: localStorage.setItem("token", "' + token + '")');
    console.log('3. Run: localStorage.setItem("user", \'{"id":"' + admin._id + '","username":"' + admin.username + '","role":"admin"}\')');
    console.log('4. Refresh the page');

  } catch (error) {
    console.error('Error creating admin token:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createAdminToken();