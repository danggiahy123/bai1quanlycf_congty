const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cafe_app';

async function testAPI() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const app = express();
    app.use(express.json());

    // Test route
    app.get('/api/test', (req, res) => {
      res.json({ message: 'API test working!' });
    });

    // Import booking router
    const bookingRouter = require('./src/routes/booking');
    app.use('/api/bookings', bookingRouter);

    const server = app.listen(5001, () => {
      console.log('Test server running on port 5001');
      
      // Test the API
      const http = require('http');
      const options = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/test',
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        console.log(`Test API status: ${res.statusCode}`);
        res.on('data', (d) => {
          console.log('Response:', d.toString());
        });
      });

      req.on('error', (e) => {
        console.error('Error:', e.message);
      });

      req.end();

      // Test bookings API
      const bookingOptions = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/bookings',
        method: 'GET'
      };

      const bookingReq = http.request(bookingOptions, (res) => {
        console.log(`Bookings API status: ${res.statusCode}`);
        res.on('data', (d) => {
          console.log('Bookings Response:', d.toString());
        });
      });

      bookingReq.on('error', (e) => {
        console.error('Bookings Error:', e.message);
      });

      bookingReq.end();

      // Close server after test
      setTimeout(() => {
        server.close();
        mongoose.disconnect();
        process.exit(0);
      }, 2000);
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAPI();
