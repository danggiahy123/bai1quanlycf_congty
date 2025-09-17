const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/cafe_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createNewToken() {
  try {
    console.log('🔑 Creating new token...');

    // Tìm customer test
    const customer = await Customer.findOne({ email: 'test@example.com' });
    if (!customer) {
      console.log('❌ No test customer found');
      return;
    }

    console.log('👤 Customer:', customer.fullName, customer._id);

    // Tạo token mới
    const token = jwt.sign(
      { 
        id: customer._id.toString(), 
        email: customer.email,
        role: 'customer'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('\n🔑 New Token:');
    console.log(token);
    
    console.log('\n📱 To test in mobile app:');
    console.log('1. Copy the token above');
    console.log('2. In mobile app, go to AsyncStorage and set token');
    console.log('3. Restart the app to load notifications');

    // Test token ngay
    console.log('\n🧪 Testing token...');
    const response = await fetch('http://localhost:5000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Token works! Notifications:', data.notifications.length);
    } else {
      const errorData = await response.json();
      console.log('❌ Token error:', errorData);
    }

  } catch (error) {
    console.error('❌ Error creating token:', error);
  } finally {
    mongoose.connection.close();
  }
}

createNewToken();
