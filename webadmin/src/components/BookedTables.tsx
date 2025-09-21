import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://192.168.1.161:5000';

interface BookedTable {
  _id: string;
  table: string;
  tableName: string;
  customer: string;
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  bookingDate: string;
  bookingTime: string;
  depositAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  confirmedAt?: string;
  notes?: string;
}

export default function BookedTables() {
  const [bookedTables, setBookedTables] = useState<BookedTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [selectedBooking, setSelectedBooking] = useState<BookedTable | null>(null);
  const [processingBooking, setProcessingBooking] = useState<string | null>(null);

  // Fetch booked tables
  const fetchBookedTables = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/bookings/booked-tables`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        console.log('📊 Raw booking data:', data.data);
        // Đảm bảo dữ liệu có format đúng
        const processedData = data.data.map((booking: any) => {
          console.log('🔍 Processing booking:', booking);
          return {
            ...booking,
            table: typeof booking.table === 'object' ? booking.table?._id || booking.table : booking.table,
            tableName: booking.tableName || (typeof booking.table === 'object' ? booking.table?.name : `Bàn ${booking.table}`) || 'N/A',
            customerInfo: {
              name: booking.customerInfo?.name || 'N/A',
              phone: booking.customerInfo?.phone || 'N/A',
              email: booking.customerInfo?.email || ''
            }
          };
        });
        console.log('✅ Processed booking data:', processedData);
        setBookedTables(processedData);
      } else {
        console.error('Invalid data format:', data);
        toast.error('Lỗi tải danh sách bàn đặt');
      }
    } catch (error) {
      console.error('Error fetching booked tables:', error);
      toast.error('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  // Confirm booking
  const confirmBooking = async (bookingId: string) => {
    setProcessingBooking(bookingId);
    try {
      const response = await fetch(`${API}/api/bookings/${bookingId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Đã xác nhận đặt bàn');
        // Cập nhật trạng thái local ngay lập tức
        setBookedTables(prev => prev.map(booking => 
          booking._id === bookingId 
            ? { ...booking, status: 'confirmed', confirmedAt: new Date().toISOString() }
            : booking
        ));
        // Cập nhật selectedBooking nếu đang mở
        if (selectedBooking && selectedBooking._id === bookingId) {
          setSelectedBooking(prev => prev ? { ...prev, status: 'confirmed', confirmedAt: new Date().toISOString() } : null);
        }
        fetchBookedTables(); // Refresh từ server
        setSelectedBooking(null);
      } else {
        toast.error(data.message || 'Lỗi xác nhận đặt bàn');
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error('Lỗi kết nối server');
    } finally {
      setProcessingBooking(null);
    }
  };

  // Cancel booking
  const cancelBooking = async (bookingId: string) => {
    setProcessingBooking(bookingId);
    try {
      const response = await fetch(`${API}/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Đã hủy đặt bàn');
        // Cập nhật trạng thái local ngay lập tức
        setBookedTables(prev => prev.map(booking => 
          booking._id === bookingId 
            ? { ...booking, status: 'cancelled' }
            : booking
        ));
        // Cập nhật selectedBooking nếu đang mở
        if (selectedBooking && selectedBooking._id === bookingId) {
          setSelectedBooking(prev => prev ? { ...prev, status: 'cancelled' } : null);
        }
        fetchBookedTables(); // Refresh từ server
        setSelectedBooking(null);
      } else {
        toast.error(data.message || 'Lỗi hủy đặt bàn');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Lỗi kết nối server');
    } finally {
      setProcessingBooking(null);
    }
  };

  useEffect(() => {
    fetchBookedTables();
  }, []);

  const filteredBookings = bookedTables.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '⏳ Chờ xác nhận';
      case 'confirmed': return '✅ Đã xác nhận';
      case 'cancelled': return '❌ Đã hủy';
      default: return '❓ Không xác định';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bàn Đặt</h1>
        <p className="text-gray-600">Quản lý các bàn đã được đặt cọc</p>
      </div>

      {/* Filter buttons */}
      <div className="mb-6 flex space-x-2">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'pending', label: 'Chờ xác nhận' },
          { key: 'confirmed', label: 'Đã xác nhận' },
          { key: 'cancelled', label: 'Đã hủy' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === key
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Booked tables list */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Không có bàn đặt nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bàn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số tiền cọc
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-green-800">
                              {typeof booking.table === 'string' ? booking.table : booking.table?._id || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.tableName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.customerInfo.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.customerInfo.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm text-gray-900">
                            {new Date(booking.bookingDate).toLocaleDateString('vi-VN')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.bookingTime}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {booking.depositAmount.toLocaleString()}đ
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-all duration-300 ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => confirmBooking(booking._id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => cancelBooking(booking._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XCircleIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking detail modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Chi tiết đặt bàn
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Bàn</label>
                  <p className="text-sm text-gray-900">{selectedBooking.tableName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Khách hàng</label>
                  <p className="text-sm text-gray-900">{selectedBooking.customerInfo.name}</p>
                  <p className="text-sm text-gray-500">{selectedBooking.customerInfo.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Thời gian đặt</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedBooking.bookingDate).toLocaleDateString('vi-VN')} - {selectedBooking.bookingTime}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Số tiền cọc</label>
                  <p className="text-sm text-gray-900">{selectedBooking.depositAmount.toLocaleString()}đ</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                    {getStatusText(selectedBooking.status)}
                  </span>
                </div>
                {selectedBooking.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ghi chú</label>
                    <p className="text-sm text-gray-900">{selectedBooking.notes}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Đóng
                </button>
                {selectedBooking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => confirmBooking(selectedBooking._id)}
                      disabled={processingBooking === selectedBooking._id}
                      className={`px-4 py-2 rounded-md flex items-center ${
                        processingBooking === selectedBooking._id
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white`}
                    >
                      {processingBooking === selectedBooking._id ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Đang xử lý...
                        </>
                      ) : (
                        '✅ Xác nhận'
                      )}
                    </button>
                    <button
                      onClick={() => cancelBooking(selectedBooking._id)}
                      disabled={processingBooking === selectedBooking._id}
                      className={`px-4 py-2 rounded-md flex items-center ${
                        processingBooking === selectedBooking._id
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700'
                      } text-white`}
                    >
                      {processingBooking === selectedBooking._id ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Đang xử lý...
                        </>
                      ) : (
                        '❌ Hủy'
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
