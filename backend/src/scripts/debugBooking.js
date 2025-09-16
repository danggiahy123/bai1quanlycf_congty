const mongoose = require('mongoose');
require('dotenv').config();

async function debugBooking() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check bookings collection
    const bookingsCollection = db.collection('bookings');
    const bookingsCount = await bookingsCollection.countDocuments();
    console.log('Bookings count:', bookingsCount);
    
    if (bookingsCount > 0) {
      const bookings = await bookingsCollection.find().limit(3).toArray();
      console.log('Sample bookings:', JSON.stringify(bookings, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

debugBooking();
