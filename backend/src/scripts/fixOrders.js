require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_management';

async function fixOrders() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const orders = await Order.find();
    console.log(`Found ${orders.length} orders`);

    for (const order of orders) {
      // Tính totalAmount từ items
      const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Cập nhật order với totalAmount
      await Order.findByIdAndUpdate(order._id, { 
        totalAmount: totalAmount,
        tableName: order.tableName || `Bàn ${order.tableId}`,
        customerId: order.customerId || `customer_${Math.floor(Math.random() * 20) + 1}`,
        customerName: order.customerName || `Khách hàng ${Math.floor(Math.random() * 20) + 1}`,
        paymentMethod: order.paymentMethod || 'cash'
      });
    }

    console.log('Updated all orders with totalAmount');

    // Kiểm tra lại
    const revenueData = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    console.log('Revenue data after fix:', revenueData);

  } catch (error) {
    console.error('Error fixing orders:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixOrders();
