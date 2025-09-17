require('dotenv').config();
const mongoose = require('mongoose');
const Menu = require('../models/Menu');
const Ingredient = require('../models/Ingredient');

async function addIngredientsToMenu() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_management');
    console.log('Connected to MongoDB');

    // Tạo nguyên liệu mẫu nếu chưa có
    const ingredients = [
      {
        name: 'Cà phê Arabica',
        category: 'coffee',
        unit: 'g',
        unitPrice: 0.5,
        currentStock: 1000,
        minStockLevel: 100,
        maxStockLevel: 2000,
        supplier: {
          name: 'Nhà cung cấp cà phê ABC',
          contact: 'Nguyễn Văn A',
          phone: '0123456789'
        }
      },
      {
        name: 'Sữa tươi',
        category: 'milk',
        unit: 'ml',
        unitPrice: 0.02,
        currentStock: 5000,
        minStockLevel: 500,
        maxStockLevel: 10000,
        supplier: {
          name: 'Công ty sữa XYZ',
          contact: 'Trần Thị B',
          phone: '0987654321'
        }
      },
      {
        name: 'Đường trắng',
        category: 'syrup',
        unit: 'g',
        unitPrice: 0.01,
        currentStock: 2000,
        minStockLevel: 200,
        maxStockLevel: 5000,
        supplier: {
          name: 'Nhà máy đường DEF',
          contact: 'Lê Văn C',
          phone: '0369852147'
        }
      },
      {
        name: 'Kem tươi',
        category: 'topping',
        unit: 'ml',
        unitPrice: 0.05,
        currentStock: 1000,
        minStockLevel: 100,
        maxStockLevel: 2000,
        supplier: {
          name: 'Công ty kem GHI',
          contact: 'Phạm Thị D',
          phone: '0741852963'
        }
      },
      {
        name: 'Bánh mì',
        category: 'food',
        unit: 'pcs',
        unitPrice: 2.0,
        currentStock: 50,
        minStockLevel: 10,
        maxStockLevel: 100,
        supplier: {
          name: 'Tiệm bánh JKL',
          contact: 'Hoàng Văn E',
          phone: '0852741963'
        }
      },
      {
        name: 'Trứng gà',
        category: 'food',
        unit: 'pcs',
        unitPrice: 0.3,
        currentStock: 100,
        minStockLevel: 20,
        maxStockLevel: 200,
        supplier: {
          name: 'Trang trại trứng MNO',
          contact: 'Vũ Thị F',
          phone: '0963258741'
        }
      }
    ];

    // Tạo nguyên liệu trong database
    const createdIngredients = [];
    for (const ingredientData of ingredients) {
      let ingredient = await Ingredient.findOne({ name: ingredientData.name });
      if (!ingredient) {
        ingredient = new Ingredient(ingredientData);
        await ingredient.save();
        console.log(`✅ Created ingredient: ${ingredient.name}`);
      } else {
        console.log(`⚠️  Ingredient already exists: ${ingredient.name}`);
      }
      createdIngredients.push(ingredient);
    }

    // Cập nhật menu với nguyên liệu
    const menus = await Menu.find({});
    console.log(`\n📋 Found ${menus.length} menus to update`);

    for (const menu of menus) {
      let ingredients = [];
      
      // Thêm nguyên liệu dựa trên tên món
      if (menu.name.toLowerCase().includes('cà phê') || menu.name.toLowerCase().includes('coffee')) {
        ingredients = [
          {
            ingredientId: createdIngredients.find(i => i.name === 'Cà phê Arabica')._id,
            ingredientName: 'Cà phê Arabica',
            quantity: 20,
            unit: 'g'
          },
          {
            ingredientId: createdIngredients.find(i => i.name === 'Sữa tươi')._id,
            ingredientName: 'Sữa tươi',
            quantity: 100,
            unit: 'ml'
          },
          {
            ingredientId: createdIngredients.find(i => i.name === 'Đường trắng')._id,
            ingredientName: 'Đường trắng',
            quantity: 10,
            unit: 'g'
          }
        ];
      } else if (menu.name.toLowerCase().includes('latte') || menu.name.toLowerCase().includes('cappuccino')) {
        ingredients = [
          {
            ingredientId: createdIngredients.find(i => i.name === 'Cà phê Arabica')._id,
            ingredientName: 'Cà phê Arabica',
            quantity: 15,
            unit: 'g'
          },
          {
            ingredientId: createdIngredients.find(i => i.name === 'Sữa tươi')._id,
            ingredientName: 'Sữa tươi',
            quantity: 200,
            unit: 'ml'
          },
          {
            ingredientId: createdIngredients.find(i => i.name === 'Kem tươi')._id,
            ingredientName: 'Kem tươi',
            quantity: 50,
            unit: 'ml'
          }
        ];
      } else if (menu.name.toLowerCase().includes('bánh mì') || menu.name.toLowerCase().includes('sandwich')) {
        ingredients = [
          {
            ingredientId: createdIngredients.find(i => i.name === 'Bánh mì')._id,
            ingredientName: 'Bánh mì',
            quantity: 1,
            unit: 'pcs'
          },
          {
            ingredientId: createdIngredients.find(i => i.name === 'Trứng gà')._id,
            ingredientName: 'Trứng gà',
            quantity: 2,
            unit: 'pcs'
          }
        ];
      } else if (menu.name.toLowerCase().includes('trà') || menu.name.toLowerCase().includes('tea')) {
        ingredients = [
          {
            ingredientId: createdIngredients.find(i => i.name === 'Đường trắng')._id,
            ingredientName: 'Đường trắng',
            quantity: 15,
            unit: 'g'
          },
          {
            ingredientId: createdIngredients.find(i => i.name === 'Sữa tươi')._id,
            ingredientName: 'Sữa tươi',
            quantity: 50,
            unit: 'ml'
          }
        ];
      }

      // Cập nhật menu với nguyên liệu
      if (ingredients.length > 0) {
        menu.ingredients = ingredients;
        await menu.save();
        console.log(`✅ Updated menu "${menu.name}" with ${ingredients.length} ingredients`);
      } else {
        console.log(`⚠️  No ingredients added for menu "${menu.name}"`);
      }
    }

    console.log('\n🎉 Successfully added ingredients to menus!');
    console.log('\n📊 Summary:');
    console.log(`- Created ${createdIngredients.length} ingredients`);
    console.log(`- Updated ${menus.length} menus`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

addIngredientsToMenu();
