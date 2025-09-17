import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
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

interface DepositPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepositSuccess: () => void;
  tableId: string;
  depositAmount: number;
  bookingId: string;
  API: string;
}

const DepositPaymentModal: React.FC<DepositPaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  onDepositSuccess, 
  tableId, 
  depositAmount,
  bookingId,
  API 
}) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [paymentInfo, setPaymentInfo] = useState({
    accountNumber: '2246811357',
    accountName: 'DANG GIA HY',
    bankCode: '970407',
    amount: depositAmount,
    description: `Coc ban ${tableId}`
  });
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'cancelled' | 'checking'>('pending');
  const [checkingPayment, setCheckingPayment] = useState(false);

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

  // Tạo QR code thanh toán cọc
  const generateQRCode = async () => {
    if (!selectedBank) {
      toast.error('Vui lòng chọn ngân hàng');
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
          amount: depositAmount,
          description: `Coc ban ${tableId}`
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setQrCode(data.data.qrCode);
        setPaymentStatus('pending');
        toast.success('Tạo QR code thanh toán cọc thành công!');
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

  // Kiểm tra thanh toán tự động
  const checkPaymentAutomatically = async () => {
    try {
      setCheckingPayment(true);
      setPaymentStatus('checking');
      
      toast.success('🔍 Đang kiểm tra thanh toán...');
      
      const response = await fetch(`${API}/api/payment/check-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: bookingId,
          amount: depositAmount,
          transactionType: 'deposit'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // Thành công - xác nhận thanh toán cọc
          setPaymentStatus('paid');
          setCheckingPayment(false);
          toast.success('✅ ĐÃ NHẬN THẤY THANH TOÁN! Bàn đã được cọc.');
          
          // Gọi API xác nhận thanh toán cọc
          await confirmDepositPaymentAPI();
          
          setTimeout(() => {
            onDepositSuccess();
            onClose();
          }, 2000);
        } else {
          setCheckingPayment(false);
          setPaymentStatus('pending');
          toast.error('❌ ' + (data.message || 'Lỗi khi kiểm tra thanh toán'));
        }
      } else {
        setCheckingPayment(false);
        setPaymentStatus('pending');
        toast.error('❌ Lỗi khi kiểm tra thanh toán');
      }
    } catch (error) {
      console.error('Error checking payment:', error);
      setCheckingPayment(false);
      setPaymentStatus('pending');
      toast.error('❌ Lỗi kết nối khi kiểm tra thanh toán');
    }
  };

  // API xác nhận thanh toán cọc
  const confirmDepositPaymentAPI = async () => {
    try {
      const response = await fetch(`${API}/api/bookings/${bookingId}/confirm-deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        console.log('✅ Đã xác nhận thanh toán cọc thành công');
      } else {
        console.error('❌ Lỗi xác nhận thanh toán cọc');
      }
    } catch (error) {
      console.error('Error confirming deposit payment:', error);
    }
  };

  // Xác nhận thanh toán cọc thành công (manual)
  const confirmDepositPayment = async () => {
    try {
      // Gọi API để xác nhận thanh toán cọc
      const response = await fetch(`${API}/api/bookings/${bookingId}/confirm-deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setPaymentStatus('paid');
        toast.success('✅ Thanh toán cọc thành công! Bàn đã được cọc.');
        setTimeout(() => {
          onDepositSuccess();
          onClose();
        }, 1500);
      } else {
        const errorData = await response.json();
        toast.error(`❌ Lỗi thanh toán cọc: ${errorData.error || 'Có lỗi xảy ra'}`);
      }
    } catch (error) {
      console.error('Deposit payment error:', error);
      toast.error('❌ Lỗi kết nối. Vui lòng thử lại.');
    }
  };

  // Hủy thanh toán cọc
  const cancelDepositPayment = () => {
    setPaymentStatus('cancelled');
    setQrCode('');
    toast.error('Đã hủy thanh toán cọc');
  };

  useEffect(() => {
    if (isOpen) {
      fetchBanks();
      setPaymentInfo(prev => ({ 
        ...prev, 
        amount: depositAmount,
        description: `Coc ban ${tableId}`
      }));
      // Auto-generate QR code when modal opens
      setTimeout(() => {
        if (banks.length > 0) {
          generateQRCode();
        }
      }, 1000); // Wait for banks to load
    }
  }, [isOpen, depositAmount, tableId, banks.length]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-lg shadow-xl">
          <div className="p-6">
            <Dialog.Title className="text-2xl font-bold text-gray-900 mb-4">
              💰 THANH TOÁN CỌC - Bàn {tableId}
            </Dialog.Title>
            
            <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-700">💰 Số tiền cọc:</span>
                <span className="text-2xl font-bold text-orange-600">
                  {depositAmount.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>📱 Quét mã QR bên dưới để thanh toán cọc</p>
                <p>⏰ Sau khi chuyển khoản, nhấn "XÁC NHẬN CỌC THÀNH CÔNG"</p>
              </div>
            </div>

            {!qrCode ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Đang tạo QR code thanh toán cọc...</p>
                  <p className="text-sm text-gray-500 mt-2">Vui lòng chờ trong giây lát</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentStatus === 'pending' && (
                  <div className="text-center">
                    <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                      <p className="text-orange-800 font-bold text-lg">
                        💳 QR CODE THANH TOÁN CỌC
                      </p>
                      <p className="text-orange-700 font-medium">
                        Quét mã QR để thanh toán cọc {depositAmount.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                    
                    <div className="flex justify-center mb-6">
                      <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-orange-200">
                        <img 
                          src={qrCode} 
                          alt="QR Code thanh toán cọc" 
                          className="w-64 h-64 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <div className="text-sm text-gray-700 space-y-1">
                        <p><span className="font-semibold">Tài khoản:</span> {paymentInfo.accountName}</p>
                        <p><span className="font-semibold">Số tài khoản:</span> {paymentInfo.accountNumber}</p>
                        <p><span className="font-semibold">Ngân hàng:</span> {selectedBank?.name}</p>
                        <p><span className="font-semibold">Nội dung:</span> {paymentInfo.description}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <button
                          onClick={checkPaymentAutomatically}
                          disabled={checkingPayment}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {checkingPayment ? '🔍 ĐANG KIỂM TRA...' : '🔍 KIỂM TRA THANH TOÁN TỰ ĐỘNG'}
                        </button>
                        <button
                          onClick={confirmDepositPayment}
                          className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 font-bold shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          ✅ XÁC NHẬN THỦ CÔNG
                        </button>
                      </div>
                      <button
                        onClick={cancelDepositPayment}
                        className="w-full px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        ❌ Hủy thanh toán
                      </button>
                    </div>
                  </div>
                )}

                {paymentStatus === 'checking' && (
                  <div className="text-center">
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-blue-800 font-semibold text-lg">
                        🔍 Đang kiểm tra thanh toán...
                      </p>
                      <p className="text-blue-700 text-sm mt-1">
                        Vui lòng chờ trong giây lát
                      </p>
                    </div>
                  </div>
                )}

                {paymentStatus === 'paid' && (
                  <div className="text-center">
                    <div className="mb-4 p-4 bg-green-50 rounded-lg">
                      <p className="text-green-800 font-semibold text-lg">
                        ✅ Thanh toán cọc thành công!
                      </p>
                      <p className="text-green-700 text-sm mt-1">
                        Bàn {tableId} đã được cọc {depositAmount.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                    <p className="text-gray-600">Đang chuyển về trang quản lý...</p>
                  </div>
                )}

                {paymentStatus === 'cancelled' && (
                  <div className="text-center">
                    <div className="mb-4 p-4 bg-red-50 rounded-lg">
                      <p className="text-red-800 font-semibold text-lg">
                        ❌ Đã hủy thanh toán cọc
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setQrCode('');
                        setPaymentStatus('pending');
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Tạo lại QR Code
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default DepositPaymentModal;
