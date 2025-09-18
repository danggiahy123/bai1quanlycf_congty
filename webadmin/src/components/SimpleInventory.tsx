import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ChartPieIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import WastageAnalysis from './WastageAnalysis';

interface Ingredient {
  _id: string;
  name: string;
  category: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  unit: string;
  unitPrice: number;
  supplier: {
    name: string;
    contact: string;
  };
  description?: string;
  lastChecked?: string;
  isCheckedToday?: boolean;
}

interface StockCheck {
  _id: string;
  date: string;
  ingredients: Array<{
    ingredientId: string;
    ingredientName: string;
    systemStock: number;
    actualStock: number;
    difference: number;
    notes?: string;
  }>;
  totalItems: number;
  checkedItems: number;
  discrepancies: number;
  status: 'completed' | 'in_progress';
}

const SimpleInventory: React.FC<{ API: string; token: string }> = ({ API, token }) => {
  const [activeTab, setActiveTab] = useState<'view' | 'check' | 'analysis'>('view');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [stockCheck, setStockCheck] = useState<StockCheck | null>(null);
  const [todayChecked, setTodayChecked] = useState(false);
  const [showLowStock, setShowLowStock] = useState(true);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    category: 'coffee',
    currentStock: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    unit: 'kg',
    unitPrice: 0,
    supplier: {
      name: '',
      contact: ''
    },
    description: ''
  });

  const categories = [
    { value: 'coffee', label: 'Cà phê', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { value: 'milk', label: 'Sữa', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'food', label: 'Thực phẩm', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'syrup', label: 'Si-rô', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { value: 'topping', label: 'Topping', color: 'bg-pink-100 text-pink-800 border-pink-200' },
    { value: 'beverage', label: 'Đồ uống', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'other', label: 'Khác', color: 'bg-gray-100 text-gray-800 border-gray-200' }
  ];

  const units = [
    { value: 'kg', label: 'Kilogram' },
    { value: 'g', label: 'Gram' },
    { value: 'l', label: 'Lít' },
    { value: 'ml', label: 'Mililit' },
    { value: 'pcs', label: 'Cái' },
    { value: 'box', label: 'Hộp' }
  ];

  useEffect(() => {
    loadIngredients();
    checkTodayStatus();
  }, []);

  const loadIngredients = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/api/ingredients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIngredients(response.data.ingredients || []);
    } catch (error) {
      console.error('Error loading ingredients:', error);
      toast.error('Lỗi tải danh sách nguyên liệu');
    } finally {
      setLoading(false);
    }
  };

  const checkTodayStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${API}/api/simple-inventory/check-today?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodayChecked(response.data.checked);
    } catch (error) {
      console.error('Error checking today status:', error);
    }
  };

  const handleAdd = () => {
    setEditingIngredient(null);
    setFormData({
      name: '',
      category: 'coffee',
      currentStock: 0,
      minStockLevel: 0,
      maxStockLevel: 0,
      unit: 'kg',
      unitPrice: 0,
      supplier: { name: '', contact: '' },
      description: ''
    });
    setShowAddModal(true);
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      category: ingredient.category,
      currentStock: ingredient.currentStock,
      minStockLevel: ingredient.minStockLevel,
      maxStockLevel: ingredient.maxStockLevel,
      unit: ingredient.unit,
      unitPrice: ingredient.unitPrice,
      supplier: {
        name: ingredient.supplier.name,
        contact: ingredient.supplier.contact || ''
      },
      description: ingredient.description || ''
    });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingIngredient) {
        await axios.put(`${API}/api/ingredients/${editingIngredient._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Cập nhật nguyên liệu thành công!');
      } else {
        await axios.post(`${API}/api/ingredients`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Thêm nguyên liệu thành công!');
      }
      setShowAddModal(false);
      loadIngredients();
    } catch (error) {
      console.error('Error saving ingredient:', error);
      toast.error('Có lỗi xảy ra khi lưu nguyên liệu');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nguyên liệu này?')) {
      try {
        await axios.delete(`${API}/api/ingredients/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Xóa nguyên liệu thành công!');
        loadIngredients();
      } catch (error) {
        console.error('Error deleting ingredient:', error);
        toast.error('Có lỗi xảy ra khi xóa nguyên liệu');
      }
    }
  };

  const startStockCheck = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/api/simple-inventory/start-check`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStockCheck(response.data);
      setActiveTab('check');
    } catch (error) {
      console.error('Error starting stock check:', error);
      toast.error('Có lỗi xảy ra khi bắt đầu kiểm kho');
    } finally {
      setLoading(false);
    }
  };

  const updateStockCheck = (ingredientId: string, actualStock: number, notes: string = '') => {
    if (!stockCheck) return;

    const updatedCheck = { ...stockCheck };
    const itemIndex = updatedCheck.ingredients.findIndex(item => item.ingredientId === ingredientId);
    
    if (itemIndex >= 0) {
      updatedCheck.ingredients[itemIndex].actualStock = actualStock;
      updatedCheck.ingredients[itemIndex].difference = actualStock - updatedCheck.ingredients[itemIndex].systemStock;
      updatedCheck.ingredients[itemIndex].notes = notes;
    }

    setStockCheck(updatedCheck);
  };

  const completeStockCheck = async () => {
    if (!stockCheck) return;

    try {
      setLoading(true);
      await axios.post(`${API}/api/simple-inventory/complete-check`, {
        checkId: stockCheck._id,
        ingredients: stockCheck.ingredients
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Kiểm kho hoàn thành!');
      setStockCheck(null);
      setTodayChecked(true);
      loadIngredients();
    } catch (error) {
      console.error('Error completing stock check:', error);
      toast.error('Có lỗi xảy ra khi hoàn thành kiểm kho');
    } finally {
      setLoading(false);
    }
  };

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingredient.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!showLowStock) return matchesSearch;
    return matchesSearch && ingredient.currentStock <= ingredient.minStockLevel;
  });

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.color : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStockStatus = (ingredient: Ingredient) => {
    if (ingredient.currentStock === 0) return { status: 'Hết hàng', color: 'text-red-600 bg-red-50 border-red-200' };
    if (ingredient.currentStock <= ingredient.minStockLevel) return { status: 'Sắp hết', color: 'text-orange-600 bg-orange-50 border-orange-200' };
    if (ingredient.currentStock >= ingredient.maxStockLevel) return { status: 'Đầy kho', color: 'text-green-600 bg-green-50 border-green-200' };
    return { status: 'Bình thường', color: 'text-blue-600 bg-blue-50 border-blue-200' };
  };

  const lowStockCount = ingredients.filter(ing => ing.currentStock <= ing.minStockLevel).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý kho</h1>
              <p className="text-gray-600 mt-1">Quản lý nguyên liệu và kiểm kho</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Today Status */}
              <div className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium border ${
                todayChecked 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
              }`}>
                {todayChecked ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Đã kiểm kho hôm nay
                  </>
                ) : (
                  <>
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Chưa kiểm kho hôm nay
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('view')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'view'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Xem kho
              </div>
            </button>
            <button
              onClick={() => setActiveTab('check')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'check'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Kiểm kho
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analysis'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <ChartPieIcon className="h-5 w-5 mr-2" />
                Phân tích
              </div>
            </button>
          </nav>
        </div>
      </div>

      <div className="p-6">
        {/* View Tab */}
        {activeTab === 'view' && (
          <div className="space-y-6">
            {/* Search and Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nguyên liệu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                />
              </div>
              <div className="flex items-center space-x-3">
                {/* Low Stock Toggle */}
                <button
                  onClick={() => setShowLowStock(!showLowStock)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showLowStock 
                      ? 'bg-red-100 text-red-700 border border-red-200' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  {showLowStock ? <EyeSlashIcon className="h-4 w-4 mr-1" /> : <EyeIcon className="h-4 w-4 mr-1" />}
                  {showLowStock ? 'Ẩn' : 'Hiện'} sắp hết hàng
                  {lowStockCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {lowStockCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleAdd}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Thêm nguyên liệu
                </button>
              </div>
            </div>

            {/* Ingredients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredIngredients.map((ingredient) => {
                const stockStatus = getStockStatus(ingredient);
                return (
                  <div key={ingredient._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-green-200">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{ingredient.name}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getCategoryColor(ingredient.category)}`}>
                            {categories.find(c => c.value === ingredient.category)?.label}
                          </span>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={() => handleEdit(ingredient)}
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ingredient._id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Tồn kho:</span>
                          <span className="font-semibold text-gray-900">{ingredient.currentStock} {ingredient.unit}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Giá:</span>
                          <span className="font-semibold text-gray-900">{ingredient.unitPrice.toLocaleString()} VND</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Nhà cung cấp:</span>
                          <span className="font-medium text-sm text-gray-900 truncate max-w-24">{ingredient.supplier.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Trạng thái:</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${stockStatus.color}`}>
                            {stockStatus.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredIngredients.length === 0 && (
              <div className="text-center py-12">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'Không tìm thấy nguyên liệu' : 'Không có nguyên liệu nào'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy thêm nguyên liệu đầu tiên của bạn'}
                </p>
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Thêm nguyên liệu
                </button>
              </div>
            )}
          </div>
        )}

        {/* Check Tab */}
        {activeTab === 'check' && (
          <div className="space-y-6">
            {!stockCheck ? (
              <div className="text-center py-12">
                <ArrowPathIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Bắt đầu kiểm kho</h3>
                <p className="text-gray-600 mb-6">So sánh tồn kho thực tế với hệ thống</p>
                <button
                  onClick={startStockCheck}
                  disabled={loading}
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="h-5 w-5 mr-2" />
                      Bắt đầu kiểm kho
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Kiểm kho ngày {new Date().toLocaleDateString('vi-VN')}</h3>
                    <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-lg">
                      {stockCheck.checkedItems} / {stockCheck.totalItems} mục đã kiểm
                    </div>
                  </div>

                  <div className="space-y-4">
                    {stockCheck.ingredients.map((item, index) => (
                      <div key={item.ingredientId} className="border border-gray-200 rounded-lg p-4 hover:border-green-200 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{item.ingredientName}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                            item.difference === 0 ? 'bg-green-50 text-green-700 border-green-200' :
                            item.difference > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {item.difference === 0 ? 'Khớp' : 
                             item.difference > 0 ? `+${item.difference}` : 
                             `${item.difference}`}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tồn kho hệ thống
                            </label>
                            <div className="text-lg font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                              {item.systemStock}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tồn kho thực tế
                            </label>
                            <input
                              type="number"
                              value={item.actualStock}
                              onChange={(e) => updateStockCheck(item.ingredientId, parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setStockCheck(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={completeStockCheck}
                      disabled={loading}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Đang lưu...' : 'Hoàn thành kiểm kho'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <WastageAnalysis API={API} token={token} />
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingIngredient ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu mới'}
              </h3>
              
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên nguyên liệu</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho hiện tại</label>
                    <input
                      type="number"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({...formData, currentStock: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    >
                      {units.map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho tối thiểu</label>
                    <input
                      type="number"
                      value={formData.minStockLevel}
                      onChange={(e) => setFormData({...formData, minStockLevel: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho tối đa</label>
                    <input
                      type="number"
                      value={formData.maxStockLevel}
                      onChange={(e) => setFormData({...formData, maxStockLevel: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá/đơn vị (VND)</label>
                  <input
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({...formData, unitPrice: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
                  <input
                    type="text"
                    value={formData.supplier.name}
                    onChange={(e) => setFormData({...formData, supplier: {...formData.supplier, name: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {editingIngredient ? 'Cập nhật' : 'Thêm mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleInventory;
