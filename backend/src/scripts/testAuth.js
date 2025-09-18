require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Test token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2I3Mjg3ODQ5MjVmZDU1MzE2MTBkOCIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTgxNjM1OTksImV4cCI6MTc1ODI0OTk5OX0.cD7P7dE-dgsho_DlE7Dyu-NksosvxSk3TDJmdkO0m4Q';

try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('Token is valid:', decoded);
} catch (error) {
  console.error('Token is invalid:', error.message);
}
