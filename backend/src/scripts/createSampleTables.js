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
    
    // Tạo bàn mẫu với tableNumber phù hợp với mobile app (10 bàn từ #10001 đến #10010)
    const sampleTables = [
      { _id: '10001', name: 'Bàn VIP 1', tableNumber: '10001', status: 'empty', capacity: 4, location: 'private_room', note: 'Bàn VIP 4 người', isPremium: true },
      { _id: '10002', name: 'Bàn cửa sổ 1', tableNumber: '10002', status: 'empty', capacity: 4, location: 'window', note: 'Bàn cửa sổ 4 người' },
      { _id: '10003', name: 'Bàn gia đình 1', tableNumber: '10003', status: 'empty', capacity: 6, location: 'main_hall', note: 'Bàn gia đình 6 người' },
      { _id: '10004', name: 'Bàn gia đình 1', tableNumber: '10004', status: 'occupied', capacity: 8, location: 'main_hall', note: 'Bàn gia đình 8 người' },
      { _id: '10005', name: 'Bàn 5', tableNumber: '10005', status: 'empty', capacity: 4, location: 'main_hall', note: 'Bàn 4 người' },
      { _id: '10006', name: 'Bàn máy lạnh 2', tableNumber: '10006', status: 'empty', capacity: 4, location: 'air_conditioned', note: 'Bàn máy lạnh 4 người' },
      { _id: '10007', name: 'Bàn ngoài trời 1', tableNumber: '10007', status: 'empty', capacity: 4, location: 'outdoor', note: 'Bàn ngoài trời 4 người' },
      { _id: '10008', name: 'Bàn VIP 2', tableNumber: '10008', status: 'empty', capacity: 6, location: 'private_room', note: 'Bàn VIP 6 người', isPremium: true },
      { _id: '10009', name: 'Bàn máy lạnh 3', tableNumber: '10009', status: 'empty', capacity: 4, location: 'air_conditioned', note: 'Bàn máy lạnh 4 người' },
      { _id: '10010', name: 'Bàn cửa sổ 3', tableNumber: '10010', status: 'empty', capacity: 4, location: 'window', note: 'Bàn cửa sổ 4 người' },
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
