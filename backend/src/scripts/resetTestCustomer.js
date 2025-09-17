const mongoose = require('mongoose');
require('dotenv').config();

const customerSchema = new mongoose.Schema({
  username: String,
  fullName: String,
  email: String,
  phone: String,
  isActive: Boolean
});

const Customer = mongoose.model('Customer', customerSchema);

async function resetTestCustomer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management');
    console.log('Connected to MongoDB');
    
    // Delete all customers
    await Customer.deleteMany({});
    console.log('Deleted all customers');
    
    // Register new customer through API
    const axios = require('axios');
    
    const response = await axios.post('http://localhost:5000/api/customers/register', {
      username: 'testuser',
      password: 'password123',
      fullName: 'Nguyễn Văn Test',
      email: 'test@example.com',
      phone: '0123456789'
    });
    
    console.log('✅ Registered new customer:', response.data.message);
    
    // Test login
    const loginResponse = await axios.post('http://localhost:5000/api/customers/login', {
      username: 'testuser',
      password: 'password123'
    });
    
    console.log('✅ Login successful!');
    console.log('Token:', loginResponse.data.token.substring(0, 20) + '...');
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

resetTestCustomer();
