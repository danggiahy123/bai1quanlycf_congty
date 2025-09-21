const express = require('express');
const mongoose = require('mongoose');
const TransactionHistory = require('../models/TransactionHistory');
const Booking = require('../models/Booking');
const Table = require('../models/Table');
const Notification = require('../models/Notification');

const router = express.Router();

// Lấy danh sách ngân hàng
router.get('/banks', async (req, res) => {
  try {
    // Danh sách ngân hàng Việt Nam
    const banks = [
      {
        id: 1,
        name: 'Ngân hàng TMCP Kỹ thương Việt Nam',
        code: 'TCB',
        bin: '970407',
        shortName: 'Techcombank',
        logo: 'https://img.vietqr.io/2021/TCB.png',
        transferSupported: 1,
        lookupSupported: 1
      },
      {
        id: 2,
        name: 'Ngân hàng TMCP Á Châu',
        code: 'ACB',
        bin: '970416',
        shortName: 'ACB',
        logo: 'https://img.vietqr.io/2021/ACB.png',
        transferSupported: 1,
        lookupSupported: 1
      },
      {
        id: 3,
        name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
        code: 'BID',
        bin: '970418',
        shortName: 'BIDV',
        logo: 'https://img.vietqr.io/2021/BID.png',
        transferSupported: 1,
        lookupSupported: 1
      }
    ];

    res.json({
      success: true,
      data: banks
    });
  } catch (error) {
    console.error('Error fetching banks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy danh sách ngân hàng' 
    });
  }
});

// Tạo QR code thanh toán
router.post('/generate-qr', async (req, res) => {
  try {
    const { accountNumber, accountName, bankCode, amount, description } = req.body;

    if (!accountNumber || !accountName || !bankCode || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    // Tạo QR code sử dụng VietQR API với cú pháp đúng
    const qrData = {
      accountNumber,
      accountName,
      bankCode,
      amount: parseInt(amount),
      description
    };
    
    // Sử dụng VietQR API với cú pháp đúng
    // https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<DESCRIPTION>&accountName=<ACCOUNT_NAME>
    const qrCodeUrl = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`;

    console.log('🔗 Tạo VietQR với thông tin:', qrData);
    console.log('🔗 VietQR URL:', qrCodeUrl);

    res.json({
      success: true,
      data: {
        qrCode: qrCodeUrl,
        accountNumber,
        accountName,
        bankCode,
        amount: parseInt(amount),
        description
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi tạo QR code' 
    });
  }
});

// Kiểm tra trạng thái thanh toán
router.get('/check-status/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;

    console.log('🔍 Kiểm tra trạng thái thanh toán cho booking:', bookingId);

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin booking ID'
      });
    }

    // Tìm booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy booking'
      });
    }

    // Kiểm tra xem có giao dịch thanh toán thành công chưa
    const completedTransaction = await TransactionHistory.findOne({
      bookingId: bookingId,
      transactionType: 'deposit',
      status: 'completed'
    });

    if (completedTransaction) {
      return res.json({
        success: true,
        data: {
          paid: true,
          status: 'completed',
          transactionId: completedTransaction._id,
          amount: completedTransaction.amount,
          paidAt: completedTransaction.paidAt,
          bookingId: bookingId
        }
      });
    }

    // Kiểm tra xem có giao dịch đang chờ xác nhận không
    const pendingTransaction = await TransactionHistory.findOne({
      bookingId: bookingId,
      transactionType: 'deposit',
      status: 'pending'
    });

    if (pendingTransaction) {
      return res.json({
        success: true,
        data: {
          paid: false,
          status: 'pending',
          transactionId: pendingTransaction._id,
          amount: pendingTransaction.amount,
          bookingId: bookingId
        }
      });
    }

    // Chưa có giao dịch nào
    return res.json({
      success: true,
      data: {
        paid: false,
        status: 'not_paid',
        bookingId: bookingId,
        amount: booking.depositAmount
      }
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi kiểm tra trạng thái thanh toán' 
    });
  }
});

// Kiểm tra thanh toán - CHỈ ADMIN MỚI CÓ THỂ XÁC NHẬN
router.post('/check-payment', async (req, res) => {
  try {
    const { bookingId, amount, transactionType = 'deposit' } = req.body;

    console.log('🔍 Kiểm tra thanh toán:', { bookingId, amount, transactionType });

    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin booking hoặc số tiền'
      });
    }

    // Tìm booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy booking'
      });
    }

    // LUÔN TRẢ VỀ FALSE - CHỈ ADMIN MỚI CÓ THỂ XÁC NHẬN THANH TOÁN
    console.log('❌ Hệ thống không thể tự động kiểm tra thanh toán ngân hàng');
    console.log('❌ Chỉ admin mới có thể xác nhận thanh toán thủ công');
    
    return res.json({
      success: true,
      message: 'CHƯA NHẬN TIỀN - Vui lòng chuyển khoản và nhấn "ĐÃ THANH TOÁN" để xác nhận',
      data: {
        isPaid: false,
        status: 'not_paid',
        bookingId: bookingId,
        amount: amount,
        transactionType: transactionType
      }
    });

  } catch (error) {
    console.error('Error checking payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi kiểm tra thanh toán' 
    });
  }
});

// API xác nhận thanh toán thủ công cho nhân viên
router.post('/confirm-manual/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amount, transactionType = 'deposit' } = req.body;

    console.log('🔧 Nhân viên xác nhận thanh toán thủ công:', { bookingId, amount, transactionType });

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin booking ID'
      });
    }

    // Tìm booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy booking'
      });
    }

    // Kiểm tra xem đã có giao dịch thanh toán thành công chưa
    const existingTransaction = await TransactionHistory.findOne({
      bookingId: bookingId,
      transactionType: transactionType,
      status: 'completed'
    });

    if (existingTransaction) {
      return res.json({
        success: true,
        message: 'Thanh toán đã được xác nhận trước đó',
        data: {
          transactionId: existingTransaction._id,
          status: 'already_confirmed'
        }
      });
    }

    // Tạo giao dịch thanh toán thành công
    const transaction = new TransactionHistory({
      bookingId: booking._id,
      tableId: booking.table,
      tableName: `Bàn ${booking.table}`,
      customerId: booking.customer,
      customerInfo: booking.customerInfo,
      transactionType: transactionType,
      amount: amount || booking.depositAmount,
      paymentMethod: 'manual_confirmation',
      status: 'completed',
      bankInfo: {
        accountNumber: '2246811357',
        accountName: 'DANG GIA HY',
        bankName: 'Techcombank',
        bankCode: '970407'
      },
      transactionId: 'MANUAL_' + Date.now(),
      paidAt: new Date(),
      confirmedAt: new Date(),
      processedBy: 'employee',
      processedByName: 'Nhân viên',
      notes: `Thanh toán ${transactionType === 'deposit' ? 'cọc' : 'đơn hàng'} bàn ${booking.table} - Xác nhận thủ công bởi nhân viên`
    });

    await transaction.save();
    console.log('✅ Đã tạo giao dịch thanh toán thủ công:', transaction._id);

    // Cập nhật trạng thái booking
    booking.status = 'confirmed';
    await booking.save();

    // Gửi thông báo cho khách hàng khi thanh toán cọc thành công
    if (transactionType === 'deposit' && booking.customer) {
      try {
        const customerNotification = new Notification({
          user: booking.customer,
          type: 'deposit_confirmed',
          title: '✅ ĐÃ CỌC THÀNH CÔNG',
          message: `Bạn đã thanh toán cọc ${(amount || booking.depositAmount).toLocaleString()}đ thành công cho bàn ${booking.table}. Đặt bàn đã được xác nhận!`,
          bookingId: booking._id,
          isRead: false
        });
        
        await customerNotification.save();
        console.log('✅ Đã gửi thông báo "ĐÃ CỌC THÀNH CÔNG" cho khách hàng');
      } catch (notificationError) {
        console.error('Lỗi gửi thông báo cho khách hàng:', notificationError);
      }
    }

    // Gửi thông báo cho admin về thanh toán thủ công
    try {
      const Employee = require('../models/Employee');
      const admins = await Employee.find({ role: 'admin' });
      
      for (const admin of admins) {
        const notification = new Notification({
          user: admin._id,
          type: 'manual_payment_confirmed',
          title: '💰 NHÂN VIÊN XÁC NHẬN THANH TOÁN THỦ CÔNG',
          message: `Nhân viên đã xác nhận thanh toán ${(amount || booking.depositAmount).toLocaleString()}đ cho bàn ${booking.table}.\nBooking ID: ${bookingId}`,
          bookingId: booking._id,
          isRead: false
        });
        
        await notification.save();
      }
      
      console.log(`✅ Đã gửi thông báo thanh toán thủ công cho ${admins.length} admin`);
    } catch (notificationError) {
      console.error('Lỗi gửi thông báo cho admin:', notificationError);
    }

    // Gửi thông báo Socket.IO real-time cho webadmin
    try {
      const io = req.app.get('io');
      if (io) {
        io.to('employees').emit('manual_payment_confirmed', {
          bookingId: booking._id,
          tableId: booking.table,
          tableName: `Bàn ${booking.table}`,
          customerName: booking.customerInfo?.fullName || 'N/A',
          amount: amount || booking.depositAmount,
          transactionType: transactionType,
          message: `Nhân viên đã xác nhận thanh toán ${(amount || booking.depositAmount).toLocaleString()}đ cho bàn ${booking.table}`,
          timestamp: new Date()
        });
        
        console.log('📢 Đã gửi thông báo Socket.IO cho webadmin về thanh toán thủ công');
      }
    } catch (socketError) {
      console.error('Lỗi gửi thông báo Socket.IO:', socketError);
    }

    res.json({
      success: true,
      message: '✅ XÁC NHẬN THANH TOÁN THỦ CÔNG THÀNH CÔNG',
      data: {
        transactionId: transaction._id,
        status: 'completed',
        bookingId: bookingId,
        amount: amount || booking.depositAmount
      }
    });
  } catch (error) {
    console.error('Error confirming manual payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi xác nhận thanh toán thủ công' 
    });
  }
});

// API để admin xác nhận thanh toán thủ công (chỉ dành cho admin thật)
router.post('/confirm-payment', async (req, res) => {
  try {
    const { bookingId, amount, transactionType = 'deposit' } = req.body;

    console.log('🔧 Admin xác nhận thanh toán thủ công:', { bookingId, amount, transactionType });

    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin booking hoặc số tiền'
      });
    }

    // Tìm booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy booking'
      });
    }

    // Kiểm tra xem đã có giao dịch thanh toán thành công chưa
    const existingTransaction = await TransactionHistory.findOne({
      bookingId: bookingId,
      transactionType: transactionType,
      status: 'completed',
      amount: amount
    });

    if (existingTransaction) {
      return res.json({
        success: true,
        message: 'Thanh toán đã được xác nhận trước đó',
        data: {
          transactionId: existingTransaction._id,
          status: 'already_confirmed'
        }
      });
    }

    // Tạo giao dịch thanh toán thành công
    const transaction = new TransactionHistory({
      bookingId: booking._id,
      tableId: booking.table,
      tableName: `Bàn ${booking.table}`,
      customerId: booking.customer,
      customerInfo: booking.customerInfo,
      transactionType: transactionType,
      amount: amount,
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
      processedBy: 'admin',
      processedByName: 'Admin',
      notes: `Thanh toán ${transactionType === 'deposit' ? 'cọc' : 'đơn hàng'} bàn ${booking.table} - Xác nhận thủ công`
    });

    await transaction.save();
    console.log('✅ Đã tạo giao dịch thanh toán thành công:', transaction._id);

    // Gửi thông báo cho admin khi có cọc thành công
    if (transactionType === 'deposit') {
      try {
        // Tạo thông báo cho admin
        const adminNotification = new Notification({
          user: null, // null = thông báo cho admin
          type: 'booking_deposit',
          title: '💰 KHÁCH HÀNG ĐÃ CỌC BÀN',
          message: `Khách hàng ${booking.customerInfo?.name || 'N/A'} đã cọc ${amount.toLocaleString()}đ cho bàn ${booking.table}. Vui lòng xác nhận!`,
          bookingId: booking._id,
          tableId: booking.table,
          customerId: booking.customer,
          isRead: false,
          priority: 'high'
        });
        
        await adminNotification.save();
        console.log('✅ Đã gửi thông báo cọc bàn cho admin');
        
        // Gửi thông báo real-time qua Socket.IO
        const io = req.app.get('io');
        if (io) {
          io.to('admins').emit('new_notification', {
            id: adminNotification._id,
            type: 'booking_deposit',
            title: adminNotification.title,
            message: adminNotification.message,
            bookingId: booking._id,
            tableId: booking.table,
            customerId: booking.customer,
            timestamp: new Date(),
            priority: 'high'
          });
          console.log('📡 Đã gửi thông báo real-time cho admin');
        }
      } catch (notificationError) {
        console.error('Lỗi gửi thông báo cho admin:', notificationError);
      }
    } else {
      console.log('✅ Đã lưu giao dịch thanh toán, chờ admin xác nhận');
    }

    // Gửi thông báo cho khách hàng khi thanh toán cọc thành công
    if (transactionType === 'deposit' && booking.customer) {
      try {
        const customerNotification = new Notification({
          user: booking.customer,
          type: 'deposit_confirmed',
          title: '✅ ĐÃ CỌC THÀNH CÔNG, ĐANG ĐỢI QUÁN XÁC NHẬN',
          message: `Bạn đã thanh toán cọc ${amount.toLocaleString()}đ thành công cho bàn ${booking.table}. Quán sẽ xác nhận trong vài phút.`,
          bookingId: booking._id,
          isRead: false
        });
        
        await customerNotification.save();
        console.log('✅ Đã gửi thông báo "ĐÃ CỌC THÀNH CÔNG" cho khách hàng');
      } catch (notificationError) {
        console.error('Lỗi gửi thông báo cho khách hàng:', notificationError);
      }
    }

    // KHÔNG gửi thông báo Socket.IO cho webadmin ở đây
    // Thông báo sẽ được gửi khi admin thực sự xác nhận cọc
    console.log('✅ Đã lưu giao dịch, chờ admin xác nhận để gửi thông báo webadmin');

    res.json({
      success: true,
      message: '✅ THÀNH CÔNG - Đơn cọc bàn đang đợi admin phê duyệt',
      data: {
        transactionId: transaction._id,
        status: 'completed',
        bookingId: bookingId,
        amount: amount
      }
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi xác nhận thanh toán' 
    });
  }
});

// Lấy lịch sử giao dịch
router.get('/history', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      status, 
      startDate, 
      endDate,
      tableId 
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    // Filter theo loại giao dịch
    if (type) {
      query.transactionType = type;
    }

    // Filter theo trạng thái
    if (status) {
      query.status = status;
    }

    // Filter theo bàn
    if (tableId) {
      query.tableId = tableId;
    }

    // Filter theo ngày
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const transactions = await TransactionHistory.find(query)
      .populate('bookingId', 'bookingDate bookingTime numberOfGuests')
      .populate('customerId', 'fullName phone email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TransactionHistory.countDocuments(query);

    // Thống kê
    const stats = await TransactionHistory.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          completedTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          completedAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        },
        stats: stats[0] || {
          totalAmount: 0,
          totalTransactions: 0,
          completedTransactions: 0,
          completedAmount: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy lịch sử giao dịch' 
    });
  }
});

// API xác nhận thanh toán QR code
router.post('/confirm-qr-payment', async (req, res) => {
  try {
    const { qrData, amount, description } = req.body;
    
    console.log('📱 QR Payment confirmation request:', { qrData, amount, description });
    
    if (!qrData || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin QR code hoặc số tiền'
      });
    }

    // Tạo transaction history cho QR payment
    const transaction = new TransactionHistory({
      transactionType: 'deposit',
      amount: parseInt(amount),
      paymentMethod: 'qr_code',
      status: 'completed',
      transactionId: 'QR_' + Date.now(),
      paidAt: new Date(),
      confirmedAt: new Date(),
      notes: `Thanh toán QR code: ${description || 'QR Payment'}`,
      qrData: qrData,
      // Thêm các trường bắt buộc
      tableId: new mongoose.Types.ObjectId(),
      tableName: 'QR Payment',
      bookingId: new mongoose.Types.ObjectId(),
      customerId: new mongoose.Types.ObjectId(),
      customerInfo: {
        fullName: 'QR Payment Customer',
        phone: 'QR_PAYMENT',
        email: 'qr@payment.com'
      }
    });

    await transaction.save();
    console.log('✅ QR Payment transaction created:', transaction._id);

    // Gửi thông báo cho admin về thanh toán QR code
    try {
      const Employee = require('../models/Employee');
      const admins = await Employee.find({ role: 'admin' });
      
      for (const admin of admins) {
        const notification = new Notification({
          user: admin._id,
          type: 'qr_payment_confirmed',
          title: '💰 THANH TOÁN QR CODE THÀNH CÔNG',
          message: `Nhân viên đã quét QR code và thanh toán ${amount.toLocaleString()}đ.\nMô tả: ${description || 'QR Payment'}\nQR Data: ${qrData.substring(0, 50)}...`,
          isRead: false
        });
        
        await notification.save();
      }
      
      console.log(`✅ Đã gửi thông báo QR payment cho ${admins.length} admin`);
    } catch (notificationError) {
      console.error('Lỗi gửi thông báo QR payment:', notificationError);
    }

    // Gửi thông báo Socket.IO real-time cho webadmin
    try {
      const io = req.app.get('io');
      if (io) {
        io.to('employees').emit('qr_payment_confirmed', {
          amount: amount,
          description: description || 'QR Payment',
          qrData: qrData.substring(0, 50) + '...',
          message: `Nhân viên đã quét QR code và thanh toán ${amount.toLocaleString()}đ`,
          timestamp: new Date()
        });
        
        console.log('📢 Đã gửi thông báo Socket.IO cho webadmin về thanh toán QR code');
      }
    } catch (socketError) {
      console.error('Lỗi gửi thông báo Socket.IO:', socketError);
    }

    res.json({
      success: true,
      message: 'Xác nhận thanh toán QR code thành công',
      data: {
        transactionId: transaction._id,
        amount: amount,
        qrData: qrData
      }
    });

  } catch (error) {
    console.error('❌ Error confirming QR payment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xác nhận thanh toán QR code',
      error: error.message
    });
  }
});


module.exports = router;