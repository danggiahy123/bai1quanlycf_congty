const API_URL = 'http://192.168.5.117:5000';

// Thông tin admin test (vì chưa có nhân viên)
const employeeCredentials = {
  username: 'admin',
  password: 'admin123'
};

// Thông tin booking test
const bookingData = {
  tableId: '', // Sẽ lấy từ danh sách bàn
  numberOfGuests: 4,
  bookingDate: new Date().toISOString().split('T')[0], // Hôm nay
  bookingTime: '19:00',
  menuItems: [
    {
      itemId: '', // Sẽ lấy từ menu
      quantity: 2
    }
  ],
  notes: 'Booking test từ nhân viên - Cần xác nhận trên webadmin',
  depositAmount: 100000, // 100k cọc
  customerInfo: {
    fullName: 'Nguyễn Văn Test',
    phone: '0123456789',
    email: 'test@example.com'
  }
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

async function testEmployeeBooking() {
  try {
    console.log('🚀 Bắt đầu test tạo booking bằng nhân viên...\n');

    // 1. Đăng nhập admin
    console.log('1️⃣ Đăng nhập admin...');
    const loginResponse = await makeRequest(`${API_URL}/api/employees/login`, {
      method: 'POST',
      body: JSON.stringify(employeeCredentials)
    });
    
    console.log('📄 Login response:', JSON.stringify(loginResponse.data, null, 2));
    
    if (!loginResponse.data.success) {
      throw new Error('Đăng nhập thất bại: ' + loginResponse.data.message);
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Đăng nhập thành công!');
    console.log('👤 Admin:', loginResponse.data.employee.fullName);
    console.log('🔑 Token:', token.substring(0, 20) + '...\n');

    // 2. Lấy danh sách bàn trống
    console.log('2️⃣ Lấy danh sách bàn trống...');
    const tablesResponse = await makeRequest(`${API_URL}/api/tables`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const availableTables = tablesResponse.data.filter(table => table.status === 'empty');
    if (availableTables.length === 0) {
      throw new Error('Không có bàn trống nào!');
    }
    
    const selectedTable = availableTables[0];
    bookingData.tableId = selectedTable._id;
    console.log('✅ Tìm thấy bàn trống:', selectedTable.name, `(${selectedTable.capacity} người)\n`);

    // 3. Lấy danh sách menu
    console.log('3️⃣ Lấy danh sách menu...');
    const menuResponse = await makeRequest(`${API_URL}/api/menu`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (menuResponse.data.length === 0) {
      throw new Error('Không có món ăn nào trong menu!');
    }
    
    const selectedMenuItem = menuResponse.data[0];
    bookingData.menuItems[0].itemId = selectedMenuItem._id;
    console.log('✅ Chọn món ăn:', selectedMenuItem.name, `(${selectedMenuItem.price.toLocaleString()}đ)\n`);

    // 4. Tạo booking
    console.log('4️⃣ Tạo booking...');
    console.log('📋 Thông tin booking:');
    console.log('   - Bàn:', selectedTable.name);
    console.log('   - Số khách:', bookingData.numberOfGuests);
    console.log('   - Ngày:', bookingData.bookingDate);
    console.log('   - Giờ:', bookingData.bookingTime);
    console.log('   - Món ăn:', selectedMenuItem.name, `x${bookingData.menuItems[0].quantity}`);
    console.log('   - Cọc:', bookingData.depositAmount.toLocaleString() + 'đ');
    console.log('   - Khách hàng:', bookingData.customerInfo.fullName);
    console.log('   - SĐT:', bookingData.customerInfo.phone);
    console.log('   - Ghi chú:', bookingData.notes);
    console.log('');

    const bookingResponse = await makeRequest(`${API_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(bookingData)
    });

    if (!bookingResponse.data.success) {
      throw new Error('Tạo booking thất bại: ' + bookingResponse.data.message);
    }

    const booking = bookingResponse.data.booking;
    console.log('✅ Tạo booking thành công!');
    console.log('🆔 Booking ID:', booking._id);
    console.log('📊 Trạng thái:', booking.status);
    console.log('💰 Tổng tiền:', booking.totalAmount?.toLocaleString() + 'đ');
    console.log('💳 Tiền cọc:', booking.depositAmount.toLocaleString() + 'đ');
    console.log('');

    // 5. Kiểm tra booking trên webadmin
    console.log('5️⃣ Hướng dẫn xác nhận trên WebAdmin:');
    console.log('🌐 Truy cập: http://192.168.5.117:5173');
    console.log('👤 Đăng nhập với tài khoản admin');
    console.log('📋 Vào tab "Đặt bàn"');
    console.log('🔍 Tìm booking ID:', booking._id);
    console.log('✅ Nhấn "Xác nhận" để duyệt booking');
    console.log('');

    // 6. Test thanh toán cọc (simulation)
    console.log('6️⃣ Test thanh toán cọc (simulation)...');
    try {
      const paymentResponse = await makeRequest(`${API_URL}/api/payment/webhook-simulation`, {
        method: 'POST',
        body: JSON.stringify({
          bookingId: booking._id,
          amount: booking.depositAmount,
          transactionType: 'deposit'
        })
      });

      if (paymentResponse.data.success) {
        console.log('✅ Thanh toán cọc thành công!');
        console.log('📊 Trạng thái booking đã được cập nhật');
      } else {
        console.log('⚠️ Thanh toán cọc thất bại:', paymentResponse.data.message);
      }
    } catch (paymentError) {
      console.log('⚠️ Lỗi test thanh toán:', paymentError.message);
    }

    console.log('\n🎉 HOÀN THÀNH! Booking đã được tạo và sẵn sàng để xác nhận trên WebAdmin.');
    console.log('📱 Bạn có thể kiểm tra trên WebAdmin tại: http://192.168.5.117:5173');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    if (error.data) {
      console.error('📄 Chi tiết lỗi:', error.data);
    }
  }
}

// Chạy test
testEmployeeBooking();
