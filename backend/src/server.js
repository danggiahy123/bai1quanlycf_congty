require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// Removed upload support to keep API simple (use external image URLs)

const menuRouter = require('./routes/menu');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static files (uploaded images)
// No static uploads; image field should be a URL

// Routes
app.use('/api/menu', menuRouter);

// Removed /api/upload endpoint

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Debug: xem thông tin kết nối MongoDB hiện tại
app.get('/api/debug/db', async (req, res) => {
  try {
    const conn = mongoose.connection;
    const collections = await conn.db.listCollections().toArray();
    res.json({
      host: conn.host,
      port: conn.port,
      name: conn.name,
      collections: collections.map(c => c.name),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DB connect and server start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cafe_app';

async function start() {
  try {
    await mongoose.connect(MONGO_URI, {
      autoIndex: true,
    });
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

module.exports = app;


