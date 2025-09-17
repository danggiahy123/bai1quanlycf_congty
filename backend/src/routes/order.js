const express = require('express');
const Order = require('../models/Order');
const Table = require('../models/Table');
const Notification = require('../models/Notification');
const Booking = require('../models/Booking');
const TableHistory = require('../models/TableHistory');
const inventoryService = require('../services/inventoryService');

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

    // Kiểm tra nguyên liệu có đủ không trước khi tạo order
    const availabilityCheck = await inventoryService.checkIngredientsAvailability(items[0]?.menuId, items[0]?.quantity || 1);
    if (!availabilityCheck.available) {
      return res.status(400).json({ 
        error: 'Không đủ nguyên liệu để làm món này',
        details: availabilityCheck.unavailableIngredients
      });
    }

    let order = await Order.findOne({ tableId, status: 'pending' });
    if (!order) {
      order = new Order({ tableId, items });
    } else {
      order.items = items;
    }
    await order.save();

    // Trừ nguyên liệu khi tạo order
    const deductResult = await inventoryService.deductIngredientsForOrder(items, order._id, tableId);
    if (!deductResult.success) {
      // Nếu trừ nguyên liệu thất bại, xóa order
      await Order.findByIdAndDelete(order._id);
      return res.status(400).json({ 
        error: 'Không thể trừ nguyên liệu',
        details: deductResult.errors
      });
    }

    await Table.findByIdAndUpdate(tableId, { status: 'ĐÃ ĐƯỢC ĐẶT' });
    
    // Emit Socket.IO event for new order
    const io = req.app.get('io');
    if (io) {
      io.to('employees').emit('order_status_changed', {
        orderId: order._id,
        tableId: tableId,
        status: 'pending',
        items: order.items,
        inventoryDeducted: deductResult.results,
        timestamp: new Date()
      });
    }
    
    res.json({
      ...order.toObject(),
      inventoryDeducted: deductResult.results
    });
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

    // Emit Socket.IO events for real-time updates
    const io = req.app.get('io');
    const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (io) {
      // Emit table status change
      io.emit('table_status_changed', {
        tableId: table._id,
        tableName: table.name,
        status: 'empty',
        bookingId: booking._id,
        customerName: booking.customerInfo?.fullName || 'N/A',
        timestamp: new Date()
      });

      // Emit order status change
      io.to('employees').emit('order_status_changed', {
        orderId: order._id,
        tableId: tableId,
        tableName: table.name,
        status: 'paid',
        totalAmount: totalAmount,
        customerId: booking.customer?._id,
        customerName: booking.customerInfo?.fullName || 'N/A',
        timestamp: new Date()
      });

      // Emit payment status change
      io.emit('payment_status_changed', {
        orderId: order._id,
        tableId: tableId,
        tableName: table.name,
        amount: totalAmount,
        status: 'completed',
        customerId: booking.customer?._id,
        customerName: booking.customerInfo?.fullName || 'N/A',
        timestamp: new Date()
      });
    }

    // Log table history for payment
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

// Hủy order và hoàn trả nguyên liệu
router.post('/by-table/:tableId/cancel', async (req, res) => {
  try {
    const tableId = req.params.tableId;
    const order = await Order.findOne({ tableId, status: 'pending' });
    
    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy order để hủy' });
    }

    // Hoàn trả nguyên liệu
    const returnResult = await inventoryService.returnIngredientsForOrder(order.items, order._id, tableId);
    
    // Xóa order
    await Order.findByIdAndDelete(order._id);
    
    // Cập nhật trạng thái bàn
    await Table.findByIdAndUpdate(tableId, { status: 'TRỐNG' });

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to('employees').emit('order_status_changed', {
        orderId: order._id,
        tableId: tableId,
        status: 'cancelled',
        items: order.items,
        inventoryReturned: returnResult.results,
        timestamp: new Date()
      });
    }

    res.json({
      message: 'Order đã được hủy',
      inventoryReturned: returnResult.results,
      errors: returnResult.errors
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// API để kiểm tra nguyên liệu có đủ cho món không
router.get('/check-ingredients/:menuId', async (req, res) => {
  try {
    const { menuId } = req.params;
    const { quantity = 1 } = req.query;
    
    const result = await inventoryService.checkIngredientsAvailability(menuId, parseInt(quantity));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;




