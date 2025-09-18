require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Table = require('../models/Table');
const Customer = require('../models/Customer');
const Employee = require('../models/Employee');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_management';

async function testDashboardAPI() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Test stats API logic
    const totalTables = await Table.countDocuments();
    const occupiedTables = await Table.countDocuments({ status: 'occupied' });
    const totalOrders = await Order.countDocuments();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today }
    });

    // Thống kê doanh thu
    const totalRevenueResult = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    const todayRevenueResult = await Order.aggregate([
      { 
        $match: { 
          status: 'paid',
          createdAt: { $gte: today }
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const todayRevenue = todayRevenueResult.length > 0 ? todayRevenueResult[0].total : 0;

    // Thống kê người dùng
    const totalCustomers = await Customer.countDocuments();
    const totalEmployees = await Employee.countDocuments();

    console.log('Dashboard Stats:');
    console.log({
      totalTables,
      occupiedTables,
      totalOrders,
      todayOrders,
      totalRevenue,
      todayRevenue,
      totalCustomers,
      totalEmployees
    });

    // Test top items
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

    console.log('\nTop Items:');
    console.log(topItems);

  } catch (error) {
    console.error('Error testing dashboard API:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testDashboardAPI();
