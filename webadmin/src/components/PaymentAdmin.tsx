import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Bank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
}

interface PaymentAdminProps {
  API: string;
}

const PaymentAdmin: React.FC<PaymentAdminProps> = ({ API }) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [paymentInfo, setPaymentInfo] = useState({
    accountNumber: '2246811357',
    accountName: 'DANG GIA HY',
    bankCode: '970407',
    amount: '',
    description: 'Thanh toan don hang'
  });

  // Lấy danh sách ngân hàng
  const fetchBanks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/api/payment/banks`);
      const data = await response.json();
      
      if (data.success) {
        setBanks(data.data);
        // Tìm Techcombank
        const techcombank = data.data.find((bank: Bank) => bank.code === 'TCB');
        if (techcombank) {
          setSelectedBank(techcombank);
          setPaymentInfo(prev => ({ ...prev, bankCode: techcombank.bin }));
        }
      } else {
        toast.error(data.message || 'Không thể tải danh sách ngân hàng');
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
      toast.error('Lỗi khi tải danh sách ngân hàng');
    } finally {
      setLoading(false);
    }
  };

  // Tạo QR code thanh toán
  const generateQRCode = async () => {
    if (!selectedBank) {
      toast.error('Vui lòng chọn ngân hàng');
      return;
    }

    if (!paymentInfo.accountNumber || !paymentInfo.accountName) {
      toast.error('Vui lòng nhập đầy đủ thông tin tài khoản');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API}/api/payment/generate-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountNumber: paymentInfo.accountNumber,
          accountName: paymentInfo.accountName,
          bankCode: paymentInfo.bankCode,
          amount: paymentInfo.amount ? parseInt(paymentInfo.amount) : 0,
          description: paymentInfo.description
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setQrCode(data.data.qrCode);
        toast.success('Tạo QR code thành công!');
      } else {
        toast.error(data.message || 'Không thể tạo QR code');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Lỗi khi tạo QR code');
    } finally {
      setLoading(false);
    }
  };

  // Tra cứu thông tin tài khoản
  const lookupAccount = async () => {
    if (!selectedBank || !paymentInfo.accountNumber) {
      toast.error('Vui lòng chọn ngân hàng và nhập số tài khoản');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API}/api/payment/lookup-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountNumber: paymentInfo.accountNumber,
          bankCode: paymentInfo.bankCode
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPaymentInfo(prev => ({ 
          ...prev, 
          accountName: data.data.accountName || prev.accountName 
        }));
        toast.success('Tra cứu thông tin tài khoản thành công!');
      } else {
        toast.error(data.message || 'Không thể tra cứu thông tin tài khoản');
      }
    } catch (error) {
      console.error('Error looking up account:', error);
      toast.error('Lỗi khi tra cứu tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">💳 Quản lý Thanh toán</h2>
      
      {/* Thông tin tài khoản */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Thông tin tài khoản nhận tiền</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số tài khoản
            </label>
            <input
              type="text"
              value={paymentInfo.accountNumber}
              onChange={(e) => setPaymentInfo(prev => ({ ...prev, accountNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập số tài khoản"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên chủ tài khoản
            </label>
            <input
              type="text"
              value={paymentInfo.accountName}
              onChange={(e) => setPaymentInfo(prev => ({ ...prev, accountName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tên chủ tài khoản"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngân hàng
            </label>
            <select
              value={selectedBank?.id || ''}
              onChange={(e) => {
                const bank = banks.find(b => b.id === parseInt(e.target.value));
                setSelectedBank(bank || null);
                if (bank) {
                  setPaymentInfo(prev => ({ ...prev, bankCode: bank.bin }));
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn ngân hàng</option>
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name} ({bank.shortName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số tiền (VND)
            </label>
            <input
              type="number"
              value={paymentInfo.amount}
              onChange={(e) => setPaymentInfo(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập số tiền"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nội dung chuyển khoản
          </label>
          <input
            type="text"
            value={paymentInfo.description}
            onChange={(e) => setPaymentInfo(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập nội dung chuyển khoản"
          />
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={lookupAccount}
            disabled={loading || !selectedBank || !paymentInfo.accountNumber}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🔍 Tra cứu tài khoản
          </button>
          
          <button
            onClick={generateQRCode}
            disabled={loading || !selectedBank || !paymentInfo.accountNumber || !paymentInfo.accountName}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Đang tạo...' : '📱 Tạo QR Code'}
          </button>
        </div>
      </div>

      {/* QR Code */}
      {qrCode && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">QR Code thanh toán</h3>
          <div className="flex flex-col items-center">
            <img 
              src={qrCode} 
              alt="QR Code thanh toán" 
              className="max-w-xs max-h-xs border border-gray-300 rounded-lg"
            />
            <p className="mt-4 text-sm text-gray-600 text-center">
              Quét mã QR để chuyển tiền đến {paymentInfo.accountName}
            </p>
            <p className="text-sm text-gray-500">
              {selectedBank?.name} - {paymentInfo.accountNumber}
            </p>
            {paymentInfo.amount && (
              <p className="text-lg font-semibold text-green-600">
                {parseInt(paymentInfo.amount).toLocaleString('vi-VN')} VND
              </p>
            )}
          </div>
        </div>
      )}

      {/* Danh sách ngân hàng hỗ trợ */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Danh sách ngân hàng hỗ trợ VietQR</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
          {banks.map((bank) => (
            <div 
              key={bank.id} 
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedBank?.id === bank.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => {
                setSelectedBank(bank);
                setPaymentInfo(prev => ({ ...prev, bankCode: bank.bin }));
              }}
            >
              <div className="flex items-center space-x-2">
                <img 
                  src={bank.logo} 
                  alt={bank.shortName}
                  className="w-6 h-6 object-contain"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {bank.shortName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {bank.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">{bank.bin}</span>
                <div className="flex space-x-1">
                  {bank.transferSupported === 1 && (
                    <span className="text-xs bg-green-100 text-green-800 px-1 rounded">
                      Chuyển tiền
                    </span>
                  )}
                  {bank.lookupSupported === 1 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                      Tra cứu
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentAdmin;
