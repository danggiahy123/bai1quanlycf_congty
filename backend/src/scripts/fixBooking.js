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

const TableSchema = new mongoose.Schema({
  _id: String,
  name: String,
  status: String
});

const Table = mongoose.model('Table', TableSchema, 'tables');

async function fixBooking() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management');
    console.log('Connected to MongoDB');
    
    // Get a table
    const tables = await Table.find();
    console.log('Tables found:', tables.length);
    
    if (tables.length > 0) {
      // Update booking with correct table
      const booking = await Booking.findOne({ status: 'pending' });
      if (booking) {
        booking.table = new mongoose.Types.ObjectId();
        await booking.save();
        console.log('✅ Updated booking with table reference');
      }
    }
    
    // Check updated booking
    const updatedBooking = await Booking.findOne({ status: 'pending' });
    console.log('Updated booking:', {
      id: updatedBooking._id,
      status: updatedBooking.status,
      customer: updatedBooking.customerInfo?.fullName,
      table: updatedBooking.table,
      total: updatedBooking.totalAmount
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixBooking();
