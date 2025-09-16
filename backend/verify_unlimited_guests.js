const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function verifyUnlimitedGuests() {
  console.log('🔍 Verify Unlimited Guests Storage\n');

  try {
    // Đăng nhập
    const loginResponse = await axios.post(`${API_URL}/api/customers/login`, {
      username: 'unlimited_test',
      password: '123123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Đăng nhập thành công');

    // Test với số khách lớn
    const testGuests = 999;
    console.log(`\n📊 Test với ${testGuests} khách:`);

    // Lấy bàn và menu
    const tablesResponse = await axios.get(`${API_URL}/api/tables`);
    const menuResponse = await axios.get(`${API_URL}/api/menu`);
    
    // Tìm bàn trống
    const availableTable = tablesResponse.data.find(table => table.status === 'empty') || tablesResponse.data[0];
    const firstMenuItem = menuResponse.data[0];

    if (!availableTable || !firstMenuItem) {
      throw new Error('Không có bàn hoặc menu');
    }

    console.log(`🪑 Sử dụng bàn: ${availableTable.name}`);

    // Tạo booking với số khách lớn
    const bookingData = {
      tableId: availableTable._id,
      numberOfGuests: testGuests,
      bookingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 tuần sau
      bookingTime: '18:00',
      menuItems: [{
        itemId: firstMenuItem._id,
        quantity: Math.ceil(testGuests / 2)
      }],
      notes: `Test ${testGuests} khách - Unlimited`
    };

    console.log('📝 Tạo booking...');
    const bookingResponse = await axios.post(`${API_URL}/api/bookings`, bookingData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (bookingResponse.data.success || bookingResponse.data.message?.includes('thành công')) {
      console.log('✅ Booking tạo thành công!');
      
      // Kiểm tra số khách đã lưu
      console.log('🔍 Kiểm tra số khách đã lưu...');
      const checkResponse = await axios.get(`${API_URL}/api/bookings/${bookingResponse.data.booking._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const savedGuests = checkResponse.data.numberOfGuests;
      console.log(`📊 Số khách đã lưu: ${savedGuests}`);
      
      if (savedGuests === testGuests) {
        console.log('✅ THÀNH CÔNG: Số khách được lưu chính xác!');
        console.log(`✅ Xác nhận: ${testGuests} khách = ${savedGuests} khách`);
      } else {
        console.log('❌ LỖI: Số khách không khớp!');
        console.log(`❌ Expected: ${testGuests}, Got: ${savedGuests}`);
      }
      
      // Hiển thị thông tin booking
      console.log('\n📋 Thông tin booking:');
      console.log(`   ID: ${checkResponse.data._id}`);
      console.log(`   Bàn: ${checkResponse.data.table.name}`);
      console.log(`   Số khách: ${checkResponse.data.numberOfGuests}`);
      console.log(`   Ngày: ${checkResponse.data.bookingDate}`);
      console.log(`   Giờ: ${checkResponse.data.bookingTime}`);
      console.log(`   Trạng thái: ${checkResponse.data.status}`);
      
      // Cleanup
      console.log('\n🧹 Dọn dẹp...');
      try {
        await axios.delete(`${API_URL}/api/bookings/${bookingResponse.data.booking._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Đã xóa booking test');
      } catch (cleanupError) {
        console.log('⚠️ Không thể xóa booking test');
      }
      
    } else {
      console.log('❌ Tạo booking thất bại:', bookingResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

verifyUnlimitedGuests();
