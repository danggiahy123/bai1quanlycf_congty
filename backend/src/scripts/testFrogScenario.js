const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Ingredient = require('../models/Ingredient');
const InventoryTransaction = require('../models/InventoryTransaction');
const StockCheck = require('../models/StockCheck');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cafe_app';

async function createFrogScenario() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Xóa dữ liệu cũ
    await Ingredient.deleteMany({ name: 'Ếch' });
    await InventoryTransaction.deleteMany({});
    await StockCheck.deleteMany({});

    // Tạo nguyên liệu ếch
    const frog = new Ingredient({
      name: 'Ếch',
      category: 'food',
      unit: 'con',
      currentStock: 3, // Hôm nay còn 3 con
      minStockLevel: 5,
      maxStockLevel: 20,
      unitPrice: 15000, // 15k/con
      supplier: 'Nhà cung cấp ếch tươi',
      notes: 'Ếch tươi sống',
      lastImportDate: new Date('2024-12-23T08:00:00Z'), // Thứ 2
      lastImportQuantity: 10,
      lastImportPrice: 15000,
      isActive: true
    });

    await frog.save();
    console.log('✅ Tạo nguyên liệu ếch thành công');

    // Tạo giao dịch nhập hàng thứ 2 (10 con)
    const importTransaction = new InventoryTransaction({
      ingredient: frog._id,
      transactionType: 'import',
      quantity: 10,
      unitPrice: 15000,
      totalAmount: 150000,
      previousStock: 0,
      newStock: 10,
      reference: 'IMPORT_2024-12-23',
      referenceId: new mongoose.Types.ObjectId(),
      reason: 'import',
      notes: 'Nhập hàng thứ 2 - 10 con ếch',
      performedBy: new mongoose.Types.ObjectId(),
      performedByName: 'Admin',
      department: 'warehouse',
      createdAt: new Date('2024-12-23T08:00:00Z') // Thứ 2
    });

    await importTransaction.save();
    console.log('✅ Tạo giao dịch nhập hàng thứ 2');

    // Tạo kiểm kho thứ 3 (còn 7 con)
    const stockCheck3 = new StockCheck({
      ingredient: frog._id,
      previousStock: 10,
      newStock: 7,
      difference: -3,
      checkedBy: new mongoose.Types.ObjectId(),
      checkedByName: 'Admin',
      notes: 'Kiểm kho thứ 3 - xài 3 con',
      checkDate: new Date('2024-12-24T18:00:00Z'), // Thứ 3
      isCompleted: true
    });

    await stockCheck3.save();
    console.log('✅ Tạo kiểm kho thứ 3');

    // Tạo kiểm kho thứ 4 (còn 3 con)
    const stockCheck4 = new StockCheck({
      ingredient: frog._id,
      previousStock: 7,
      newStock: 3,
      difference: -4,
      checkedBy: new mongoose.Types.ObjectId(),
      checkedByName: 'Admin',
      notes: 'Kiểm kho thứ 4 - xài 4 con',
      checkDate: new Date('2024-12-25T18:00:00Z'), // Thứ 4 (hôm nay)
      isCompleted: true
    });

    await stockCheck4.save();
    console.log('✅ Tạo kiểm kho thứ 4');

    console.log('\n🎯 Kịch bản ếch đã được tạo:');
    console.log('📅 Thứ 2: Nhập 10 con ếch');
    console.log('📅 Thứ 3: Xài 3 con → Còn 7 con');
    console.log('📅 Thứ 4: Xài 4 con → Còn 3 con (hôm nay)');
    console.log('\n📊 Bảng so sánh sẽ hiển thị:');
    console.log('• Ngày nhập gần nhất: 10 con (Thứ 2)');
    console.log('• Hôm qua: 7 con (Thứ 3)');
    console.log('• Hôm nay: 3 con (Thứ 4)');
    console.log('• Chênh lệch ngày nhập: -7 con (3 - 10)');
    console.log('• Chênh lệch hôm qua: -4 con (3 - 7)');

  } catch (error) {
    console.error('❌ Lỗi tạo kịch bản ếch:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Hoàn thành! Hãy kiểm tra bảng so sánh trong webadmin.');
  }
}

createFrogScenario();
