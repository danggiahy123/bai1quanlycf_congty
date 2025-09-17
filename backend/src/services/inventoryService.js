const Ingredient = require('../models/Ingredient');
const InventoryTransaction = require('../models/InventoryTransaction');

/**
 * Trừ nguyên liệu khi order món
 * @param {Array} orderItems - Danh sách món đã order
 * @param {String} orderId - ID của order
 * @param {String} tableId - ID của bàn
 * @returns {Object} - Kết quả xử lý
 */
async function deductIngredientsForOrder(orderItems, orderId, tableId) {
  try {
    const results = [];
    const errors = [];

    for (const item of orderItems) {
      // Lấy thông tin menu để biết cần nguyên liệu gì
      const Menu = require('../models/Menu');
      const menu = await Menu.findById(item.menuId);
      
      if (!menu) {
        errors.push(`Menu ${item.menuId} không tồn tại`);
        continue;
      }

      if (!menu.ingredients || menu.ingredients.length === 0) {
        // Món này không cần nguyên liệu
        continue;
      }

      // Trừ từng nguyên liệu theo số lượng order
      for (const ingredient of menu.ingredients) {
        const totalQuantityNeeded = ingredient.quantity * item.quantity;
        
        try {
          // Tìm nguyên liệu trong kho
          const stockIngredient = await Ingredient.findById(ingredient.ingredientId);
          
          if (!stockIngredient) {
            errors.push(`Nguyên liệu ${ingredient.ingredientName} không tồn tại trong kho`);
            continue;
          }

          // Kiểm tra số lượng có đủ không
          if (stockIngredient.currentStock < totalQuantityNeeded) {
            errors.push(`Không đủ ${ingredient.ingredientName} trong kho. Cần: ${totalQuantityNeeded}${ingredient.unit}, có: ${stockIngredient.currentStock}${ingredient.unit}`);
            continue;
          }

          // Trừ nguyên liệu
          await stockIngredient.updateStock(totalQuantityNeeded, 'subtract');

          // Tạo transaction record
          await InventoryTransaction.create({
            ingredient: ingredient.ingredientId,
            transactionType: 'export',
            quantity: totalQuantityNeeded,
            unitPrice: stockIngredient.unitPrice,
            totalAmount: totalQuantityNeeded * stockIngredient.unitPrice,
            previousStock: stockIngredient.currentStock + totalQuantityNeeded,
            newStock: stockIngredient.currentStock,
            reference: `ORDER-${orderId}`,
            referenceId: orderId,
            performedBy: 'system',
            performedByName: 'Hệ thống',
            reason: 'order',
            notes: `Order món ${menu.name} x${item.quantity} tại bàn ${tableId}`,
            department: 'kitchen'
          });

          results.push({
            ingredientName: ingredient.ingredientName,
            quantityDeducted: totalQuantityNeeded,
            unit: ingredient.unit,
            remainingStock: stockIngredient.currentStock
          });

        } catch (error) {
          errors.push(`Lỗi khi trừ nguyên liệu ${ingredient.ingredientName}: ${error.message}`);
        }
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors
    };

  } catch (error) {
    console.error('Lỗi trong deductIngredientsForOrder:', error);
    return {
      success: false,
      results: [],
      errors: [`Lỗi hệ thống: ${error.message}`]
    };
  }
}

/**
 * Hoàn trả nguyên liệu khi hủy order
 * @param {Array} orderItems - Danh sách món đã order
 * @param {String} orderId - ID của order
 * @param {String} tableId - ID của bàn
 * @returns {Object} - Kết quả xử lý
 */
async function returnIngredientsForOrder(orderItems, orderId, tableId) {
  try {
    const results = [];
    const errors = [];

    for (const item of orderItems) {
      const Menu = require('../models/Menu');
      const menu = await Menu.findById(item.menuId);
      
      if (!menu || !menu.ingredients || menu.ingredients.length === 0) {
        continue;
      }

      for (const ingredient of menu.ingredients) {
        const totalQuantityToReturn = ingredient.quantity * item.quantity;
        
        try {
          const stockIngredient = await Ingredient.findById(ingredient.ingredientId);
          
          if (!stockIngredient) {
            errors.push(`Nguyên liệu ${ingredient.ingredientName} không tồn tại trong kho`);
            continue;
          }

          // Hoàn trả nguyên liệu
          await stockIngredient.updateStock(totalQuantityToReturn, 'add');

          // Tạo transaction record
          await InventoryTransaction.create({
            ingredient: ingredient.ingredientId,
            transactionType: 'import',
            quantity: totalQuantityToReturn,
            unitPrice: stockIngredient.unitPrice,
            totalAmount: totalQuantityToReturn * stockIngredient.unitPrice,
            previousStock: stockIngredient.currentStock - totalQuantityToReturn,
            newStock: stockIngredient.currentStock,
            reference: `CANCEL-${orderId}`,
            referenceId: orderId,
            performedBy: 'system',
            performedByName: 'Hệ thống',
            reason: 'order_cancel',
            notes: `Hoàn trả món ${menu.name} x${item.quantity} tại bàn ${tableId}`,
            department: 'kitchen'
          });

          results.push({
            ingredientName: ingredient.ingredientName,
            quantityReturned: totalQuantityToReturn,
            unit: ingredient.unit,
            newStock: stockIngredient.currentStock
          });

        } catch (error) {
          errors.push(`Lỗi khi hoàn trả nguyên liệu ${ingredient.ingredientName}: ${error.message}`);
        }
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors
    };

  } catch (error) {
    console.error('Lỗi trong returnIngredientsForOrder:', error);
    return {
      success: false,
      results: [],
      errors: [`Lỗi hệ thống: ${error.message}`]
    };
  }
}

/**
 * Kiểm tra nguyên liệu có đủ để làm món không
 * @param {String} menuId - ID của món
 * @param {Number} quantity - Số lượng món
 * @returns {Object} - Kết quả kiểm tra
 */
async function checkIngredientsAvailability(menuId, quantity = 1) {
  try {
    const Menu = require('../models/Menu');
    const menu = await Menu.findById(menuId);
    
    if (!menu) {
      return {
        available: false,
        message: 'Món không tồn tại'
      };
    }

    if (!menu.ingredients || menu.ingredients.length === 0) {
      return {
        available: true,
        message: 'Món này không cần nguyên liệu'
      };
    }

    const unavailableIngredients = [];

    for (const ingredient of menu.ingredients) {
      const totalQuantityNeeded = ingredient.quantity * quantity;
      const stockIngredient = await Ingredient.findById(ingredient.ingredientId);
      
      if (!stockIngredient) {
        unavailableIngredients.push({
          name: ingredient.ingredientName,
          needed: totalQuantityNeeded,
          available: 0,
          unit: ingredient.unit,
          reason: 'Không tồn tại trong kho'
        });
      } else if (stockIngredient.currentStock < totalQuantityNeeded) {
        unavailableIngredients.push({
          name: ingredient.ingredientName,
          needed: totalQuantityNeeded,
          available: stockIngredient.currentStock,
          unit: ingredient.unit,
          reason: 'Không đủ số lượng'
        });
      }
    }

    return {
      available: unavailableIngredients.length === 0,
      unavailableIngredients,
      message: unavailableIngredients.length === 0 ? 'Đủ nguyên liệu' : 'Thiếu nguyên liệu'
    };

  } catch (error) {
    console.error('Lỗi trong checkIngredientsAvailability:', error);
    return {
      available: false,
      message: `Lỗi hệ thống: ${error.message}`
    };
  }
}

module.exports = {
  deductIngredientsForOrder,
  returnIngredientsForOrder,
  checkIngredientsAvailability
};
