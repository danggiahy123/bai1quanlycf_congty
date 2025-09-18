const mongoose = require('mongoose');
require('dotenv').config();

const Ingredient = require('./src/models/Ingredient');

async function quickTest() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cafe_app');
    console.log('Connected to MongoDB');

    // Kiểm tra xem có nguyên liệu nào không
    const ingredients = await Ingredient.find({});
    console.log('Số lượng nguyên liệu:', ingredients.length);
    
    if (ingredients.length > 0) {
      console.log('Nguyên liệu đầu tiên:', ingredients[0].name);
    }

    // Tạo nguyên liệu test đơn giản
    const testIngredient = new Ingredient({
      name: 'Test Ếch',
      category: 'food',
      unit: 'con',
      currentStock: 10,
      minStockLevel: 5,
      maxStockLevel: 20,
      unitPrice: 15000,
      supplier: 'Test Supplier',
      notes: 'Test ingredient',
      isActive: true
    });

    await testIngredient.save();
    console.log('✅ Tạo nguyên liệu test thành công');

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await mongoose.disconnect();
  }
}

quickTest();
