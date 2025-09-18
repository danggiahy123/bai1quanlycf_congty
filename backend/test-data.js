const mongoose = require('mongoose');
require('dotenv').config();

const Ingredient = require('./src/models/Ingredient');
const InventoryTransaction = require('./src/models/InventoryTransaction');

async function createTestData() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cafe_app');
    console.log('Connected to MongoDB');

    // Xóa dữ liệu cũ
    await Ingredient.deleteMany({ name: 'Ếch' });
    await InventoryTransaction.deleteMany({});

    // Tạo nguyên liệu ếch
    const frog = new Ingredient({
      name: 'Ếch',
      category: 'food',
      unit: 'con',
      currentStock: 15,
      minStockLevel: 5,
      maxStockLevel: 30,
      unitPrice: 15000,
      supplier: 'Nhà cung cấp ếch tươi',
      notes: 'Ếch tươi sống',
      lastImportDate: new Date('2024-12-27T08:00:00Z'),
      lastImportQuantity: 5,
      lastImportPrice: 15000,
      isActive: true
    });

    await frog.save();
    console.log('✅ Tạo nguyên liệu ếch thành công');

    // Tạo giao dịch nhập hàng thứ 2 (20 con)
    const import1 = new InventoryTransaction({
      ingredient: frog._id,
      transactionType: 'import',
      quantity: 20,
      unitPrice: 15000,
      totalAmount: 300000,
      previousStock: 0,
      newStock: 20,
      reference: 'IMPORT_2024-12-23',
      referenceId: new mongoose.Types.ObjectId(),
      reason: 'import',
      notes: 'Nhập hàng thứ 2 - 20 con ếch',
      performedBy: new mongoose.Types.ObjectId(),
      performedByName: 'Admin',
      department: 'warehouse',
      createdAt: new Date('2024-12-23T08:00:00Z')
    });

    await import1.save();
    console.log('✅ Tạo giao dịch nhập hàng thứ 2 (20 con)');

    // Tạo giao dịch nhập hàng thứ 6 (5 con)
    const import2 = new InventoryTransaction({
      ingredient: frog._id,
      transactionType: 'import',
      quantity: 5,
      unitPrice: 15000,
      totalAmount: 75000,
      previousStock: 10,
      newStock: 15,
      reference: 'IMPORT_2024-12-27',
      referenceId: new mongoose.Types.ObjectId(),
      reason: 'import',
      notes: 'Nhập hàng thứ 6 - 5 con ếch',
      performedBy: new mongoose.Types.ObjectId(),
      performedByName: 'Admin',
      department: 'warehouse',
      createdAt: new Date('2024-12-27T08:00:00Z')
    });

    await import2.save();
    console.log('✅ Tạo giao dịch nhập hàng thứ 6 (5 con)');

    // Tạo giao dịch kiểm kho thứ 5 (còn 10 con)
    const stockCheck = new InventoryTransaction({
      ingredient: frog._id,
      transactionType: 'adjustment',
      quantity: -10,
      unitPrice: 15000,
      totalAmount: -150000,
      previousStock: 20,
      newStock: 10,
      reference: 'STOCK_CHECK_2024-12-26',
      referenceId: new mongoose.Types.ObjectId(),
      reason: 'stock_check',
      notes: 'Kiểm kho thứ 5 - đã bán 10 con từ thứ 2',
      performedBy: new mongoose.Types.ObjectId(),
      performedByName: 'Admin',
      department: 'warehouse',
      createdAt: new Date('2024-12-26T18:00:00Z')
    });

    await stockCheck.save();
    console.log('✅ Tạo giao dịch kiểm kho thứ 5');

    console.log('\n🎯 Dữ liệu test đã được tạo thành công!');
    console.log('Hãy vào webadmin để kiểm tra bảng so sánh.');

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestData();
