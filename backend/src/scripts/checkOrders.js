require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_management';

async function checkOrders() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const orders = await Order.find();
    console.log(`Total orders: ${orders.length}`);
    
    if (orders.length > 0) {
      console.log('First order:', JSON.stringify(orders[0], null, 2));
    }

    // Kiểm tra aggregation
    const revenueData = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    console.log('Revenue data:', revenueData);

  } catch (error) {
    console.error('Error checking orders:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkOrders();
