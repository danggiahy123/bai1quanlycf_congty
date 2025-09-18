const express = require('express');
const mongoose = require('mongoose');
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

// Kiểm tra trạng thái kiểm kho hôm nay
router.get('/check-today', authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;
    const checkDate = date ? new Date(date) : new Date();
    checkDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(checkDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Kiểm tra xem có giao dịch kiểm kho nào trong ngày không
    const todayCheck = await InventoryTransaction.findOne({
      reason: 'stock_check',
      createdAt: { $gte: checkDate, $lt: nextDay }
    });

    res.json({ checked: !!todayCheck });
  } catch (error) {
    console.error('Error checking today status:', error);
    res.status(500).json({ message: 'Lỗi server khi kiểm tra trạng thái hôm nay' });
  }
});

// Bắt đầu kiểm kho
router.post('/start-check', authenticateToken, async (req, res) => {
  try {
    const ingredients = await Ingredient.find({ isActive: true });
    
    const checkData = {
      date: new Date().toISOString().split('T')[0],
      ingredients: ingredients.map(ingredient => ({
        ingredientId: ingredient._id,
        ingredientName: ingredient.name,
        systemStock: ingredient.currentStock,
        actualStock: ingredient.currentStock, // Default to system stock
        difference: 0,
        notes: ''
      })),
      totalItems: ingredients.length,
      checkedItems: 0,
      discrepancies: 0,
      status: 'in_progress'
    };

    res.json(checkData);
  } catch (error) {
    console.error('Error starting stock check:', error);
    res.status(500).json({ message: 'Lỗi server khi bắt đầu kiểm kho' });
  }
});

// Hoàn thành kiểm kho
router.post('/complete-check', authenticateToken, async (req, res) => {
  try {
    const { checkId, ingredients } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results = [];
    let totalDiscrepancies = 0;

    for (const item of ingredients) {
      const { ingredientId, actualStock, notes } = item;
      
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

      const previousStock = ingredient.currentStock;
      const difference = actualStock - previousStock;

      // Cập nhật tồn kho
      ingredient.currentStock = Math.max(0, actualStock);
      await ingredient.save();

      // Tạo giao dịch nếu có thay đổi
      if (difference !== 0) {
        const transaction = new InventoryTransaction({
          ingredient: ingredientId,
          transactionType: difference > 0 ? 'import' : 'export',
          quantity: Math.abs(difference),
          unitPrice: ingredient.unitPrice,
          totalAmount: Math.abs(difference) * ingredient.unitPrice,
          previousStock,
          newStock: ingredient.currentStock,
          reference: `STOCK_CHECK_${today.toISOString().split('T')[0]}`,
          referenceId: new mongoose.Types.ObjectId(),
          reason: 'stock_check',
          notes: notes || `Kiểm kho ngày ${today.toISOString().split('T')[0]}`,
          performedBy: req.user.id,
          performedByName: req.user.username || 'Admin',
          department: 'warehouse'
        });

        await transaction.save();
        totalDiscrepancies++;
      }

      results.push({
        ingredientId,
        ingredientName: ingredient.name,
        success: true,
        previousStock,
        newStock: ingredient.currentStock,
        difference
      });
    }

    res.json({
      success: true,
      message: 'Kiểm kho hoàn thành',
      totalDiscrepancies,
      results
    });
  } catch (error) {
    console.error('Error completing stock check:', error);
    res.status(500).json({ message: 'Lỗi server khi hoàn thành kiểm kho' });
  }
});

// Lấy lịch sử kiểm kho
router.get('/check-history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const checks = await InventoryTransaction.find({
      reason: 'stock_check'
    })
    .populate('ingredient', 'name unit')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await InventoryTransaction.countDocuments({
      reason: 'stock_check'
    });

    res.json({
      checks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching check history:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy lịch sử kiểm kho' });
  }
});

// Thống kê hao hụt
router.get('/wastage-analysis', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Lấy các giao dịch kiểm kho trong khoảng thời gian
    const checks = await InventoryTransaction.find({
      reason: 'stock_check',
      createdAt: { $gte: startDate }
    }).populate('ingredient', 'name unit category');

    // Phân tích hao hụt
    const wastageByCategory = {};
    const wastageByIngredient = {};

    checks.forEach(check => {
      if (check.transactionType === 'export' && check.quantity > 0) {
        const category = check.ingredient.category;
        const ingredientName = check.ingredient.name;

        // Theo danh mục
        if (!wastageByCategory[category]) {
          wastageByCategory[category] = {
            totalQuantity: 0,
            totalValue: 0,
            count: 0
          };
        }
        wastageByCategory[category].totalQuantity += check.quantity;
        wastageByCategory[category].totalValue += check.totalAmount;
        wastageByCategory[category].count++;

        // Theo nguyên liệu
        if (!wastageByIngredient[ingredientName]) {
          wastageByIngredient[ingredientName] = {
            totalQuantity: 0,
            totalValue: 0,
            count: 0,
            unit: check.ingredient.unit
          };
        }
        wastageByIngredient[ingredientName].totalQuantity += check.quantity;
        wastageByIngredient[ingredientName].totalValue += check.totalAmount;
        wastageByIngredient[ingredientName].count++;
      }
    });

    // Sắp xếp theo giá trị hao hụt
    const topWastageCategories = Object.entries(wastageByCategory)
      .map(([category, data]) => ({
        category,
        ...data
      }))
      .sort((a, b) => b.totalValue - a.totalValue);

    const topWastageIngredients = Object.entries(wastageByIngredient)
      .map(([ingredient, data]) => ({
        ingredient,
        ...data
      }))
      .sort((a, b) => b.totalValue - a.totalValue);

    res.json({
      period: `${days} ngày qua`,
      totalWastageValue: Object.values(wastageByIngredient).reduce((sum, data) => sum + data.totalValue, 0),
      totalWastageQuantity: Object.values(wastageByIngredient).reduce((sum, data) => sum + data.totalQuantity, 0),
      topWastageCategories: topWastageCategories.slice(0, 5),
      topWastageIngredients: topWastageIngredients.slice(0, 10)
    });
  } catch (error) {
    console.error('Error analyzing wastage:', error);
    res.status(500).json({ message: 'Lỗi server khi phân tích hao hụt' });
  }
});

module.exports = router;
