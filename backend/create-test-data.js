const mongoose = require('mongoose');
require('dotenv').config();

const Ingredient = require('./src/models/Ingredient');
const InventoryTransaction = require('./src/models/InventoryTransaction');

async function createTestData() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cafe_app');
    console.log('✅ Connected to MongoDB');

    // Xóa dữ liệu cũ
    await Ingredient.deleteMany({ name: 'Ếch' });
    await InventoryTransaction.deleteMany({});

    // Tạo nguyên liệu ếch
    const frog = new Ingredient({
      name: 'Ếch',
      category: 'food',
      unit: 'con',
      currentStock: 12, // Hôm nay còn 12 con
      minStockLevel: 5,
      maxStockLevel: 30,
      unitPrice: 15000,
      supplier: 'Nhà cung cấp ếch tươi',
      notes: 'Ếch tươi sống',
      isActive: true
    });

    await frog.save();
    console.log('✅ Tạo nguyên liệu ếch thành công');

    // Tạo giao dịch kiểm kho hôm qua (còn 15 con)
    const yesterdayCheck = new InventoryTransaction({
      ingredient: frog._id,
      transactionType: 'adjustment',
      quantity: 0,
      unitPrice: 15000,
      totalAmount: 0,
      previousStock: 15,
      newStock: 15,
      reference: 'STOCK_CHECK_2024-12-26',
      referenceId: new mongoose.Types.ObjectId(),
      reason: 'stock_check',
      notes: 'Kiểm kho hôm qua - còn 15 con',
      performedBy: new mongoose.Types.ObjectId(),
      performedByName: 'Admin',
      department: 'warehouse',
      createdAt: new Date('2024-12-26T18:00:00Z') // Hôm qua
    });

    await yesterdayCheck.save();
    console.log('✅ Tạo kiểm kho hôm qua (15 con)');

    // Cập nhật nguyên liệu để có currentStock = 12 (hôm nay xài 3 con)
    frog.currentStock = 12;
    await frog.save();
    console.log('✅ Cập nhật tồn kho hôm nay (12 con)');

    console.log('\n🎯 Dữ liệu test đã được tạo:');
    console.log('📅 Hôm qua: 15 con ếch');
    console.log('📅 Hôm nay: 12 con ếch');
    console.log('📊 Bảng so sánh sẽ hiển thị:');
    console.log('• NGUYÊN LIỆU: Ếch');
    console.log('• TRONG KHO CÒN: 12 con');
    console.log('• HÔM NAY XÀI: 3 con (15 - 12 = 3)');

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Hoàn thành! Hãy kiểm tra bảng so sánh.');
  }
}

createTestData();
