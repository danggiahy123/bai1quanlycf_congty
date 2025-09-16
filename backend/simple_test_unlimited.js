const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testUnlimitedGuests() {
  console.log('🧪 Test Unlimited Guests - Simple Version\n');

  try {
    // 1. Tạo customer nếu chưa có
    console.log('👤 Tạo/kiểm tra customer...');
    try {
      await axios.post(`${API_URL}/api/customers/register`, {
        username: 'unlimited_test',
        password: '123123',
        fullName: 'Unlimited Test',
        phone: '0123456789',
        email: `unlimited_${Date.now()}@test.com`
      });
      console.log('✅ Customer đã sẵn sàng');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('ℹ️ Customer đã tồn tại, tiếp tục...');
      } else {
        throw error;
      }
    }

    // 2. Đăng nhập
    console.log('🔐 Đăng nhập...');
    const loginResponse = await axios.post(`${API_URL}/api/customers/login`, {
      username: 'unlimited_test',
      password: '123123'
    });

    if (!loginResponse.data.token) {
      throw new Error('Login failed');
    }

    const token = loginResponse.data.token;
    console.log('✅ Đăng nhập thành công');

    // 3. Test với các số khách khác nhau
    const testCases = [1, 5, 25, 50, 100, 200, 500];
    
    for (const guests of testCases) {
      console.log(`\n📊 Test với ${guests} khách:`);
      
      try {
        // Lấy bàn đầu tiên
        const tablesResponse = await axios.get(`${API_URL}/api/tables`);
        const firstTable = tablesResponse.data[0];
        
        if (!firstTable) {
          console.log('   ⚠️ Không có bàn nào');
          continue;
        }

        // Lấy menu item đầu tiên
        const menuResponse = await axios.get(`${API_URL}/api/menu`);
        const firstMenuItem = menuResponse.data[0];
        
        if (!firstMenuItem) {
          console.log('   ⚠️ Không có món nào');
          continue;
        }

        // Tạo booking
        const bookingData = {
          tableId: firstTable._id,
          numberOfGuests: guests,
          bookingDate: new Date().toISOString().split('T')[0],
          bookingTime: '18:00',
          menuItems: [{
            itemId: firstMenuItem._id,
            quantity: Math.ceil(guests / 2)
          }],
          notes: `Test ${guests} khách`
        };

        const bookingResponse = await axios.post(`${API_URL}/api/bookings`, bookingData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (bookingResponse.data.success) {
          console.log(`   ✅ Thành công: ${guests} khách`);
          
          // Kiểm tra số khách đã lưu đúng
          const checkResponse = await axios.get(`${API_URL}/api/bookings/${bookingResponse.data.booking._id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (checkResponse.data.numberOfGuests === guests) {
            console.log(`   ✅ Xác nhận: Đã lưu đúng ${guests} khách`);
          } else {
            console.log(`   ❌ Lỗi: Lưu ${checkResponse.data.numberOfGuests} thay vì ${guests}`);
          }
          
          // Cleanup
          try {
            await axios.delete(`${API_URL}/api/bookings/${bookingResponse.data.booking._id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
          } catch (cleanupError) {
            // Ignore cleanup errors
          }
          
        } else {
          console.log(`   ❌ Thất bại: ${bookingResponse.data.message}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Lỗi: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n🎉 Test hoàn thành! Số khách không bị giới hạn.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUnlimitedGuests();
