const axios = require('axios');

async function testIngredientsAPI() {
  try {
    // First, login to get token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/employees/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');

    // Test ingredients API
    console.log('\n📦 Testing ingredients API...');
    const ingredientsResponse = await axios.get('http://localhost:5000/api/ingredients', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const ingredients = ingredientsResponse.data.ingredients || ingredientsResponse.data;
    
    if (Array.isArray(ingredients)) {
      console.log(`✅ Found ${ingredients.length} ingredients:`);
      ingredients.forEach((ingredient, index) => {
        console.log(`${index + 1}. ${ingredient.name} - ${ingredient.currentStock}${ingredient.unit} - ${ingredient.unitPrice.toLocaleString('vi-VN')} VNĐ`);
      });
    } else {
      console.log('❌ Response is not an array:', typeof ingredients);
    }

    // Test inventory transactions API
    console.log('\n📊 Testing inventory transactions API...');
    const transactionsResponse = await axios.get('http://localhost:5000/api/inventory-transactions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`✅ Found ${transactionsResponse.data.length} transactions`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the test
testIngredientsAPI();
