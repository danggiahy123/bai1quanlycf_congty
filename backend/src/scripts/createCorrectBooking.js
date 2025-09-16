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

async function createCorrectBooking() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management');
    console.log('Connected to MongoDB');
    
    // Delete existing bookings
    await Booking.deleteMany({});
    console.log('Cleared existing bookings');
    
    // Get or create customer
    let customer = await Customer.findOne({ email: 'test@example.com' });
    if (!customer) {
      customer = new Customer({
        username: 'testuser',
        fullName: 'Nguyễn Văn Test',
        email: 'test@example.com',
        phone: '0123456789'
      });
      await customer.save();
      console.log('Created customer:', customer._id);
    }
    
    // Create correct booking
    const booking = new Booking({
      customer: customer._id,
      table: '30001',
      numberOfGuests: 2,
      bookingDate: new Date(),
      bookingTime: '19:00',
      menuItems: [
        {
          item: '10001',
          quantity: 2,
          price: 35000
        },
        {
          item: '10002',
          quantity: 1,
          price: 25000
        }
      ],
      totalAmount: 95000,
      status: 'pending',
      notes: 'Test booking - correct format',
      customerInfo: {
        fullName: 'Nguyễn Văn Test',
        email: 'test@example.com',
        phone: '0123456789'
      }
    });
    
    await booking.save();
    console.log('✅ Created correct booking successfully!');
    console.log('Booking ID:', booking._id);
    console.log('Status:', booking.status);
    console.log('Customer ID:', booking.customer);
    console.log('Table:', booking.table);
    console.log('Total:', booking.totalAmount.toLocaleString() + 'đ');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createCorrectBooking();
