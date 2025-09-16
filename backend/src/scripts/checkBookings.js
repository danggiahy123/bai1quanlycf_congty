const mongoose = require('mongoose');
require('dotenv').config();

const BookingSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerInfo: {
    fullName: String,
    email: String,
    phone: String
  },
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
  numberOfGuests: Number,
  bookingDate: String,
  bookingTime: String,
  menuItems: [{
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu' },
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
  notes: String,
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  confirmedAt: Date
}, { timestamps: true });

const Booking = mongoose.model('Booking', BookingSchema);

async function checkBookings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management');
    console.log('Connected to MongoDB');
    
    const bookings = await Booking.find();
    console.log('Bookings found:', bookings.length);
    
    bookings.forEach(booking => {
      console.log('- ID:', booking._id);
      console.log('  Status:', booking.status);
      console.log('  Customer:', booking.customerInfo?.fullName);
      console.log('  Table:', booking.table);
      console.log('  Total:', booking.totalAmount);
      console.log('  Created:', booking.createdAt);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkBookings();
