const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Booking = require('../models/Booking');
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

// Lấy danh sách thông báo của user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    console.log('🔍 Debug notification API:');
    console.log('User ID from token:', req.user.id);
    console.log('User ID type:', typeof req.user.id);
    
    const notifications = await Notification.find({ user: req.user.id })
      .populate('bookingId', 'bookingDate bookingTime table totalAmount status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    console.log('Found notifications:', notifications.length);

    const total = await Notification.countDocuments({ user: req.user.id });
    const unreadCount = await Notification.countDocuments({ 
      user: req.user.id, 
      isRead: false 
    });

    res.json({
      notifications,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      },
      unreadCount
    });
  } catch (error) {
    console.error('Lỗi lấy thông báo:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Đánh dấu thông báo đã đọc
router.post('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }

    res.json({ message: 'Đã đánh dấu đã đọc' });
  } catch (error) {
    console.error('Lỗi đánh dấu thông báo:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Đánh dấu tất cả thông báo đã đọc
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ message: 'Đã đánh dấu tất cả thông báo đã đọc' });
  } catch (error) {
    console.error('Lỗi đánh dấu tất cả thông báo:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xóa thông báo
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }

    res.json({ message: 'Đã xóa thông báo' });
  } catch (error) {
    console.error('Lỗi xóa thông báo:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Tạo thông báo mới (cho admin)
router.post('/', async (req, res) => {
  try {
    const { user, type, title, message, bookingId } = req.body;

    const notification = new Notification({
      user,
      type,
      title,
      message,
      bookingId
    });

    await notification.save();

    res.status(201).json({ message: 'Thông báo đã được tạo', notification });
  } catch (error) {
    console.error('Lỗi tạo thông báo:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy thông báo cho khách hàng
router.get('/customer', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    console.log('🔍 Debug customer notification API:');
    console.log('User ID from token:', req.user.id);
    
    const notifications = await Notification.find({ user: req.user.id })
      .populate('bookingId', 'table numberOfGuests bookingDate bookingTime totalAmount status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments({ user: req.user.id });
    const unreadCount = await Notification.countDocuments({ 
      user: req.user.id, 
      isRead: false 
    });

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      unreadCount
    });
  } catch (error) {
    console.error('Lỗi lấy thông báo khách hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy thông báo cho nhân viên (không cần xác thực customer)
router.get('/employee', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Lấy tất cả thông báo (cho nhân viên)
    const notifications = await Notification.find({})
      .populate('user', 'fullName username')
      .populate('bookingId', 'table numberOfGuests bookingDate bookingTime totalAmount status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(skip);

    const total = await Notification.countDocuments({});
    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      unreadCount
    });
  } catch (error) {
    console.error('Lỗi lấy thông báo nhân viên:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
