require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Menu = require('../models/Menu');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cafe_app';

async function createSampleData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Lấy danh sách menu items
    const menuItems = await Menu.find();
    if (menuItems.length === 0) {
      console.log('No menu items found. Please create menu items first.');
      return;
    }

    // Tạo dữ liệu đơn hàng mẫu cho 30 ngày qua
    const orders = [];
    const now = new Date();
    
    for (let i = 0; i < 30; i++) {
      const orderDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      
      // Tạo 1-5 đơn hàng mỗi ngày
      const ordersPerDay = Math.floor(Math.random() * 5) + 1;
      
      for (let j = 0; j < ordersPerDay; j++) {
        // Chọn ngẫu nhiên 1-3 món từ menu
        const numItems = Math.floor(Math.random() * 3) + 1;
        const selectedItems = [];
        
        for (let k = 0; k < numItems; k++) {
          const randomItem = menuItems[Math.floor(Math.random() * menuItems.length)];
          selectedItems.push({
            menuId: randomItem._id,
            name: randomItem.name,
            price: randomItem.price,
            quantity: Math.floor(Math.random() * 3) + 1,
            category: randomItem.category || 'other'
          });
        }
        
        const totalAmount = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        orders.push({
          tableId: `table_${Math.floor(Math.random() * 10) + 1}`,
          tableName: `Bàn ${Math.floor(Math.random() * 10) + 1}`,
          customerId: `customer_${Math.floor(Math.random() * 20) + 1}`,
          customerName: `Khách hàng ${Math.floor(Math.random() * 20) + 1}`,
          items: selectedItems,
          totalAmount: totalAmount,
          status: 'paid',
          paymentMethod: 'cash',
          createdAt: new Date(orderDate.getTime() + Math.random() * 24 * 60 * 60 * 1000),
          updatedAt: new Date(orderDate.getTime() + Math.random() * 24 * 60 * 60 * 1000)
        });
      }
    }

    // Xóa dữ liệu cũ nếu có
    await Order.deleteMany({});
    console.log('Cleared existing orders');

    // Thêm dữ liệu mới
    await Order.insertMany(orders);
    console.log(`Created ${orders.length} sample orders`);

    // Thống kê
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    console.log(`Total orders: ${totalOrders}`);
    console.log(`Total revenue: ${totalRevenue[0]?.total || 0} VND`);

    // Top items
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

    console.log('Top 5 selling items:');
    topItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name}: ${item.totalSold} sold, ${item.revenue} VND`);
    });

  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createSampleData();
