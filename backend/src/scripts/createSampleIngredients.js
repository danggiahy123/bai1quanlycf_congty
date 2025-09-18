require('dotenv').config();
const mongoose = require('mongoose');
const Ingredient = require('../models/Ingredient');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cafe_app';

const sampleIngredients = [
  {
    name: 'Cà phê Arabica',
    category: 'coffee',
    currentStock: 50,
    minStock: 10,
    maxStock: 100,
    unit: 'kg',
    unitPrice: 250000,
    supplier: {
      name: 'Công ty Cà phê Việt Nam',
      contact: '0123456789'
    },
    description: 'Cà phê Arabica chất lượng cao',
    isActive: true
  },
  {
    name: 'Cà phê Robusta',
    category: 'coffee',
    currentStock: 30,
    minStock: 5,
    maxStock: 80,
    unit: 'kg',
    unitPrice: 180000,
    supplier: {
      name: 'Công ty Cà phê Việt Nam',
      contact: '0123456789'
    },
    description: 'Cà phê Robusta đậm đà',
    isActive: true
  },
  {
    name: 'Sữa tươi',
    category: 'milk',
    currentStock: 20,
    minStock: 5,
    maxStock: 50,
    unit: 'l',
    unitPrice: 25000,
    supplier: {
      name: 'Vinamilk',
      contact: '0123456788'
    },
    description: 'Sữa tươi nguyên kem',
    isActive: true
  },
  {
    name: 'Sữa đặc',
    category: 'milk',
    currentStock: 15,
    minStock: 3,
    maxStock: 30,
    unit: 'l',
    unitPrice: 35000,
    supplier: {
      name: 'Vinamilk',
      contact: '0123456788'
    },
    description: 'Sữa đặc có đường',
    isActive: true
  },
  {
    name: 'Đường trắng',
    category: 'food',
    currentStock: 25,
    minStock: 5,
    maxStock: 50,
    unit: 'kg',
    unitPrice: 15000,
    supplier: {
      name: 'Công ty Đường Biên Hòa',
      contact: '0123456787'
    },
    description: 'Đường trắng tinh luyện',
    isActive: true
  },
  {
    name: 'Si-rô vani',
    category: 'syrup',
    currentStock: 8,
    minStock: 2,
    maxStock: 20,
    unit: 'l',
    unitPrice: 120000,
    supplier: {
      name: 'Công ty Si-rô ABC',
      contact: '0123456786'
    },
    description: 'Si-rô vani tự nhiên',
    isActive: true
  },
  {
    name: 'Si-rô caramel',
    category: 'syrup',
    currentStock: 6,
    minStock: 2,
    maxStock: 15,
    unit: 'l',
    unitPrice: 150000,
    supplier: {
      name: 'Công ty Si-rô ABC',
      contact: '0123456786'
    },
    description: 'Si-rô caramel thơm ngon',
    isActive: true
  },
  {
    name: 'Kem tươi',
    category: 'topping',
    currentStock: 12,
    minStock: 3,
    maxStock: 25,
    unit: 'l',
    unitPrice: 45000,
    supplier: {
      name: 'Công ty Kem XYZ',
      contact: '0123456785'
    },
    description: 'Kem tươi whipping cream',
    isActive: true
  },
  {
    name: 'Bột ca cao',
    category: 'other',
    currentStock: 10,
    minStock: 2,
    maxStock: 20,
    unit: 'kg',
    unitPrice: 80000,
    supplier: {
      name: 'Công ty Ca cao DEF',
      contact: '0123456784'
    },
    description: 'Bột ca cao nguyên chất',
    isActive: true
  },
  {
    name: 'Trà xanh',
    category: 'beverage',
    currentStock: 5,
    minStock: 1,
    maxStock: 15,
    unit: 'kg',
    unitPrice: 120000,
    supplier: {
      name: 'Công ty Trà GHI',
      contact: '0123456783'
    },
    description: 'Trà xanh cao cấp',
    isActive: true
  }
];

async function createSampleIngredients() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing ingredients
    await Ingredient.deleteMany({});
    console.log('Cleared existing ingredients');

    // Create sample ingredients
    for (const ingredientData of sampleIngredients) {
      const ingredient = new Ingredient(ingredientData);
      await ingredient.save();
      console.log(`Created ingredient: ${ingredient.name}`);
    }

    console.log(`\n✅ Successfully created ${sampleIngredients.length} sample ingredients!`);
    
    // Display summary
    const totalValue = sampleIngredients.reduce((sum, ing) => sum + (ing.currentStock * ing.unitPrice), 0);
    console.log(`\n📊 Summary:`);
    console.log(`Total ingredients: ${sampleIngredients.length}`);
    console.log(`Total stock value: ${totalValue.toLocaleString('vi-VN')} VND`);
    
    const categoryCount = {};
    sampleIngredients.forEach(ing => {
      categoryCount[ing.category] = (categoryCount[ing.category] || 0) + 1;
    });
    
    console.log(`\n📋 By category:`);
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`- ${category}: ${count} items`);
    });

  } catch (error) {
    console.error('Error creating sample ingredients:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createSampleIngredients();