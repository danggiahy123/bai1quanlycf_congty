require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_management';

async function createCleanRevenueData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Xóa dữ liệu cũ
    await Order.deleteMany({ status: 'paid' });
    console.log('Cleared old data');

    const orders = [];
    const today = new Date();

    // Tạo dữ liệu cho 7 ngày gần đây (từ hôm qua trở về trước)
    for (let i = 7; i >= 1; i--) {
      const orderDate = new Date(today);
      orderDate.setDate(orderDate.getDate() - i);
      
      // Tạo 2-6 orders mỗi ngày
      const ordersPerDay = Math.floor(Math.random() * 5) + 2;
      
      for (let j = 0; j < ordersPerDay; j++) {
        const orderTime = new Date(orderDate);
        orderTime.setHours(7 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 60), 0, 0);

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

    // Tạo dữ liệu cho 6 tuần gần đây (cho view tuần)
    for (let weekOffset = 6; weekOffset >= 1; weekOffset--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - (weekStart.getDay() - 1) - (weekOffset * 7)); // Thứ 2
      
      // Tạo 3-8 orders mỗi tuần
      const ordersPerWeek = Math.floor(Math.random() * 6) + 3;
      
      for (let day = 0; day < 7; day++) {
        const orderDate = new Date(weekStart);
        orderDate.setDate(orderDate.getDate() + day);
        
        // Tạo 0-2 orders mỗi ngày trong tuần
        const ordersPerDay = Math.floor(Math.random() * 3);
        
        for (let i = 0; i < ordersPerDay; i++) {
          const orderTime = new Date(orderDate);
          orderTime.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0, 0);

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
    }

    // Tạo dữ liệu cho 6 tháng gần đây (cho view tháng)
    for (let monthOffset = 6; monthOffset >= 1; monthOffset--) {
      const monthDate = new Date(today);
      monthDate.setMonth(monthDate.getMonth() - monthOffset);
      
      // Tạo 5-15 orders mỗi tháng
      const ordersPerMonth = Math.floor(Math.random() * 11) + 5;
      
      for (let i = 0; i < ordersPerMonth; i++) {
        const orderDate = new Date(monthDate);
        orderDate.setDate(Math.floor(Math.random() * 28) + 1);
        orderDate.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0, 0);

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
          createdAt: orderDate,
          updatedAt: orderDate
        };

        orders.push(order);
      }
    }

    // Insert tất cả orders
    const result = await Order.insertMany(orders);
    console.log(`Created ${result.length} test orders with clean revenue data`);

    // Tính tổng doanh thu
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    console.log(`Total test revenue: ${totalRevenue.toLocaleString('vi-VN')} VND`);

    // Test các view khác nhau
    console.log('\n=== Testing different views ===');
    
    // Test day view (7 ngày gần đây)
    const dayData = await Order.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { 
            $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
            $lt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000) // Không bao gồm hôm nay
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('Day view (last 7 days):');
    dayData.forEach(item => {
      console.log(`  ${item._id}: ${item.revenue.toLocaleString('vi-VN')} VND (${item.orders} orders)`);
    });

    // Test week view
    const weekData = await Order.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: new Date(today.getTime() - 6 * 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-W%U', date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\nWeek view (last 6 weeks):');
    weekData.forEach(item => {
      console.log(`  Week ${item._id}: ${item.revenue.toLocaleString('vi-VN')} VND (${item.orders} orders)`);
    });

    // Test month view
    const monthData = await Order.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: new Date(today.getTime() - 6 * 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\nMonth view (last 6 months):');
    monthData.forEach(item => {
      console.log(`  ${item._id}: ${item.revenue.toLocaleString('vi-VN')} VND (${item.orders} orders)`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    console.log('Clean test data created successfully!');

  } catch (error) {
    console.error('Error creating clean test data:', error);
    process.exit(1);
  }
}

createCleanRevenueData();
