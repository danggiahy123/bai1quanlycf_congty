require('dotenv').config();
const mongoose = require('mongoose');
const Menu = require('../models/Menu');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_management';

async function addStingToMenu() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Thêm món sting vào menu
    const stingMenu = {
      _id: 'ST001',
      name: 'Sting',
      price: 15000,
      category: 'juice',
      available: true
    };

    // Kiểm tra xem đã có chưa
    let existingMenu = await Menu.findById(stingMenu._id);
    if (existingMenu) {
      console.log('Sting đã có trong menu');
    } else {
      const menu = new Menu(stingMenu);
      await menu.save();
      console.log('✅ Added Sting to menu');
    }

    // Hiển thị menu hiện tại
    const menus = await Menu.find({}).sort({ name: 1 });
    console.log('\n=== MENU HIỆN TẠI ===');
    menus.forEach((menu, index) => {
      console.log(`${index + 1}. ${menu.name} - ${menu.price?.toLocaleString('vi-VN')} VND (${menu.category || 'N/A'})`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');

  } catch (error) {
    console.error('Error adding Sting to menu:', error);
    process.exit(1);
  }
}

addStingToMenu();
