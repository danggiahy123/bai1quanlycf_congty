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

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  tableId: string;
  totalAmount: number;
  API: string;
  depositAmount?: number;
  orderAmount?: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  onPaymentSuccess, 
  tableId, 
  totalAmount, 
  API,
  depositAmount = 0,
  orderAmount = 0
}) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [paymentInfo, setPaymentInfo] = useState({
    accountNumber: '2246811357',
    accountName: 'DANG GIA HY',
    bankCode: '970407',
    amount: totalAmount,
    description: `Thanh toan ban ${tableId}`
  });
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'cancelled'>('pending');

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
          amount: totalAmount,
          description: `Thanh toan ban ${tableId}`
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setQrCode(data.data.qrCode);
        setPaymentStatus('pending');
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

  // Xác nhận thanh toán thành công
  const confirmPayment = async () => {
    try {
      // Gọi API để xác nhận thanh toán
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/by-table/${tableId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setPaymentStatus('paid');
        toast.success('✅ Thanh toán thành công! Bàn đã được giải phóng.');
        setTimeout(() => {
          onPaymentSuccess();
          onClose();
        }, 1500);
      } else {
        const errorData = await response.json();
        toast.error(`❌ Lỗi thanh toán: ${errorData.error || 'Có lỗi xảy ra'}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('❌ Lỗi kết nối. Vui lòng thử lại.');
    }
  };

  // Hủy thanh toán
  const cancelPayment = () => {
    setPaymentStatus('cancelled');
    setQrCode('');
    toast.error('Đã hủy thanh toán');
  };

  useEffect(() => {
    if (isOpen) {
      fetchBanks();
      setPaymentInfo(prev => ({ 
        ...prev, 
        amount: totalAmount,
        description: `Thanh toan ban ${tableId}`
      }));
      // Auto-generate QR code when modal opens
      setTimeout(() => {
        if (banks.length > 0) {
          generateQRCode();
        }
      }, 1000); // Wait for banks to load
    }
  }, [isOpen, totalAmount, tableId, banks.length]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-lg shadow-xl">
          <div className="p-6">
            <Dialog.Title className="text-2xl font-bold text-gray-900 mb-4">
              💳 THANH TOÁN NGAY - Bàn {tableId}
            </Dialog.Title>
            
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="space-y-2 mb-3">
                {orderAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Tổng đơn hàng:</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {orderAmount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                )}
                {depositAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-orange-600">Số tiền cọc:</span>
                    <span className="text-lg font-semibold text-orange-600">
                      {depositAmount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-green-300">
                  <span className="text-lg font-semibold text-gray-700">💰 Tổng thanh toán:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {totalAmount.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>📱 Quét mã QR bên dưới để chuyển khoản</p>
                <p>⏰ Sau khi chuyển khoản, nhấn "THANH TOÁN THÀNH CÔNG"</p>
              </div>
            </div>

            {!qrCode ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Đang tạo QR code thanh toán...</p>
                  <p className="text-sm text-gray-500 mt-2">Vui lòng chờ trong giây lát</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentStatus === 'pending' && (
                  <div className="text-center">
                    <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                      <p className="text-green-800 font-bold text-lg">
                        💳 QR CODE THANH TOÁN
                      </p>
                      <p className="text-green-700 font-medium">
                        Quét mã QR để thanh toán {totalAmount.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                    
                    <div className="flex justify-center mb-6">
                      <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-green-200">
                        <img 
                          src={qrCode} 
                          alt="QR Code thanh toán" 
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

                    <div className="flex gap-3">
                      <button
                        onClick={confirmPayment}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      >
                        ✅ THANH TOÁN THÀNH CÔNG
                      </button>
                      <button
                        onClick={cancelPayment}
                        className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        ❌ Hủy
                      </button>
                    </div>
                  </div>
                )}

                {paymentStatus === 'paid' && (
                  <div className="text-center">
                    <div className="mb-4 p-4 bg-green-50 rounded-lg">
                      <p className="text-green-800 font-semibold text-lg">
                        ✅ Thanh toán thành công!
                      </p>
                    </div>
                    <p className="text-gray-600">Đang chuyển về trang quản lý...</p>
                  </div>
                )}

                {paymentStatus === 'cancelled' && (
                  <div className="text-center">
                    <div className="mb-4 p-4 bg-red-50 rounded-lg">
                      <p className="text-red-800 font-semibold text-lg">
                        ❌ Đã hủy thanh toán
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

export default PaymentModal;
