const API_URL = 'http://192.168.5.117:5000';

// Thông tin booking đơn giản
const bookingData = {
  tableId: '10001', // Bàn VIP 1
  numberOfGuests: 4,
  bookingDate: new Date().toISOString().split('T')[0], // Hôm nay
  bookingTime: '19:00',
  specialRequests: 'Booking test từ nhân viên cho khách hàng - Cần xác nhận trên webadmin',
  depositAmount: 100000, // 100k cọc
  customerPhone: '0123456789',
  customerEmail: 'khachhang@example.com'
};

async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  const data = await response.json();
  return { data, ok: response.ok, status: response.status };
}

async function testSimpleBooking() {
  try {
    console.log('🚀 Bắt đầu test tạo booking đơn giản...\n');

    console.log('📋 Thông tin booking:');
    console.log('   - Bàn ID:', bookingData.tableId);
    console.log('   - Số khách:', bookingData.numberOfGuests);
    console.log('   - Ngày:', bookingData.bookingDate);
    console.log('   - Giờ:', bookingData.bookingTime);
    console.log('   - Cọc:', bookingData.depositAmount.toLocaleString() + 'đ');
    console.log('   - SĐT:', bookingData.customerPhone);
    console.log('   - Email:', bookingData.customerEmail);
    console.log('   - Ghi chú:', bookingData.specialRequests);
    console.log('');

    // Sử dụng API admin-quick-booking
    const bookingResponse = await makeRequest(`${API_URL}/api/bookings/admin-quick-booking`, {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });

    console.log('📄 Booking response:', JSON.stringify(bookingResponse.data, null, 2));

    if (bookingResponse.data.booking) {
      const booking = bookingResponse.data.booking;
      console.log('✅ Tạo booking thành công!');
      console.log('🆔 Booking ID:', booking._id);
      console.log('📊 Trạng thái:', booking.status);
      console.log('💳 Tiền cọc:', booking.depositAmount.toLocaleString() + 'đ');
      console.log('');

      // Hướng dẫn xác nhận trên webadmin
      console.log('5️⃣ Hướng dẫn xác nhận trên WebAdmin:');
      console.log('🌐 Truy cập: http://192.168.5.117:5173');
      console.log('👤 Đăng nhập với tài khoản admin');
      console.log('📋 Vào tab "Đặt bàn"');
      console.log('🔍 Tìm booking ID:', booking._id);
      console.log('✅ Nhấn "Xác nhận" để duyệt booking');
      console.log('');

      console.log('\n🎉 HOÀN THÀNH! Booking đã được tạo và sẵn sàng để xác nhận trên WebAdmin.');
      console.log('📱 Bạn có thể kiểm tra trên WebAdmin tại: http://192.168.5.117:5173');
    } else {
      throw new Error('Tạo booking thất bại: ' + bookingResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    if (error.data) {
      console.error('📄 Chi tiết lỗi:', error.data);
    }
  }
}

// Chạy test
testSimpleBooking();
