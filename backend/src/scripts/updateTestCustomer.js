const mongoose = require('mongoose');
require('dotenv').config();

const CustomerSchema = new mongoose.Schema({
  _id: { type: String },
  username: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: true }
});

const Customer = mongoose.model('Customer', CustomerSchema, 'customers');

async function updateTestCustomer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management');
    console.log('Connected to MongoDB');
    
    // Find existing test customer
    let customer = await Customer.findOne({ email: 'test@example.com' });
    
    if (customer) {
      // Update with username
      customer.username = 'testuser';
      customer.isActive = true;
      await customer.save();
      console.log('✅ Updated test customer with username: testuser');
    } else {
      // Create new test customer
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      customer = new Customer({
        _id: '20001',
        username: 'testuser',
        fullName: 'Nguyễn Văn Test',
        email: 'test@example.com',
        phone: '0123456789',
        password: hashedPassword,
        isActive: true
      });
      
      await customer.save();
      console.log('✅ Created test customer with username: testuser');
    }
    
    console.log('Test customer details:');
    console.log('- Username: testuser');
    console.log('- Email: test@example.com');
    console.log('- Password: password123');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateTestCustomer();
