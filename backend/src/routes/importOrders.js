const express = require('express');
const jwt = require('jsonwebtoken');
const ImportOrder = require('../models/ImportOrder');
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

// Lấy danh sách đơn nhập hàng
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = '', 
      supplier = '',
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

    // Filter by supplier
    if (supplier) {
      query['supplier.name'] = { $regex: supplier, $options: 'i' };
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

    const orders = await ImportOrder.find(query)
      .populate('approvedBy', 'fullName')
      .populate('receivedBy', 'fullName')
      .populate('items.ingredient', 'name unit')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ImportOrder.countDocuments(query);

    res.json({
      orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách đơn nhập hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy đơn nhập hàng theo ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await ImportOrder.findById(req.params.id)
      .populate('approvedBy', 'fullName')
      .populate('receivedBy', 'fullName')
      .populate('items.ingredient', 'name unit currentStock');

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn nhập hàng' });
    }

    res.json(order);
  } catch (error) {
    console.error('Lỗi lấy đơn nhập hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Tạo đơn nhập hàng mới
router.post('/', authenticateToken, async (req, res) => {
  try {
    const orderData = req.body;
    
    // Validate items
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ message: 'Đơn nhập hàng phải có ít nhất 1 sản phẩm' });
    }

    // Calculate total amount
    let totalAmount = 0;
    for (const item of orderData.items) {
      item.totalPrice = item.quantity * item.unitPrice;
      totalAmount += item.totalPrice;
    }

    orderData.totalAmount = totalAmount;
    orderData.finalAmount = totalAmount - (orderData.discount || 0) + (orderData.tax || 0);

    const order = new ImportOrder(orderData);
    await order.save();

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to('employees').emit('inventory_updated', {
        type: 'import_order_created',
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      message: 'Tạo đơn nhập hàng thành công',
      order
    });
  } catch (error) {
    console.error('Lỗi tạo đơn nhập hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cập nhật đơn nhập hàng
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Only allow update if status is pending
    const existingOrder = await ImportOrder.findById(id);
    if (!existingOrder) {
      return res.status(404).json({ message: 'Không tìm thấy đơn nhập hàng' });
    }

    if (existingOrder.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Chỉ có thể cập nhật đơn nhập hàng đang chờ duyệt' 
      });
    }

    // Recalculate total amount if items are updated
    if (updateData.items) {
      let totalAmount = 0;
      for (const item of updateData.items) {
        item.totalPrice = item.quantity * item.unitPrice;
        totalAmount += item.totalPrice;
      }
      updateData.totalAmount = totalAmount;
      updateData.finalAmount = totalAmount - (updateData.discount || 0) + (updateData.tax || 0);
    }

    const order = await ImportOrder.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('items.ingredient', 'name unit');

    res.json({
      message: 'Cập nhật đơn nhập hàng thành công',
      order
    });
  } catch (error) {
    console.error('Lỗi cập nhật đơn nhập hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Duyệt đơn nhập hàng
router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const order = await ImportOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn nhập hàng' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Chỉ có thể duyệt đơn nhập hàng đang chờ duyệt' 
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
        type: 'import_order_approved',
        orderId: order._id,
        orderNumber: order.orderNumber,
        approvedBy: req.user.fullName,
        timestamp: new Date()
      });
    }

    res.json({
      message: 'Duyệt đơn nhập hàng thành công',
      order
    });
  } catch (error) {
    console.error('Lỗi duyệt đơn nhập hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Nhận hàng
router.post('/:id/receive', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const order = await ImportOrder.findById(id)
      .populate('items.ingredient');
    
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn nhập hàng' });
    }

    if (order.status !== 'approved') {
      return res.status(400).json({ 
        message: 'Chỉ có thể nhận hàng đã được duyệt' 
      });
    }

    // Update stock for each item
    for (const item of order.items) {
      const ingredient = item.ingredient;
      const previousStock = ingredient.currentStock;
      const newStock = previousStock + item.quantity;

      // Update ingredient stock
      ingredient.currentStock = newStock;
      await ingredient.save();

      // Create inventory transaction
      await InventoryTransaction.createTransaction({
        ingredient: ingredient._id,
        transactionType: 'import',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        previousStock,
        newStock,
        reference: order.orderNumber,
        referenceId: order._id,
        performedBy: req.user.id,
        performedByName: req.user.fullName || 'System',
        reason: 'Nhập hàng',
        notes: notes || `Nhập hàng từ đơn ${order.orderNumber}`,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        department: 'warehouse'
      });
    }

    await order.receive(req.user.id);
    if (notes) {
      order.notes = notes;
      await order.save();
    }

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to('employees').emit('inventory_updated', {
        type: 'import_order_received',
        orderId: order._id,
        orderNumber: order.orderNumber,
        receivedBy: req.user.fullName,
        timestamp: new Date()
      });
    }

    res.json({
      message: 'Nhận hàng thành công',
      order
    });
  } catch (error) {
    console.error('Lỗi nhận hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Hủy đơn nhập hàng
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await ImportOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn nhập hàng' });
    }

    if (order.status === 'received') {
      return res.status(400).json({ 
        message: 'Không thể hủy đơn nhập hàng đã nhận' 
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
        type: 'import_order_cancelled',
        orderId: order._id,
        orderNumber: order.orderNumber,
        reason,
        timestamp: new Date()
      });
    }

    res.json({
      message: 'Hủy đơn nhập hàng thành công',
      order
    });
  } catch (error) {
    console.error('Lỗi hủy đơn nhập hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xóa đơn nhập hàng
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await ImportOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn nhập hàng' });
    }

    if (order.status === 'received') {
      return res.status(400).json({ 
        message: 'Không thể xóa đơn nhập hàng đã nhận' 
      });
    }

    await ImportOrder.findByIdAndDelete(id);

    res.json({ message: 'Xóa đơn nhập hàng thành công' });
  } catch (error) {
    console.error('Lỗi xóa đơn nhập hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy thống kê đơn nhập hàng
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

    const totalOrders = await ImportOrder.countDocuments(dateFilter);
    const pendingOrders = await ImportOrder.countDocuments({ ...dateFilter, status: 'pending' });
    const approvedOrders = await ImportOrder.countDocuments({ ...dateFilter, status: 'approved' });
    const receivedOrders = await ImportOrder.countDocuments({ ...dateFilter, status: 'received' });
    const cancelledOrders = await ImportOrder.countDocuments({ ...dateFilter, status: 'cancelled' });

    // Calculate total amount
    const orders = await ImportOrder.find(dateFilter);
    const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalFinalAmount = orders.reduce((sum, order) => sum + order.finalAmount, 0);

    // Top suppliers
    const supplierStats = await ImportOrder.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$supplier.name',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      totalOrders,
      pendingOrders,
      approvedOrders,
      receivedOrders,
      cancelledOrders,
      totalAmount,
      totalFinalAmount,
      supplierStats
    });
  } catch (error) {
    console.error('Lỗi lấy thống kê đơn nhập hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
