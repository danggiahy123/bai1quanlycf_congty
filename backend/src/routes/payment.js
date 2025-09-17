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

// Kiểm tra thanh toán tự động (simulate)
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

    // Tìm booking (cho phép bookingId không tồn tại để demo)
    let booking = null;
    try {
      booking = await Booking.findById(bookingId);
    } catch (error) {
      console.log('Booking không tồn tại, tiếp tục demo mode');
    }

    // Luôn trả về thành công để demo (trong thực tế sẽ gọi API ngân hàng)
    console.log('✅ Trả về kết quả thành công cho demo');
    res.json({
      success: true,
      message: 'Thanh toán đã được xác nhận',
      data: {
        status: 'completed',
        message: 'ĐÃ NHẬN THẤY THANH TOÁN'
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