const mongoose = require('mongoose');
const Table = require('../models/Table');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cafe_app';

async function updateAllTableStatus() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Cập nhật tất cả bàn có trạng thái 'empty' thành 'TRỐNG'
    const emptyResult = await Table.updateMany(
      { status: 'empty' },
      { status: 'TRỐNG' }
    );
    console.log(`Đã cập nhật ${emptyResult.modifiedCount} bàn từ 'empty' thành 'TRỐNG'`);

    // Cập nhật tất cả bàn có trạng thái 'occupied' thành 'ĐÃ ĐƯỢC ĐẶT'
    const occupiedResult = await Table.updateMany(
      { status: 'occupied' },
      { status: 'ĐÃ ĐƯỢC ĐẶT' }
    );
    console.log(`Đã cập nhật ${occupiedResult.modifiedCount} bàn từ 'occupied' thành 'ĐÃ ĐƯỢC ĐẶT'`);

    // Hiển thị danh sách bàn sau khi cập nhật
    const tables = await Table.find();
    console.log('\n=== DANH SÁCH BÀN SAU KHI CẬP NHẬT ===');
    tables.forEach(table => {
      console.log(`Bàn ${table.name}: ${table.status}`);
    });

    // Hiển thị thống kê
    const stats = {
      totalTables: tables.length,
      emptyTables: tables.filter(t => t.status === 'TRỐNG').length,
      occupiedTables: tables.filter(t => t.status === 'ĐÃ ĐƯỢC ĐẶT').length
    };

    console.log('\n=== THỐNG KÊ ===');
    console.log(`Tổng số bàn: ${stats.totalTables}`);
    console.log(`Bàn trống: ${stats.emptyTables}`);
    console.log(`Bàn đã được đặt: ${stats.occupiedTables}`);

  } catch (error) {
    console.error('Error updating table status:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateAllTableStatus();
