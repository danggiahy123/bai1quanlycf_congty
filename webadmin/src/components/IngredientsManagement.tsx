import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Dialog } from '@headlessui/react';
import { PencilSquareIcon, TrashIcon, PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Ingredient {
  _id: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  unitPrice: number;
  supplier: {
    name: string;
    contact?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  minStockLevel: number;
  maxStockLevel: number;
  currentStock: number;
  isActive: boolean;
  image?: string;
  barcode?: string;
  notes?: string;
  stockStatus: 'low' | 'normal' | 'high';
  stockValue: number;
}

const emptyForm = {
  name: '',
  description: '',
  category: 'coffee',
  unit: 'kg',
  unitPrice: 0,
  supplier: {
    name: '',
    contact: '',
    address: '',
    phone: '',
    email: ''
  },
  minStockLevel: 10,
  maxStockLevel: 1000,
  currentStock: 0,
  isActive: true,
  image: '',
  barcode: '',
  notes: ''
};

const categories = [
  { value: 'coffee', label: 'Cà phê' },
  { value: 'milk', label: 'Sữa' },
  { value: 'syrup', label: 'Sirop' },
  { value: 'topping', label: 'Topping' },
  { value: 'food', label: 'Thức ăn' },
  { value: 'beverage', label: 'Đồ uống' },
  { value: 'other', label: 'Khác' }
];

const units = [
  { value: 'kg', label: 'Kilogram' },
  { value: 'g', label: 'Gram' },
  { value: 'l', label: 'Lít' },
  { value: 'ml', label: 'Mililit' },
  { value: 'pcs', label: 'Cái' },
  { value: 'box', label: 'Hộp' },
  { value: 'bag', label: 'Túi' },
  { value: 'bottle', label: 'Chai' },
  { value: 'can', label: 'Lon' }
];

export default function IngredientsManagement() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<any>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [stockForm, setStockForm] = useState({
    quantity: 0,
    operation: 'add',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    loadIngredients();
    loadStats();
  }, [currentPage, search, categoryFilter, statusFilter]);

  const loadIngredients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search,
        category: categoryFilter,
        status: statusFilter
      });

      const response = await axios.get(`${API}/api/ingredients?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIngredients(response.data.ingredients);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error loading ingredients:', error);
      toast.error('Lỗi tải danh sách nguyên liệu');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/ingredients/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingId(ingredient._id);
    setForm({
      name: ingredient.name,
      description: ingredient.description || '',
      category: ingredient.category,
      unit: ingredient.unit,
      unitPrice: ingredient.unitPrice,
      supplier: ingredient.supplier,
      minStockLevel: ingredient.minStockLevel,
      maxStockLevel: ingredient.maxStockLevel,
      currentStock: ingredient.currentStock,
      isActive: ingredient.isActive,
      image: ingredient.image || '',
      barcode: ingredient.barcode || '',
      notes: ingredient.notes || ''
    });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (editingId) {
        await axios.put(`${API}/api/ingredients/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Cập nhật nguyên liệu thành công!');
      } else {
        await axios.post(`${API}/api/ingredients`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Tạo nguyên liệu thành công!');
      }
      
      setOpen(false);
      loadIngredients();
      loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa nguyên liệu này?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/api/ingredients/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Xóa nguyên liệu thành công!');
      loadIngredients();
      loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleStockUpdate = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setStockForm({
      quantity: 0,
      operation: 'add',
      reason: '',
      notes: ''
    });
    setShowStockModal(true);
  };

  const handleStockSave = async () => {
    if (!selectedIngredient) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/ingredients/${selectedIngredient._id}/update-stock`, stockForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Cập nhật tồn kho thành công!');
      setShowStockModal(false);
      loadIngredients();
      loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'text-red-600 bg-red-100';
      case 'high': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'low': return 'Sắp hết';
      case 'high': return 'Tồn nhiều';
      default: return 'Bình thường';
    }
  };

  return (
    <div>
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Tổng nguyên liệu</p>
                <p className="text-2xl font-bold text-white">{stats.totalIngredients}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Sắp hết hàng</p>
                <p className="text-2xl font-bold text-white">{stats.lowStockItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Tồn nhiều</p>
                <p className="text-2xl font-bold text-white">{stats.highStockItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Giá trị tồn kho</p>
                <p className="text-2xl font-bold text-white">{stats.totalStockValue?.toLocaleString()}đ</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Tìm kiếm nguyên liệu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="low">Sắp hết hàng</option>
          <option value="normal">Bình thường</option>
          <option value="high">Tồn nhiều</option>
        </select>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Thêm mới
        </button>
      </div>

      {/* Ingredients List */}
      <div className="bg-gray-800 rounded-xl border border-gray-600 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nguyên liệu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Danh mục</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tồn kho</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Giá</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-600">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-400">Đang tải...</td>
                </tr>
              ) : ingredients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-400">Không có nguyên liệu nào</td>
                </tr>
              ) : (
                ingredients.map((ingredient) => (
                  <tr key={ingredient._id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{ingredient.name}</div>
                        <div className="text-sm text-gray-400">{ingredient.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-600 text-gray-300 rounded-full">
                        {categories.find(c => c.value === ingredient.category)?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {ingredient.currentStock} {ingredient.unit}
                      </div>
                      <div className="text-xs text-gray-400">
                        Min: {ingredient.minStockLevel} | Max: {ingredient.maxStockLevel}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {ingredient.unitPrice.toLocaleString()}đ/{ingredient.unit}
                      </div>
                      <div className="text-xs text-gray-400">
                        Tổng: {(ingredient.currentStock * ingredient.unitPrice).toLocaleString()}đ
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ingredient.stockStatus)}`}>
                        {getStatusText(ingredient.stockStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(ingredient)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStockUpdate(ingredient)}
                          className="text-green-400 hover:text-green-300"
                          title="Cập nhật tồn kho"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(ingredient._id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
            >
              Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded-lg ${
                  currentPage === page
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-xl bg-gray-800 p-6 space-y-4">
            <Dialog.Title className="text-lg font-semibold">
              {editingId ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu mới'}
            </Dialog.Title>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm text-gray-300">Tên nguyên liệu *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Nhập tên nguyên liệu"
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm text-gray-300">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Mô tả nguyên liệu"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Danh mục *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-300">Đơn vị *</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {units.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-300">Giá đơn vị *</label>
                <input
                  type="number"
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Tồn kho hiện tại</label>
                <input
                  type="number"
                  value={form.currentStock}
                  onChange={(e) => setForm({ ...form, currentStock: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Tồn kho tối thiểu *</label>
                <input
                  type="number"
                  value={form.minStockLevel}
                  onChange={(e) => setForm({ ...form, minStockLevel: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Tồn kho tối đa *</label>
                <input
                  type="number"
                  value={form.maxStockLevel}
                  onChange={(e) => setForm({ ...form, maxStockLevel: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="1000"
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm text-gray-300">Nhà cung cấp</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <input
                    type="text"
                    value={form.supplier.name}
                    onChange={(e) => setForm({ ...form, supplier: { ...form.supplier, name: e.target.value } })}
                    className="px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Tên nhà cung cấp"
                  />
                  <input
                    type="text"
                    value={form.supplier.phone}
                    onChange={(e) => setForm({ ...form, supplier: { ...form.supplier, phone: e.target.value } })}
                    className="px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Số điện thoại"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-300">Hình ảnh URL</label>
                <input
                  type="url"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Mã vạch</label>
                <input
                  type="text"
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="123456789"
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm text-gray-300">Ghi chú</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                  placeholder="Ghi chú thêm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {editingId ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Stock Update Modal */}
      <Dialog open={showStockModal} onClose={() => setShowStockModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-md rounded-xl bg-gray-800 p-6 space-y-4">
            <Dialog.Title className="text-lg font-semibold">
              Cập nhật tồn kho - {selectedIngredient?.name}
            </Dialog.Title>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300">Số lượng *</label>
                <input
                  type="number"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm({ ...stockForm, quantity: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Phép toán *</label>
                <select
                  value={stockForm.operation}
                  onChange={(e) => setStockForm({ ...stockForm, operation: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="add">Cộng (+)</option>
                  <option value="subtract">Trừ (-)</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-300">Lý do *</label>
                <input
                  type="text"
                  value={stockForm.reason}
                  onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Nhập lý do điều chỉnh"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Ghi chú</label>
                <textarea
                  value={stockForm.notes}
                  onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Ghi chú thêm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowStockModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={handleStockSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Cập nhật
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
