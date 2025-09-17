const express = require('express');
const Order = require('../models/Order');
const Table = require('../models/Table');
const Notification = require('../models/Notification');
const Booking = require('../models/Booking');
const TableHistory = require('../models/TableHistory');

const router = express.Router();

// Get current active order by tableId (status pending)
router.get('/by-table/:tableId', async (req, res) => {
  try {
    const order = await Order.findOne({ tableId: req.params.tableId, status: 'pending' });
    res.json(order || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upsert items for a table (create pending order or update its items)
router.post('/by-table/:tableId', async (req, res) => {
  try {
    const { items } = req.body; // [{menuId,name,price,quantity}]
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be an array' });
    const tableId = req.params.tableId;
    let order = await Order.findOne({ tableId, status: 'pending' });
    if (!order) {
      order = new Order({ tableId, items });
    } else {
      order.items = items;
    }
    await order.save();
    await Table.findByIdAndUpdate(tableId, { status: 'ĐÃ ĐƯỢC ĐẶT' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Mark order as paid and free the table
router.post('/by-table/:tableId/pay', async (req, res) => {
  try {
    const tableId = req.params.tableId;
    
    // Kiểm tra xem có booking đã được xác nhận cho bàn này không
    const booking = await Booking.findOne({ 
      table: tableId, 
      status: 'confirmed' 
    }).populate('customer');

    if (!booking) {
      return res.status(400).json({ 
        error: 'Không thể thanh toán. Bàn này chưa có đặt bàn được xác nhận hoặc đặt bàn chưa được xác nhận bởi nhân viên.' 
      });
    }

    const order = await Order.findOneAndUpdate({ tableId, status: 'pending' }, { status: 'paid' }, { new: true });
    
    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy order để thanh toán' });
    }

    // Cập nhật booking thành completed
    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();

    // Free the table
    const table = await Table.findByIdAndUpdate(tableId, { status: 'TRỐNG' }, { new: true });

    // Log table history for payment
    const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    await TableHistory.create({
      tableId: table._id,
      tableName: table.name,
      action: 'PAID',
      performedBy: req.user?.id || 'system',
      performedByName: req.user?.fullName || 'System',
      customerName: booking.customerInfo?.fullName || 'Khách hàng',
      bookingId: booking._id,
      amount: totalAmount
    });

    // Send notification to customer if booking exists
    if (booking && booking.customer) {
      const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const notification = new Notification({
        user: booking.customer._id,
        type: 'payment_completed',
        title: 'Thanh toán hoàn tất',
        message: `Đơn hàng tại bàn ${booking.table.name} đã được thanh toán thành công. Tổng tiền: ${totalAmount.toLocaleString()}đ. Cảm ơn bạn đã sử dụng dịch vụ!`,
        bookingId: booking._id
      });
      
      await notification.save();
    }

    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;




