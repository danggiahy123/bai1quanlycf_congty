const express = require('express');
const Table = require('../models/Table');

const router = express.Router();

function generateId() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// List all tables (optionally filter by status)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const tables = await Table.find(query).sort({ createdAt: 1 });
    res.json(tables);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new table
router.post('/', async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload._id) {
      for (let i = 0; i < 5; i++) {
        const id = generateId();
        const exists = await Table.exists({ _id: id });
        if (!exists) { payload._id = id; break; }
      }
      if (!payload._id) return res.status(500).json({ error: 'Không tạo được ID' });
    }
    if (!payload.name) payload.name = `Bàn ${payload._id}`;
    const table = new Table(payload);
    await table.save();
    res.json(table);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update table
router.put('/:id', async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(table);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete table
router.delete('/:id', async (req, res) => {
  try {
    await Table.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Mark table as occupied
router.post('/:id/occupy', async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, { status: 'occupied' }, { new: true });
    res.json(table);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Mark table as empty
router.post('/:id/free', async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, { status: 'empty' }, { new: true });
    res.json(table);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;



