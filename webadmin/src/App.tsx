import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Dialog } from '@headlessui/react';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import AuthSimple from './components/AuthSimple';
import PaymentsAdmin from './components/PaymentsAdmin';
import PaymentAdmin from './components/PaymentAdmin';

type TableHistoryEntry = {
  _id: string;
  tableId: string;
  tableName: string;
  action: 'OCCUPIED' | 'FREED' | 'PAID' | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED';
  performedBy: string; // User ID
  performedByName: string; // User Full Name
  customerName?: string;
  bookingId?: string;
  amount?: number;
  createdAt: string;
};

type Menu = {
  _id: string;
  name: string;
  price: number;
  image?: string;
  note?: string;
  available?: boolean;
  size?: string;
};

const API = import.meta.env.VITE_API_URL || 'http://192.168.5.74:5000';

const emptyForm: Omit<Menu, '_id'> = {
  name: '',
  price: 0,
  image: '',
  note: '',
  available: true,
};

type Employee = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
};

export default function App() {
  const [user, setUser] = useState<Employee | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<'menu' | 'tables' | 'employees' | 'customers' | 'bookings' | 'payments' | 'payment' | 'history'>('menu');
  const [items, setItems] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Menu, '_id'>>(emptyForm);
  const [q, setQ] = useState('');
  const [stats, setStats] = useState<{pending: number; confirmed: number; todayConfirmed: number; thisMonthConfirmed: number} | null>(null);

  // Kiểm tra token trong localStorage khi khởi động
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (employee: Employee, authToken: string) => {
    setUser(employee);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(employee));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    return items.filter((x) => `${x.name} ${x.note ?? ''}`.toLowerCase().includes(q.toLowerCase()));
  }, [items, q]);

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get<Menu[]>(`${API}/api/menu`);
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const res = await axios.get<{pending: number; confirmed: number; todayConfirmed: number; thisMonthConfirmed: number}>(`${API}/api/bookings/stats`);
      setStats(res.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  useEffect(() => {
    load();
    loadStats();
  }, []);

  // Auto refresh stats every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Nếu chưa đăng nhập, hiển thị màn hình đăng nhập
  if (!user || !token) {
    return <AuthSimple onLogin={handleLogin} />;
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function startEdit(row: Menu) {
    setEditingId(row._id);
    setForm({
      name: row.name,
      price: row.price,
      image: row.image || '',
      note: row.note || '',
      available: row.available ?? true,
    });
    setOpen(true);
  }

  async function save() {
    try {
      if (editingId) {
        await axios.put(`${API}/api/menu/${editingId}`, form);
        toast.success('Cập nhật món thành công!');
      } else {
        await axios.post(`${API}/api/menu`, form);
        toast.success('Thêm món mới thành công!');
      }
      setOpen(false);
      await load();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
    }
  }

  async function remove(id: string) {
    if (!confirm('Xóa món này?')) return;
    try {
      await axios.delete(`${API}/api/menu/${id}`);
      toast.success('Xóa món thành công!');
      await load();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
    }
  }


  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {/* Sidebar */}
      <div className="fixed left-0 top-0 w-64 h-full bg-gray-900 shadow-xl border-r border-gray-700 z-10">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-white">
            <span className="text-green-500">Water</span>
            <span className="text-gray-300">DG</span>
          </h1>
        </div>
        
        {/* Navigation */}
        <nav className="mt-6 px-3 pb-24">
          <div className="space-y-1">
            <button 
              onClick={() => setTab('menu')} 
              className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                tab === 'menu' 
                  ? 'bg-green-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Quản lý Món
            </button>
            
            <button 
              onClick={() => setTab('tables')} 
              className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                tab === 'tables' 
                  ? 'bg-green-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Quản lý Bàn
            </button>
            
            <button 
              onClick={() => setTab('employees')} 
              className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                tab === 'employees' 
                  ? 'bg-green-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Nhân viên
            </button>
            
            <button 
              onClick={() => setTab('customers')} 
              className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                tab === 'customers' 
                  ? 'bg-green-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Khách hàng
            </button>
            
            <button 
              onClick={() => setTab('bookings')} 
              className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors relative ${
                tab === 'bookings' 
                  ? 'bg-green-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Đặt bàn cho khách
              {stats && stats.pending > 0 && (
                <span className="absolute right-3 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {stats.pending}
                </span>
              )}
            </button>
            
            <button 
              onClick={() => setTab('payments')} 
              className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                tab === 'payments' 
                  ? 'bg-green-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Thanh toán bàn
            </button>
            
            <button 
              onClick={() => setTab('payment')} 
              className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                tab === 'payment' 
                  ? 'bg-green-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              VietQR
            </button>
            
            <button 
              onClick={() => setTab('history')} 
              className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                tab === 'history' 
                  ? 'bg-green-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Lịch sử bàn
            </button>
          </div>
        </nav>
        
        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-700">
          <div className="flex items-center mb-2">
            <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-2 flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user.fullName}</p>
              <p className="text-xs text-gray-400">Quản trị viên</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-2 py-1.5 bg-green-700 text-white rounded-md hover:bg-green-600 text-xs transition-colors font-medium"
          >
            Đăng xuất
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Bar */}
        <div className="bg-gray-900 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white capitalize">
              {tab === 'menu' && 'Quản lý Món ăn'}
              {tab === 'tables' && 'Quản lý Bàn'}
              {tab === 'employees' && 'Quản lý Nhân viên'}
              {tab === 'customers' && 'Quản lý Khách hàng'}
              {tab === 'bookings' && 'Quản lý Đặt bàn'}
              {tab === 'payments' && 'Thanh toán Bàn'}
              {tab === 'payment' && 'VietQR'}
              {tab === 'history' && 'Lịch sử Bàn'}
            </h2>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-64 px-4 py-2 bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <svg className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {tab==='menu' && (
                <button
                  onClick={startCreate}
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-lg"
                >
                  <PlusIcon className="w-5 h-5" /> Thêm món
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-gray-900 p-6 overflow-y-auto">
        {tab==='menu' ? (
          loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
              <p className="text-gray-400 text-lg">Đang tải thực đơn...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filtered.map((m) => (
                <div key={m._id} className="bg-gray-800 rounded-xl border border-gray-600 shadow-lg overflow-hidden hover:shadow-xl hover:border-green-500 transition-all duration-300 group">
                  {/* Image Container - Tỷ lệ dọc cho hình ảnh dài */}
                  <div className="relative h-64 bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden">
                    {m.image ? (
                      <img
                        src={m.image.startsWith('http') ? m.image : `${API}${m.image}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        alt={m.name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Status Badge - Floating on image */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium backdrop-blur-sm ${
                          m.available 
                            ? 'bg-green-500/90 text-white border border-green-400/50' 
                            : 'bg-gray-800/90 text-gray-300 border border-gray-600/50'
                        }`}
                      >
                        {m.available ? 'Đang bán' : 'Tạm ngừng'}
                      </span>
                    </div>

                    {/* Action Buttons - Floating on image */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button 
                        onClick={() => startEdit(m)} 
                        className="p-2 bg-blue-600/90 text-white rounded-lg hover:bg-blue-500 transition-colors backdrop-blur-sm border border-blue-400/50"
                        title="Chỉnh sửa"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => remove(m._id)} 
                        className="p-2 bg-red-600/90 text-white rounded-lg hover:bg-red-500 transition-colors backdrop-blur-sm border border-red-400/50"
                        title="Xóa"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    {/* Name and Size */}
                    <div className="space-y-1">
                      <h3 className="font-semibold text-white text-lg leading-tight">
                        {m.name}
                      </h3>
                      {m.size && (
                        <span className="text-sm text-gray-400 font-medium">
                          {m.size}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {m.note && (
                      <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">
                        {m.note}
                      </p>
                    )}

                    {/* Price */}
                    <div className="pt-2 border-t border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-green-400">
                          {m.price.toLocaleString()}đ
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-400">Giá bán</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!filtered.length && (
                <div className="col-span-full flex flex-col items-center justify-center py-16">
                  <svg className="w-20 h-20 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">Chưa có món ăn nào</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    Hãy thêm món ăn đầu tiên để bắt đầu quản lý thực đơn của bạn
                  </p>
                </div>
              )}
            </div>
          )
        ) : tab==='tables' ? (
          <TablesAdmin />
        ) : tab==='employees' ? (
          <EmployeesAdmin />
        ) : tab==='customers' ? (
          <CustomersAdmin />
        ) : tab==='payments' ? (
          <PaymentsAdmin />
        ) : tab==='payment' ? (
          <PaymentAdmin API={API} />
        ) : tab==='history' ? (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Lịch sử bàn</h2>
            <p className="text-gray-300">Tính năng đang được phát triển...</p>
          </div>
        ) : (
          <BookingsAdmin stats={stats} onStatsChange={setStats} token={token} />
        )}
        </div>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-lg rounded-xl bg-gray-800 p-6 space-y-4">
            <Dialog.Title className="text-lg font-semibold">{editingId ? 'Sửa món' : 'Thêm món'}</Dialog.Title>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm">Tên món</label>
                <input
                  className="mt-1 w-full rounded-md border-gray-300 focus:border-red-500 focus:ring-red-500"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm">Giá (đ)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border-gray-300 focus:border-red-500 focus:ring-red-500"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm">Trạng thái</label>
                <select
                  className="mt-1 w-full rounded-md border-gray-300 focus:border-red-500 focus:ring-red-500"
                  value={form.available ? '1' : '0'}
                  onChange={(e) => setForm((f) => ({ ...f, available: e.target.value === '1' }))}
                >
                  <option value="1">Đang bán</option>
                  <option value="0">Tạm ngừng</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm">Link ảnh</label>
                <input
                  className="mt-1 w-full rounded-md border-gray-300 focus:border-red-500 focus:ring-red-500"
                  placeholder="https://... hoặc /uploads/xxx.jpg"
                  value={form.image}
                  onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm">Ghi chú</label>
                <textarea
                  className="mt-1 w-full rounded-md border-gray-300 focus:border-red-500 focus:ring-red-500"
                  rows={2}
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-md border border-gray-500 text-gray-300 bg-gray-700 hover:bg-gray-600">
                Hủy
              </button>
              <button onClick={save} className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700">
                Lưu
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}











// --- Employees Admin ---
type EmployeeData = { 
  _id: string; 
  username: string; 
  fullName: string; 
  email: string; 
  role: 'admin'|'staff'; 
  isActive: boolean;
  createdAt: string;
};

function EmployeesAdmin() {
  const API = import.meta.env.VITE_API_URL || 'http://192.168.5.74:5000';
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<EmployeeData, '_id' | 'createdAt'>>({
    username: '',
    fullName: '',
    email: '',
    role: 'staff',
    isActive: true
  });
  const [password, setPassword] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get<EmployeeData[]>(`${API}/api/employees`);
      setEmployees(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startCreate() {
    setEditingId(null);
    setForm({
      username: '',
      fullName: '',
      email: '',
      role: 'staff',
      isActive: true
    });
    setPassword('');
    setOpen(true);
  }

  function startEdit(emp: EmployeeData) {
    setEditingId(emp._id);
    setForm({
      username: emp.username,
      fullName: emp.fullName,
      email: emp.email,
      role: emp.role,
      isActive: emp.isActive
    });
    setPassword('');
    setOpen(true);
  }

  async function save() {
    try {
      if (editingId) {
        // Cập nhật nhân viên
        await axios.put(`${API}/api/employees/${editingId}`, form);
      } else {
        // Tạo nhân viên mới
        await axios.post(`${API}/api/employees/register`, {
          ...form,
          password: password
        });
      }
      setOpen(false);
      await load();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  }

  async function remove(id: string) {
    if (!confirm('Xóa nhân viên này?')) return;
    try {
      await axios.delete(`${API}/api/employees/${id}`);
      await load();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={startCreate} className="ml-auto inline-flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700">
          <PlusIcon className="w-5 h-5" /> Thêm nhân viên
        </button>
      </div>

      {loading ? <div>Đang tải...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(emp => (
            <div key={emp._id} className="bg-gray-800 rounded-xl border border-gray-600 shadow-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-white">{emp.fullName}</div>
                  <div className="text-sm text-gray-300">@{emp.username}</div>
                  <div className="text-sm text-gray-400">{emp.email}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${emp.role==='admin'?'bg-purple-600 text-purple-100':'bg-red-600 text-red-100'}`}>
                  {emp.role==='admin'?'Quản lý':'Nhân viên'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => startEdit(emp)} className="px-3 py-1.5 rounded-md border border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">Sửa</button>
                <button onClick={() => remove(emp._id)} className="ml-auto p-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors">
                  <TrashIcon className="w-5 h-5 text-red-400" />
                </button>
              </div>
            </div>
          ))}
          {!employees.length && <div className="text-gray-400">Không có nhân viên nào.</div>}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-md rounded-xl bg-gray-800 p-6 space-y-4">
            <Dialog.Title className="text-lg font-semibold">{editingId ? 'Sửa nhân viên' : 'Thêm nhân viên'}</Dialog.Title>
            <div className="space-y-3">
              <div>
                <label className="text-sm">Tên đăng nhập</label>
                <input className="mt-1 w-full rounded-md border-gray-300 focus:border-red-500 focus:ring-red-500" value={form.username} onChange={e=>setForm(f=>({ ...f, username: e.target.value }))} placeholder="Nhập tên đăng nhập" />
              </div>
              <div>
                <label className="text-sm">Họ và tên</label>
                <input className="mt-1 w-full rounded-md border-gray-300 focus:border-red-500 focus:ring-red-500" value={form.fullName} onChange={e=>setForm(f=>({ ...f, fullName: e.target.value }))} placeholder="Nhập họ và tên" />
              </div>
              <div>
                <label className="text-sm">Email</label>
                <input type="email" className="mt-1 w-full rounded-md border-gray-300 focus:border-red-500 focus:ring-red-500" value={form.email} onChange={e=>setForm(f=>({ ...f, email: e.target.value }))} placeholder="Nhập email" />
              </div>
              <div>
                <label className="text-sm">Vai trò</label>
                <select className="mt-1 w-full rounded-md border-gray-300 focus:border-red-500 focus:ring-red-500" value={form.role} onChange={e=>setForm(f=>({ ...f, role: e.target.value as 'admin'|'staff' }))}>
                  <option value="staff">Nhân viên</option>
                  <option value="admin">Quản lý</option>
                </select>
              </div>
              {!editingId && (
                <div>
                  <label className="text-sm">Mật khẩu</label>
                  <input type="password" className="mt-1 w-full rounded-md border-gray-300 focus:border-red-500 focus:ring-red-500" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Nhập mật khẩu" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-md border border-gray-500 text-gray-300 bg-gray-700 hover:bg-gray-600">Hủy</button>
              <button onClick={save} className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700">Lưu</button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}











// --- Customers Admin ---
type CustomerData = { 
  _id: string; 
  username: string; 
  fullName: string; 
  email: string; 
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: string;
};

type CustomerStats = {
  totalCustomers: number;
  newToday: number;
  newThisMonth: number;
};

function CustomersAdmin() {
  const API = import.meta.env.VITE_API_URL || 'http://192.168.5.74:5000';
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  async function loadCustomers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: search
      });
      
      const res = await axios.get<{
        customers: CustomerData[];
        pagination: { current: number; pages: number; total: number };
      }>(`${API}/api/customers?${params}`);
      
      setCustomers(res.data.customers);
      setTotalPages(res.data.pagination.pages);
      setTotal(res.data.pagination.total);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const res = await axios.get<CustomerStats>(`${API}/api/customers/stats`);
      setStats(res.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  useEffect(() => { 
    loadCustomers();
    loadStats();
  }, [currentPage, search]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  return (
    <div>
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Tổng khách hàng</p>
                <p className="text-2xl font-bold text-white">{stats.totalCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Hôm nay</p>
                <p className="text-2xl font-bold text-white">{stats.newToday}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Tháng này</p>
                <p className="text-2xl font-bold text-white">{stats.newThisMonth}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-2 mb-4">
        <input
          placeholder="Tìm kiếm khách hàng..."
          className="flex-1 rounded-md border-gray-300 focus:border-red-500 focus:ring-red-500"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <div className="text-sm text-gray-400">
          Tổng: {total} khách hàng
        </div>
      </div>

      {/* Customers List */}
      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-600 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Thông tin liên hệ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ngày đăng ký</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-600">
                {customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{customer.fullName}</div>
                        <div className="text-sm text-gray-400">@{customer.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{customer.email}</div>
                      {customer.phone && (
                        <div className="text-sm text-gray-400">{customer.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(customer.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-600 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-500 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-500 bg-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-500 bg-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                    >
                      Sau
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

          {customers.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              Không có khách hàng nào.
            </div>
          )}
        </div>
      )}
    </div>
  );
}











// --- Bookings Admin ---
type BookingData = {
  _id: string;
  customer?: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  } | null;
  customerInfo?: {
    fullName: string;
    email: string;
    phone: string;
  };
  table: {
    _id: string;
    name: string;
  };
  numberOfGuests: number;
  bookingDate: string;
  bookingTime: string;
  menuItems: Array<{
    item: {
      _id: string;
      name: string;
      price: number;
    };
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  confirmedBy?: {
    _id: string;
    fullName: string;
  };
  confirmedAt?: string;
  createdAt: string;
};

type BookingStats = {
  pending: number;
  confirmed: number;
  todayConfirmed: number;
  thisMonthConfirmed: number;
};

function BookingsAdmin({ stats, onStatsChange, token }: { stats: {pending: number; confirmed: number; todayConfirmed: number; thisMonthConfirmed: number} | null; onStatsChange: (stats: {pending: number; confirmed: number; todayConfirmed: number; thisMonthConfirmed: number}) => void; token: string | null }) {
  const API = import.meta.env.VITE_API_URL || 'http://192.168.5.74:5000';
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastBookingCount, setLastBookingCount] = useState(0);
  const [showNewBookingAlert, setShowNewBookingAlert] = useState(false);
  const [showNewBookingForm, setShowNewBookingForm] = useState(false);
  const [newBookingForm, setNewBookingForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    tableId: '',
    numberOfGuests: 1,
    bookingDate: new Date().toISOString().split('T')[0],
    bookingTime: new Date().toTimeString().slice(0, 5),
    specialRequests: ''
  });
  const [tables, setTables] = useState<{_id: string; name: string; status: string}[]>([]);

  async function loadBookings() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: currentPage.toString(),
        limit: '10'
      });
      
      const res = await axios.get<{
        bookings: BookingData[];
        pagination: { current: number; pages: number; total: number };
      }>(`${API}/api/bookings/admin?${params}`);
      
      // Check for new bookings
      const newBookingCount = res.data.bookings.length;
      if (lastBookingCount > 0 && newBookingCount > lastBookingCount) {
        setShowNewBookingAlert(true);
        setTimeout(() => setShowNewBookingAlert(false), 5000); // Hide after 5 seconds
      }
      setLastBookingCount(newBookingCount);
      
      setBookings(res.data.bookings);
      setTotalPages(res.data.pagination.pages);
      setTotal(res.data.pagination.total);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const res = await axios.get<BookingStats>(`${API}/api/bookings/stats`);
      onStatsChange(res.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async function loadTables() {
    try {
      const res = await axios.get(`${API}/api/tables`);
      setTables(res.data);
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  }

  async function createNewBooking() {
    if (!newBookingForm.customerName.trim()) {
      toast.error('Vui lòng nhập tên khách hàng');
      return;
    }
    if (!newBookingForm.tableId) {
      toast.error('Vui lòng chọn bàn');
      return;
    }

    try {
      const res = await axios.post(`${API}/api/bookings/admin-quick-booking`, newBookingForm);
      toast.success('Tạo booking thành công!');
      setShowNewBookingForm(false);
      setNewBookingForm({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        tableId: '',
        numberOfGuests: 1,
        bookingDate: new Date().toISOString().split('T')[0],
        bookingTime: new Date().toTimeString().slice(0, 5),
        specialRequests: ''
      });
      loadBookings();
      loadStats();
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo booking');
    }
  }

  useEffect(() => { 
    loadBookings();
    loadStats();
  }, [statusFilter, currentPage]);

  useEffect(() => {
    if (showNewBookingForm) {
      loadTables();
    }
  }, [showNewBookingForm]);

  // Auto refresh bookings every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadBookings();
      loadStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [statusFilter, currentPage]);

  const handleConfirm = async (bookingId: string) => {
    if (!token) {
      toast.error('Vui lòng đăng nhập lại');
      return;
    }

    console.log('Confirming booking:', bookingId);
    console.log('Token:', token);
    console.log('API URL:', API);

    try {
      const res = await axios.post(`${API}/api/bookings/${bookingId}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Confirm response:', res.data);
      
      if (res.data.message) {
        toast.success('Xác nhận booking thành công!');
        loadBookings();
        loadStats();
      }
    } catch (error: any) {
      console.error('Confirm error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!token) {
      toast.error('Vui lòng đăng nhập lại');
      return;
    }

    const reason = prompt('Lý do hủy booking:');
    if (reason === null) return;

    console.log('Cancelling booking:', bookingId);
    console.log('Token:', token);
    console.log('API URL:', API);

    try {
      const res = await axios.post(`${API}/api/bookings/${bookingId}/cancel`, 
        { reason }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Cancel response:', res.data);
      
      if (res.data.message) {
        toast.success('Hủy booking thành công!');
        loadBookings();
        loadStats();
      }
    } catch (error: any) {
      console.error('Cancel error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'cancelled': return 'Đã hủy';
      case 'completed': return 'Hoàn thành';
      default: return status;
    }
  };

  return (
    <div>
      {/* New Booking Alert */}
      {showNewBookingAlert && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Có booking mới! Vui lòng kiểm tra.</span>
          <button 
            onClick={() => setShowNewBookingAlert(false)}
            className="ml-2 text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Chờ xác nhận</p>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Đã xác nhận</p>
                <p className="text-2xl font-bold text-white">{stats.confirmed}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Hôm nay</p>
                <p className="text-2xl font-bold text-white">{stats.todayConfirmed}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Tháng này</p>
                <p className="text-2xl font-bold text-white">{stats.thisMonthConfirmed}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-md border-gray-300 focus:border-red-500 focus:ring-red-500"
        >
          <option value="pending">Chờ xác nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="cancelled">Đã hủy</option>
          <option value="completed">Hoàn thành</option>
          <option value="all">Tất cả</option>
        </select>
        <button
          onClick={() => {
            loadBookings();
            loadStats();
          }}
          className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
        >
          🔄 Làm mới
        </button>
        <button
          onClick={() => setShowNewBookingForm(true)}
          className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
        >
          ➕ Tạo booking mới
        </button>
        <div className="text-sm text-gray-400">
          Tổng: {total} booking
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="bg-gray-800 rounded-xl border border-gray-600 shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {booking.customer?.fullName || booking.customerInfo?.fullName || 'Khách hàng'}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300">
                    <div>
                      <span className="font-medium">Bàn:</span> {booking.table?.name || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Số người:</span> {booking.numberOfGuests}
                    </div>
                    <div>
                      <span className="font-medium">Ngày:</span> {new Date(booking.bookingDate).toLocaleDateString('vi-VN')}
                    </div>
                    <div>
                      <span className="font-medium">Giờ:</span> {booking.bookingTime}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-red-600">
                    {booking.totalAmount.toLocaleString()}đ
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(booking.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="mb-4">
                <h4 className="font-medium text-white mb-2">Món đã đặt:</h4>
                <div className="space-y-1">
                  {booking.menuItems.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.item?.name || 'N/A'} x{item.quantity}</span>
                      <span className="font-medium">{(item.price * item.quantity).toLocaleString()}đ</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              <div className="mb-4 text-sm text-gray-300">
                <div><span className="font-medium">Email:</span> {booking.customer?.email || booking.customerInfo?.email || 'N/A'}</div>
                {(booking.customer?.phone || booking.customerInfo?.phone) && (
                  <div><span className="font-medium">Phone:</span> {booking.customer?.phone || booking.customerInfo?.phone}</div>
                )}
              </div>

              {/* Actions */}
              {booking.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirm(booking._id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                  >
                    Xác nhận
                  </button>
                  <button
                    onClick={() => handleCancel(booking._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                  >
                    Hủy
                  </button>
                </div>
              )}

              {booking.confirmedBy && (
                <div className="text-sm text-gray-400 mt-2">
                  Xác nhận bởi: {booking.confirmedBy.fullName} - {new Date(booking.confirmedAt!).toLocaleString('vi-VN')}
                </div>
              )}
            </div>
          ))}

          {bookings.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              Không có booking nào.
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-500 rounded-md text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
            >
              Trước
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-500 rounded-md text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* New Booking Form Modal */}
      {showNewBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Tạo booking mới</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên khách hàng *
                  </label>
                  <input
                    type="text"
                    value={newBookingForm.customerName}
                    onChange={(e) => setNewBookingForm(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên khách hàng"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={newBookingForm.customerPhone}
                    onChange={(e) => setNewBookingForm(prev => ({ ...prev, customerPhone: e.target.value }))}
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
                    value={newBookingForm.customerEmail}
                    onChange={(e) => setNewBookingForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chọn bàn *
                  </label>
                  <select
                    value={newBookingForm.tableId}
                    onChange={(e) => setNewBookingForm(prev => ({ ...prev, tableId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Chọn bàn</option>
                    {tables.filter(table => table.status === 'empty').map((table) => (
                      <option key={table._id} value={table._id}>
                        Bàn {table.name}
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
                    value={newBookingForm.numberOfGuests}
                    onChange={(e) => setNewBookingForm(prev => ({ ...prev, numberOfGuests: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày đặt bàn *
                  </label>
                  <input
                    type="date"
                    value={newBookingForm.bookingDate}
                    onChange={(e) => setNewBookingForm(prev => ({ ...prev, bookingDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giờ đặt bàn *
                  </label>
                  <input
                    type="time"
                    value={newBookingForm.bookingTime}
                    onChange={(e) => setNewBookingForm(prev => ({ ...prev, bookingTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yêu cầu đặc biệt
                </label>
                <textarea
                  value={newBookingForm.specialRequests}
                  onChange={(e) => setNewBookingForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Nhập yêu cầu đặc biệt (nếu có)"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowNewBookingForm(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={createNewBooking}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Tạo booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}











// --- Tables Admin ---
type Table = { _id: string; name: string; status: 'empty'|'occupied'; note?: string };

function TablesAdmin() {
  const API = import.meta.env.VITE_API_URL || 'http://192.168.5.74:5000';
  const [items, setItems] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all'|'empty'|'occupied'>('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Pick<Table,'name'|'note'>>({ name: '', note: '' });
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailFor, setDetailFor] = useState<Table | null>(null);
  const [detailOrder, setDetailOrder] = useState<{ items: { name: string; price: number; quantity: number }[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const qs = filter==='all' ? '' : `?status=${filter}`;
      const res = await axios.get<Table[]>(`${API}/api/tables${qs}`);
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);

  async function create() {
    await axios.post(`${API}/api/tables`, form);
    setOpen(false);
    setForm({ name: '', note: '' });
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Xóa bàn này?')) return;
    await axios.delete(`${API}/api/tables/${id}`);
    await load();
  }

  async function toggle(id: string, status: 'empty'|'occupied') {
    if (status === 'empty') {
      // Nhận bàn
      await axios.post(`${API}/api/tables/${id}/occupy`);
      toast.success('Đã nhận bàn thành công!');
    } else {
      // Trả bàn - cần xác nhận
      if (!confirm('Bạn có chắc chắn muốn trả bàn này? Tất cả dữ liệu món ăn/nước sẽ bị xóa!')) return;
      
      try {
        const response = await axios.post(`${API}/api/tables/${id}/free`);
        const deletedCount = response.data.deletedOrdersCount || 0;
        toast.success(`Đã trả bàn thành công! Xóa ${deletedCount} món ăn/nước.`);
      } catch (error) {
        console.error('Error freeing table:', error);
        toast.error('Có lỗi xảy ra khi trả bàn!');
        return;
      }
    }
    await load();
  }

  async function resetAllTables() {
    const occupiedCount = items.filter(t => t.status === 'occupied').length;
    
    if (occupiedCount === 0) {
      toast.info('Không có bàn nào đang được sử dụng để reset!');
      return;
    }
    
    if (!confirm(`Bạn có chắc chắn muốn trả ${occupiedCount} bàn? Tất cả dữ liệu món ăn/nước sẽ bị xóa!`)) return;
    
    try {
      setLoading(true);
      
      // Gọi API reset tất cả bàn
      const response = await axios.post(`${API}/api/tables/reset-all`);
      
      if (response.data.success) {
        if (response.data.resetCount > 0) {
          toast.success(`Đã trả ${response.data.resetCount} bàn thành công! Xóa ${response.data.deletedOrdersCount} món ăn/nước.`);
        } else {
          toast.info(response.data.message);
        }
        await load();
      } else {
        toast.error(response.data.message || 'Có lỗi xảy ra khi trả bàn!');
      }
    } catch (error: any) {
      console.error('Error resetting tables:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Có lỗi xảy ra khi trả bàn!';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function openDetails(t: Table) {
    setDetailFor(t);
    setDetailOrder(null);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await axios.get(`${API}/api/orders/by-table/${t._id}`);
      setDetailOrder(res.data || { items: [] });
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="inline-flex rounded-md border border-gray-600 overflow-hidden">
          {(['all','empty','occupied'] as const).map(k => (
            <button key={k} onClick={()=>setFilter(k as 'all'|'empty'|'occupied')} className={`px-3 py-1.5 rounded-md transition-colors ${filter===k?'bg-red-600 text-white':'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{k==='all'?'Tất cả':k==='empty'?'Bàn trống':'Đang dùng'}</button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button 
            onClick={resetAllTables} 
            disabled={loading || items.filter(t => t.status === 'occupied').length === 0}
            className="inline-flex items-center gap-2 bg-orange-600 text-white px-3 py-2 rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            🔄 Trả tất cả bàn
          </button>
          <button onClick={()=>setOpen(true)} className="inline-flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700">
            <PlusIcon className="w-5 h-5" /> Tạo bàn
          </button>
        </div>
      </div>

      {loading ? <div>Đang tải...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(t => (
            <div key={t._id} className="bg-gray-800 rounded-xl border border-gray-600 shadow-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-white">{t.name} <span className="text-gray-400">#{t._id}</span></div>
                  {t.note && <div className="text-sm text-gray-300">{t.note}</div>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${t.status==='empty'?'bg-green-600 text-green-100':'bg-amber-600 text-amber-100'}`}>
                  {t.status==='empty'?'Bàn trống':'Đang dùng'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={()=>openDetails(t)} className="px-3 py-1.5 rounded-md border border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">Thông tin bàn</button>
                {t.status !== 'empty' && (
                  <button onClick={()=>toggle(t._id, t.status)} className="px-3 py-1.5 rounded-md border border-red-500 text-red-300 hover:bg-red-600 hover:text-white transition-colors">
                    Trả bàn
                  </button>
                )}
                <button onClick={()=>remove(t._id)} className="ml-auto p-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors">
                  <TrashIcon className="w-5 h-5 text-red-400" />
                </button>
              </div>
            </div>
          ))}
          {!items.length && <div className="text-gray-400">Không có bàn.</div>}
        </div>
      )}

      <Dialog open={open} onClose={()=>setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-md rounded-xl bg-gray-800 p-6 space-y-4">
            <Dialog.Title className="text-lg font-semibold">Tạo bàn</Dialog.Title>
            <div className="space-y-3">
              <div>
                <label className="text-sm">Tên bàn</label>
                <input className="mt-1 w-full rounded-md border-gray-300 focus:border-red-500 focus:ring-red-500" value={form.name} onChange={e=>setForm(f=>({ ...f, name: e.target.value }))} placeholder="Ví dụ: Bàn 1" />
              </div>
              <div>
                <label className="text-sm">Ghi chú</label>
                <input className="mt-1 w-full rounded-md border-gray-300 focus:border-red-500 focus:ring-red-500" value={form.note ?? ''} onChange={e=>setForm(f=>({ ...f, note: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={()=>setOpen(false)} className="px-4 py-2 rounded-md border border-gray-500 text-gray-300 bg-gray-700 hover:bg-gray-600">Hủy</button>
              <button onClick={create} className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700">Tạo</button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onClose={()=>setDetailOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-lg rounded-xl bg-gray-800 p-6 space-y-4">
            <Dialog.Title className="text-lg font-semibold">Thông tin bàn {detailFor ? detailFor.name : ''} {detailFor ? `#${detailFor._id}` : ''}</Dialog.Title>
            {detailLoading ? (
              <div>Đang tải...</div>
            ) : (
              <div className="space-y-3">
                {(detailOrder?.items?.length ?? 0) === 0 ? (
                  <div className="text-gray-400">Chưa có món nào được order.</div>
                ) : (
                  <div className="divide-y">
                    {detailOrder!.items.map((it, idx) => (
                      <div key={idx} className="py-2 flex items-center">
                        <div className="flex-1">{it.name}</div>
                        <div className="w-16 text-right">x{it.quantity}</div>
                        <div className="w-28 text-right">{(it.price * it.quantity).toLocaleString()}đ</div>
                      </div>
                    ))}
                    <div className="pt-3 flex items-center font-semibold">
                      <div className="flex-1">Tổng</div>
                      <div className="w-16" />
                      <div className="w-28 text-right">{detailOrder!.items.reduce((s, x)=> s + x.price*x.quantity, 0).toLocaleString()}đ</div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={()=>setDetailOpen(false)} className="px-4 py-2 rounded-md border">Đóng</button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

    </div>
  );
}






  





