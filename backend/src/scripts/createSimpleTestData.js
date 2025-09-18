const mongoose = require('mongoose');
require('dotenv').config();

const Ingredient = require('../models/Ingredient');
const InventoryTransaction = require('../models/InventoryTransaction');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cafe_app';

async function createSimpleTestData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Xóa dữ liệu cũ
    await Ingredient.deleteMany({ name: 'Ếch' });
    await InventoryTransaction.deleteMany({});

    // Tạo nguyên liệu ếch
    const frog = new Ingredient({
      name: 'Ếch',
      category: 'food',
      unit: 'con',
      currentStock: 15, // Hôm nay còn 15 con
      minStockLevel: 5,
      maxStockLevel: 30,
      unitPrice: 15000,
      supplier: 'Nhà cung cấp ếch tươi',
      notes: 'Ếch tươi sống',
      lastImportDate: new Date('2024-12-27T08:00:00Z'), // Thứ 6
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
      createdAt: new Date('2024-12-23T08:00:00Z') // Thứ 2
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
      createdAt: new Date('2024-12-27T08:00:00Z') // Thứ 6
    });

    await import2.save();
    console.log('✅ Tạo giao dịch nhập hàng thứ 6 (5 con)');

    // Tạo giao dịch kiểm kho thứ 5 (còn 10 con)
    const stockCheck = new InventoryTransaction({
      ingredient: frog._id,
      transactionType: 'adjustment',
      quantity: -10, // Đã bán 10 con từ thứ 2 đến thứ 5
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
      createdAt: new Date('2024-12-26T18:00:00Z') // Thứ 5
    });

    await stockCheck.save();
    console.log('✅ Tạo giao dịch kiểm kho thứ 5');

    console.log('\n🎯 Dữ liệu test đã được tạo:');
    console.log('📅 Thứ 2: Nhập 20 con ếch');
    console.log('📅 Thứ 5: Kiểm kho - đã bán 10 con (còn 10 con)');
    console.log('📅 Thứ 6: Nhập 5 con ếch (còn 15 con)');
    console.log('\n📊 Bảng so sánh sẽ hiển thị:');
    console.log('• Ngày nhập gần nhất: 5 con (Thứ 6)');
    console.log('• Hôm qua: 10 con (Thứ 5)');
    console.log('• Hôm nay: 15 con (Thứ 6)');
    console.log('• Xài hôm nay: 0 con (vì nhập hàng)');
    console.log('• Xài từ lần nhập trước: 10 con (20 - 10 = 10)');

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Hoàn thành! Hãy kiểm tra bảng so sánh.');
  }
}

createSimpleTestData();
