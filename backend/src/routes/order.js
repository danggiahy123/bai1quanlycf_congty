const express = require('express');
const Order = require('../models/Order');
const Table = require('../models/Table');

const router = express.Router();

// Get current active order by tableId (status pending)
router.get('/by-table/:tableId', async (req, res) => {
  try {
    const order = await Order.findOne({ tableId: req.params.tableId, status: 'pending' });
    res.json(order || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upsert items for a table (create pending order or update its items)
router.post('/by-table/:tableId', async (req, res) => {
  try {
    const { items } = req.body; // [{menuId,name,price,quantity}]
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be an array' });
    const tableId = req.params.tableId;
    let order = await Order.findOne({ tableId, status: 'pending' });
    if (!order) {
      order = new Order({ tableId, items });
    } else {
      order.items = items;
    }
    await order.save();
    await Table.findByIdAndUpdate(tableId, { status: 'occupied' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Mark order as paid and free the table
router.post('/by-table/:tableId/pay', async (req, res) => {
  try {
    const tableId = req.params.tableId;
    const order = await Order.findOneAndUpdate({ tableId, status: 'pending' }, { status: 'paid' }, { new: true });
    await Table.findByIdAndUpdate(tableId, { status: 'empty' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;



