const express = require('express');
const router = express.Router();

// Lấy danh sách ngân hàng từ VietQR API
router.get('/banks', async (req, res) => {
  try {
    // Sử dụng fetch thay vì axios
    const response = await fetch('https://api.vietqr.io/v2/banks');
    const data = await response.json();
    
    if (data.code === '00') {
      res.json({
        success: true,
        message: 'Lấy danh sách ngân hàng thành công',
        data: data.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Không thể lấy danh sách ngân hàng',
        error: data.desc
      });
    }
  } catch (error) {
    console.error('Error fetching banks:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách ngân hàng',
      error: error.message
    });
  }
});

// Tạo QR code thanh toán
router.post('/generate-qr', async (req, res) => {
  try {
    const { 
      accountNumber, 
      accountName, 
      bankCode, 
      amount, 
      description = 'Thanh toan don hang',
      template = 'compact'
    } = req.body;

    // Validate required fields
    if (!accountNumber || !accountName || !bankCode) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: accountNumber, accountName, bankCode'
      });
    }

    // Tạo QR code data
    const qrData = {
      accountNo: accountNumber,
      accountName: accountName,
      acqId: bankCode,
      amount: amount || 0,
      addInfo: description,
      format: 'text',
      template: template
    };

    // Gọi VietQR API để tạo QR code
    const response = await fetch('https://api.vietqr.io/v2/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(qrData)
    });

    const data = await response.json();

    if (data.code === '00') {
      res.json({
        success: true,
        message: 'Tạo QR code thành công',
        data: {
          qrCode: data.data.qrDataURL,
          qrText: data.data.qrCode,
          accountInfo: {
            accountNumber,
            accountName,
            bankCode,
            amount,
            description
          }
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Không thể tạo QR code',
        error: data.desc
      });
    }
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo QR code',
      error: error.message
    });
  }
});

// Tra cứu thông tin tài khoản
router.post('/lookup-account', async (req, res) => {
  try {
    const { accountNumber, bankCode } = req.body;

    if (!accountNumber || !bankCode) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin: accountNumber, bankCode'
      });
    }

    const response = await fetch('https://api.vietqr.io/v2/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountNo: accountNumber,
        acqId: bankCode
      })
    });

    const data = await response.json();

    if (data.code === '00') {
      res.json({
        success: true,
        message: 'Tra cứu thông tin tài khoản thành công',
        data: data.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Không thể tra cứu thông tin tài khoản',
        error: data.desc
      });
    }
  } catch (error) {
    console.error('Error looking up account:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tra cứu tài khoản',
      error: error.message
    });
  }
});

module.exports = router;