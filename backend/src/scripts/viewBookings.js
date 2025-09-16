const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Table = require('../models/Table');
const Menu = require('../models/Menu');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cafe_app';

async function viewBookings() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Lấy tất cả bookings
    const bookings = await Booking.find()
      .populate('customer', 'fullName email phone')
      .populate('table', 'name')
      .populate('menuItems.item', 'name price')
      .populate('confirmedBy', 'fullName')
      .sort({ createdAt: -1 });

    console.log('\n=== DANH SÁCH BOOKINGS ===');
    console.log(`Tổng số bookings: ${bookings.length}\n`);

    bookings.forEach((booking, index) => {
      console.log(`--- Booking ${index + 1} ---`);
      console.log(`ID: ${booking._id}`);
      console.log(`Khách hàng: ${booking.customer.fullName} (${booking.customer.email})`);
      console.log(`Bàn: ${booking.table.name}`);
      console.log(`Số người: ${booking.numberOfGuests}`);
      console.log(`Ngày: ${booking.bookingDate.toLocaleDateString('vi-VN')}`);
      console.log(`Giờ: ${booking.bookingTime}`);
      console.log(`Trạng thái: ${booking.status}`);
      console.log(`Tổng tiền: ${booking.totalAmount.toLocaleString()}đ`);
      console.log(`Ngày tạo: ${booking.createdAt.toLocaleString('vi-VN')}`);
      
      if (booking.confirmedBy) {
        console.log(`Xác nhận bởi: ${booking.confirmedBy.fullName}`);
        console.log(`Ngày xác nhận: ${booking.confirmedAt.toLocaleString('vi-VN')}`);
      }

      console.log('\nMón đã đặt:');
      booking.menuItems.forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.item.name} (Size: ${item.size}) x${item.quantity} - ${(item.price * item.quantity).toLocaleString()}đ`);
      });

      if (booking.notes) {
        console.log(`Ghi chú: ${booking.notes}`);
      }
      
      console.log('\n' + '='.repeat(50) + '\n');
    });

    // Thống kê
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    console.log('=== THỐNG KÊ ===');
    stats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} bookings - ${stat.totalAmount.toLocaleString()}đ`);
    });

  } catch (error) {
    console.error('Error viewing bookings:', error);
  } finally {
    await mongoose.disconnect();
  }
}

viewBookings();
