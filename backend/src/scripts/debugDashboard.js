require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_management';

async function debugDashboard() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Kiểm tra orders
    const totalOrders = await Order.countDocuments();
    console.log(`Total orders: ${totalOrders}`);

    const paidOrders = await Order.countDocuments({ status: 'paid' });
    console.log(`Paid orders: ${paidOrders}`);

    // Kiểm tra một order cụ thể
    const sampleOrder = await Order.findOne({ status: 'paid' });
    if (sampleOrder) {
      console.log('Sample order:', {
        _id: sampleOrder._id,
        status: sampleOrder.status,
        totalAmount: sampleOrder.totalAmount,
        items: sampleOrder.items.length
      });
    }

    // Test aggregation
    const revenueResult = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    console.log('Revenue aggregation result:', revenueResult);

    // Test top items
    const topItems = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuId',
          name: { $first: '$items.name' },
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);
    console.log('Top items result:', topItems);

  } catch (error) {
    console.error('Error debugging dashboard:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

debugDashboard();
