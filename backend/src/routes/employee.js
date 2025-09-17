const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const router = express.Router();

// Đăng ký nhân viên mới
router.post('/register', async (req, res) => {
  try {
    const { username, password, fullName, email, role } = req.body;

    // Kiểm tra thông tin bắt buộc
    if (!username || !password || !fullName || !email) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Kiểm tra username đã tồn tại
    const existingUser = await Employee.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }

    // Kiểm tra email đã tồn tại
    const existingEmail = await Employee.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    // Mã hóa mật khẩu
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Tạo nhân viên mới
    const employee = new Employee({
      username,
      password: hashedPassword,
      fullName,
      email,
      role: role || 'staff'
    });

    await employee.save();

    res.status(201).json({ 
      message: 'Đăng ký thành công',
      employee: {
        id: employee._id,
        username: employee.username,
        fullName: employee.fullName,
        email: employee.email,
        role: employee.role
      }
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Kiểm tra thông tin đăng nhập
    if (!username || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
    }

    // Tìm nhân viên
    const employee = await Employee.findOne({ username, isActive: true });
    if (!employee) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { 
        id: employee._id, 
        username: employee.username,
        role: employee.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      employee: {
        id: employee._id,
        username: employee.username,
        fullName: employee.fullName,
        email: employee.email,
        role: employee.role
      }
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy danh sách nhân viên (chỉ admin)
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(employees);
  } catch (error) {
    console.error('Lỗi lấy danh sách nhân viên:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cập nhật nhân viên
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, fullName, email, role, isActive } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }

    // Kiểm tra username trùng lặp (nếu thay đổi)
    if (username !== employee.username) {
      const existingUser = await Employee.findOne({ username, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
      }
    }

    // Kiểm tra email trùng lặp (nếu thay đổi)
    if (email !== employee.email) {
      const existingEmail = await Employee.findOne({ email, _id: { $ne: id } });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email đã tồn tại' });
      }
    }

    employee.username = username;
    employee.fullName = fullName;
    employee.email = email;
    employee.role = role;
    employee.isActive = isActive;

    await employee.save();

    res.json({ 
      message: 'Cập nhật thành công',
      employee: {
        id: employee._id,
        username: employee.username,
        fullName: employee.fullName,
        email: employee.email,
        role: employee.role,
        isActive: employee.isActive
      }
    });
  } catch (error) {
    console.error('Lỗi cập nhật nhân viên:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xóa nhân viên (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }

    employee.isActive = false;
    await employee.save();

    res.json({ message: 'Xóa nhân viên thành công' });
  } catch (error) {
    console.error('Lỗi xóa nhân viên:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
