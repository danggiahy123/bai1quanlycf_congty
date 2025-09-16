import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

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
};

export default function PaymentsAdmin() {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [tables, setTables] = useState<PaymentTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'occupied' | 'empty'>('occupied');

  async function loadTables() {
    setLoading(true);
    try {
      const res = await axios.get<PaymentTable[]>(`${API}/api/tables`);
      const tablesWithOrders = await Promise.all(
        res.data.map(async (table) => {
          if (table.status === 'occupied') {
            try {
              const orderRes = await axios.get(`${API}/api/orders/by-table/${table._id}`);
              return { ...table, order: orderRes.data };
            } catch (error) {
              return { ...table, order: null };
            }
          }
          return { ...table, order: null };
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

              {table.status === 'occupied' && table.order && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Đơn hàng:</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {table.order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name} x{item.quantity}</span>
                        <span className="font-medium">{(item.price * item.quantity).toLocaleString()}đ</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                    <span className="font-semibold">Tổng cộng:</span>
                    <span className="font-bold text-lg text-red-600">
                      {table.order.totalAmount.toLocaleString()}đ
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {table.status === 'occupied' ? (
                  <button
                    onClick={() => processPayment(table._id)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                  >
                    💳 Thanh toán
                  </button>
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
    </div>
  );
}
