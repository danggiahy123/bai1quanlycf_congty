const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Ingredient = require('../models/Ingredient');
const InventoryTransaction = require('../models/InventoryTransaction');
const StockCheck = require('../models/StockCheck');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cafe_app';

async function createFrogScenario2() {
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
      currentStock: 15, // Hôm nay còn 15 con (thứ 6)
      minStockLevel: 5,
      maxStockLevel: 30,
      unitPrice: 15000, // 15k/con
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
    const importTransaction1 = new InventoryTransaction({
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

    await importTransaction1.save();
    console.log('✅ Tạo giao dịch nhập hàng thứ 2 (20 con)');

    // Tạo giao dịch nhập hàng thứ 6 (5 con)
    const importTransaction2 = new InventoryTransaction({
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

    await importTransaction2.save();
    console.log('✅ Tạo giao dịch nhập hàng thứ 6 (5 con)');

    // Tạo kiểm kho thứ 3 (bán 3 con, còn 17 con)
    const stockCheck3 = new StockCheck({
      ingredient: frog._id,
      previousStock: 20,
      newStock: 17,
      difference: -3,
      checkedBy: new mongoose.Types.ObjectId(),
      checkedByName: 'Admin',
      notes: 'Kiểm kho thứ 3 - bán 3 con',
      checkDate: new Date('2024-12-24T18:00:00Z'), // Thứ 3
      isCompleted: true
    });

    await stockCheck3.save();
    console.log('✅ Tạo kiểm kho thứ 3 (bán 3 con)');

    // Tạo kiểm kho thứ 4 (bán 6 con, còn 11 con)
    const stockCheck4 = new StockCheck({
      ingredient: frog._id,
      previousStock: 17,
      newStock: 11,
      difference: -6,
      checkedBy: new mongoose.Types.ObjectId(),
      checkedByName: 'Admin',
      notes: 'Kiểm kho thứ 4 - bán 6 con',
      checkDate: new Date('2024-12-25T18:00:00Z'), // Thứ 4
      isCompleted: true
    });

    await stockCheck4.save();
    console.log('✅ Tạo kiểm kho thứ 4 (bán 6 con)');

    // Tạo kiểm kho thứ 5 (bán 1 con, còn 10 con)
    const stockCheck5 = new StockCheck({
      ingredient: frog._id,
      previousStock: 11,
      newStock: 10,
      difference: -1,
      checkedBy: new mongoose.Types.ObjectId(),
      checkedByName: 'Admin',
      notes: 'Kiểm kho thứ 5 - bán 1 con',
      checkDate: new Date('2024-12-26T18:00:00Z'), // Thứ 5
      isCompleted: true
    });

    await stockCheck5.save();
    console.log('✅ Tạo kiểm kho thứ 5 (bán 1 con)');

    console.log('\n🎯 Kịch bản ếch mới đã được tạo:');
    console.log('📅 Thứ 2: Nhập 20 con ếch');
    console.log('📅 Thứ 3: Bán 3 con → Còn 17 con');
    console.log('📅 Thứ 4: Bán 6 con → Còn 11 con');
    console.log('📅 Thứ 5: Bán 1 con → Còn 10 con');
    console.log('📅 Thứ 6: Nhập 5 con → Còn 15 con (hôm nay)');
    console.log('\n📊 Bảng so sánh sẽ hiển thị:');
    console.log('• Ngày nhập gần nhất: 5 con (Thứ 6)');
    console.log('• Hôm qua: 10 con (Thứ 5)');
    console.log('• Hôm nay: 15 con (Thứ 6)');
    console.log('• Xài hôm nay: 0 con (15 - 15 = 0, vì nhập hàng)');
    console.log('• Xài từ lần nhập trước: 10 con (20 - 10 = 10, từ thứ 2 đến thứ 5)');

  } catch (error) {
    console.error('❌ Lỗi tạo kịch bản ếch:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Hoàn thành! Hãy kiểm tra bảng so sánh trong webadmin.');
  }
}

createFrogScenario2();
