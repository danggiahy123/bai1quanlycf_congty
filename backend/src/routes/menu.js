const express = require('express');
const Menu = require('../models/Menu');

const router = express.Router();

// Get all menu items
router.get('/', async (req, res) => {
  try {
    const menus = await Menu.find();
    res.json(menus);
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


