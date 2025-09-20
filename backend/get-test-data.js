const mongoose = require('mongoose');
const Table = require('./src/models/Table');
const Menu = require('./src/models/Menu');

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/cafe_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function getTestData() {
  try {
    console.log('🔍 Getting test data...\n');

    // Lấy tables
    const tables = await Table.find({ status: 'empty' }).limit(5);
    console.log('📋 Available Tables:');
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ID: ${table._id}, Name: ${table.name}, Capacity: ${table.capacity}`);
    });

    // Lấy menu items
    const menuItems = await Menu.find({}).limit(5);
    console.log('\n🍽️ Available Menu Items:');
    menuItems.forEach((item, index) => {
      console.log(`  ${index + 1}. ID: ${item._id}, Name: ${item.name}, Price: ${item.price}đ`);
    });

    // Tạo test data với ID thật
    if (tables.length > 0 && menuItems.length > 0) {
      const testData = {
        tableId: tables[0]._id.toString(),
        numberOfGuests: 2,
        bookingDate: new Date().toISOString().split('T')[0],
        bookingTime: '19:00',
        menuItems: [
          {
            itemId: menuItems[0]._id.toString(),
            quantity: 2
          }
        ],
        notes: 'Test booking from script',
        depositAmount: 100000,
        customerInfo: {
          fullName: 'Test Customer',
          phone: '0123456789',
          email: 'test@example.com'
        }
      };

      console.log('\n📤 Generated Test Data:');
      console.log(JSON.stringify(testData, null, 2));
    }

  } catch (error) {
    console.error('❌ Error getting test data:', error);
  } finally {
    mongoose.connection.close();
  }
}

getTestData();
