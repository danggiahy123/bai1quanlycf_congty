const express = require('express');
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Table = require('../models/Table');
const Menu = require('../models/Menu');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const TransactionHistory = require('../models/TransactionHistory');
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
      notes,
      depositAmount 
    } = req.body;

    // Kiểm tra thông tin bắt buộc - BẮT BUỘC PHẢI CÓ CỌC
    if (!tableId || !numberOfGuests || !bookingDate || !bookingTime || !menuItems || !depositAmount || parseInt(depositAmount) <= 0) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin và chọn số tiền cọc (tối thiểu 50,000đ)' });
    }

    // Kiểm tra số tiền cọc tối thiểu
    const parsedDepositAmount = parseInt(depositAmount);
    if (parsedDepositAmount < 50000) {
      return res.status(400).json({ message: 'Số tiền cọc tối thiểu là 50,000đ' });
    }

    // Kiểm tra bàn có tồn tại
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Không tìm thấy bàn' });
    }

    // Kiểm tra xem bàn có booking nào đang pending hoặc confirmed không trong cùng thời gian
    const existingBooking = await Booking.findOne({
      table: tableId,
      status: { $in: ['pending', 'confirmed'] },
      bookingDate: new Date(bookingDate),
      bookingTime: bookingTime
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Bàn này đã được đặt trong khoảng thời gian này' });
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

    // Tạo booking - depositAmount đã được validate ở trên
    console.log('Creating booking with depositAmount:', parsedDepositAmount, 'from input:', depositAmount);
    
    const booking = new Booking({
      customer: req.user.id,
      table: tableId,
      numberOfGuests,
      bookingDate: new Date(bookingDate),
      bookingTime,
      menuItems: processedMenuItems,
      totalAmount,
      depositAmount: parsedDepositAmount,
      notes,
      customerInfo: {
        fullName: customer.fullName,
        phone: customer.phone || '',
        email: customer.email
      }
    });

    await booking.save();

    // Không tạo thông báo khi tạo booking
    // Thông báo sẽ được tạo khi khách hàng cọc tiền thành công

    // KHÔNG gửi thông báo cho webadmin khi tạo booking
    // Thông báo sẽ được gửi khi khách hàng thực sự thanh toán cọc hoặc admin xác nhận
    console.log('✅ Đã tạo booking, chờ thanh toán cọc để gửi thông báo webadmin');

    res.status(201).json({
      message: 'Đặt bàn đã được tạo, vui lòng thanh toán cọc để xác nhận',
      booking: {
        id: booking._id,
        tableName: table.name,
        numberOfGuests: booking.numberOfGuests,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        totalAmount: booking.totalAmount,
        depositAmount: booking.depositAmount,
        status: booking.status,
        requiresDeposit: true
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
    console.log('GET /api/bookings/admin - Headers:', req.headers);
    console.log('GET /api/bookings/admin - Query:', req.query);
    
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = status === 'all' ? {} : { status };
    
    // Nếu status là 'pending', chỉ hiển thị booking đã cọc tiền
    if (status === 'pending') {
      const TransactionHistory = require('../models/TransactionHistory');
      const bookingsWithDeposit = await TransactionHistory.distinct('bookingId', {
        transactionType: 'deposit',
        status: 'completed'
      });
      query = { 
        status: 'pending',
        _id: { $in: bookingsWithDeposit }
      };
    }
    
    const bookings = await Booking.find(query)
      .populate('customer', 'fullName email phone')
      .populate('table', 'name')
      .populate({
        path: 'menuItems.item',
        model: 'Menu',
        select: 'name price'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Xử lý confirmedBy field thủ công để tránh lỗi ObjectId
    const processedBookings = bookings.map(booking => {
      const bookingObj = booking.toObject();
      if (bookingObj.confirmedBy && typeof bookingObj.confirmedBy === 'string') {
        // Nếu confirmedBy là string, giữ nguyên
        bookingObj.confirmedBy = { fullName: bookingObj.confirmedBy };
      }
      return bookingObj;
    });

    const total = await Booking.countDocuments(query);

    res.json({
      bookings: processedBookings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách booking:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Lỗi server', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Xác nhận booking (admin/nhân viên)
router.post('/:id/confirm', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, paymentMethod = 'cash', depositAmount } = req.body || {};

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

    // Cập nhật trạng thái bàn thành occupied
    const table = await Table.findById(booking.table);
    if (table) {
      table.status = 'occupied';
      await table.save();
      
      // TẠM THỜI ẨN: Emit Socket.IO event for table status change
      // const io = req.app.get('io');
      // if (io) {
      //   io.emit('table_status_changed', {
      //     tableId: table._id,
      //     tableName: table.name,
      //     status: 'occupied',
      //     bookingId: booking._id,
      //     customerName: booking.customerInfo?.fullName || 'N/A',
      //     timestamp: new Date()
      //   });
      // }
    }

    // Tạo lịch sử giao dịch nếu có cọc tiền
    if (booking.depositAmount > 0) {
      try {
        const transaction = new TransactionHistory({
          bookingId: booking._id,
          tableId: booking.table,
          tableName: table?.name || `Bàn ${booking.table}`,
          customerId: booking.customer,
          customerInfo: booking.customerInfo,
          transactionType: 'deposit',
          amount: booking.depositAmount,
          paymentMethod: paymentMethod,
          status: 'completed',
          bankInfo: paymentMethod === 'bank_transfer' ? {
            accountNumber: '2246811357',
            accountName: 'DANG GIA HY',
            bankName: 'Techcombank',
            bankCode: '970407'
          } : null,
          transactionId: 'TXN_' + Date.now(),
          paidAt: new Date(),
          confirmedAt: new Date(),
          notes: `Thanh toán cọc bàn ${table?.name || booking.table} - ${paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}`
        });

        await transaction.save();
        console.log('✅ Đã tạo lịch sử giao dịch cọc:', transaction._id);
      } catch (transactionError) {
        console.error('Lỗi tạo lịch sử giao dịch:', transactionError);
      }
    }

    // Tạo thông báo "BÀN ĐÃ ĐƯỢC DUYỆT" cho khách hàng
    try {
      const customerNotification = new Notification({
        user: booking.customer,
        type: 'booking_confirmed',
        title: '🎉 BÀN ĐÃ ĐƯỢC DUYỆT!',
        message: `${table ? table.name : 'N/A'} đã được admin xác nhận cho ngày ${booking.bookingDate.toLocaleDateString('vi-VN')} lúc ${booking.bookingTime}. ${booking.depositAmount > 0 ? `Số tiền cọc: ${booking.depositAmount.toLocaleString()}đ (${paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}). ` : ''}Bạn có thể đến quán đúng giờ.`,
        bookingId: booking._id,
        isRead: false
      });
      await customerNotification.save();
      console.log('✅ Đã gửi thông báo "BÀN ĐÃ ĐƯỢC DUYỆT" cho khách hàng');
    } catch (notificationError) {
      console.error('Lỗi gửi thông báo xác nhận cho khách hàng:', notificationError);
    }

    // Gửi thông báo cho nhân viên khác về việc xác nhận
    try {
      const employees = await Employee.find({ _id: { $ne: req.user.id } });
      
      for (const employee of employees) {
        const employeeNotification = new Notification({
          user: employee._id,
          type: 'booking_confirmed',
          title: '✅ BÀN ĐÃ ĐƯỢC DUYỆT',
          message: `Khách hàng ${booking.customerInfo ? booking.customerInfo.fullName : 'N/A'} đã được duyệt ${table ? table.name : 'N/A'} cho ngày ${booking.bookingDate.toLocaleDateString('vi-VN')} lúc ${booking.bookingTime}. ${booking.depositAmount > 0 ? `Cọc: ${booking.depositAmount.toLocaleString()}đ` : ''}`,
          bookingId: booking._id,
          isRead: false
        });
        
        await employeeNotification.save();
      }
      
      console.log(`Đã gửi thông báo cho ${employees.length} nhân viên về việc xác nhận booking`);
    } catch (notificationError) {
      console.error('Lỗi gửi thông báo cho nhân viên:', notificationError);
    }

    // Gửi thông báo cho admin về việc nhân viên xác nhận đặt bàn
    try {
      const admins = await Employee.find({ role: 'admin' });
      
      for (const admin of admins) {
        const adminNotification = new Notification({
          user: admin._id,
          type: 'booking_confirmed',
          title: '✅ BÀN ĐÃ ĐƯỢC DUYỆT',
          message: `Nhân viên ${req.user.fullName || 'Nhân viên'} đã duyệt bàn ${table ? table.name : 'N/A'} cho khách ${booking.customerInfo ? booking.customerInfo.fullName : 'N/A'} (${booking.numberOfGuests} người) - ${booking.bookingDate.toLocaleDateString('vi-VN')} ${booking.bookingTime}. ${booking.depositAmount > 0 ? `Cọc: ${booking.depositAmount.toLocaleString()}đ` : ''}`,
          bookingId: booking._id,
          isRead: false
        });
        
        await adminNotification.save();
      }
      
      console.log(`Đã gửi thông báo cho ${admins.length} admin về việc nhân viên xác nhận đặt bàn`);
    } catch (notificationError) {
      console.error('Lỗi gửi thông báo cho admin:', notificationError);
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

    // Import TransactionHistory model để kiểm tra booking đã cọc tiền
    const TransactionHistory = require('../models/TransactionHistory');

    // Tìm các booking đã có giao dịch cọc tiền
    const bookingsWithDeposit = await TransactionHistory.distinct('bookingId', {
      transactionType: 'deposit',
      status: 'completed'
    });

    const stats = await Promise.all([
      // Chỉ đếm booking pending VÀ đã cọc tiền
      Booking.countDocuments({ 
        status: 'pending',
        _id: { $in: bookingsWithDeposit }
      }),
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

// Debug route để kiểm tra stats
router.get('/debug-stats', async (req, res) => {
  try {
    const TransactionHistory = require('../models/TransactionHistory');
    
    // Tìm tất cả booking pending
    const allPendingBookings = await Booking.find({ status: 'pending' });
    
    // Tìm các booking đã có giao dịch cọc tiền
    const bookingsWithDeposit = await TransactionHistory.distinct('bookingId', {
      transactionType: 'deposit',
      status: 'completed'
    });
    
    // Tìm booking pending đã cọc tiền
    const pendingWithDeposit = await Booking.find({
      status: 'pending',
      _id: { $in: bookingsWithDeposit }
    });
    
    res.json({
      allPendingBookings: allPendingBookings.length,
      bookingsWithDeposit: bookingsWithDeposit.length,
      pendingWithDeposit: pendingWithDeposit.length,
      allPendingBookingsList: allPendingBookings.map(b => ({
        id: b._id,
        customer: b.customerInfo?.fullName,
        table: b.table,
        deposit: b.depositAmount,
        createdAt: b.createdAt
      })),
      bookingsWithDepositList: bookingsWithDeposit,
      pendingWithDepositList: pendingWithDeposit.map(b => ({
        id: b._id,
        customer: b.customerInfo?.fullName,
        table: b.table,
        deposit: b.depositAmount,
        createdAt: b.createdAt
      }))
    });
  } catch (error) {
    console.error('Lỗi debug stats:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
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

// Lấy booking theo table ID
router.get('/by-table/:tableId', async (req, res) => {
  try {
    const booking = await Booking.findOne({ 
      table: req.params.tableId, 
      status: { $in: ['confirmed', 'pending'] } 
    })
    .populate('customer', 'fullName phone email')
    .populate('table', 'name')
    .populate({
      path: 'menuItems.item',
      model: 'Menu',
      select: 'name price'
    });

    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy booking cho bàn này' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Lỗi lấy booking theo table:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Hoàn thành booking và giải phóng bàn
router.post('/:bookingId/complete', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Tìm booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Booking chưa được xác nhận' });
    }

    // Cập nhật trạng thái booking thành completed
    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();

    // Giải phóng bàn
    const table = await Table.findById(booking.table);
    if (table) {
      table.status = 'empty';
      await table.save();
      console.log('✅ Đã giải phóng bàn:', table.name);
    }

    res.json({
      success: true,
      message: 'Hoàn thành booking và giải phóng bàn thành công',
      booking: {
        id: booking._id,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Lỗi hoàn thành booking:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xác nhận thanh toán cọc Facebook (chỉ admin)
router.post('/:bookingId/confirm-facebook-deposit', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Tìm booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    }

    // Cập nhật trạng thái booking thành confirmed (đã cọc Facebook)
    booking.status = 'confirmed';
    booking.confirmedBy = req.user?.id || 'admin';
    booking.confirmedAt = new Date();
    await booking.save();

    // Cập nhật trạng thái bàn thành occupied
    const table = await Table.findById(booking.table);
    if (table) {
      table.status = 'occupied';
      await table.save();
    }

    // Tạo lịch sử giao dịch
    try {
      const transaction = new TransactionHistory({
        bookingId: booking._id,
        tableId: booking.table,
        tableName: table?.name || `Bàn ${booking.table}`,
        customerId: booking.customer,
        customerInfo: booking.customerInfo,
        transactionType: 'deposit',
        amount: booking.depositAmount || 0,
        paymentMethod: 'facebook',
        status: 'completed',
        transactionId: 'FB_' + Date.now(),
        paidAt: new Date(),
        confirmedAt: new Date(),
        notes: `Thanh toán cọc Facebook bàn ${table?.name || booking.table}`
      });

      await transaction.save();
      console.log('✅ Đã tạo lịch sử giao dịch cọc Facebook:', transaction._id);
    } catch (transactionError) {
      console.error('Lỗi tạo lịch sử giao dịch:', transactionError);
    }

    // Tạo thông báo "BÀN ĐÃ ĐƯỢC DUYỆT" cho khách hàng
    try {
      if (booking.customer) {
        const customerNotification = new Notification({
          user: booking.customer,
          type: 'deposit_confirmed',
          title: '🎉 XÁC NHẬN THÀNH CÔNG ĐƠN ĐẶT BÀN',
          message: `Xác nhận thành công đơn đặt bàn - Cọc qua Facebook`,
          bookingId: booking._id,
          isRead: false
        });
        
        await customerNotification.save();
        console.log('✅ Đã gửi thông báo "BÀN ĐÃ ĐƯỢC DUYỆT" cho khách hàng');
      }
    } catch (notificationError) {
      console.error('Lỗi gửi thông báo xác nhận cọc Facebook:', notificationError);
    }

    // Gửi thông báo cho tất cả nhân viên về cọc Facebook thành công
    try {
      const employees = await Employee.find({});
      
      for (const employee of employees) {
        const notification = new Notification({
          user: employee._id,
          type: 'deposit_confirmed',
          title: '✅ BÀN ĐÃ ĐƯỢC DUYỆT - CỌC FACEBOOK',
          message: `Khách hàng ${booking.customerInfo?.fullName || 'N/A'} đã được duyệt ${table?.name || 'N/A'} với cọc Facebook ${booking.depositAmount?.toLocaleString() || '0'}đ vào ${booking.bookingDate} lúc ${booking.bookingTime}. Vui lòng chuẩn bị bàn.`,
          bookingId: booking._id,
          isRead: false
        });
        
        await notification.save();
      }
      
      console.log(`Đã gửi thông báo cọc Facebook thành công cho ${employees.length} nhân viên`);
    } catch (employeeNotificationError) {
      console.error('Lỗi gửi thông báo cho nhân viên:', employeeNotificationError);
    }

    // TẠM THỜI ẨN: Gửi thông báo Socket.IO real-time cho webadmin
    // try {
    //   const io = req.app.get('io');
    //   if (io) {
    //     // Gửi thông báo deposit_booking_created cho webadmin khi admin xác nhận cọc Facebook
    //     io.to('employees').emit('deposit_booking_created', {
    //       bookingId: booking._id,
    //       tableId: booking.table,
    //       tableName: table?.name || 'N/A',
    //       customerName: booking.customerInfo?.fullName || 'N/A',
    //       depositAmount: booking.depositAmount || 0,
    //       bookingDate: booking.bookingDate,
    //       bookingTime: booking.bookingTime,
    //       message: `Admin đã xác nhận cọc Facebook ${booking.depositAmount?.toLocaleString() || '0'}đ cho bàn ${table?.name || 'N/A'} - ${booking.customerInfo?.fullName || 'N/A'}`,
    //       timestamp: new Date()
    //     });
    //     
    //     console.log('📢 Đã gửi thông báo Socket.IO cho webadmin về việc xác nhận cọc Facebook');
    //   }
    // } catch (socketError) {
    //   console.error('Lỗi gửi thông báo Socket.IO:', socketError);
    // }

    res.json({
      success: true,
      message: 'Xác nhận thanh toán cọc Facebook thành công',
      booking: {
        id: booking._id,
        status: booking.status,
        depositAmount: booking.depositAmount
      }
    });
  } catch (error) {
    console.error('Lỗi xác nhận thanh toán cọc Facebook:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xác nhận thanh toán cọc QR code (chỉ admin)
router.post('/:bookingId/confirm-qr-deposit', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Tìm booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    }

    // Cập nhật trạng thái booking thành confirmed (đã cọc QR)
    booking.status = 'confirmed';
    booking.confirmedBy = req.user?.id || 'admin';
    booking.confirmedAt = new Date();
    await booking.save();

    // Cập nhật trạng thái bàn thành occupied
    const table = await Table.findById(booking.table);
    if (table) {
      table.status = 'occupied';
      await table.save();
    }

    // Tạo lịch sử giao dịch
    try {
      const transaction = new TransactionHistory({
        bookingId: booking._id,
        tableId: booking.table,
        tableName: table?.name || `Bàn ${booking.table}`,
        customerId: booking.customer,
        customerInfo: booking.customerInfo,
        transactionType: 'deposit',
        amount: booking.depositAmount || 0,
        paymentMethod: 'qr_code',
        status: 'completed',
        transactionId: 'QR_' + Date.now(),
        paidAt: new Date(),
        confirmedAt: new Date(),
        notes: `Thanh toán cọc QR code bàn ${table?.name || booking.table}`
      });

      await transaction.save();
      console.log('✅ Đã tạo lịch sử giao dịch cọc QR code:', transaction._id);
    } catch (transactionError) {
      console.error('Lỗi tạo lịch sử giao dịch:', transactionError);
    }

    // Tạo thông báo "BÀN ĐÃ ĐƯỢC DUYỆT" cho khách hàng
    try {
      if (booking.customer) {
        const customerNotification = new Notification({
          user: booking.customer,
          type: 'deposit_confirmed',
          title: '🎉 XÁC NHẬN THÀNH CÔNG ĐƠN ĐẶT BÀN',
          message: `Xác nhận thành công đơn đặt bàn - Cọc qua QR code`,
          bookingId: booking._id,
          isRead: false
        });
        
        await customerNotification.save();
        console.log('✅ Đã gửi thông báo "BÀN ĐÃ ĐƯỢC DUYỆT" cho khách hàng');
      }
    } catch (notificationError) {
      console.error('Lỗi gửi thông báo xác nhận cọc QR code:', notificationError);
    }

    // Gửi thông báo cho tất cả nhân viên về cọc QR code thành công
    try {
      const employees = await Employee.find({});
      
      for (const employee of employees) {
        const notification = new Notification({
          user: employee._id,
          type: 'deposit_confirmed',
          title: '✅ BÀN ĐÃ ĐƯỢC DUYỆT - CỌC QR CODE',
          message: `Khách hàng ${booking.customerInfo?.fullName || 'N/A'} đã được duyệt ${table?.name || 'N/A'} với cọc QR code ${booking.depositAmount?.toLocaleString() || '0'}đ vào ${booking.bookingDate} lúc ${booking.bookingTime}. Vui lòng chuẩn bị bàn.`,
          bookingId: booking._id,
          isRead: false
        });
        
        await notification.save();
      }
      
      console.log(`Đã gửi thông báo cọc QR code thành công cho ${employees.length} nhân viên`);
    } catch (employeeNotificationError) {
      console.error('Lỗi gửi thông báo cho nhân viên:', employeeNotificationError);
    }

    // TẠM THỜI ẨN: Gửi thông báo Socket.IO real-time cho webadmin
    // try {
    //   const io = req.app.get('io');
    //   if (io) {
    //     // Gửi thông báo deposit_booking_created cho webadmin khi admin xác nhận cọc QR code
    //     io.to('employees').emit('deposit_booking_created', {
    //       bookingId: booking._id,
    //       tableId: booking.table,
    //       tableName: table?.name || 'N/A',
    //       customerName: booking.customerInfo?.fullName || 'N/A',
    //       depositAmount: booking.depositAmount || 0,
    //       bookingDate: booking.bookingDate,
    //       bookingTime: booking.bookingTime,
    //       message: `Admin đã xác nhận cọc QR code ${booking.depositAmount?.toLocaleString() || '0'}đ cho bàn ${table?.name || 'N/A'} - ${booking.customerInfo?.fullName || 'N/A'}`,
    //       timestamp: new Date()
    //     });
    //     
    //     console.log('📢 Đã gửi thông báo Socket.IO cho webadmin về việc xác nhận cọc QR code');
    //   }
    // } catch (socketError) {
    //   console.error('Lỗi gửi thông báo Socket.IO:', socketError);
    // }

    res.json({
      success: true,
      message: 'Xác nhận thanh toán cọc QR code thành công',
      booking: {
        id: booking._id,
        status: booking.status,
        depositAmount: booking.depositAmount
      }
    });
  } catch (error) {
    console.error('Lỗi xác nhận thanh toán cọc QR code:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xác nhận thanh toán cọc (chỉ admin)
router.post('/:bookingId/confirm-deposit', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Tìm booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    }

    // Cập nhật trạng thái booking thành confirmed (đã cọc)
    booking.status = 'confirmed';
    booking.confirmedBy = req.user?.id || 'system';
    booking.confirmedAt = new Date();
    await booking.save();

    // Cập nhật trạng thái bàn thành occupied
    const table = await Table.findById(booking.table);
    if (table) {
      table.status = 'occupied';
      await table.save();
    }

    // Tạo lịch sử giao dịch
    try {
      const transaction = new TransactionHistory({
        bookingId: booking._id,
        tableId: booking.table,
        tableName: table?.name || `Bàn ${booking.table}`,
        customerId: booking.customer,
        customerInfo: booking.customerInfo,
        transactionType: 'deposit',
        amount: booking.depositAmount || 0,
        paymentMethod: 'qr_code',
        status: 'completed',
        bankInfo: {
          accountNumber: '2246811357',
          accountName: 'DANG GIA HY',
          bankName: 'Techcombank',
          bankCode: '970407'
        },
        transactionId: 'TXN_' + Date.now(),
        paidAt: new Date(),
        confirmedAt: new Date(),
        notes: `Thanh toán cọc bàn ${table?.name || booking.table}`
      });

      await transaction.save();
      console.log('✅ Đã tạo lịch sử giao dịch cọc:', transaction._id);
    } catch (transactionError) {
      console.error('Lỗi tạo lịch sử giao dịch:', transactionError);
    }

    // Tạo thông báo "BÀN ĐÃ ĐƯỢC DUYỆT" cho khách hàng
    try {
      if (booking.customer) {
        const customerNotification = new Notification({
          user: booking.customer,
          type: 'deposit_confirmed',
          title: '🎉 XÁC NHẬN THÀNH CÔNG ĐƠN ĐẶT BÀN',
          message: `Xác nhận thành công đơn đặt bàn`,
          bookingId: booking._id,
          isRead: false
        });
        
        await customerNotification.save();
        console.log('✅ Đã gửi thông báo "BÀN ĐÃ ĐƯỢC DUYỆT" cho khách hàng');
      }
    } catch (notificationError) {
      console.error('Lỗi gửi thông báo xác nhận cọc:', notificationError);
    }

    // Gửi thông báo cho tất cả nhân viên về cọc thành công
    try {
      const employees = await Employee.find({});
      
      for (const employee of employees) {
        const notification = new Notification({
          user: employee._id,
          type: 'deposit_confirmed',
          title: '✅ BÀN ĐÃ ĐƯỢC DUYỆT',
          message: `Khách hàng ${booking.customerInfo?.fullName || 'N/A'} đã được duyệt ${table?.name || 'N/A'} với cọc ${booking.depositAmount?.toLocaleString() || '0'}đ vào ${booking.bookingDate} lúc ${booking.bookingTime}. Vui lòng chuẩn bị bàn.`,
          bookingId: booking._id,
          isRead: false
        });
        
        await notification.save();
      }
      
      console.log(`Đã gửi thông báo cọc thành công cho ${employees.length} nhân viên`);
    } catch (employeeNotificationError) {
      console.error('Lỗi gửi thông báo cho nhân viên:', employeeNotificationError);
    }

    // TẠM THỜI ẨN: Gửi thông báo Socket.IO real-time cho webadmin
    // try {
    //   const io = req.app.get('io');
    //   if (io) {
    //     // Gửi thông báo deposit_booking_created cho webadmin khi admin xác nhận cọc
    //     io.to('employees').emit('deposit_booking_created', {
    //       bookingId: booking._id,
    //       tableId: booking.table,
    //       tableName: table?.name || 'N/A',
    //       customerName: booking.customerInfo?.fullName || 'N/A',
    //       depositAmount: booking.depositAmount || 0,
    //       bookingDate: booking.bookingDate,
    //       bookingTime: booking.bookingTime,
    //       message: `Admin đã xác nhận cọc ${booking.depositAmount?.toLocaleString() || '0'}đ cho bàn ${table?.name || 'N/A'} - ${booking.customerInfo?.fullName || 'N/A'}`,
    //       timestamp: new Date()
    //     });
    //     
    //     console.log('📢 Đã gửi thông báo Socket.IO cho webadmin về việc xác nhận cọc');
    //   }
    // } catch (socketError) {
    //   console.error('Lỗi gửi thông báo Socket.IO:', socketError);
    // }

    res.json({
      success: true,
      message: 'Xác nhận thanh toán cọc thành công',
      booking: {
        id: booking._id,
        status: booking.status,
        depositAmount: booking.depositAmount
      }
    });
  } catch (error) {
    console.error('Lỗi xác nhận thanh toán cọc:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// API tìm kiếm khách hàng (cho admin)
router.get('/search-customers', async (req, res) => {
  try {
    const { name, phone } = req.query;
    
    console.log('🔍 Search customers API called with:', { name, phone });
    
    let searchQuery = {};
    
    if (phone) {
      // Tìm kiếm theo SĐT
      searchQuery = {
        phone: { $regex: phone, $options: 'i' },
        isActive: true
      };
      console.log('📱 Searching by phone with query:', searchQuery);
    } else if (name && name.trim().length >= 2) {
      // Tìm kiếm theo tên
      searchQuery = {
        $or: [
          { fullName: { $regex: name, $options: 'i' } },
          { username: { $regex: name, $options: 'i' } }
        ],
        isActive: true
      };
      console.log('👤 Searching by name with query:', searchQuery);
    } else {
      return res.status(400).json({ message: 'Vui lòng nhập tên (ít nhất 2 ký tự) hoặc số điện thoại để tìm kiếm' });
    }

    const customers = await Customer.find(searchQuery)
      .select('_id username fullName email phone')
      .limit(10);

    console.log('✅ Found customers:', customers.length);
    customers.forEach((c, i) => {
      console.log(`  ${i+1}. ${c.fullName} (@${c.username}) - ${c.phone}`);
    });

    res.json({
      success: true,
      customers: customers
    });
  } catch (error) {
    console.error('❌ Error searching customers:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Admin đặt bàn nhanh (không cần token)
router.post('/admin-quick-booking', async (req, res) => {
  try {
    console.log('Admin quick booking request:', req.body);
    const { 
      customerId, // ID khách hàng đã chọn
      customerName,
      customerPhone,
      customerEmail,
      tableId, 
      numberOfGuests, 
      bookingDate, 
      bookingTime, 
      specialRequests,
      depositAmount 
    } = req.body;

    // Kiểm tra thông tin bắt buộc
    if (!tableId || !numberOfGuests || !bookingDate || !bookingTime || !customerPhone) {
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
      bookingDate: new Date(bookingDate),
      bookingTime: bookingTime
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Bàn này đã được đặt trong khoảng thời gian này' });
    }

    // Tạo booking mới
    const parsedDepositAmount = depositAmount ? parseInt(depositAmount) : 0;
    console.log('Creating admin booking with depositAmount:', parsedDepositAmount, 'from input:', depositAmount);
    
    const booking = new Booking({
      customer: customerId || null, // Sử dụng customerId nếu có
      table: tableId, // Sử dụng tableId làm table
      numberOfGuests,
      bookingDate: new Date(bookingDate),
      bookingTime,
      menuItems: [], // Admin đặt bàn nhanh không có menu items
      totalAmount: 0, // Admin đặt bàn nhanh không có tổng tiền
      depositAmount: parsedDepositAmount, // Số tiền cọc
      status: 'confirmed', // Admin đặt bàn nhanh tự động confirm
      notes: specialRequests,
      confirmedBy: req.user?.id || 'admin', // Nếu có user thì dùng user id, không thì dùng 'admin'
      confirmedAt: new Date(),
      customerInfo: {
        fullName: 'Khách hàng',
        phone: customerPhone,
        email: customerEmail || ''
      }
    });

    await booking.save();

    // Cập nhật trạng thái bàn
    table.status = 'occupied';
    await table.save();

    // Tìm khách hàng trong hệ thống
    let foundCustomer = null;
    
    // Nếu có customerId, tìm theo ID (ưu tiên cao nhất)
    if (customerId) {
      try {
        foundCustomer = await Customer.findById(customerId);
        if (foundCustomer) {
          console.log('Tìm thấy khách hàng theo ID:', foundCustomer.fullName);
        }
      } catch (customerError) {
        console.error('Lỗi tìm khách hàng theo ID:', customerError);
      }
    }
    
    // Nếu không tìm thấy theo ID, tìm theo SĐT
    if (!foundCustomer && customerPhone) {
      try {
        foundCustomer = await Customer.findOne({
          phone: { $regex: customerPhone, $options: 'i' }
        });
        
        if (foundCustomer) {
          console.log('Tìm thấy khách hàng theo SĐT:', foundCustomer.fullName);
        }
      } catch (customerError) {
        console.error('Lỗi tìm khách hàng theo SĐT:', customerError);
      }
    }

    // Tạo thông báo cho khách hàng cụ thể hoặc thông báo chung
    try {
      if (foundCustomer) {
        // Tạo thông báo riêng cho khách hàng đã tìm thấy
        const customerNotification = new Notification({
          user: foundCustomer._id,
          type: 'booking_confirmed',
          title: '🎉 Admin đã đặt bàn cho bạn!',
          message: `Chào ${foundCustomer.fullName}! Admin đã đặt ${table.name} cho ${numberOfGuests} người vào ${bookingDate} lúc ${bookingTime}. ${parsedDepositAmount > 0 ? `Số tiền cọc: ${parsedDepositAmount.toLocaleString()}đ. ` : ''}${specialRequests ? `Yêu cầu đặc biệt: ${specialRequests}` : ''}`,
          bookingId: booking._id,
          isRead: false
        });
        
        await customerNotification.save();
        console.log(`Đã gửi thông báo riêng cho khách hàng ${foundCustomer.fullName}`);
      } else {
        // Tạo thông báo chung cho tất cả khách hàng
        const generalNotification = new Notification({
          user: null, // null = thông báo chung cho tất cả khách hàng
          type: 'booking_pending',
          title: 'Đặt bàn thành công!',
          message: `${table.name} đã được đặt cho ${numberOfGuests} người vào ${bookingDate} lúc ${bookingTime}. ${parsedDepositAmount > 0 ? `Số tiền cọc: ${parsedDepositAmount.toLocaleString()}đ. ` : ''}${specialRequests ? `Yêu cầu đặc biệt: ${specialRequests}` : ''}`,
          bookingId: booking._id,
          isRead: false
        });
        
        await generalNotification.save();
        console.log('Đã gửi thông báo chung cho khách hàng về đặt bàn thành công');
      }
    } catch (notificationError) {
      console.error('Lỗi gửi thông báo cho khách hàng:', notificationError);
    }

    res.status(201).json({ 
      message: 'Đặt bàn thành công',
      booking: booking
    });
  } catch (error) {
    console.error('Lỗi tạo booking admin:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

module.exports = router;
