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
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  onPaymentSuccess, 
  tableId, 
  totalAmount, 
  API 
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
  const confirmPayment = () => {
    setPaymentStatus('paid');
    toast.success('Xác nhận thanh toán thành công!');
    setTimeout(() => {
      onPaymentSuccess();
      onClose();
    }, 1500);
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
    }
  }, [isOpen, totalAmount, tableId]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-lg shadow-xl">
          <div className="p-6">
            <Dialog.Title className="text-2xl font-bold text-gray-900 mb-4">
              💳 Thanh toán bàn {tableId}
            </Dialog.Title>
            
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-700">Tổng tiền:</span>
                <span className="text-2xl font-bold text-green-600">
                  {totalAmount.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            {!qrCode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn ngân hàng
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

                <div className="flex gap-2">
                  <button
                    onClick={generateQRCode}
                    disabled={loading || !selectedBank}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '⏳ Đang tạo...' : '📱 Tạo QR Code'}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentStatus === 'pending' && (
                  <div className="text-center">
                    <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                      <p className="text-yellow-800 font-semibold">
                        ⏳ Đang chờ khách hàng thanh toán...
                      </p>
                    </div>
                    
                    <div className="flex justify-center mb-4">
                      <img 
                        src={qrCode} 
                        alt="QR Code thanh toán" 
                        className="max-w-xs max-h-xs border border-gray-300 rounded-lg"
                      />
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-4">
                      <p>Quét mã QR để chuyển tiền đến {paymentInfo.accountName}</p>
                      <p>{selectedBank?.name} - {paymentInfo.accountNumber}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={confirmPayment}
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                      >
                        ✅ Xác nhận đã thanh toán
                      </button>
                      <button
                        onClick={cancelPayment}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
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
