const express = require('express');
const jwt = require('jsonwebtoken');
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

// Lấy danh sách nguyên liệu
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      category = '', 
      status = '',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const skip = (page - 1) * limit;
    let query = {};

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by stock status
    if (status) {
      if (status === 'low') {
        query.$expr = { $lte: ['$currentStock', '$minStockLevel'] };
      } else if (status === 'high') {
        query.$expr = { $gte: ['$currentStock', '$maxStockLevel'] };
      } else if (status === 'normal') {
        query.$expr = { 
          $and: [
            { $gt: ['$currentStock', '$minStockLevel'] },
            { $lt: ['$currentStock', '$maxStockLevel'] }
          ]
        };
      }
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const ingredients = await Ingredient.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Ingredient.countDocuments(query);

    res.json({
      ingredients,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách nguyên liệu:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy nguyên liệu theo ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ message: 'Không tìm thấy nguyên liệu' });
    }
    res.json(ingredient);
  } catch (error) {
    console.error('Lỗi lấy nguyên liệu:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Tạo nguyên liệu mới
router.post('/', authenticateToken, async (req, res) => {
  try {
    const ingredientData = req.body;
    
    // Kiểm tra tên nguyên liệu đã tồn tại
    const existingIngredient = await Ingredient.findOne({ name: ingredientData.name });
    if (existingIngredient) {
      return res.status(400).json({ message: 'Tên nguyên liệu đã tồn tại' });
    }

    const ingredient = new Ingredient(ingredientData);
    await ingredient.save();

    res.status(201).json({
      message: 'Tạo nguyên liệu thành công',
      ingredient
    });
  } catch (error) {
    console.error('Lỗi tạo nguyên liệu:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cập nhật nguyên liệu
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Kiểm tra tên nguyên liệu đã tồn tại (trừ chính nó)
    if (updateData.name) {
      const existingIngredient = await Ingredient.findOne({ 
        name: updateData.name, 
        _id: { $ne: id } 
      });
      if (existingIngredient) {
        return res.status(400).json({ message: 'Tên nguyên liệu đã tồn tại' });
      }
    }

    const ingredient = await Ingredient.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!ingredient) {
      return res.status(404).json({ message: 'Không tìm thấy nguyên liệu' });
    }

    res.json({
      message: 'Cập nhật nguyên liệu thành công',
      ingredient
    });
  } catch (error) {
    console.error('Lỗi cập nhật nguyên liệu:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xóa nguyên liệu
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem nguyên liệu có đang được sử dụng không
    const hasTransactions = await InventoryTransaction.findOne({ ingredient: id });
    if (hasTransactions) {
      return res.status(400).json({ 
        message: 'Không thể xóa nguyên liệu đã có giao dịch. Vui lòng vô hiệu hóa thay vì xóa.' 
      });
    }

    const ingredient = await Ingredient.findByIdAndDelete(id);
    if (!ingredient) {
      return res.status(404).json({ message: 'Không tìm thấy nguyên liệu' });
    }

    res.json({ message: 'Xóa nguyên liệu thành công' });
  } catch (error) {
    console.error('Lỗi xóa nguyên liệu:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cập nhật số lượng tồn kho
router.post('/:id/update-stock', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation, reason, notes } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Số lượng phải lớn hơn 0' });
    }

    const ingredient = await Ingredient.findById(id);
    if (!ingredient) {
      return res.status(404).json({ message: 'Không tìm thấy nguyên liệu' });
    }

    const previousStock = ingredient.currentStock;
    let newStock;

    if (operation === 'add') {
      newStock = previousStock + quantity;
    } else if (operation === 'subtract') {
      newStock = Math.max(0, previousStock - quantity);
    } else {
      return res.status(400).json({ message: 'Phép toán không hợp lệ' });
    }

    // Cập nhật số lượng tồn kho
    ingredient.currentStock = newStock;
    await ingredient.save();

    // Tạo giao dịch kho
    await InventoryTransaction.createTransaction({
      ingredient: id,
      transactionType: 'adjustment',
      quantity: operation === 'add' ? quantity : -quantity,
      unitPrice: ingredient.unitPrice,
      totalAmount: Math.abs(quantity) * ingredient.unitPrice,
      previousStock,
      newStock,
      reference: `ADJ-${Date.now()}`,
      referenceId: id,
      performedBy: req.user.id,
      performedByName: req.user.fullName || 'System',
      reason: reason || 'Điều chỉnh tồn kho',
      notes,
      department: 'warehouse'
    });

    res.json({
      message: 'Cập nhật tồn kho thành công',
      ingredient: {
        id: ingredient._id,
        name: ingredient.name,
        previousStock,
        newStock,
        currentStock: ingredient.currentStock
      }
    });
  } catch (error) {
    console.error('Lỗi cập nhật tồn kho:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy lịch sử giao dịch của nguyên liệu
router.get('/:id/transactions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;
    let query = { ingredient: id };

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
    console.error('Lỗi lấy lịch sử giao dịch:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy thống kê tồn kho
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const totalIngredients = await Ingredient.countDocuments({ isActive: true });
    const lowStockItems = await Ingredient.countDocuments({
      $expr: { $lte: ['$currentStock', '$minStockLevel'] },
      isActive: true
    });
    const highStockItems = await Ingredient.countDocuments({
      $expr: { $gte: ['$currentStock', '$maxStockLevel'] },
      isActive: true
    });
    const outOfStockItems = await Ingredient.countDocuments({
      currentStock: 0,
      isActive: true
    });

    // Tính tổng giá trị tồn kho
    const ingredients = await Ingredient.find({ isActive: true });
    const totalStockValue = ingredients.reduce((sum, item) => {
      return sum + (item.currentStock * item.unitPrice);
    }, 0);

    // Thống kê theo danh mục
    const categoryStats = await Ingredient.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$currentStock', '$unitPrice'] } }
        }
      }
    ]);

    res.json({
      totalIngredients,
      lowStockItems,
      highStockItems,
      outOfStockItems,
      totalStockValue,
      categoryStats
    });
  } catch (error) {
    console.error('Lỗi lấy thống kê:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy danh sách nguyên liệu sắp hết hàng
router.get('/alerts/low-stock', authenticateToken, async (req, res) => {
  try {
    const lowStockItems = await Ingredient.find({
      $expr: { $lte: ['$currentStock', '$minStockLevel'] },
      isActive: true
    }).sort({ currentStock: 1 });

    res.json(lowStockItems);
  } catch (error) {
    console.error('Lỗi lấy danh sách sắp hết hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
