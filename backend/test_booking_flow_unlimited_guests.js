const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testBookingFlowWithUnlimitedGuests() {
  console.log('🧪 Test Booking Flow with Unlimited Guests\n');

  try {
    // 1. Test với số khách nhỏ (1-10)
    console.log('📝 Test 1: Số khách nhỏ (1-10)');
    await testBookingWithGuests(5);
    
    // 2. Test với số khách trung bình (10-50)
    console.log('\n📝 Test 2: Số khách trung bình (10-50)');
    await testBookingWithGuests(25);
    
    // 3. Test với số khách lớn (50+)
    console.log('\n📝 Test 3: Số khách lớn (50+)');
    await testBookingWithGuests(100);
    
    // 4. Test với số khách rất lớn
    console.log('\n📝 Test 4: Số khách rất lớn (200+)');
    await testBookingWithGuests(250);
    
    console.log('\n✅ Tất cả test đều thành công! Số khách không bị giới hạn.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testBookingWithGuests(numberOfGuests) {
  try {
    // 1. Đăng nhập khách hàng
    console.log(`   👤 Đăng nhập khách hàng...`);
    const loginResponse = await axios.post(`${API_URL}/api/customers/login`, {
      username: 'test_customer_unlimited',
      password: '123123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }
    
    const token = loginResponse.data.token;
    console.log(`   ✅ Đăng nhập thành công`);
    
    // 2. Lấy danh sách bàn
    console.log(`   🪑 Lấy danh sách bàn...`);
    const tablesResponse = await axios.get(`${API_URL}/api/tables`);
    const tables = tablesResponse.data;
    
    if (!tables || tables.length === 0) {
      throw new Error('No tables available');
    }
    
    const firstTable = tables[0];
    console.log(`   ✅ Tìm thấy bàn: ${firstTable.name}`);
    
    // 3. Lấy menu
    console.log(`   🍽️ Lấy menu...`);
    const menuResponse = await axios.get(`${API_URL}/api/menu`);
    const menuItems = menuResponse.data;
    
    if (!menuItems || menuItems.length === 0) {
      throw new Error('No menu items available');
    }
    
    const firstMenuItem = menuItems[0];
    console.log(`   ✅ Tìm thấy món: ${firstMenuItem.name}`);
    
    // 4. Tạo booking với số khách không giới hạn
    console.log(`   📅 Tạo booking cho ${numberOfGuests} khách...`);
    const bookingData = {
      tableId: firstTable._id,
      numberOfGuests: numberOfGuests,
      bookingDate: new Date().toISOString().split('T')[0],
      bookingTime: '18:00',
      menuItems: [{
        itemId: firstMenuItem._id,
        quantity: Math.ceil(numberOfGuests / 2) // Tỷ lệ món ăn theo số khách
      }],
      notes: `Booking test cho ${numberOfGuests} khách`
    };
    
    const bookingResponse = await axios.post(`${API_URL}/api/bookings`, bookingData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!bookingResponse.data.success) {
      throw new Error(`Booking failed: ${bookingResponse.data.message}`);
    }
    
    console.log(`   ✅ Booking thành công cho ${numberOfGuests} khách`);
    console.log(`   📊 Booking ID: ${bookingResponse.data.booking._id}`);
    
    // 5. Kiểm tra booking đã được tạo
    console.log(`   🔍 Kiểm tra booking...`);
    const checkResponse = await axios.get(`${API_URL}/api/bookings/${bookingResponse.data.booking._id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (checkResponse.data.numberOfGuests !== numberOfGuests) {
      throw new Error(`Số khách không khớp: expected ${numberOfGuests}, got ${checkResponse.data.numberOfGuests}`);
    }
    
    console.log(`   ✅ Xác nhận: Booking có ${checkResponse.data.numberOfGuests} khách`);
    
    // 6. Cleanup - Xóa booking test
    console.log(`   🧹 Dọn dẹp booking test...`);
    try {
      await axios.delete(`${API_URL}/api/bookings/${bookingResponse.data.booking._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`   ✅ Đã xóa booking test`);
    } catch (cleanupError) {
      console.log(`   ⚠️ Không thể xóa booking test: ${cleanupError.message}`);
    }
    
  } catch (error) {
    console.error(`   ❌ Lỗi với ${numberOfGuests} khách:`, error.message);
    throw error;
  }
}

// Chạy test
testBookingFlowWithUnlimitedGuests();
