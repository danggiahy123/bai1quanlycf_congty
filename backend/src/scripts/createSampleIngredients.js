const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Ingredient = require('../models/Ingredient');

const sampleIngredients = [
  {
    name: 'Cà phê Arabica',
    category: 'coffee',
    currentStock: 50,
    minStock: 10,
    maxStock: 100,
    unit: 'kg',
    unitPrice: 200000,
    supplier: 'Công ty Cà phê Việt Nam',
    description: 'Cà phê Arabica chất lượng cao, hương vị thơm ngon'
  },
  {
    name: 'Cà phê Robusta',
    category: 'coffee',
    currentStock: 30,
    minStock: 5,
    maxStock: 80,
    unit: 'kg',
    unitPrice: 150000,
    supplier: 'Công ty Cà phê Việt Nam',
    description: 'Cà phê Robusta đậm đà, vị đắng nhẹ'
  },
  {
    name: 'Sữa tươi',
    category: 'milk',
    currentStock: 20,
    minStock: 5,
    maxStock: 50,
    unit: 'l',
    unitPrice: 25000,
    supplier: 'Vinamilk',
    description: 'Sữa tươi nguyên kem, béo ngậy'
  },
  {
    name: 'Sữa đặc',
    category: 'milk',
    currentStock: 15,
    minStock: 3,
    maxStock: 30,
    unit: 'kg',
    unitPrice: 45000,
    supplier: 'Nestlé',
    description: 'Sữa đặc có đường, ngọt vừa phải'
  },
  {
    name: 'Đường trắng',
    category: 'other',
    currentStock: 25,
    minStock: 5,
    maxStock: 50,
    unit: 'kg',
    unitPrice: 18000,
    supplier: 'Đường Biên Hòa',
    description: 'Đường trắng tinh luyện, ngọt thanh'
  },
  {
    name: 'Đường nâu',
    category: 'other',
    currentStock: 10,
    minStock: 2,
    maxStock: 20,
    unit: 'kg',
    unitPrice: 22000,
    supplier: 'Đường Biên Hòa',
    description: 'Đường nâu tự nhiên, hương vị đặc biệt'
  },
  {
    name: 'Si-rô Vanilla',
    category: 'syrup',
    currentStock: 8,
    minStock: 2,
    maxStock: 15,
    unit: 'l',
    unitPrice: 85000,
    supplier: 'Monin',
    description: 'Si-rô vani thơm ngon, chất lượng cao'
  },
  {
    name: 'Si-rô Caramel',
    category: 'syrup',
    currentStock: 6,
    minStock: 2,
    maxStock: 12,
    unit: 'l',
    unitPrice: 95000,
    supplier: 'Monin',
    description: 'Si-rô caramel đậm đà, vị ngọt thanh'
  },
  {
    name: 'Whipped Cream',
    category: 'topping',
    currentStock: 12,
    minStock: 3,
    maxStock: 25,
    unit: 'l',
    unitPrice: 120000,
    supplier: 'Rich\'s',
    description: 'Kem tươi đánh bông, béo ngậy'
  },
  {
    name: 'Bột Cacao',
    category: 'coffee',
    currentStock: 5,
    minStock: 1,
    maxStock: 10,
    unit: 'kg',
    unitPrice: 180000,
    supplier: 'Valrhona',
    description: 'Bột cacao nguyên chất, hương vị đậm đà'
  },
  {
    name: 'Đá viên',
    category: 'other',
    currentStock: 100,
    minStock: 20,
    maxStock: 200,
    unit: 'kg',
    unitPrice: 5000,
    supplier: 'Công ty Đá lạnh',
    description: 'Đá viên sạch, an toàn thực phẩm'
  },
  {
    name: 'Cốc giấy',
    category: 'other',
    currentStock: 500,
    minStock: 100,
    maxStock: 1000,
    unit: 'pcs',
    unitPrice: 2000,
    supplier: 'Công ty Bao bì',
    description: 'Cốc giấy 12oz, thân thiện môi trường'
  }
];

async function createSampleIngredients() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management');
    console.log('✅ Connected to MongoDB');

    // Clear existing ingredients
    await Ingredient.deleteMany({});
    console.log('🗑️ Cleared existing ingredients');

    // Create sample ingredients
    const createdIngredients = await Ingredient.insertMany(sampleIngredients);
    console.log(`✅ Created ${createdIngredients.length} sample ingredients`);

    // Display created ingredients
    console.log('\n📋 Sample ingredients created:');
    createdIngredients.forEach((ingredient, index) => {
      console.log(`${index + 1}. ${ingredient.name} - ${ingredient.currentStock}${ingredient.unit} - ${ingredient.unitPrice.toLocaleString('vi-VN')} VNĐ`);
    });

    console.log('\n🎉 Sample ingredients created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating sample ingredients:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createSampleIngredients();
