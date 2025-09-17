const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Table = require('../models/Table');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const Order = require('../models/Order');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cafe_app';

async function testBookingFlow() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== KIỂM TRA QUY TRÌNH ĐẶT BÀN ===\n');

    // 1. Kiểm tra bàn trống
    const emptyTables = await Table.find({ status: 'TRỐNG' });
    console.log(`1. Bàn trống có sẵn: ${emptyTables.length}`);
    emptyTables.forEach(table => {
      console.log(`   - ${table.name}: ${table.status}`);
    });

    // 2. Kiểm tra booking pending
    const pendingBookings = await Booking.find({ status: 'pending' });
    console.log(`\n2. Booking đang chờ xác nhận: ${pendingBookings.length}`);
    pendingBookings.forEach(booking => {
      console.log(`   - ID: ${booking._id}, Bàn: ${booking.table}, Khách: ${booking.customerInfo?.fullName || 'N/A'}`);
    });

    // 3. Kiểm tra booking đã xác nhận
    const confirmedBookings = await Booking.find({ status: 'confirmed' });
    console.log(`\n3. Booking đã xác nhận: ${confirmedBookings.length}`);
    confirmedBookings.forEach(booking => {
      console.log(`   - ID: ${booking._id}, Bàn: ${booking.table}, Khách: ${booking.customerInfo?.fullName || 'N/A'}`);
    });

    // 4. Kiểm tra booking đã hoàn thành
    const completedBookings = await Booking.find({ status: 'completed' });
    console.log(`\n4. Booking đã hoàn thành: ${completedBookings.length}`);
    completedBookings.forEach(booking => {
      console.log(`   - ID: ${booking._id}, Bàn: ${booking.table}, Khách: ${booking.customerInfo?.fullName || 'N/A'}`);
    });

    // 5. Kiểm tra thông báo
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(10);
    console.log(`\n5. Thông báo gần nhất (10 cái): ${notifications.length}`);
    notifications.forEach(notif => {
      console.log(`   - ${notif.type}: ${notif.title} - ${notif.isRead ? 'Đã đọc' : 'Chưa đọc'}`);
    });

    // 6. Kiểm tra order
    const pendingOrders = await Order.find({ status: 'pending' });
    const paidOrders = await Order.find({ status: 'paid' });
    console.log(`\n6. Order đang chờ thanh toán: ${pendingOrders.length}`);
    console.log(`   Order đã thanh toán: ${paidOrders.length}`);

    // 7. Thống kê tổng quan
    const stats = {
      totalTables: await Table.countDocuments(),
      emptyTables: await Table.countDocuments({ status: 'TRỐNG' }),
      occupiedTables: await Table.countDocuments({ status: 'ĐÃ ĐƯỢC ĐẶT' }),
      totalBookings: await Booking.countDocuments(),
      pendingBookings: await Booking.countDocuments({ status: 'pending' }),
      confirmedBookings: await Booking.countDocuments({ status: 'confirmed' }),
      completedBookings: await Booking.countDocuments({ status: 'completed' }),
      totalNotifications: await Notification.countDocuments(),
      unreadNotifications: await Notification.countDocuments({ isRead: false })
    };

    console.log('\n=== THỐNG KÊ TỔNG QUAN ===');
    console.log(`Tổng số bàn: ${stats.totalTables}`);
    console.log(`Bàn trống: ${stats.emptyTables}`);
    console.log(`Bàn đã được đặt: ${stats.occupiedTables}`);
    console.log(`Tổng số booking: ${stats.totalBookings}`);
    console.log(`Booking chờ xác nhận: ${stats.pendingBookings}`);
    console.log(`Booking đã xác nhận: ${stats.confirmedBookings}`);
    console.log(`Booking đã hoàn thành: ${stats.completedBookings}`);
    console.log(`Tổng số thông báo: ${stats.totalNotifications}`);
    console.log(`Thông báo chưa đọc: ${stats.unreadNotifications}`);

    console.log('\n=== QUY TRÌNH ĐẶT BÀN ===');
    console.log('1. Khách hàng đặt bàn → Status: pending → Gửi thông báo cho khách và nhân viên');
    console.log('2. Nhân viên xác nhận → Status: confirmed → Cập nhật bàn thành "ĐÃ ĐƯỢC ĐẶT"');
    console.log('3. Khách hàng đến và thanh toán → Status: completed → Cập nhật bàn thành "TRỐNG"');
    console.log('4. Chỉ có thể thanh toán khi booking đã được xác nhận (status: confirmed)');

  } catch (error) {
    console.error('Error testing booking flow:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testBookingFlow();
