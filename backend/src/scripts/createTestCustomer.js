const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const customerSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Customer = mongoose.model('Customer', customerSchema);

async function createTestCustomer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management');
    console.log('Connected to MongoDB');
    
    // Delete existing test customer
    await Customer.deleteOne({ email: 'test@example.com' });
    console.log('Cleared existing test customer');
    
    // Create new test customer
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const customer = new Customer({
      username: 'testuser',
      fullName: 'Nguyễn Văn Test',
      email: 'test@example.com',
      phone: '0123456789',
      password: hashedPassword,
      isActive: true
    });
    
    await customer.save();
    console.log('✅ Created test customer successfully!');
    console.log('Username: testuser');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestCustomer();
