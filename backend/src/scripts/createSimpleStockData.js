require('dotenv').config();
const mongoose = require('mongoose');
const Ingredient = require('../models/Ingredient');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cafe_app';

const simpleIngredients = [
  {
    name: 'Cà phê Arabica',
    category: 'coffee',
    unit: 'kg',
    currentStock: 25,
    minStockLevel: 10,
    maxStockLevel: 100,
    unitPrice: 250000,
    supplier: 'Công ty Cà phê Việt Nam',
    notes: 'Cà phê Arabica chất lượng cao',
    isActive: true
  },
  {
    name: 'Sữa tươi',
    category: 'milk',
    unit: 'l',
    currentStock: 15,
    minStockLevel: 5,
    maxStockLevel: 50,
    unitPrice: 25000,
    supplier: 'Vinamilk',
    notes: 'Sữa tươi nguyên kem',
    isActive: true
  },
  {
    name: 'Đường trắng',
    category: 'food',
    unit: 'kg',
    currentStock: 20,
    minStockLevel: 8,
    maxStockLevel: 80,
    unitPrice: 15000,
    supplier: 'Công ty Đường Biên Hòa',
    notes: 'Đường trắng tinh luyện',
    isActive: true
  },
  {
    name: 'Si-rô vani',
    category: 'syrup',
    unit: 'l',
    currentStock: 5,
    minStockLevel: 2,
    maxStockLevel: 20,
    unitPrice: 120000,
    supplier: 'Công ty Si-rô ABC',
    notes: 'Si-rô vani tự nhiên',
    isActive: true
  },
  {
    name: 'Kem tươi',
    category: 'topping',
    unit: 'l',
    currentStock: 8,
    minStockLevel: 3,
    maxStockLevel: 25,
    unitPrice: 45000,
    supplier: 'Công ty Kem XYZ',
    notes: 'Kem tươi whipping cream',
    isActive: true
  },
  {
    name: 'Bột ca cao',
    category: 'other',
    unit: 'kg',
    currentStock: 3,
    minStockLevel: 2,
    maxStockLevel: 20,
    unitPrice: 80000,
    supplier: 'Công ty Ca cao DEF',
    notes: 'Bột ca cao nguyên chất',
    isActive: true
  }
];

async function createSimpleStockData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing ingredients
    await Ingredient.deleteMany({});
    console.log('Cleared existing ingredients');

    // Create simple ingredients
    for (const ingredientData of simpleIngredients) {
      const ingredient = new Ingredient(ingredientData);
      await ingredient.save();
      console.log(`Created ingredient: ${ingredient.name}`);
    }

    console.log(`\n✅ Successfully created ${simpleIngredients.length} simple ingredients!`);
    
    // Display summary
    const totalValue = simpleIngredients.reduce((sum, ing) => sum + (ing.currentStock * ing.unitPrice), 0);
    console.log(`\n📊 Summary:`);
    console.log(`Total ingredients: ${simpleIngredients.length}`);
    console.log(`Total stock value: ${totalValue.toLocaleString('vi-VN')} VND`);
    
    console.log(`\n📋 Ingredients:`);
    simpleIngredients.forEach(ing => {
      console.log(`- ${ing.name}: ${ing.currentStock} ${ing.unit} (${ing.unitPrice.toLocaleString()} VND/${ing.unit})`);
    });

  } catch (error) {
    console.error('Error creating simple stock data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createSimpleStockData();
