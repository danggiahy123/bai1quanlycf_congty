const express = require('express');
const jwt = require('jsonwebtoken');
const ExportOrder = require('../models/ExportOrder');
const Ingredient = require('../models/Ingredient');
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

// Lấy danh sách đơn xuất kho
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = '', 
      department = '',
      startDate = '',
      endDate = '',
      sortBy = 'orderDate',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by department
    if (department) {
      query.department = department;
    }

    // Filter by date range
    if (startDate && endDate) {
      query.orderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const orders = await ExportOrder.find(query)
      .populate('requestedBy', 'fullName')
      .populate('approvedBy', 'fullName')
      .populate('completedBy', 'fullName')
      .populate('items.ingredient', 'name unit currentStock')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ExportOrder.countDocuments(query);

    res.json({
      orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách đơn xuất kho:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy đơn xuất kho theo ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await ExportOrder.findById(req.params.id)
      .populate('requestedBy', 'fullName')
      .populate('approvedBy', 'fullName')
      .populate('completedBy', 'fullName')
      .populate('items.ingredient', 'name unit currentStock');

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn xuất kho' });
    }

    res.json(order);
  } catch (error) {
    console.error('Lỗi lấy đơn xuất kho:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Tạo đơn xuất kho mới
router.post('/', authenticateToken, async (req, res) => {
  try {
    const orderData = req.body;
    
    // Validate items
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ message: 'Đơn xuất kho phải có ít nhất 1 sản phẩm' });
    }

    // Check stock availability
    for (const item of orderData.items) {
      const ingredient = await Ingredient.findById(item.ingredient);
      if (!ingredient) {
        return res.status(400).json({ 
          message: `Nguyên liệu ${item.ingredient} không tồn tại` 
        });
      }

      if (ingredient.currentStock < item.quantity) {
        return res.status(400).json({ 
          message: `Không đủ tồn kho cho ${ingredient.name}. Tồn kho hiện tại: ${ingredient.currentStock}` 
        });
      }
    }

    // Calculate total amount
    let totalAmount = 0;
    for (const item of orderData.items) {
      const ingredient = await Ingredient.findById(item.ingredient);
      item.unitPrice = ingredient.unitPrice;
      item.totalPrice = item.quantity * item.unitPrice;
      totalAmount += item.totalPrice;
    }

    orderData.totalAmount = totalAmount;
    orderData.requestedBy = req.user.id;

    const order = new ExportOrder(orderData);
    await order.save();

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to('employees').emit('inventory_updated', {
        type: 'export_order_created',
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        department: order.department,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      message: 'Tạo đơn xuất kho thành công',
      order
    });
  } catch (error) {
    console.error('Lỗi tạo đơn xuất kho:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cập nhật đơn xuất kho
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Only allow update if status is pending
    const existingOrder = await ExportOrder.findById(id);
    if (!existingOrder) {
      return res.status(404).json({ message: 'Không tìm thấy đơn xuất kho' });
    }

    if (existingOrder.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Chỉ có thể cập nhật đơn xuất kho đang chờ duyệt' 
      });
    }

    // Recalculate total amount if items are updated
    if (updateData.items) {
      let totalAmount = 0;
      for (const item of updateData.items) {
        const ingredient = await Ingredient.findById(item.ingredient);
        item.unitPrice = ingredient.unitPrice;
        item.totalPrice = item.quantity * item.unitPrice;
        totalAmount += item.totalPrice;
      }
      updateData.totalAmount = totalAmount;
    }

    const order = await ExportOrder.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('items.ingredient', 'name unit');

    res.json({
      message: 'Cập nhật đơn xuất kho thành công',
      order
    });
  } catch (error) {
    console.error('Lỗi cập nhật đơn xuất kho:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Duyệt đơn xuất kho
router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const order = await ExportOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn xuất kho' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Chỉ có thể duyệt đơn xuất kho đang chờ duyệt' 
      });
    }

    await order.approve(req.user.id);
    if (notes) {
      order.notes = notes;
      await order.save();
    }

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to('employees').emit('inventory_updated', {
        type: 'export_order_approved',
        orderId: order._id,
        orderNumber: order.orderNumber,
        approvedBy: req.user.fullName,
        timestamp: new Date()
      });
    }

    res.json({
      message: 'Duyệt đơn xuất kho thành công',
      order
    });
  } catch (error) {
    console.error('Lỗi duyệt đơn xuất kho:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Hoàn thành đơn xuất kho
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const order = await ExportOrder.findById(id)
      .populate('items.ingredient');
    
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn xuất kho' });
    }

    if (order.status !== 'approved') {
      return res.status(400).json({ 
        message: 'Chỉ có thể hoàn thành đơn xuất kho đã được duyệt' 
      });
    }

    // Update stock for each item
    for (const item of order.items) {
      const ingredient = item.ingredient;
      const previousStock = ingredient.currentStock;
      const newStock = Math.max(0, previousStock - item.quantity);

      // Update ingredient stock
      ingredient.currentStock = newStock;
      await ingredient.save();

      // Create inventory transaction
      await InventoryTransaction.createTransaction({
        ingredient: ingredient._id,
        transactionType: 'export',
        quantity: -item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        previousStock,
        newStock,
        reference: order.orderNumber,
        referenceId: order._id,
        performedBy: req.user.id,
        performedByName: req.user.fullName || 'System',
        reason: item.reason || 'Xuất kho',
        notes: notes || `Xuất kho từ đơn ${order.orderNumber}`,
        department: order.department
      });
    }

    await order.complete(req.user.id);
    if (notes) {
      order.notes = notes;
      await order.save();
    }

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to('employees').emit('inventory_updated', {
        type: 'export_order_completed',
        orderId: order._id,
        orderNumber: order.orderNumber,
        completedBy: req.user.fullName,
        timestamp: new Date()
      });
    }

    res.json({
      message: 'Hoàn thành đơn xuất kho thành công',
      order
    });
  } catch (error) {
    console.error('Lỗi hoàn thành đơn xuất kho:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Hủy đơn xuất kho
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await ExportOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn xuất kho' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ 
        message: 'Không thể hủy đơn xuất kho đã hoàn thành' 
      });
    }

    await order.cancel();
    if (reason) {
      order.notes = reason;
      await order.save();
    }

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to('employees').emit('inventory_updated', {
        type: 'export_order_cancelled',
        orderId: order._id,
        orderNumber: order.orderNumber,
        reason,
        timestamp: new Date()
      });
    }

    res.json({
      message: 'Hủy đơn xuất kho thành công',
      order
    });
  } catch (error) {
    console.error('Lỗi hủy đơn xuất kho:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xóa đơn xuất kho
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await ExportOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn xuất kho' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ 
        message: 'Không thể xóa đơn xuất kho đã hoàn thành' 
      });
    }

    await ExportOrder.findByIdAndDelete(id);

    res.json({ message: 'Xóa đơn xuất kho thành công' });
  } catch (error) {
    console.error('Lỗi xóa đơn xuất kho:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy thống kê đơn xuất kho
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = {};

    if (startDate && endDate) {
      dateFilter.orderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const totalOrders = await ExportOrder.countDocuments(dateFilter);
    const pendingOrders = await ExportOrder.countDocuments({ ...dateFilter, status: 'pending' });
    const approvedOrders = await ExportOrder.countDocuments({ ...dateFilter, status: 'approved' });
    const completedOrders = await ExportOrder.countDocuments({ ...dateFilter, status: 'completed' });
    const cancelledOrders = await ExportOrder.countDocuments({ ...dateFilter, status: 'cancelled' });

    // Calculate total amount
    const orders = await ExportOrder.find(dateFilter);
    const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Top departments
    const departmentStats = await ExportOrder.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    res.json({
      totalOrders,
      pendingOrders,
      approvedOrders,
      completedOrders,
      cancelledOrders,
      totalAmount,
      departmentStats
    });
  } catch (error) {
    console.error('Lỗi lấy thống kê đơn xuất kho:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
