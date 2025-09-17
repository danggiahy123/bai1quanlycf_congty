const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Ingredient = require('../models/Ingredient');

async function testIngredients() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management');
    console.log('✅ Connected to MongoDB');

    // Count ingredients
    const count = await Ingredient.countDocuments();
    console.log(`📊 Total ingredients in database: ${count}`);

    if (count > 0) {
      // Get first few ingredients
      const ingredients = await Ingredient.find().limit(5);
      console.log('\n📋 Sample ingredients:');
      ingredients.forEach((ingredient, index) => {
        console.log(`${index + 1}. ${ingredient.name} - ${ingredient.currentStock}${ingredient.unit}`);
      });
    } else {
      console.log('❌ No ingredients found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
testIngredients();
