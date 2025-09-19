const express = require('express');
const jwt = require('jsonwebtoken');
const InventoryTransaction = require('../models/InventoryTransaction');
const Ingredient = require('../models/Ingredient');
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

// Lấy danh sách giao dịch kho
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      ingredientId = '', 
      transactionType = '',
      startDate = '',
      endDate = '',
      department = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    let query = {};

    // Filter by ingredient
    if (ingredientId) {
      query.ingredient = ingredientId;
    }

    // Filter by transaction type
    if (transactionType) {
      query.transactionType = transactionType;
    }

    // Filter by department
    if (department) {
      query.department = department;
    }

    // Filter by date range
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const transactions = await InventoryTransaction.find(query)
      .populate('ingredient', 'name unit')
      .populate('performedBy', 'fullName')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await InventoryTransaction.countDocuments(query);

    res.json({
      transactions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách giao dịch kho:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy giao dịch kho theo ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const transaction = await InventoryTransaction.findById(req.params.id)
      .populate('ingredient', 'name unit')
      .populate('performedBy', 'fullName');

    if (!transaction) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch kho' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Lỗi lấy giao dịch kho:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Tạo giao dịch điều chỉnh kho
router.post('/adjustment', authenticateToken, async (req, res) => {
  try {
    const { ingredientId, quantity, reason, notes, department = 'warehouse' } = req.body;

    if (!ingredientId || !quantity || !reason) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp đầy đủ thông tin: ingredientId, quantity, reason' 
      });
    }

    const ingredient = await Ingredient.findById(ingredientId);
    if (!ingredient) {
      return res.status(404).json({ message: 'Không tìm thấy nguyên liệu' });
    }

    const previousStock = ingredient.currentStock;
    const newStock = Math.max(0, previousStock + quantity);

    // Update ingredient stock
    ingredient.currentStock = newStock;
    await ingredient.save();

    // Create transaction
    const transaction = await InventoryTransaction.createTransaction({
      ingredient: ingredientId,
      transactionType: 'adjustment',
      quantity: quantity,
      unitPrice: ingredient.unitPrice,
      totalAmount: Math.abs(quantity) * ingredient.unitPrice,
      previousStock,
      newStock,
      reference: `ADJ-${Date.now()}`,
      referenceId: ingredientId,
      performedBy: req.user.id,
      performedByName: req.user.fullName || 'System',
      reason,
      notes,
      department
    });

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to('employees').emit('inventory_updated', {
        type: 'stock_adjusted',
        ingredientId,
        ingredientName: ingredient.name,
        quantity,
        previousStock,
        newStock,
        reason,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      message: 'Tạo giao dịch điều chỉnh kho thành công',
      transaction
    });
  } catch (error) {
    console.error('Lỗi tạo giao dịch điều chỉnh kho:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy lịch sử tồn kho của nguyên liệu
router.get('/ingredient/:ingredientId/history', authenticateToken, async (req, res) => {
  try {
    const { ingredientId } = req.params;
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;
    let query = { ingredient: ingredientId };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const transactions = await InventoryTransaction.find(query)
      .populate('performedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await InventoryTransaction.countDocuments(query);

    res.json({
      transactions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Lỗi lấy lịch sử tồn kho:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy thống kê giao dịch kho
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = {};

    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const totalTransactions = await InventoryTransaction.countDocuments(dateFilter);
    
    // Transactions by type
    const transactionsByType = await InventoryTransaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$transactionType',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Transactions by department
    const transactionsByDepartment = await InventoryTransaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Top ingredients by transaction count
    const topIngredients = await InventoryTransaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$ingredient',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'ingredients',
          localField: '_id',
          foreignField: '_id',
          as: 'ingredient'
        }
      },
      { $unwind: '$ingredient' }
    ]);

    // Daily transaction summary
    const dailySummary = await InventoryTransaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 30 }
    ]);

    res.json({
      totalTransactions,
      transactionsByType,
      transactionsByDepartment,
      topIngredients,
      dailySummary
    });
  } catch (error) {
    console.error('Lỗi lấy thống kê giao dịch kho:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy báo cáo tồn kho
router.get('/report/stock', authenticateToken, async (req, res) => {
  try {
    const { category = '', status = '' } = req.query;
    let query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (status === 'low') {
      query.$expr = { $lte: ['$currentStock', '$minStockLevel'] };
    } else if (status === 'high') {
      query.$expr = { $gte: ['$currentStock', '$maxStockLevel'] };
    } else if (status === 'out') {
      query.currentStock = 0;
    }

    const ingredients = await Ingredient.find(query)
      .sort({ currentStock: 1 });

    // Calculate total value
    const totalValue = ingredients.reduce((sum, item) => {
      return sum + (item.currentStock * item.unitPrice);
    }, 0);

    res.json({
      ingredients,
      totalValue,
      totalItems: ingredients.length
    });
  } catch (error) {
    console.error('Lỗi lấy báo cáo tồn kho:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy giao dịch gần đây
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const transactions = await InventoryTransaction.find()
      .populate('ingredient', 'name unit')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy giao dịch gần đây' });
  }
});

module.exports = router;
