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

async function createTestBooking() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management');
    console.log('Connected to MongoDB');
    
    // Get a table
    const Table = mongoose.model('Table', new mongoose.Schema({}), 'tables');
    const tables = await Table.find();
    if (tables.length === 0) {
      console.log('No tables found');
      return;
    }
    
    // Get menu items
    const MenuSchema = new mongoose.Schema({
      _id: String,
      name: String,
      price: Number,
      image: String,
      note: String,
      available: Boolean
    });
    const Menu = mongoose.model('Menu', MenuSchema, 'menus');
    const menuItems = await Menu.find();
    if (menuItems.length === 0) {
      console.log('No menu items found');
      return;
    }
    
    console.log('Menu items:', menuItems.map(m => ({ name: m.name, price: m.price, type: typeof m.price })));
    
    // Create test booking
    const booking = new Booking({
      customerInfo: {
        fullName: 'Nguyễn Văn Test',
        email: 'test@example.com',
        phone: '0123456789'
      },
      table: tables[0]._id,
      numberOfGuests: 2,
      bookingDate: new Date().toISOString().split('T')[0],
      bookingTime: '19:00',
      menuItems: [
        {
          item: new mongoose.Types.ObjectId(),
          quantity: 2,
          price: menuItems[0].price
        },
        {
          item: new mongoose.Types.ObjectId(),
          quantity: 1,
          price: menuItems[1].price
        }
      ],
      totalAmount: (Number(menuItems[0].price) * 2) + Number(menuItems[1].price),
      status: 'pending',
      notes: 'Test booking created by script'
    });
    
    await booking.save();
    console.log('✅ Created test booking successfully!');
    console.log('Booking ID:', booking._id);
    console.log('Status:', booking.status);
    console.log('Total amount:', booking.totalAmount.toLocaleString() + 'đ');
    console.log('Customer:', booking.customerInfo.fullName);
    console.log('Table:', tables[0].name);
    
    console.log('\n🎉 Test booking created! Check webadmin for notification.');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestBooking();
