import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/cafe_admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Schemas
const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image: String,
  status: { type: String, enum: ['available', 'unavailable'], default: 'available' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const TableSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true },
  capacity: { type: Number, required: true },
  status: { type: String, enum: ['available', 'occupied', 'reserved', 'maintenance'], default: 'available' },
  location: String,
  createdAt: { type: Date, default: Date.now }
});

const OrderSchema = new mongoose.Schema({
  tableNumber: { type: Number, required: true },
  items: [{
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'preparing', 'ready', 'served', 'paid'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: String,
  email: String,
  address: String,
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String, required: true },
  phone: String,
  email: String,
  salary: Number,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

// Models
const MenuItem = mongoose.model('MenuItem', MenuItemSchema);
const Table = mongoose.model('Table', TableSchema);
const Order = mongoose.model('Order', OrderSchema);
const Customer = mongoose.model('Customer', CustomerSchema);
const Employee = mongoose.model('Employee', EmployeeSchema);

// API Routes

// Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalCustomers = await Customer.countDocuments();
    const totalMenuItems = await MenuItem.countDocuments();
    const availableTables = await Table.countDocuments({ status: 'available' });

    res.json({
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalCustomers,
      totalMenuItems,
      availableTables
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Menu Items
app.get('/api/menu', async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/menu', async (req, res) => {
  try {
    const item = new MenuItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/menu/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: 'Menu item not found' });
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/menu/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Menu item not found' });
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Tables
app.get('/api/tables', async (req, res) => {
  try {
    const tables = await Table.find().sort({ number: 1 });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tables', async (req, res) => {
  try {
    const table = new Table(req.body);
    await table.save();
    res.status(201).json(table);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.menuItemId')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Customers
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Employees
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Recent Activity
app.get('/api/dashboard/recent-activity', async (req, res) => {
  try {
    const recentOrders = await Order.find()
      .populate('items.menuItemId')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json(recentOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Top Selling Items
app.get('/api/dashboard/top-items', async (req, res) => {
  try {
    const topItems = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { 
        _id: '$items.menuItemId', 
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
      }},
      { $lookup: {
        from: 'menuitems',
        localField: '_id',
        foreignField: '_id',
        as: 'menuItem'
      }},
      { $unwind: '$menuItem' },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);
    
    res.json(topItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
