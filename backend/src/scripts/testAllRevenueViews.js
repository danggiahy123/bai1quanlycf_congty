const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YzhlNWUxZDFiMzRhMjkxZjc1ZTkzOSIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTgzMzk1MTYsImV4cCI6MTc1ODQyNTkxNn0.PgPp_DqqNjGdDtuOZPbsEFLVq03A2rPIpKhtUST6L4g';

async function testAllRevenueViews() {
  try {
    console.log('🧪 Testing all revenue views...\n');

    const views = ['day', 'week', 'month'];
    
    for (const view of views) {
      console.log(`📊 Testing ${view.toUpperCase()} view:`);
      console.log('='.repeat(50));
      
      try {
        const response = await axios.get(`${API_BASE}/dashboard/revenue?range=${view}`, {
          headers: {
            'Authorization': `Bearer ${testToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = response.data;
        console.log(`✅ Success: Found ${data.length} records`);
        
        if (data.length > 0) {
          const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
          const totalOrders = data.reduce((sum, item) => sum + item.orders, 0);
          const avgRevenue = Math.round(totalRevenue / data.length);
          
          console.log(`💰 Total Revenue: ${totalRevenue.toLocaleString('vi-VN')} VND`);
          console.log(`📦 Total Orders: ${totalOrders}`);
          console.log(`📈 Average: ${avgRevenue.toLocaleString('vi-VN')} VND`);
          
          console.log('\n📋 Data breakdown:');
          data.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.date}: ${item.revenue.toLocaleString('vi-VN')} VND (${item.orders} orders)`);
          });
        } else {
          console.log('⚠️  No data found for this view');
        }
        
      } catch (error) {
        console.log(`❌ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
      
      console.log('\n');
    }

    console.log('🎉 All tests completed!');

  } catch (error) {
    console.error('General Error:', error.message);
  }
}

testAllRevenueViews();
