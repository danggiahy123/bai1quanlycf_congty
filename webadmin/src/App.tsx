import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Dialog } from '@headlessui/react';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import AuthSimple from './components/AuthSimple';
import PaymentsAdmin from './components/PaymentsAdmin';
import PaymentAdmin from './components/PaymentAdmin';
import QuickBookingModal from './components/QuickBookingModal';

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
  const [quickBookingModal, setQuickBookingModal] = useState(false);
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
    <div className="min-h-screen bg-gray-50">
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
      <header className="px-6 py-4 bg-white border-b">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <h1 className="text-xl font-semibold">Admin</h1>
          <nav className="ml-6 flex gap-2">
            <button onClick={() => setTab('menu')} className={`px-3 py-1.5 rounded-md border ${tab==='menu'?'bg-red-600 text-white border-red-600':'border-gray-300'}`}>Món</button>
            <button onClick={() => setTab('tables')} className={`px-3 py-1.5 rounded-md border ${tab==='tables'?'bg-red-600 text-white border-red-600':'border-gray-300'}`}>Bàn</button>
            <button onClick={() => setTab('employees')} className={`px-3 py-1.5 rounded-md border ${tab==='employees'?'bg-red-600 text-white border-red-600':'border-gray-300'}`}>Nhân viên</button>
            <button onClick={() => setTab('customers')} className={`px-3 py-1.5 rounded-md border ${tab==='customers'?'bg-red-600 text-white border-red-600':'border-gray-300'}`}>Khách hàng</button>
            <button 
              onClick={() => setQuickBookingModal(true)} 
              className="px-3 py-1.5 rounded-md border border-green-600 bg-green-600 text-white hover:bg-green-700"
            >
              🚀 Đặt bàn nhanh
            </button>
            <button onClick={() => setTab('bookings')} className={`px-3 py-1.5 rounded-md border ${tab==='bookings'?'bg-red-600 text-white border-red-600':'border-gray-300'} relative`}>
              Đặt bàn cho khách
              {stats && stats.pending > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {stats.pending}
                </span>
              )}
            </button>
            <button onClick={() => setTab('payments')} className={`px-3 py-1.5 rounded-md border ${tab==='payments'?'bg-red-600 text-white border-red-600':'border-gray-300'}`}>
              Thanh toán bàn
            </button>
            <button onClick={() => setTab('payment')} className={`px-3 py-1.5 rounded-md border ${tab==='payment'?'bg-green-600 text-white border-green-600':'border-gray-300'}`}>
              💳 VietQR
            </button>
            <button onClick={() => setTab('history')} className={`px-3 py-1.5 rounded-md border ${tab==='history'?'bg-red-600 text-white border-red-600':'border-gray-300'}`}>
              Lịch sử bàn
            </button>
          </nav>
          <input
            placeholder="Tìm theo tên/ghi chú..."
            className="ml-auto w-72 rounded-md border-gray-300 focus:border-red-500 focus:ring-red-500"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {tab==='menu' && (
            <button
              onClick={startCreate}
              className="inline-flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700"
            >
              <PlusIcon className="w-5 h-5" /> Thêm món
            </button>
          )}
          <div className="flex items-center gap-3 ml-4">
            <span className="text-sm text-gray-600">
              Xin chào, <span className="font-medium">{user.fullName}</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        {tab==='menu' ? (
          loading ? (
            <div>Đang tải...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((m) => (
                <div key={m._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="h-40 bg-gray-100">
                    {m.image ? (
                      <img
                        src={m.image.startsWith('http') ? m.image : `${API}${m.image}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                    )}
                  </div>
                  <div className="p-4 space-y-1">
                    <div className="flex items-start justify-between">
                      <div className="font-semibold text-black">
                        {m.name}
                        {m.size ? ` • ${m.size}` : ''}
                      </div>
                      <div className="text-red-600 font-semibold">{m.price.toLocaleString()}đ</div>
                    </div>
                    {m.note && <div className="text-sm text-gray-600">{m.note}</div>}
                    <div className="flex items-center justify-between pt-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${m.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {m.available ? 'Đang bán' : 'Tạm ngừng'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(m)} className="p-2 rounded hover:bg-gray-100">
                          <PencilSquareIcon className="w-5 h-5 text-gray-700" />
                        </button>
                        <button onClick={() => remove(m._id)} className="p-2 rounded hover:bg-gray-100">
                          <TrashIcon className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!filtered.length && <div className="text-gray-500">Không có món nào.</div>}
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
            <p className="text-gray-600">Tính năng đang được phát triển...</p>
          </div>
        ) : (
          <BookingsAdmin stats={stats} onStatsChange={setStats} token={token} />
        )}
      </main>

      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-lg rounded-xl bg-white p-6 space-y-4">
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
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-md border">
                Hủy
              </button>
              <button onClick={save} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">
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
            <div key={emp._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{emp.fullName}</div>
                  <div className="text-sm text-gray-600">@{emp.username}</div>
                  <div className="text-sm text-gray-500">{emp.email}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${emp.role==='admin'?'bg-purple-100 text-purple-700':'bg-red-100 text-red-700'}`}>
                  {emp.role==='admin'?'Quản lý':'Nhân viên'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => startEdit(emp)} className="px-3 py-1.5 rounded-md border">Sửa</button>
                <button onClick={() => remove(emp._id)} className="ml-auto p-2 rounded hover:bg-gray-100">
                  <TrashIcon className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>
          ))}
          {!employees.length && <div className="text-gray-500">Không có nhân viên nào.</div>}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-md rounded-xl bg-white p-6 space-y-4">
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
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-md border">Hủy</button>
              <button onClick={save} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">Lưu</button>
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
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng khách hàng</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hôm nay</p>
                <p className="text-2xl font-bold text-gray-900">{stats.newToday}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tháng này</p>
                <p className="text-2xl font-bold text-gray-900">{stats.newThisMonth}</p>
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
        <div className="text-sm text-gray-500">
          Tổng: {total} khách hàng
        </div>
      </div>

      {/* Customers List */}
      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thông tin liên hệ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đăng ký</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.fullName}</div>
                        <div className="text-sm text-gray-500">@{customer.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.email}</div>
                      {customer.phone && (
                        <div className="text-sm text-gray-500">{customer.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
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
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Sau
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

          {customers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
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

  useEffect(() => { 
    loadBookings();
    loadStats();
  }, [statusFilter, currentPage]);

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
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Chờ xác nhận</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
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
                <p className="text-sm font-medium text-gray-600">Đã xác nhận</p>
                <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hôm nay</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayConfirmed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tháng này</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisMonthConfirmed}</p>
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
        <div className="text-sm text-gray-500">
          Tổng: {total} booking
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {booking.customer?.fullName || booking.customerInfo?.fullName || 'Khách hàng'}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
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
                  <div className="text-sm text-gray-500">
                    {new Date(booking.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Món đã đặt:</h4>
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
              <div className="mb-4 text-sm text-gray-600">
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
                <div className="text-sm text-gray-500 mt-2">
                  Xác nhận bởi: {booking.confirmedBy.fullName} - {new Date(booking.confirmedAt!).toLocaleString('vi-VN')}
                </div>
              )}
            </div>
          ))}

          {bookings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
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
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Trước
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Sau
            </button>
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
    if (!confirm('Bạn có chắc chắn muốn trả tất cả bàn? Tất cả dữ liệu món ăn/nước sẽ bị xóa!')) return;
    
    try {
      setLoading(true);
      
      // Gọi API reset tất cả bàn
      const response = await axios.post(`${API}/api/tables/reset-all`);
      
      toast.success(`Đã trả ${response.data.resetCount} bàn thành công! Xóa ${response.data.deletedOrdersCount} món ăn/nước.`);
      await load();
    } catch (error) {
      console.error('Error resetting tables:', error);
      toast.error('Có lỗi xảy ra khi trả bàn!');
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
        <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
          {(['all','empty','occupied'] as const).map(k => (
            <button key={k} onClick={()=>setFilter(k as 'all'|'empty'|'occupied')} className={`px-3 py-1.5 ${filter===k?'bg-red-600 text-white':'bg-white'}`}>{k==='all'?'Tất cả':k==='empty'?'Bàn trống':'Đang dùng'}</button>
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
            <div key={t._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{t.name} <span className="text-gray-400">#{t._id}</span></div>
                  {t.note && <div className="text-sm text-gray-600">{t.note}</div>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${t.status==='empty'?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}`}>
                  {t.status==='empty'?'Bàn trống':'Đang dùng'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={()=>openDetails(t)} className="px-3 py-1.5 rounded-md border">Thông tin bàn</button>
                {t.status !== 'empty' && (
                  <button onClick={()=>toggle(t._id, t.status)} className="px-3 py-1.5 rounded-md border">
                    Trả bàn
                  </button>
                )}
                <button onClick={()=>remove(t._id)} className="ml-auto p-2 rounded hover:bg-gray-100">
                  <TrashIcon className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>
          ))}
          {!items.length && <div className="text-gray-500">Không có bàn.</div>}
        </div>
      )}

      <Dialog open={open} onClose={()=>setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-md rounded-xl bg-white p-6 space-y-4">
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
              <button onClick={()=>setOpen(false)} className="px-4 py-2 rounded-md border">Hủy</button>
              <button onClick={create} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">Tạo</button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onClose={()=>setDetailOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-lg rounded-xl bg-white p-6 space-y-4">
            <Dialog.Title className="text-lg font-semibold">Thông tin bàn {detailFor ? detailFor.name : ''} {detailFor ? `#${detailFor._id}` : ''}</Dialog.Title>
            {detailLoading ? (
              <div>Đang tải...</div>
            ) : (
              <div className="space-y-3">
                {(detailOrder?.items?.length ?? 0) === 0 ? (
                  <div className="text-gray-500">Chưa có món nào được order.</div>
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

      {/* Quick Booking Modal */}
      <QuickBookingModal
        isOpen={quickBookingModal}
        onClose={() => setQuickBookingModal(false)}
        onBookingSuccess={() => {
          // Refresh bookings data
          if (tab === 'bookings') {
            // Trigger refresh for bookings tab
            window.location.reload();
          }
        }}
        API={API}
      />
    </div>
  );
}






  





