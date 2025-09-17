const express = require('express');
const Table = require('../models/Table');
const TableHistory = require('../models/TableHistory');
const Order = require('../models/Order');

const router = express.Router();

function generateId() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// Helper function to log table history
async function logTableHistory(tableId, tableName, action, performedBy, performedByName, additionalData = {}) {
  try {
    const history = new TableHistory({
      tableId,
      tableName,
      action,
      performedBy,
      performedByName,
      ...additionalData
    });
    await history.save();
  } catch (error) {
    console.error('Lỗi ghi lịch sử bàn:', error);
  }
}

// List all tables (optionally filter by status)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const tables = await Table.find(query).sort({ createdAt: 1 });
    res.json(tables);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new table
router.post('/', async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload._id) {
      for (let i = 0; i < 5; i++) {
        const id = generateId();
        const exists = await Table.exists({ _id: id });
        if (!exists) { payload._id = id; break; }
      }
      if (!payload._id) return res.status(500).json({ error: 'Không tạo được ID' });
    }
    if (!payload.name) payload.name = `Bàn ${payload._id}`;
    const table = new Table(payload);
    await table.save();
    res.json(table);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update table
router.put('/:id', async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(table);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete table
router.delete('/:id', async (req, res) => {
  try {
    await Table.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Mark table as occupied
router.post('/:id/occupy', async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, { status: 'occupied' }, { new: true });
    
    // Log history
    await logTableHistory(
      table._id, 
      table.name, 
      'OCCUPIED', 
      req.body.performedBy || 'admin', 
      req.body.performedByName || 'Admin',
      { customerName: req.body.customerName }
    );
    
    res.json(table);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Mark table as empty
router.post('/:id/free', async (req, res) => {
  try {
    const tableId = req.params.id;
    
    // Xóa tất cả order liên quan đến bàn này
    const deletedOrders = await Order.deleteMany({ tableId: tableId });
    console.log(`Đã xóa ${deletedOrders.deletedCount} order của bàn ${tableId}`);
    
    // Cập nhật trạng thái bàn về empty
    const table = await Table.findByIdAndUpdate(tableId, { status: 'empty' }, { new: true });
    
    // Log history
    await logTableHistory(
      table._id, 
      table.name, 
      'FREED', 
      req.body.performedBy || 'admin', 
      req.body.performedByName || 'Admin',
      { 
        note: `Đã xóa ${deletedOrders.deletedCount} order`,
        deletedOrdersCount: deletedOrders.deletedCount
      }
    );
    
    res.json({
      ...table.toObject(),
      deletedOrdersCount: deletedOrders.deletedCount
    });
  } catch (err) {
    console.error('Error freeing table:', err);
    res.status(400).json({ error: err.message });
  }
});

// Reset all tables to empty status
router.post('/reset-all', async (req, res) => {
  try {
    console.log('Starting reset all tables...');
    
    // Lấy tất cả bàn đang occupied
    const occupiedTables = await Table.find({ status: 'occupied' });
    console.log(`Found ${occupiedTables.length} occupied tables`);
    
    if (occupiedTables.length === 0) {
      return res.json({ 
        success: true, 
        message: 'Không có bàn nào đang được sử dụng để reset',
        resetCount: 0,
        deletedOrdersCount: 0
      });
    }
    
    const tableIds = occupiedTables.map(t => t._id);
    console.log('Table IDs to reset:', tableIds);
    
    // Xóa tất cả order liên quan đến các bàn này
    const deletedOrders = await Order.deleteMany({ tableId: { $in: tableIds } });
    console.log(`Đã xóa ${deletedOrders.deletedCount} order của ${tableIds.length} bàn`);
    
    // Reset tất cả về empty
    const updateResult = await Table.updateMany({ status: 'occupied' }, { status: 'empty' });
    console.log(`Updated ${updateResult.modifiedCount} tables to empty status`);
    
    // Log history cho từng bàn
    for (const table of occupiedTables) {
      try {
        await logTableHistory(
          table._id, 
          table.name, 
          'FREED', 
          req.body.performedBy || 'admin', 
          req.body.performedByName || 'Admin',
          { 
            note: 'Reset tất cả bàn',
            deletedOrdersCount: deletedOrders.deletedCount
          }
        );
      } catch (logError) {
        console.error(`Error logging history for table ${table.name}:`, logError);
        // Không throw error, chỉ log để không làm gián đoạn quá trình
      }
    }
    
    res.json({ 
      success: true, 
      message: `Đã reset ${occupiedTables.length} bàn về trạng thái trống và xóa ${deletedOrders.deletedCount} order`,
      resetCount: occupiedTables.length,
      deletedOrdersCount: deletedOrders.deletedCount
    });
  } catch (err) {
    console.error('Error resetting all tables:', err);
    console.error('Error details:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

module.exports = router;




