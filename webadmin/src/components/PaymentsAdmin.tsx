import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import PaymentModal from './PaymentModal';

type PaymentTable = {
  _id: string;
  name: string;
  status: 'empty' | 'occupied';
  note?: string;
  order?: {
    _id: string;
    items: Array<{
      name: string;
      price: number;
      quantity: number;
    }>;
    totalAmount: number;
  };
  booking?: {
    _id: string;
    customerInfo?: {
      fullName: string;
      phone: string;
    };
    numberOfGuests: number;
    bookingDate: string;
    bookingTime: string;
    totalAmount: number;
    depositAmount?: number;
    status: string;
  };
};

export default function PaymentsAdmin() {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [tables, setTables] = useState<PaymentTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'occupied' | 'empty'>('occupied');
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    tableId: string;
    totalAmount: number;
    depositAmount: number;
    orderAmount: number;
  }>({
    isOpen: false,
    tableId: '',
    totalAmount: 0,
    depositAmount: 0,
    orderAmount: 0
  });

  async function loadTables() {
    setLoading(true);
    try {
      const res = await axios.get<PaymentTable[]>(`${API}/api/tables`);
      const tablesWithOrders = await Promise.all(
        res.data.map(async (table) => {
          if (table.status === 'occupied') {
            try {
              // Lấy thông tin order
              const orderRes = await axios.get(`${API}/api/orders/by-table/${table._id}`);
              const order = orderRes.data;
              
              // Lấy thông tin booking
              let booking = null;
              try {
                const bookingRes = await axios.get(`${API}/api/bookings/by-table/${table._id}`);
                booking = bookingRes.data;
                console.log('Booking data for table', table._id, ':', booking);
              } catch (bookingError) {
                console.log('No booking found for table:', table._id);
              }
              
              return { ...table, order, booking };
            } catch (error) {
              return { ...table, order: null, booking: null };
            }
          }
          return { ...table, order: null, booking: null };
        })
      );
      setTables(tablesWithOrders);
    } catch (error) {
      console.error('Error loading tables:', error);
    } finally {
      setLoading(false);
    }
  }

  async function processPayment(tableId: string) {
    try {
      await axios.post(`${API}/api/orders/by-table/${tableId}/pay`);
      toast.success('Thanh toán thành công! Thông báo đã được gửi cho khách hàng.');
      await loadTables();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
    }
  }

  const handleQRPayment = (tableId: string, totalAmount: number, depositAmount: number = 0, orderAmount: number = 0) => {
    setPaymentModal({
      isOpen: true,
      tableId,
      totalAmount,
      depositAmount,
      orderAmount
    });
  };

  const handlePaymentSuccess = async () => {
    // Xử lý thanh toán thành công
    await processPayment(paymentModal.tableId);
    setPaymentModal({
      isOpen: false,
      tableId: '',
      totalAmount: 0,
      depositAmount: 0,
      orderAmount: 0
    });
  };

  // Xử lý trả bàn
  const handleReturnTable = async (tableId: string, tableName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn trả bàn ${tableName}?\n\n⚠️ Hành động này sẽ:\n- Xóa dữ liệu order chưa thanh toán\n- Hủy booking liên quan\n- Giải phóng bàn ngay lập tức`)) {
      return;
    }

    try {
      const response = await axios.post(`${API}/api/tables/${tableId}/return`, {
        performedBy: 'admin',
        performedByName: 'Admin'
      });
      
      if (response.data.success) {
        toast.success(`✅ Đã trả bàn ${tableName} thành công!`);
        await loadTables();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra khi trả bàn');
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const filteredTables = tables.filter(table => {
    if (filter === 'all') return true;
    return table.status === filter;
  });

  const occupiedTables = filteredTables.filter(table => table.status === 'occupied');

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bàn chưa thanh toán</p>
              <p className="text-2xl font-bold text-gray-900">{occupiedTables.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
              <p className="text-2xl font-bold text-gray-900">
                {occupiedTables.reduce((sum, table) => sum + (table.order?.totalAmount || 0), 0).toLocaleString()}đ
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng bàn</p>
              <p className="text-2xl font-bold text-gray-900">{tables.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
          {(['all', 'occupied', 'empty'] as const).map(k => (
            <button 
              key={k} 
              onClick={() => setFilter(k)} 
              className={`px-3 py-1.5 ${filter === k ? 'bg-red-600 text-white' : 'bg-white'}`}
            >
              {k === 'all' ? 'Tất cả' : k === 'occupied' ? 'Chưa thanh toán' : 'Bàn trống'}
            </button>
          ))}
        </div>
        <button
          onClick={loadTables}
          className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
        >
          🔄 Làm mới
        </button>
      </div>

      {/* Tables List */}
      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTables.map(table => (
            <div key={table._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-semibold text-lg">{table.name}</div>
                  <div className="text-sm text-gray-500">#{table._id}</div>
                  {table.note && <div className="text-sm text-gray-600 mt-1">{table.note}</div>}
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  table.status === 'empty' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {table.status === 'empty' ? 'Bàn trống' : 'Chưa thanh toán'}
                </span>
              </div>

              {table.status === 'occupied' && (
                <div className="mb-4">
                  {/* Thông tin booking */}
                  {table.booking && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Thông tin đặt bàn
                      </h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Khách hàng:</span>
                          <span className="font-medium">{table.booking.customerInfo?.fullName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Số người:</span>
                          <span className="font-medium">{table.booking.numberOfGuests} người</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Thời gian:</span>
                          <span className="font-medium">{table.booking.bookingTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Số tiền cọc:</span>
                          <span className="font-bold text-orange-600">
                            {table.booking.depositAmount ? table.booking.depositAmount.toLocaleString() : '0'}đ
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Thông tin đơn hàng */}
                  {table.order && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Đơn hàng:</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {table.order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.name} x{item.quantity}</span>
                            <span className="font-medium">{(item.price * item.quantity).toLocaleString()}đ</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1 pt-2 border-t border-gray-200 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Tổng đơn hàng:</span>
                          <span className="font-bold text-lg text-red-600">
                            {table.order.totalAmount.toLocaleString()}đ
                          </span>
                        </div>
                        {table.booking?.depositAmount && table.booking.depositAmount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-orange-600">Số tiền cọc:</span>
                            <span className="font-bold text-lg text-orange-600">
                              {table.booking.depositAmount.toLocaleString()}đ
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-1 border-t border-gray-300">
                          <span className="font-bold text-lg">Tổng thanh toán:</span>
                          <span className="font-bold text-xl text-green-600">
                            {((table.order.totalAmount || 0) + (table.booking?.depositAmount || 0)).toLocaleString()}đ
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {table.status === 'occupied' ? (
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => {
                        const orderAmount = table.order?.totalAmount || 0;
                        const depositAmount = table.booking?.depositAmount || 0;
                        const totalAmount = orderAmount + depositAmount;
                        handleQRPayment(table._id, totalAmount, depositAmount, orderAmount);
                      }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      💳 THANH TOÁN NGAY
                    </button>
                    <button
                      onClick={() => handleReturnTable(table._id, table.name)}
                      className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      title="Trả bàn - xóa dữ liệu chưa thanh toán"
                    >
                      🔄 TRẢ BÀN
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 px-4 py-2 bg-gray-100 text-gray-500 rounded-md text-sm text-center">
                    Bàn trống
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredTables.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              Không có bàn nào.
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, tableId: '', totalAmount: 0, depositAmount: 0, orderAmount: 0 })}
        onPaymentSuccess={handlePaymentSuccess}
        tableId={paymentModal.tableId}
        totalAmount={paymentModal.totalAmount}
        depositAmount={paymentModal.depositAmount}
        orderAmount={paymentModal.orderAmount}
        API={API}
      />
    </div>
  );
}
