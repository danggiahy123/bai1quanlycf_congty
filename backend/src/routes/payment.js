const express = require('express');
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

    // Tạo QR code URL (sử dụng VietQR API)
    const qrCodeUrl = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(description)}`;

    res.json({
      success: true,
      data: {
        qrCode: qrCodeUrl,
        accountNumber,
        accountName,
        bankCode,
        amount,
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
      success: false,
      message: 'Hệ thống không thể tự động kiểm tra thanh toán ngân hàng. Vui lòng chuyển khoản và liên hệ quán để xác nhận.',
      data: {
        status: 'pending',
        message: 'CHƯA CÓ THANH TOÁN - CẦN XÁC NHẬN THỦ CÔNG'
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

    // TẠM THỜI ẨN: Gửi thông báo cho admin khi có cọc (QR code hoặc Facebook)
    // Thông báo sẽ chỉ được gửi khi admin thực sự xác nhận cọc
    if (transactionType === 'deposit') {
      console.log('✅ Đã lưu giao dịch cọc, KHÔNG gửi thông báo cho admin - chờ admin xác nhận');
    } else {
      console.log('✅ Đã lưu giao dịch thanh toán, chờ admin xác nhận');
    }

    // KHÔNG gửi thông báo Socket.IO cho webadmin ở đây
    // Thông báo sẽ được gửi khi admin thực sự xác nhận cọc
    console.log('✅ Đã lưu giao dịch, chờ admin xác nhận để gửi thông báo webadmin');

    res.json({
      success: true,
      message: 'Đã xác nhận thanh toán thành công',
      data: {
        transactionId: transaction._id,
        status: 'completed'
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

module.exports = router;