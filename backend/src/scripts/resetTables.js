const mongoose = require('mongoose');
const Table = require('../models/Table');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cafe_app';

async function resetTables() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Reset tất cả bàn về trạng thái TRỐNG
    const result = await Table.updateMany(
      { status: 'ĐÃ ĐƯỢC ĐẶT' },
      { status: 'TRỐNG' }
    );

    console.log(`Đã reset ${result.modifiedCount} bàn về trạng thái TRỐNG`);

    // Hiển thị danh sách bàn
    const tables = await Table.find();
    console.log('\n=== DANH SÁCH BÀN ===');
    tables.forEach(table => {
      console.log(`Bàn ${table.name}: ${table.status}`);
    });

  } catch (error) {
    console.error('Error resetting tables:', error);
  } finally {
    await mongoose.disconnect();
  }
}

resetTables();
