const mongoose = require('mongoose');
require('dotenv').config();

const MenuSchema = new mongoose.Schema({
  _id: { type: String },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  note: { type: String },
  available: { type: Boolean, default: true }
});

const Menu = mongoose.model('Menu', MenuSchema, 'menus');

const drinks = [
  {
    _id: '10001',
    name: 'Trà Sữa Trân Châu Đen',
    price: 35000,
    note: 'Trà sữa thơm ngon với trân châu đen dai giòn',
    available: true
  },
  {
    _id: '10002', 
    name: 'Cà Phê Sữa Đá',
    price: 25000,
    note: 'Cà phê đậm đà pha với sữa đặc, thêm đá mát lạnh',
    available: true
  },
  {
    _id: '10003',
    name: 'Sinh Tố Bơ',
    price: 40000,
    note: 'Sinh tố bơ béo ngậy, thơm ngon và bổ dưỡng',
    available: true
  },
  {
    _id: '10004',
    name: 'Nước Cam Tươi',
    price: 30000,
    note: 'Nước cam tươi vắt, giàu vitamin C',
    available: true
  },
  {
    _id: '10005',
    name: 'Trà Đào Cam Sả',
    price: 32000,
    note: 'Trà đào thơm ngon với cam sả, giải nhiệt mùa hè',
    available: true
  }
];

async function createDrinks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management');
    console.log('Connected to MongoDB');

    // Xóa các món nước cũ nếu có
    await Menu.deleteMany({ _id: { $in: drinks.map(d => d._id) } });
    console.log('Cleared existing drinks');

    // Thêm món nước mới
    for (const drink of drinks) {
      const menu = new Menu(drink);
      await menu.save();
      console.log(`Created: ${drink.name} - ${drink.price.toLocaleString()}đ`);
    }

    console.log('\n✅ Successfully created 5 drinks!');
    console.log('Drinks created:');
    drinks.forEach(drink => {
      console.log(`- ${drink.name}: ${drink.price.toLocaleString()}đ`);
    });

  } catch (error) {
    console.error('Error creating drinks:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createDrinks();
