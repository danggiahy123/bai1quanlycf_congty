const express = require('express');
const TableHistory = require('../models/TableHistory');

const router = express.Router();

// Lấy lịch sử bàn
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, tableId } = req.query;
    const skip = (page - 1) * limit;

    const query = tableId ? { tableId } : {};
    
    const history = await TableHistory.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TableHistory.countDocuments(query);

    res.json({
      history,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Lỗi lấy lịch sử bàn:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
