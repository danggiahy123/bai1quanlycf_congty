import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import toast from 'react-hot-toast';

interface Table {
  _id: string;
  name: string;
  status: 'empty' | 'occupied';
  capacity?: number;
}

interface Customer {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
}

interface QuickBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: () => void;
  API: string;
}

const QuickBookingModal: React.FC<QuickBookingModalProps> = ({ 
  isOpen, 
  onClose, 
  onBookingSuccess, 
  API 
}) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    tableId: '',
    numberOfGuests: 1,
    bookingDate: new Date().toISOString().split('T')[0],
    bookingTime: new Date().toTimeString().slice(0, 5),
    specialRequests: ''
  });

  // Lấy danh sách bàn trống
  const fetchTables = async () => {
    try {
      const response = await fetch(`${API}/api/tables`);
      const data = await response.json();
      const emptyTables = data.filter((table: Table) => table.status === 'empty');
      setTables(emptyTables);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Không thể tải danh sách bàn');
    }
  };

  // Lấy danh sách khách hàng
  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API}/api/customers`);
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Không thể tải danh sách khách hàng');
    }
  };

  // Tạo đặt bàn nhanh
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tableId) {
      toast.error('Vui lòng chọn bàn');
      return;
    }

    if (!formData.customerName.trim()) {
      toast.error('Vui lòng nhập tên khách hàng');
      return;
    }

    try {
      setSubmitting(true);
      
      // Tạo booking
      const bookingData = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        tableId: formData.tableId,
        numberOfGuests: formData.numberOfGuests,
        bookingDate: formData.bookingDate,
        bookingTime: formData.bookingTime,
        specialRequests: formData.specialRequests,
        status: 'confirmed' // Đặt bàn nhanh tự động confirm
      };

      const response = await fetch(`${API}/api/bookings/admin-quick-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Đặt bàn thành công!');
        onBookingSuccess();
        onClose();
        resetForm();
      } else {
        toast.error(data.message || 'Có lỗi xảy ra khi đặt bàn');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Có lỗi xảy ra khi đặt bàn');
    } finally {
      setSubmitting(false);
    }
  };

  // Gửi thông báo cho khách hàng
  const sendNotificationToCustomer = async (booking: any) => {
    try {
      const notificationData = {
        title: '🎉 Đặt bàn thành công!',
        message: `Bàn ${booking.tableId} đã được đặt cho ${booking.numberOfGuests} khách vào ${booking.bookingDate} lúc ${booking.bookingTime}`,
        type: 'booking_confirmed',
        bookingId: booking._id,
        customerPhone: formData.customerPhone
      };

      await fetch(`${API}/api/notifications/send-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData)
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      customerId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      tableId: '',
      numberOfGuests: 1,
      bookingDate: new Date().toISOString().split('T')[0],
      bookingTime: new Date().toTimeString().slice(0, 5),
      specialRequests: ''
    });
  };

  // Load data khi modal mở
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([fetchTables(), fetchCustomers()]).finally(() => {
        setLoading(false);
      });
    }
  }, [isOpen]);

  // Auto-fill customer info khi chọn khách hàng
  useEffect(() => {
    if (formData.customerId) {
      const customer = customers.find(c => c._id === formData.customerId);
      if (customer) {
        setFormData(prev => ({
          ...prev,
          customerName: customer.fullName,
          customerPhone: customer.phone || '',
          customerEmail: customer.email
        }));
      }
    }
  }, [formData.customerId, customers]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <Dialog.Title className="text-2xl font-bold text-gray-900 mb-4">
              🚀 Đặt bàn nhanh
            </Dialog.Title>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Thông tin khách hàng */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Thông tin khách hàng</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Khách hàng có sẵn (tùy chọn)
                    </label>
                    <select
                      value={formData.customerId}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Chọn khách hàng</option>
                      {customers.map((customer) => (
                        <option key={customer._id} value={customer._id}>
                          {customer.fullName} - {customer.phone || customer.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên khách hàng *
                    </label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập tên khách hàng"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập email"
                    />
                  </div>
                </div>
              </div>

              {/* Thông tin đặt bàn */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Thông tin đặt bàn</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chọn bàn *
                    </label>
                    <select
                      value={formData.tableId}
                      onChange={(e) => setFormData(prev => ({ ...prev, tableId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Chọn bàn</option>
                      {tables.map((table) => (
                        <option key={table._id} value={table._id}>
                          Bàn {table.name} {table.capacity ? `(${table.capacity} chỗ)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số khách *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.numberOfGuests}
                      onChange={(e) => setFormData(prev => ({ ...prev, numberOfGuests: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày đặt bàn *
                    </label>
                    <input
                      type="date"
                      value={formData.bookingDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, bookingDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giờ đặt bàn *
                    </label>
                    <input
                      type="time"
                      value={formData.bookingTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, bookingTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yêu cầu đặc biệt
                  </label>
                  <textarea
                    value={formData.specialRequests}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Nhập yêu cầu đặc biệt (nếu có)"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || loading}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '⏳ Đang xử lý...' : '🚀 Đặt bàn ngay'}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default QuickBookingModal;
