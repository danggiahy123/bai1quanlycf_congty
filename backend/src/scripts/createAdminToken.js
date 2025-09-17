const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

async function createAdminToken() {
  try {
    // Tìm admin user
    const admin = await Employee.findOne({ role: 'admin', isActive: true });
    
    if (!admin) {
      console.log('❌ Không tìm thấy admin user');
      return;
    }

    console.log('👤 Admin found:', {
      id: admin._id,
      username: admin.username,
      fullName: admin.fullName,
      role: admin.role
    });

    // Tạo token mới
    const token = jwt.sign(
      { 
        id: admin._id, 
        username: admin.username,
        role: admin.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('🔑 New admin token:');
    console.log(token);
    console.log('\n📋 Copy this token to webadmin localStorage');

    // Test decode
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('\n✅ Token verification successful:');
      console.log('Decoded:', decoded);
    } catch (error) {
      console.error('❌ Token verification failed:', error);
    }

  } catch (error) {
    console.error('❌ Error creating admin token:', error);
  }
}

createAdminToken();
