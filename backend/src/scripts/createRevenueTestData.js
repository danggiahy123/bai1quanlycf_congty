require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Table = require('../models/Table');
const Customer = require('../models/Customer');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_management';

async function createRevenueTestData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Tạo dữ liệu orders đã thanh toán cho 7 ngày qua
    const today = new Date();
    const orders = [];

    for (let i = 0; i < 7; i++) {
      const orderDate = new Date(today);
      orderDate.setDate(orderDate.getDate() - i);
      orderDate.setHours(12, 0, 0, 0); // Đặt giờ cố định

      // Tạo 3-5 orders mỗi ngày
      const ordersPerDay = Math.floor(Math.random() * 3) + 3;
      
      for (let j = 0; j < ordersPerDay; j++) {
        const orderTime = new Date(orderDate);
        orderTime.setHours(orderTime.getHours() + j);

        const order = {
          tableId: `table${Math.floor(Math.random() * 10) + 1}`,
          tableName: `Bàn ${Math.floor(Math.random() * 10) + 1}`,
          items: [
            {
              menuId: `menu${Math.floor(Math.random() * 5) + 1}`,
              name: ['Cà phê đen', 'Cà phê sữa', 'Trà chanh', 'Nước ép cam', 'Bánh mì'][Math.floor(Math.random() * 5)],
              price: Math.floor(Math.random() * 50000) + 20000,
              quantity: Math.floor(Math.random() * 3) + 1,
              category: 'Đồ uống'
            }
          ],
          totalAmount: Math.floor(Math.random() * 200000) + 50000,
          status: 'paid',
          paymentMethod: 'cash',
          createdAt: orderTime,
          updatedAt: orderTime
        };

        orders.push(order);
      }
    }

    // Xóa orders cũ và tạo mới
    await Order.deleteMany({ status: 'paid' });
    const result = await Order.insertMany(orders);
    
    console.log(`Created ${result.length} test orders with revenue data`);

    // Tạo thống kê
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    console.log(`Total test revenue: ${totalRevenue.toLocaleString('vi-VN')} VND`);

    // Kiểm tra dữ liệu doanh thu
    const revenueData = await Order.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: '$_id',
          revenue: 1,
          orders: 1,
          _id: 0
        }
      }
    ]);

    console.log('Revenue by day:');
    revenueData.forEach(item => {
      console.log(`${item.date}: ${item.revenue.toLocaleString('vi-VN')} VND (${item.orders} orders)`);
    });

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    console.log('Test data created successfully!');

  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

createRevenueTestData();
