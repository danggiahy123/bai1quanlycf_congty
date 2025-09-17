const mongoose = require('mongoose');
const Table = require('../models/Table');

// Kết nối database
mongoose.connect('mongodb://localhost:27017/restaurant_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createSampleTables() {
  try {
    console.log('🔄 Đang tạo bàn mẫu...');
    
    // Xóa tất cả bàn cũ
    await Table.deleteMany({});
    console.log('🗑️ Đã xóa tất cả bàn cũ');
    
    // Tạo bàn mẫu
    const sampleTables = [
      { _id: '001', name: 'Bàn 1', status: 'empty', capacity: 2, location: 'main_hall', note: 'Bàn 2 người' },
      { _id: '002', name: 'Bàn 2', status: 'empty', capacity: 4, location: 'main_hall', note: 'Bàn 4 người' },
      { _id: '003', name: 'Bàn 3', status: 'empty', capacity: 6, location: 'main_hall', note: 'Bàn 6 người' },
      { _id: '004', name: 'Bàn 4', status: 'empty', capacity: 8, location: 'main_hall', note: 'Bàn 8 người' },
      { _id: '005', name: 'Bàn 5', status: 'empty', capacity: 10, location: 'main_hall', note: 'Bàn 10 người' },
      { _id: '006', name: 'Bàn VIP 1', status: 'empty', capacity: 4, location: 'private_room', note: 'Bàn VIP 4 người', isPremium: true },
      { _id: '007', name: 'Bàn VIP 2', status: 'empty', capacity: 6, location: 'private_room', note: 'Bàn VIP 6 người', isPremium: true },
    ];
    
    const createdTables = await Table.insertMany(sampleTables);
    console.log(`✅ Đã tạo ${createdTables.length} bàn mẫu`);
    
    // Hiển thị danh sách bàn
    console.log('\n📋 Danh sách bàn:');
    createdTables.forEach(table => {
      console.log(`  - ${table.name}: ${table.status}`);
    });
    
  } catch (error) {
    console.error('❌ Lỗi khi tạo bàn:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Đã đóng kết nối database');
  }
}

// Chạy script
createSampleTables();
