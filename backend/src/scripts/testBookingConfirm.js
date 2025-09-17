const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testBookingConfirm() {
  try {
    console.log('🧪 Test xác nhận booking...\n');

    // 1. Lấy danh sách booking pending
    console.log('1️⃣ Lấy danh sách booking pending...');
    const bookingsResponse = await axios.get(`${API_URL}/api/bookings`);
    const pendingBookings = bookingsResponse.data.filter(booking => booking.status === 'pending');
    
    if (pendingBookings.length === 0) {
      console.log('⚠️ Không có booking nào đang pending để test');
      return;
    }

    const testBooking = pendingBookings[0];
    console.log(`✅ Tìm thấy booking ${testBooking._id} đang pending`);

    // 2. Tạo token admin
    console.log('\n2️⃣ Tạo token admin...');
    const tokenResponse = await axios.post(`${API_URL}/api/employees/login`, {
      username: 'admin',
      password: 'admin123'
    });

    if (tokenResponse.data.token) {
      console.log('✅ Token admin tạo thành công');
      const token = tokenResponse.data.token;

      // 3. Test xác nhận booking
      console.log(`\n3️⃣ Test xác nhận booking ${testBooking._id}...`);
      try {
        const confirmResponse = await axios.post(`${API_URL}/api/bookings/${testBooking._id}/confirm`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Xác nhận booking thành công!');
        console.log('📊 Dữ liệu trả về:', confirmResponse.data);
      } catch (confirmError) {
        console.log('❌ Lỗi xác nhận booking:', confirmError.response?.data || confirmError.message);
      }
    } else {
      console.log('❌ Không thể tạo token admin');
    }

  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error.message);
  }
}

// Chạy test
testBookingConfirm();
