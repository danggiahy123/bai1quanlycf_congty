const express = require('express');
const Menu = require('../models/Menu');

const router = express.Router();

// Get all menu items
router.get('/', async (req, res) => {
  try {
    const { category, search, limit = 50, page = 1 } = req.query;
    let query = {};
    
    // Filter by category if provided
    if (category) {
      query.category = category;
    }
    
    // Search by name if provided
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const menus = await Menu.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Menu.countDocuments(query);
    
    res.json({
      data: menus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get menu categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Menu.distinct('category');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get menu item by ID
router.get('/:id', async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({ error: 'Món ăn không tồn tại' });
    }
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new menu item with 5-digit id
router.post('/', async (req, res) => {
  try {
    let payload = { ...req.body };
    // Nếu client chưa gửi _id, tự sinh _id 5 chữ số, đảm bảo unique bằng cách thử nhiều lần
    if (!payload._id) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const id = Math.floor(10000 + Math.random() * 90000).toString();
        const exists = await Menu.exists({ _id: id });
        if (!exists) {
          payload._id = id;
          break;
        }
      }
      if (!payload._id) {
        return res.status(500).json({ error: 'Không tạo được ID ngẫu nhiên, thử lại.' });
      }
    }

    const menu = new Menu(payload);
    await menu.save();
    res.json(menu);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a menu item
router.put('/:id', async (req, res) => {
  try {
    const menu = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(menu);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a menu item
router.delete('/:id', async (req, res) => {
  try {
    await Menu.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;


