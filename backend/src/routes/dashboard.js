const express = require('express');
const jwt = require('jsonwebtoken');
const Table = require('../models/Table');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Employee = require('../models/Employee');
const Menu = require('../models/Menu');
const Booking = require('../models/Booking');
const InventoryTransaction = require('../models/InventoryTransaction');
const router = express.Router();

// Middleware để xác thực token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Token không được cung cấp' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

// Lấy thống kê tổng quan (public endpoint)
router.get('/stats', async (req, res) => {
  try {
    // Thống kê bàn
    const totalTables = await Table.countDocuments();
    const occupiedTables = await Table.countDocuments({ status: 'occupied' });

    // Thống kê đơn hàng
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

    res.json({
      totalTables,
      occupiedTables,
      totalOrders,
      todayOrders,
      totalRevenue,
      todayRevenue,
      totalCustomers,
      totalEmployees
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thống kê' });
  }
});

// Lấy dữ liệu doanh thu theo thời gian
router.get('/revenue', authenticateToken, async (req, res) => {
  try {
    const { range = 'day' } = req.query;
    let groupFormat, dateFormat, startDate;

    const now = new Date();
    
    switch (range) {
      case 'day':
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        dateFormat = '%Y-%m-%d';
        // Chỉ lấy 7 ngày gần đây, bắt đầu từ hôm qua
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        // Tính tuần từ thứ 2 đến chủ nhật
        groupFormat = { 
          $dateToString: { 
            format: '%Y-W%U', 
            date: '$createdAt',
            timezone: 'Asia/Ho_Chi_Minh'
          } 
        };
        dateFormat = '%Y-W%U';
        startDate = new Date(now.getTime() - 6 * 7 * 24 * 60 * 60 * 1000); // 6 tuần
        break;
      case 'month':
        groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        dateFormat = '%Y-%m';
        startDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000); // 6 tháng
        break;
      default:
        return res.status(400).json({ message: 'Range không hợp lệ' });
    }

    const revenueData = await Order.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: groupFormat,
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

    res.json(revenueData);
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu doanh thu' });
  }
});

// Lấy top món bán chạy
router.get('/top-items', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

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
      { $limit: parseInt(limit) }
    ]);

    res.json(topItems);
  } catch (error) {
    console.error('Error fetching top items:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy top món bán chạy' });
  }
});

// Lấy hoạt động gần đây
router.get('/recent-activities', authenticateToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const activities = [];

    // Lấy đặt bàn gần đây
    const recentBookings = await Booking.find()
      .populate('customer', 'fullName phone')
      .populate('table', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 4);

    recentBookings.forEach(booking => {
      activities.push({
        _id: `booking_${booking._id}`,
        type: 'booking',
        description: `Đặt bàn mới từ ${booking.customer?.fullName || booking.customerInfo?.fullName || 'Khách hàng'}`,
        tableName: booking.table?.name,
        amount: booking.totalAmount,
        createdAt: booking.createdAt
      });
    });

    // Lấy thanh toán gần đây
    const recentPayments = await Order.find({ status: 'paid' })
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit) / 4);

    recentPayments.forEach(order => {
      activities.push({
        _id: `payment_${order._id}`,
        type: 'payment',
        description: `Thanh toán hoàn tất`,
        tableName: order.tableName || `Bàn ${order.tableId}`,
        amount: order.totalAmount,
        createdAt: order.updatedAt
      });
    });

    // Lấy đơn hàng gần đây
    const recentOrders = await Order.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 4);

    recentOrders.forEach(order => {
      activities.push({
        _id: `order_${order._id}`,
        type: 'order',
        description: `Đơn hàng mới`,
        tableName: order.tableName || `Bàn ${order.tableId}`,
        amount: order.totalAmount,
        createdAt: order.createdAt
      });
    });

    // Lấy giao dịch kho gần đây
    const recentInventory = await InventoryTransaction.find()
      .populate('ingredient', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 4);

    recentInventory.forEach(transaction => {
      activities.push({
        _id: `inventory_${transaction._id}`,
        type: 'inventory',
        description: `${transaction.transactionType === 'import' ? 'Nhập' : 'Xuất'} ${transaction.ingredient.name}`,
        amount: transaction.totalAmount,
        createdAt: transaction.createdAt
      });
    });

    // Sắp xếp theo thời gian và giới hạn
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    activities.splice(parseInt(limit));

    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy hoạt động gần đây' });
  }
});

module.exports = router;
