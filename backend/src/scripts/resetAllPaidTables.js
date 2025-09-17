const mongoose = require('mongoose');
const Table = require('../models/Table');
const Order = require('../models/Order');
const Booking = require('../models/Booking');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cafe_app';

async function resetAllPaidTables() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Tìm tất cả bàn có order đã thanh toán
    const paidOrders = await Order.find({ status: 'paid' });
    console.log(`Tìm thấy ${paidOrders.length} order đã thanh toán`);

    // Lấy danh sách tableId từ các order đã thanh toán
    const paidTableIds = paidOrders.map(order => order.tableId);
    console.log('Danh sách bàn đã thanh toán:', paidTableIds);

    // Reset tất cả bàn đã thanh toán về trạng thái TRỐNG
    const result = await Table.updateMany(
      { _id: { $in: paidTableIds } },
      { status: 'TRỐNG' }
    );

    console.log(`Đã reset ${result.modifiedCount} bàn về trạng thái TRỐNG`);

    // Cập nhật tất cả booking đã completed về trạng thái completed
    const completedBookings = await Booking.updateMany(
      { status: 'confirmed' },
      { status: 'completed' }
    );

    console.log(`Đã cập nhật ${completedBookings.modifiedCount} booking về trạng thái completed`);

    // Hiển thị danh sách bàn sau khi reset
    const tables = await Table.find();
    console.log('\n=== DANH SÁCH BÀN SAU KHI RESET ===');
    tables.forEach(table => {
      console.log(`Bàn ${table.name}: ${table.status}`);
    });

    // Hiển thị thống kê
    const stats = {
      totalTables: tables.length,
      emptyTables: tables.filter(t => t.status === 'TRỐNG').length,
      occupiedTables: tables.filter(t => t.status === 'ĐÃ ĐƯỢC ĐẶT').length,
      paidOrders: paidOrders.length
    };

    console.log('\n=== THỐNG KÊ ===');
    console.log(`Tổng số bàn: ${stats.totalTables}`);
    console.log(`Bàn trống: ${stats.emptyTables}`);
    console.log(`Bàn đã được đặt: ${stats.occupiedTables}`);
    console.log(`Order đã thanh toán: ${stats.paidOrders}`);

  } catch (error) {
    console.error('Error resetting paid tables:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

resetAllPaidTables();
