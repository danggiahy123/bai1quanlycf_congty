require('dotenv').config();
const mongoose = require('mongoose');
const Menu = require('../models/Menu');
const Order = require('../models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_management';

async function checkRealMenu() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Kiểm tra menu hiện tại
    console.log('\n=== MENU HIỆN TẠI ===');
    const menus = await Menu.find({}).sort({ name: 1 });
    console.log(`Tổng số món: ${menus.length}`);
    
    menus.forEach((menu, index) => {
      console.log(`${index + 1}. ${menu.name} - ${menu.price?.toLocaleString('vi-VN')} VND (${menu.category || 'N/A'})`);
    });

    // Kiểm tra orders hiện tại
    console.log('\n=== ORDERS HIỆN TẠI ===');
    const orders = await Order.find({ status: 'paid' }).sort({ createdAt: -1 }).limit(10);
    console.log(`Tổng số orders đã thanh toán: ${await Order.countDocuments({ status: 'paid' })}`);
    
    if (orders.length > 0) {
      console.log('\n10 orders gần nhất:');
      orders.forEach((order, index) => {
        console.log(`${index + 1}. ${order.createdAt.toLocaleDateString('vi-VN')} - ${order.totalAmount.toLocaleString('vi-VN')} VND`);
        console.log(`   Items: ${order.items.map(item => `${item.name} (${item.quantity})`).join(', ')}`);
      });
    }

    // Kiểm tra top items thực tế
    console.log('\n=== TOP ITEMS THỰC TẾ ===');
    const topItems = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuId',
          name: { $first: '$items.name' },
          category: { $first: '$items.category' },
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    if (topItems.length > 0) {
      console.log('Top món bán chạy thực tế:');
      topItems.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name} - ${item.totalSold} món - ${item.revenue.toLocaleString('vi-VN')} VND`);
      });
    } else {
      console.log('Không có dữ liệu orders để tính top items');
    }

    // Kiểm tra doanh thu thực tế
    console.log('\n=== DOANH THU THỰC TẾ ===');
    const revenueStats = await Order.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    if (revenueStats.length > 0) {
      const stats = revenueStats[0];
      console.log(`Tổng doanh thu: ${stats.totalRevenue.toLocaleString('vi-VN')} VND`);
      console.log(`Tổng đơn hàng: ${stats.totalOrders}`);
      console.log(`Giá trị trung bình/đơn: ${Math.round(stats.avgOrderValue).toLocaleString('vi-VN')} VND`);
    } else {
      console.log('Không có dữ liệu doanh thu');
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');

  } catch (error) {
    console.error('Error checking real menu:', error);
    process.exit(1);
  }
}

checkRealMenu();
