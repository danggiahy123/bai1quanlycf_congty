const mongoose = require('mongoose');
require('dotenv').config();

const BookingSchema = new mongoose.Schema({
  customerInfo: {
    fullName: String,
    email: String,
    phone: String
  },
  table: {
    _id: String,
    name: String
  },
  numberOfGuests: Number,
  bookingDate: String,
  bookingTime: String,
  menuItems: [{
    item: {
      _id: String,
      name: String,
      price: Number
    },
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
  notes: String
}, { timestamps: true });

const Booking = mongoose.model('Booking', BookingSchema);

async function createSimpleBooking() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management');
    console.log('Connected to MongoDB');
    
    // Delete existing bookings
    await Booking.deleteMany({});
    console.log('Cleared existing bookings');
    
    // Create simple booking
    const booking = new Booking({
      customerInfo: {
        fullName: 'Nguyễn Văn Test',
        email: 'test@example.com',
        phone: '0123456789'
      },
      table: {
        _id: '30001',
        name: 'Bàn 1'
      },
      numberOfGuests: 2,
      bookingDate: new Date().toISOString().split('T')[0],
      bookingTime: '19:00',
      menuItems: [
        {
          item: {
            _id: '10001',
            name: 'Trà Sữa Trân Châu Đen',
            price: 35000
          },
          quantity: 2,
          price: 35000
        },
        {
          item: {
            _id: '10002',
            name: 'Cà Phê Sữa Đá',
            price: 25000
          },
          quantity: 1,
          price: 25000
        }
      ],
      totalAmount: 95000,
      status: 'pending',
      notes: 'Test booking - simple format'
    });
    
    await booking.save();
    console.log('✅ Created simple booking successfully!');
    console.log('Booking ID:', booking._id);
    console.log('Status:', booking.status);
    console.log('Customer:', booking.customerInfo.fullName);
    console.log('Table:', booking.table.name);
    console.log('Total:', booking.totalAmount.toLocaleString() + 'đ');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createSimpleBooking();
