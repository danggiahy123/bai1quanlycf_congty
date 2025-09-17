require('dotenv').config();
const mongoose = require('mongoose');
const Menu = require('../models/Menu');
const Ingredient = require('../models/Ingredient');

async function createMenuWithIngredients() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_management');
    console.log('Connected to MongoDB');

    // Lấy nguyên liệu từ database
    const ingredients = await Ingredient.find({});
    console.log(`Found ${ingredients.length} ingredients`);

    // Tạo menu mẫu với nguyên liệu
    const sampleMenus = [
      {
        _id: 'CF001',
        name: 'Cà phê đen',
        price: 15000,
        category: 'coffee',
        ingredients: [
          {
            ingredientId: ingredients.find(i => i.name === 'Cà phê Arabica')._id,
            ingredientName: 'Cà phê Arabica',
            quantity: 20,
            unit: 'g'
          }
        ]
      },
      {
        _id: 'CF002',
        name: 'Cà phê sữa',
        price: 20000,
        category: 'coffee',
        ingredients: [
          {
            ingredientId: ingredients.find(i => i.name === 'Cà phê Arabica')._id,
            ingredientName: 'Cà phê Arabica',
            quantity: 20,
            unit: 'g'
          },
          {
            ingredientId: ingredients.find(i => i.name === 'Sữa tươi')._id,
            ingredientName: 'Sữa tươi',
            quantity: 100,
            unit: 'ml'
          },
          {
            ingredientId: ingredients.find(i => i.name === 'Đường trắng')._id,
            ingredientName: 'Đường trắng',
            quantity: 10,
            unit: 'g'
          }
        ]
      },
      {
        _id: 'CF003',
        name: 'Latte',
        price: 35000,
        category: 'coffee',
        ingredients: [
          {
            ingredientId: ingredients.find(i => i.name === 'Cà phê Arabica')._id,
            ingredientName: 'Cà phê Arabica',
            quantity: 15,
            unit: 'g'
          },
          {
            ingredientId: ingredients.find(i => i.name === 'Sữa tươi')._id,
            ingredientName: 'Sữa tươi',
            quantity: 200,
            unit: 'ml'
          },
          {
            ingredientId: ingredients.find(i => i.name === 'Kem tươi')._id,
            ingredientName: 'Kem tươi',
            quantity: 50,
            unit: 'ml'
          }
        ]
      },
      {
        _id: 'FD001',
        name: 'Bánh mì trứng',
        price: 25000,
        category: 'food',
        ingredients: [
          {
            ingredientId: ingredients.find(i => i.name === 'Bánh mì')._id,
            ingredientName: 'Bánh mì',
            quantity: 1,
            unit: 'pcs'
          },
          {
            ingredientId: ingredients.find(i => i.name === 'Trứng gà')._id,
            ingredientName: 'Trứng gà',
            quantity: 2,
            unit: 'pcs'
          }
        ]
      },
      {
        _id: 'TE001',
        name: 'Trà sữa',
        price: 18000,
        category: 'tea',
        ingredients: [
          {
            ingredientId: ingredients.find(i => i.name === 'Sữa tươi')._id,
            ingredientName: 'Sữa tươi',
            quantity: 150,
            unit: 'ml'
          },
          {
            ingredientId: ingredients.find(i => i.name === 'Đường trắng')._id,
            ingredientName: 'Đường trắng',
            quantity: 20,
            unit: 'g'
          }
        ]
      }
    ];

    // Tạo hoặc cập nhật menu
    for (const menuData of sampleMenus) {
      let menu = await Menu.findById(menuData._id);
      if (menu) {
        // Cập nhật menu hiện có
        menu.name = menuData.name;
        menu.price = menuData.price;
        menu.category = menuData.category;
        menu.ingredients = menuData.ingredients;
        await menu.save();
        console.log(`✅ Updated menu: ${menu.name}`);
      } else {
        // Tạo menu mới
        menu = new Menu(menuData);
        await menu.save();
        console.log(`✅ Created menu: ${menu.name}`);
      }
    }

    console.log('\n🎉 Successfully created/updated menus with ingredients!');
    console.log(`📊 Created/Updated ${sampleMenus.length} menus`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createMenuWithIngredients();
