const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YzkwZGJkMTZiYWQxNWU2NzcxYzhhMSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1ODAwNzk1OSwiZXhwIjoxNzU4MDk0MzU5fQ.mjfCHsVkPC8TOriWWYC-j6gDtUKyx2MKml5D3FssajQ';

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  console.log('🔍 Decoded token:');
  console.log('ID:', decoded.id);
  console.log('Type of ID:', typeof decoded.id);
  console.log('Email:', decoded.email);
  console.log('Role:', decoded.role);
} catch (error) {
  console.error('❌ Error decoding token:', error);
}
