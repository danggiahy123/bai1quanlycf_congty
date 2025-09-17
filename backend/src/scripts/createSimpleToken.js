const jwt = require('jsonwebtoken');

// Tạo token admin đơn giản
const adminData = {
  id: '68c90dbd16bad15e6771c8a1', // ID admin mặc định
  username: 'admin',
  role: 'admin'
};

const token = jwt.sign(
  adminData,
  process.env.JWT_SECRET || 'your-secret-key',
  { expiresIn: '24h' }
);

console.log('🔑 New admin token:');
console.log(token);

// Test decode
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  console.log('\n✅ Token verification successful:');
  console.log('Decoded:', decoded);
} catch (error) {
  console.error('❌ Token verification failed:', error);
}
