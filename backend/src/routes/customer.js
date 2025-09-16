const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const router = express.Router();

// Đăng ký khách hàng mới
router.post('/register', async (req, res) => {
  try {
    const { username, password, fullName, email, phone, address } = req.body;

    // Kiểm tra thông tin bắt buộc
    if (!username || !password || !fullName || !email) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Kiểm tra username đã tồn tại
    const existingUser = await Customer.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }

    // Kiểm tra email đã tồn tại
    const existingEmail = await Customer.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    // Mã hóa mật khẩu
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Tạo khách hàng mới
    const customer = new Customer({
      username,
      password: hashedPassword,
      fullName,
      email,
      phone: phone || '',
      address: address || ''
    });

    await customer.save();

    res.status(201).json({ 
      message: 'Đăng ký thành công',
      customer: {
        id: customer._id,
        username: customer.username,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address
      }
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Đăng nhập khách hàng
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Kiểm tra thông tin đăng nhập
    if (!username || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
    }

    // Tìm khách hàng
    const customer = await Customer.findOne({ username, isActive: true });
    if (!customer) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { 
        id: customer._id, 
        username: customer.username,
        type: 'customer'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      customer: {
        id: customer._id,
        username: customer.username,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address
      }
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy thông tin khách hàng (cần token)
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Token không được cung cấp' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (decoded.type !== 'customer') {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }

    const customer = await Customer.findById(decoded.id).select('-password');
    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Lỗi lấy thông tin khách hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy danh sách khách hàng (cho admin)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { isActive: true };
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách khách hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Thống kê khách hàng
router.get('/stats', async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments({ isActive: true });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newToday = await Customer.countDocuments({
      isActive: true,
      createdAt: { $gte: today }
    });

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const newThisMonth = await Customer.countDocuments({
      isActive: true,
      createdAt: { $gte: thisMonth }
    });

    res.json({
      totalCustomers,
      newToday,
      newThisMonth
    });
  } catch (error) {
    console.error('Lỗi thống kê khách hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
