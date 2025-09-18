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
      _id: new mongoose.Types.ObjectId().toString(),
      date: new Date().toISOString().split('T')[0],
      ingredients: ingredients.map(ingredient => ({
        ingredientId: ingredient._id,
        ingredientName: ingredient.name,
        previousStock: ingredient.currentStock,
        newStock: ingredient.currentStock, // Default to current stock
        difference: 0
      }))
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
      const { ingredientId, newStock } = item;
      
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
      const difference = newStock - previousStock;

      // Cập nhật tồn kho
      ingredient.currentStock = Math.max(0, newStock);
      ingredient.lastCheckDate = today.toISOString();
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
          notes: `Kiểm kho ngày ${today.toISOString().split('T')[0]}`,
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

// Lấy dữ liệu so sánh
router.get('/comparison', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    // Lấy tất cả nguyên liệu hiện tại
    const currentIngredients = await Ingredient.find({ isActive: true });
    
    // Lấy dữ liệu kiểm kho hôm qua
    const yesterdayCheck = await InventoryTransaction.find({
      reason: 'stock_check',
      createdAt: { 
        $gte: yesterday, 
        $lt: today 
      }
    }).populate('ingredient', 'name');

    // Lấy dữ liệu nhập hàng gần nhất cho mỗi nguyên liệu
    const lastImports = await InventoryTransaction.find({
      transactionType: 'import',
      reason: { $ne: 'stock_check' }
    }).sort({ createdAt: -1 });

    // Tạo dữ liệu so sánh
    const details = currentIngredients.map(ingredient => {
      const yesterdayStock = yesterdayCheck.find(check => 
        check.ingredient._id.toString() === ingredient._id.toString()
      )?.newStock || ingredient.currentStock;

      // Tìm lần nhập hàng gần nhất cho nguyên liệu này
      const lastImportData = lastImports.find(imp => 
        imp.ingredient.toString() === ingredient._id.toString()
      );

      // Tìm lần nhập hàng trước đó (để tính tổng đã bán từ lần nhập trước)
      const previousImportData = lastImports.find(imp => 
        imp.ingredient.toString() === ingredient._id.toString() &&
        imp.createdAt < (lastImportData?.createdAt || new Date())
      );

      // Tính tổng đã bán từ lần nhập hàng trước đến hôm qua
      const totalSoldFromPreviousImport = previousImportData ? 
        (previousImportData.quantity - yesterdayStock) : 0;

      return {
        name: ingredient.name,
        unit: ingredient.unit,
        currentStock: ingredient.currentStock,
        yesterdayStock: yesterdayStock,
        lastImportQuantity: lastImportData?.quantity || ingredient.lastImportQuantity || 0,
        lastImportDate: lastImportData?.createdAt || ingredient.lastImportDate,
        totalSoldFromPreviousImport: totalSoldFromPreviousImport, // Tổng đã bán từ lần nhập trước
        difference: yesterdayStock - ingredient.currentStock // Hôm nay xài (chênh lệch hôm qua - hôm nay)
      };
    });

    const totalValue = currentIngredients.reduce((sum, ing) => 
      sum + (ing.currentStock * ing.unitPrice), 0
    );

    const yesterdayComparison = {
      totalDifference: details.reduce((sum, item) => sum + item.difference, 0)
    };

    const lastImportComparison = {
      totalDifference: lastImports.length > 0 ? 
        currentIngredients.reduce((sum, ing) => {
          const importQty = lastImports.find(imp => 
            imp.ingredient.toString() === ing._id.toString()
          )?.quantity || 0;
          return sum + (ing.currentStock - importQty);
        }, 0) : 0
    };

    res.json({
      totalValue,
      yesterdayComparison,
      lastImportComparison,
      details
    });
  } catch (error) {
    console.error('Error getting comparison data:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu so sánh' });
  }
});

// Nhập hàng mới
router.post('/import', authenticateToken, async (req, res) => {
  try {
    const { ingredientId, quantity, unitPrice, supplier, notes, importDate } = req.body;
    
    // Tìm nguyên liệu
    const ingredient = await Ingredient.findById(ingredientId);
    if (!ingredient) {
      return res.status(404).json({ message: 'Nguyên liệu không tồn tại' });
    }

    const previousStock = ingredient.currentStock;
    const newStock = previousStock + quantity;
    const actualImportDate = importDate ? new Date(importDate) : new Date();

    // Cập nhật tồn kho
    ingredient.currentStock = newStock;
    ingredient.unitPrice = unitPrice; // Cập nhật giá mới
    ingredient.supplier = supplier; // Cập nhật nhà cung cấp
    ingredient.lastImportDate = actualImportDate.toISOString();
    ingredient.lastImportQuantity = quantity;
    ingredient.lastImportPrice = unitPrice;
    await ingredient.save();

    // Tạo giao dịch nhập hàng
    const transaction = new InventoryTransaction({
      ingredient: ingredientId,
      transactionType: 'import',
      quantity: quantity,
      unitPrice: unitPrice,
      totalAmount: quantity * unitPrice,
      previousStock,
      newStock: newStock,
      reference: `IMPORT_${actualImportDate.toISOString().split('T')[0]}`,
      referenceId: new mongoose.Types.ObjectId(),
      reason: 'import',
      notes: notes || `Nhập hàng ngày ${actualImportDate.toISOString().split('T')[0]}`,
      performedBy: req.user.id,
      performedByName: req.user.username || 'Admin',
      department: 'warehouse',
      createdAt: actualImportDate
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Nhập hàng thành công',
      ingredient: {
        _id: ingredient._id,
        name: ingredient.name,
        currentStock: ingredient.currentStock,
        unitPrice: ingredient.unitPrice,
        supplier: ingredient.supplier,
        lastImportDate: ingredient.lastImportDate,
        lastImportQuantity: ingredient.lastImportQuantity
      }
    });
  } catch (error) {
    console.error('Error importing:', error);
    res.status(500).json({ message: 'Lỗi server khi nhập hàng' });
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

module.exports = router;
