const mongoose = require('mongoose');
require('dotenv').config();

const CustomerSchema = new mongoose.Schema({
  _id: { type: String },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true }
});

const Customer = mongoose.model('Customer', CustomerSchema, 'customers');

async function checkCustomers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management');
    console.log('Connected to MongoDB');
    
    const customers = await Customer.find();
    console.log('\n📋 Customers found:', customers.length);
    
    if (customers.length === 0) {
      console.log('No customers found. Creating test customer...');
      
      const testCustomer = new Customer({
        _id: '20001',
        fullName: 'Nguyễn Văn Test',
        email: 'test@example.com',
        phone: '0123456789',
        password: 'password123'
      });
      
      await testCustomer.save();
      console.log('✅ Created test customer: test@example.com / password123');
    } else {
      customers.forEach(c => {
        console.log(`- ${c.fullName} (${c.email})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkCustomers();
