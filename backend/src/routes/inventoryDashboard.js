const express = require('express');
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

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

// Dashboard overview
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const ingredients = await Ingredient.find();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Thống kê cơ bản
    const totalIngredients = ingredients.length;
    const lowStockItems = ingredients.filter(ing => ing.currentStock <= ing.minStockLevel).length;
    const outOfStockItems = ingredients.filter(ing => ing.currentStock === 0).length;
    const totalValue = ingredients.reduce((sum, ing) => sum + (ing.currentStock * ing.unitPrice), 0);

    // Hoạt động hôm nay
    const todayImports = await InventoryTransaction.countDocuments({
      transactionType: 'import',
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const todayExports = await InventoryTransaction.countDocuments({
      transactionType: 'export',
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Nguyên liệu cần bổ sung
    const criticalItems = ingredients
      .filter(ing => ing.currentStock <= ing.minStockLevel)
      .map(ing => ({
        name: ing.name,
        currentStock: ing.currentStock,
        minStock: ing.minStockLevel,
        unit: ing.unit
      }))
      .slice(0, 10); // Top 10 items cần bổ sung

    res.json({
      totalIngredients,
      lowStockItems,
      outOfStockItems,
      totalValue,
      todayImports,
      todayExports,
      criticalItems
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu dashboard' });
  }
});

// Báo cáo hàng ngày
router.get('/daily-report', authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();
    reportDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(reportDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Lấy giao dịch trong ngày
    const transactions = await InventoryTransaction.find({
      createdAt: { $gte: reportDate, $lt: nextDay }
    }).populate('ingredient', 'name unit');

    // Tính toán thống kê
    const imports = transactions.filter(t => t.transactionType === 'import');
    const exports = transactions.filter(t => t.transactionType === 'export');
    
    const totalImports = imports.reduce((sum, t) => sum + t.quantity, 0);
    const totalExports = exports.reduce((sum, t) => sum + t.quantity, 0);
    const netChange = totalImports - totalExports;
    const totalValue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);

    // Chi tiết giao dịch
    const transactionDetails = transactions.map(t => ({
      type: t.transactionType,
      ingredient: t.ingredient?.name || 'Unknown',
      quantity: t.quantity,
      unit: t.ingredient?.unit || t.unit,
      reason: t.reason,
      timestamp: t.createdAt
    }));

    res.json({
      date: reportDate.toISOString().split('T')[0],
      imports: totalImports,
      exports: totalExports,
      netChange,
      totalValue,
      transactions: transactionDetails
    });
  } catch (error) {
    console.error('Error fetching daily report:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy báo cáo hàng ngày' });
  }
});

// Điều chỉnh tồn kho (cho kiểm kho)
router.post('/adjust-stock', authenticateToken, async (req, res) => {
  try {
    const { adjustments, checkDate, notes } = req.body;

    if (!Array.isArray(adjustments) || adjustments.length === 0) {
      return res.status(400).json({ message: 'Không có điều chỉnh nào' });
    }

    const results = [];

    for (const adjustment of adjustments) {
      const { ingredientId, adjustment: quantity, reason, notes: adjustmentNotes } = adjustment;

      // Tìm nguyên liệu
      const ingredient = await Ingredient.findById(ingredientId);
      if (!ingredient) {
        results.push({
          ingredientId,
          success: false,
          message: 'Nguyên liệu không tồn tại'
        });
        continue;
      }

      // Cập nhật tồn kho
      const previousStock = ingredient.currentStock;
      ingredient.currentStock = Math.max(0, ingredient.currentStock + quantity);
      await ingredient.save();

      // Tạo giao dịch
      const transaction = new InventoryTransaction({
        ingredient: ingredientId,
        transactionType: quantity > 0 ? 'import' : 'export',
        quantity: Math.abs(quantity),
        unitPrice: ingredient.unitPrice,
        totalAmount: Math.abs(quantity) * ingredient.unitPrice,
        previousStock,
        newStock: ingredient.currentStock,
        reason: reason || 'stock_check',
        notes: adjustmentNotes || notes || `Kiểm kho ngày ${checkDate}`,
        performedBy: req.user.id,
        performedByName: req.user.username || 'Admin',
        department: 'inventory'
      });

      await transaction.save();

      results.push({
        ingredientId,
        ingredientName: ingredient.name,
        success: true,
        previousStock,
        newStock: ingredient.currentStock,
        adjustment: quantity
      });
    }

    res.json({
      success: true,
      message: 'Điều chỉnh tồn kho thành công',
      results
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ message: 'Lỗi server khi điều chỉnh tồn kho' });
  }
});

module.exports = router;
