require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Menu = require('../models/Menu');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_management';

async function createRealOrdersFromMenu() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Lấy menu thực tế
    const menus = await Menu.find({}).sort({ name: 1 });
    console.log(`Found ${menus.length} menu items:`);
    menus.forEach(menu => {
      console.log(`- ${menu.name}: ${menu.price.toLocaleString('vi-VN')} VND`);
    });

    if (menus.length === 0) {
      console.log('❌ Không có menu items nào! Vui lòng tạo menu trước.');
      return;
    }

    // Xóa orders cũ
    await Order.deleteMany({ status: 'paid' });
    console.log('\nCleared old orders');

    const orders = [];
    const today = new Date();

    // Tạo dữ liệu cho 7 ngày gần đây
    for (let i = 7; i >= 1; i--) {
      const orderDate = new Date(today);
      orderDate.setDate(orderDate.getDate() - i);
      
      // Tạo 2-6 orders mỗi ngày
      const ordersPerDay = Math.floor(Math.random() * 5) + 2;
      
      for (let j = 0; j < ordersPerDay; j++) {
        const orderTime = new Date(orderDate);
        orderTime.setHours(7 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 60), 0, 0);

        // Chọn ngẫu nhiên 1-3 món từ menu thực tế
        const numItems = Math.floor(Math.random() * 3) + 1;
        const selectedMenus = [];
        const usedMenuIds = new Set();
        
        for (let k = 0; k < numItems; k++) {
          let randomMenu;
          do {
            randomMenu = menus[Math.floor(Math.random() * menus.length)];
          } while (usedMenuIds.has(randomMenu._id));
          
          usedMenuIds.add(randomMenu._id);
          selectedMenus.push(randomMenu);
        }

        // Tạo items cho order
        const items = selectedMenus.map(menu => ({
          menuId: menu._id,
          name: menu.name,
          price: menu.price,
          quantity: Math.floor(Math.random() * 3) + 1,
          category: menu.category || 'other'
        }));

        // Tính tổng tiền
        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const order = {
          tableId: `table${Math.floor(Math.random() * 10) + 1}`,
          tableName: `Bàn ${Math.floor(Math.random() * 10) + 1}`,
          items: items,
          totalAmount: totalAmount,
          status: 'paid',
          paymentMethod: 'cash',
          createdAt: orderTime,
          updatedAt: orderTime
        };

        orders.push(order);
      }
    }

    // Tạo dữ liệu cho 6 tuần gần đây
    for (let weekOffset = 6; weekOffset >= 1; weekOffset--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - (weekStart.getDay() - 1) - (weekOffset * 7));
      
      const ordersPerWeek = Math.floor(Math.random() * 6) + 3;
      
      for (let day = 0; day < 7; day++) {
        const orderDate = new Date(weekStart);
        orderDate.setDate(orderDate.getDate() + day);
        
        const ordersPerDay = Math.floor(Math.random() * 3);
        
        for (let i = 0; i < ordersPerDay; i++) {
          const orderTime = new Date(orderDate);
          orderTime.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0, 0);

          const numItems = Math.floor(Math.random() * 3) + 1;
          const selectedMenus = [];
          const usedMenuIds = new Set();
          
          for (let k = 0; k < numItems; k++) {
            let randomMenu;
            do {
              randomMenu = menus[Math.floor(Math.random() * menus.length)];
            } while (usedMenuIds.has(randomMenu._id));
            
            usedMenuIds.add(randomMenu._id);
            selectedMenus.push(randomMenu);
          }

          const items = selectedMenus.map(menu => ({
            menuId: menu._id,
            name: menu.name,
            price: menu.price,
            quantity: Math.floor(Math.random() * 3) + 1,
            category: menu.category || 'other'
          }));

          const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

          const order = {
            tableId: `table${Math.floor(Math.random() * 10) + 1}`,
            tableName: `Bàn ${Math.floor(Math.random() * 10) + 1}`,
            items: items,
            totalAmount: totalAmount,
            status: 'paid',
            paymentMethod: 'cash',
            createdAt: orderTime,
            updatedAt: orderTime
          };

          orders.push(order);
        }
      }
    }

    // Tạo dữ liệu cho 6 tháng gần đây
    for (let monthOffset = 6; monthOffset >= 1; monthOffset--) {
      const monthDate = new Date(today);
      monthDate.setMonth(monthDate.getMonth() - monthOffset);
      
      const ordersPerMonth = Math.floor(Math.random() * 11) + 5;
      
      for (let i = 0; i < ordersPerMonth; i++) {
        const orderDate = new Date(monthDate);
        orderDate.setDate(Math.floor(Math.random() * 28) + 1);
        orderDate.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0, 0);

        const numItems = Math.floor(Math.random() * 3) + 1;
        const selectedMenus = [];
        const usedMenuIds = new Set();
        
        for (let k = 0; k < numItems; k++) {
          let randomMenu;
          do {
            randomMenu = menus[Math.floor(Math.random() * menus.length)];
          } while (usedMenuIds.has(randomMenu._id));
          
          usedMenuIds.add(randomMenu._id);
          selectedMenus.push(randomMenu);
        }

        const items = selectedMenus.map(menu => ({
          menuId: menu._id,
          name: menu.name,
          price: menu.price,
          quantity: Math.floor(Math.random() * 3) + 1,
          category: menu.category || 'other'
        }));

        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const order = {
          tableId: `table${Math.floor(Math.random() * 10) + 1}`,
          tableName: `Bàn ${Math.floor(Math.random() * 10) + 1}`,
          items: items,
          totalAmount: totalAmount,
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
    console.log(`\nCreated ${result.length} orders from real menu`);

    // Tính tổng doanh thu
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    console.log(`Total revenue: ${totalRevenue.toLocaleString('vi-VN')} VND`);

    // Kiểm tra top items thực tế
    console.log('\n=== TOP ITEMS SAU KHI TẠO ===');
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

    console.log('Top món bán chạy:');
    topItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} - ${item.totalSold} món - ${item.revenue.toLocaleString('vi-VN')} VND`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    console.log('✅ Successfully created real orders from menu!');

  } catch (error) {
    console.error('Error creating real orders:', error);
    process.exit(1);
  }
}

createRealOrdersFromMenu();
