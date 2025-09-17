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

async function checkCustomer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management');
    console.log('Connected to MongoDB');
    
    const customers = await Customer.find();
    console.log('Customers found:', customers.length);
    
    customers.forEach(customer => {
      console.log('- Username:', customer.username);
      console.log('  Email:', customer.email);
      console.log('  FullName:', customer.fullName);
      console.log('  isActive:', customer.isActive);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkCustomer();
