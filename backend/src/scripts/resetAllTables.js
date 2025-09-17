const mongoose = require('mongoose');
const Table = require('../models/Table');

// Kết nối database
mongoose.connect('mongodb://localhost:27017/restaurant_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function resetAllTables() {
  try {
    console.log('🔄 Đang reset tất cả bàn về trạng thái TRỐNG...');
    
    // Cập nhật tất cả bàn về trạng thái empty
    const result = await Table.updateMany(
      {}, // Tất cả bàn
      { 
        status: 'empty',
        $unset: { 
          currentBooking: 1,
          occupiedAt: 1,
          occupiedBy: 1
        }
      }
    );
    
    console.log(`✅ Đã reset ${result.modifiedCount} bàn về trạng thái TRỐNG`);
    
    // Hiển thị danh sách bàn sau khi reset
    const tables = await Table.find({});
    console.log('\n📋 Danh sách bàn sau khi reset:');
    tables.forEach(table => {
      console.log(`  - ${table.name}: ${table.status}`);
    });
    
  } catch (error) {
    console.error('❌ Lỗi khi reset bàn:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Đã đóng kết nối database');
  }
}

// Chạy script
resetAllTables();
