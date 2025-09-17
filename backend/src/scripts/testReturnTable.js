const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testReturnTable() {
  try {
    console.log('🧪 Bắt đầu test tính năng trả bàn...\n');

    // 1. Kiểm tra bàn occupied
    console.log('1️⃣ Kiểm tra bàn đang occupied...');
    const tablesResponse = await axios.get(`${API_URL}/api/tables`);
    const occupiedTables = tablesResponse.data.filter(table => table.status === 'occupied');
    
    if (occupiedTables.length === 0) {
      console.log('⚠️ Không có bàn nào đang occupied để test trả bàn');
      console.log('💡 Hãy tạo booking trước để test');
      return;
    }

    const testTable = occupiedTables[0];
    console.log(`✅ Tìm thấy bàn ${testTable.name} (ID: ${testTable._id}) đang occupied`);

    // 2. Test API trả bàn
    console.log(`\n2️⃣ Test trả bàn ${testTable.name}...`);
    try {
      const returnResponse = await axios.post(`${API_URL}/api/tables/${testTable._id}/return`, {
        performedBy: 'admin',
        performedByName: 'Admin'
      });
      
      if (returnResponse.data.success) {
        console.log('✅ Trả bàn thành công!');
        console.log('📊 Dữ liệu trả về:', {
          message: returnResponse.data.message,
          table: returnResponse.data.table,
          deletedOrder: returnResponse.data.deletedOrder,
          cancelledBooking: returnResponse.data.cancelledBooking
        });
      }
    } catch (returnError) {
      console.log('❌ Lỗi trả bàn:', returnError.response?.data?.error || returnError.message);
    }

    // 3. Kiểm tra trạng thái bàn sau khi trả
    console.log('\n3️⃣ Kiểm tra trạng thái bàn sau khi trả...');
    const updatedTablesResponse = await axios.get(`${API_URL}/api/tables`);
    const updatedTable = updatedTablesResponse.data.find(table => table._id === testTable._id);
    console.log(`📋 Trạng thái bàn ${updatedTable.name}: ${updatedTable.status}`);

    // 4. Kiểm tra lịch sử bàn
    console.log('\n4️⃣ Kiểm tra lịch sử bàn...');
    try {
      const historyResponse = await axios.get(`${API_URL}/api/table-history`);
      const recentHistory = historyResponse.data
        .filter(h => h.tableId === testTable._id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
      
      console.log('📜 Lịch sử gần đây:');
      recentHistory.forEach(h => {
        console.log(`  - ${h.action}: ${h.note} (${new Date(h.createdAt).toLocaleString()})`);
      });
    } catch (historyError) {
      console.log('⚠️ Không thể lấy lịch sử bàn:', historyError.message);
    }

    console.log('\n🎉 Test hoàn thành!');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error.message);
  }
}

// Chạy test
testReturnTable();
