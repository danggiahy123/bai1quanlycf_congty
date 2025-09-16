const mongoose = require('mongoose');
require('dotenv').config();

const BookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  table: {
    type: String,
    ref: 'Table',
    required: true
  },
  numberOfGuests: {
    type: Number,
    required: true,
    min: 1
  },
  bookingDate: {
    type: Date,
    required: true
  },
  bookingTime: {
    type: String,
    required: true
  },
  menuItems: [{
    item: {
      type: String,
      ref: 'Menu',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  customerInfo: {
    fullName: String,
    phone: String,
    email: String
  }
}, {
  timestamps: true
});

const Booking = mongoose.model('Booking', BookingSchema);

const CustomerSchema = new mongoose.Schema({
  username: String,
  fullName: String,
  email: String,
  phone: String
});

const Customer = mongoose.model('Customer', CustomerSchema);

const TableSchema = new mongoose.Schema({
  _id: String,
  name: String,
  status: String
});

const Table = mongoose.model('Table', TableSchema, 'tables');

const MenuSchema = new mongoose.Schema({
  _id: String,
  name: String,
  price: Number,
  image: String,
  note: String,
  available: Boolean
});

const Menu = mongoose.model('Menu', MenuSchema, 'menus');

async function testBookingAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management');
    console.log('Connected to MongoDB');
    
    // Test query
    const query = { status: 'pending' };
    console.log('Query:', query);
    
    const bookings = await Booking.find(query)
      .populate('customer', 'fullName email phone')
      .populate('table', 'name')
      .populate('menuItems.item', 'name price')
      .sort({ createdAt: -1 });
    
    console.log('Bookings found:', bookings.length);
    console.log('Bookings:', JSON.stringify(bookings, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testBookingAPI();
