const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management');

const Booking = require('./src/models/Booking');
const Table = require('./src/models/Table');

async function testBooking() {
  try {
    console.log('Testing booking confirm...');
    
    const bookingId = '68c8f6eb0554af19a2edc807';
    
    // Test find booking
    console.log('1. Finding booking...');
    const booking = await Booking.findById(bookingId);
    console.log('Booking found:', booking ? 'Yes' : 'No');
    if (booking) {
      console.log('Booking status:', booking.status);
      console.log('Booking table ID:', booking.table);
      console.log('Customer info:', booking.customerInfo);
    }
    
    // Test find table
    console.log('2. Finding table...');
    const table = await Table.findById(booking.table);
    console.log('Table found:', table ? 'Yes' : 'No');
    if (table) {
      console.log('Table name:', table.name);
      console.log('Table status:', table.status);
    }
    
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test error:', error);
    console.error('Error message:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

testBooking();
