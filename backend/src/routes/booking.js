const express = require('express');
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Table = require('../models/Table');
const Menu = require('../models/Menu');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const router = express.Router();

// Middleware để xác thực token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Token không được cung cấp' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

// Tạo booking mới (khách hàng)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      tableId, 
      numberOfGuests, 
      bookingDate, 
      bookingTime, 
      menuItems, 
      notes 
    } = req.body;

    // Kiểm tra thông tin bắt buộc
    if (!tableId || !numberOfGuests || !bookingDate || !bookingTime || !menuItems) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Kiểm tra bàn có tồn tại
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Không tìm thấy bàn' });
    }

    // Kiểm tra xem bàn có booking nào đang pending hoặc confirmed không
    const existingBooking = await Booking.findOne({
      table: tableId,
      status: { $in: ['pending', 'confirmed'] },
      bookingDate: new Date(bookingDate)
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Bàn đã được đặt trong ngày này' });
    }

    // Tạm thời bỏ qua kiểm tra thời gian để hệ thống hoạt động
    // const today = new Date().toISOString().split('T')[0];
    // if (bookingDate < today) {
    //   return res.status(400).json({ message: 'Ngày đặt bàn phải trong tương lai' });
    // }

    // Tính tổng tiền
    let totalAmount = 0;
    const processedMenuItems = [];

    for (const item of menuItems) {
      const menuItem = await Menu.findById(item.itemId);
      if (!menuItem) {
        return res.status(404).json({ message: `Không tìm thấy món ${item.itemId}` });
      }

      const itemPrice = menuItem.price;
      const itemTotal = itemPrice * item.quantity;
      totalAmount += itemTotal;

      processedMenuItems.push({
        item: item.itemId,
        quantity: item.quantity,
        size: item.size || 'M',
        price: itemPrice
      });
    }

    // Lấy thông tin khách hàng hoặc nhân viên
    let customer;
    if (req.user.role === 'admin' || req.user.role === 'staff') {
      // Tạo customer tạm thời cho nhân viên/admin
      customer = {
        _id: req.user.id,
        fullName: req.user.fullName || 'Nhân viên',
        phone: req.user.phone || '',
        email: req.user.email || ''
      };
    } else {
      // Tìm customer thật
      customer = await Customer.findById(req.user.id);
    }
    
    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
    }

    // Tạo booking
    const booking = new Booking({
      customer: req.user.id,
      table: tableId,
      numberOfGuests,
      bookingDate: new Date(bookingDate),
      bookingTime,
      menuItems: processedMenuItems,
      totalAmount,
      notes,
      customerInfo: {
        fullName: customer.fullName,
        phone: customer.phone || '',
        email: customer.email
      }
    });

    await booking.save();

    // Gửi thông báo cho khách hàng
    try {
      const customerNotification = new Notification({
        user: booking.customer,
        type: 'booking_pending',
        title: 'Đặt bàn thành công!',
        message: `Bạn đã đặt bàn ${table.name} cho ${numberOfGuests} người vào ${bookingDate} lúc ${bookingTime}. Tổng tiền: ${totalAmount.toLocaleString()}đ. Đang chờ nhân viên xác nhận.`,
        bookingId: booking._id,
        isRead: false
      });
      
      await customerNotification.save();
      console.log('Đã gửi thông báo cho khách hàng về đặt bàn thành công');
    } catch (customerNotificationError) {
      console.error('Lỗi gửi thông báo cho khách hàng:', customerNotificationError);
    }

    // Gửi thông báo cho tất cả nhân viên
    try {
      const employees = await Employee.find({});
      
      for (const employee of employees) {
        const notification = new Notification({
          user: employee._id,
          type: 'booking_pending',
          title: 'Đặt bàn mới cần xác nhận',
          message: `Khách hàng ${customer.fullName} đã đặt bàn ${table.name} cho ${numberOfGuests} người vào ${bookingDate} lúc ${bookingTime}. Tổng tiền: ${totalAmount.toLocaleString()}đ. Vui lòng xác nhận.`,
          bookingId: booking._id,
          isRead: false
        });
        
        await notification.save();
      }
      
      console.log(`Đã gửi thông báo cho ${employees.length} nhân viên về booking mới`);
    } catch (notificationError) {
      console.error('Lỗi gửi thông báo cho nhân viên:', notificationError);
      // Không fail booking nếu gửi thông báo lỗi
    }

    res.status(201).json({
      message: 'Đặt bàn thành công, đang chờ xác nhận',
      booking: {
        id: booking._id,
        tableName: table.name,
        numberOfGuests: booking.numberOfGuests,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        totalAmount: booking.totalAmount,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Lỗi tạo booking:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy danh sách booking của khách hàng
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user.id })
      .populate('table', 'name')
      .populate('menuItems.item', 'name price image')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Lỗi lấy booking:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy danh sách booking cho admin/nhân viên
router.get('/admin', async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = status === 'all' ? {} : { status };
    
    const bookings = await Booking.find(query)
      .populate('customer', 'fullName email phone')
      .populate('table', 'name')
      .populate('menuItems.item', 'name price')
      .populate('confirmedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách booking:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xác nhận booking (admin/nhân viên)
router.post('/:id/confirm', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body || {};

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Booking đã được xử lý' });
    }

    // Cập nhật booking
    booking.status = 'confirmed';
    booking.confirmedBy = req.user.id;
    booking.confirmedAt = new Date();
    if (notes) {
      booking.notes = notes;
    }

    await booking.save();

    // Cập nhật trạng thái bàn thành ĐÃ ĐƯỢC ĐẶT
    const table = await Table.findById(booking.table);
    if (table) {
      table.status = 'ĐÃ ĐƯỢC ĐẶT';
      await table.save();
    }

    // Tạo thông báo cho khách hàng
    const customerNotification = new Notification({
      user: booking.customer,
      type: 'booking_confirmed',
      title: 'Đặt bàn đã được xác nhận!',
      message: `Bàn ${table ? table.name : 'N/A'} đã được xác nhận cho ngày ${booking.bookingDate.toLocaleDateString('vi-VN')} lúc ${booking.bookingTime}. Bạn có thể thanh toán khi đến nhà hàng.`,
      bookingId: booking._id,
      isRead: false
    });
    await customerNotification.save();

    // Gửi thông báo cho nhân viên khác về việc xác nhận
    try {
      const employees = await Employee.find({ _id: { $ne: req.user.id } });
      
      for (const employee of employees) {
        const employeeNotification = new Notification({
          user: employee._id,
          type: 'booking_confirmed',
          title: 'Đặt bàn đã được xác nhận',
          message: `Đặt bàn của khách hàng ${booking.customerInfo ? booking.customerInfo.fullName : 'N/A'} tại bàn ${table ? table.name : 'N/A'} đã được xác nhận bởi nhân viên.`,
          bookingId: booking._id,
          isRead: false
        });
        
        await employeeNotification.save();
      }
      
      console.log(`Đã gửi thông báo cho ${employees.length} nhân viên về việc xác nhận booking`);
    } catch (notificationError) {
      console.error('Lỗi gửi thông báo cho nhân viên:', notificationError);
    }

    res.json({
      message: 'Xác nhận booking thành công',
      booking: {
        id: booking._id,
        customerName: booking.customerInfo ? booking.customerInfo.fullName : 'N/A',
        tableName: table ? table.name : 'N/A',
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        totalAmount: booking.totalAmount,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Lỗi xác nhận booking:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Hủy booking
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(id)
      .populate('table');

    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking đã được hủy' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Không thể hủy booking đã hoàn thành' });
    }

    // Lưu trạng thái cũ để kiểm tra
    const wasConfirmed = booking.status === 'confirmed';

    // Cập nhật booking
    booking.status = 'cancelled';
    if (reason) {
      booking.notes = reason;
    }

    await booking.save();

    // Giải phóng bàn nếu booking đã được confirmed
    if (wasConfirmed && booking.table) {
      booking.table.status = 'TRỐNG';
      await booking.table.save();
    }

    // Tạo thông báo cho khách hàng
    const notification = new Notification({
      user: booking.customer,
      type: 'booking_cancelled',
      title: 'Đặt bàn đã bị hủy',
      message: `Đặt bàn của bạn đã bị hủy${reason ? ` với lý do: ${reason}` : ''}. Vui lòng liên hệ để biết thêm chi tiết.`,
      bookingId: booking._id
    });
    await notification.save();

    res.json({
      message: 'Hủy booking thành công',
      booking: {
        id: booking._id,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Lỗi hủy booking:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Thống kê booking
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const stats = await Promise.all([
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ 
        status: 'confirmed', 
        bookingDate: { $gte: today } 
      }),
      Booking.countDocuments({ 
        status: 'confirmed', 
        createdAt: { $gte: thisMonth } 
      })
    ]);

    res.json({
      pending: stats[0],
      confirmed: stats[1],
      todayConfirmed: stats[2],
      thisMonthConfirmed: stats[3]
    });
  } catch (error) {
    console.error('Lỗi thống kê booking:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'API bookings hoạt động!' });
});

// Lấy danh sách booking cho nhân viên (không cần xác thực customer)
router.get('/employee', async (req, res) => {
  try {
    console.log('GET /api/bookings/employee được gọi');
    const { status, page = 1, limit = 50 } = req.query;
    
    let filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate('customer', 'fullName phone email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Manually populate table data since table uses String ID
    const populatedBookings = await Promise.all(bookings.map(async (booking) => {
      const table = await Table.findById(booking.table);
      return {
        ...booking.toObject(),
        table: table ? { name: table.name } : { name: 'N/A' }
      };
    }));

    const total = await Booking.countDocuments(filter);

    res.json({
      bookings: populatedBookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách booking:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
