import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Ingredient {
  _id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  unitPrice: number;
  supplier: string;
  notes?: string;
  lastImportDate?: string;
  lastCheckDate?: string;
  isCheckedToday?: boolean;
  minStockLevel?: number;
  maxStockLevel?: number;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastImportQuantity?: number;
  lastImportPrice?: number;
}

interface StockCheck {
  _id: string;
  date: string;
  ingredients: Array<{
    ingredientId: string;
    ingredientName: string;
    previousStock: number;
    newStock: number;
    difference: number;
  }>;
}

const SimpleStockManagement: React.FC<{ API: string; token: string }> = ({ API, token }) => {
  const [activeTab, setActiveTab] = useState<'add' | 'check' | 'compare' | 'suggestions' | 'import'>('add');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [stockCheck, setStockCheck] = useState<StockCheck | null>(null);
  const [todayChecked, setTodayChecked] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState({
    ingredientId: '',
    quantity: 0,
    unitPrice: 0,
    supplier: '',
    notes: ''
  });
  const [bulkImportData, setBulkImportData] = useState({
    selectedIngredients: [] as string[],
    importDate: new Date().toISOString().split('T')[0],
    supplier: '',
    notes: ''
  });
  const [ingredientQuantities, setIngredientQuantities] = useState<{[key: string]: number}>({});

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    category: 'coffee',
    unit: 'kg',
    currentStock: 0,
    unitPrice: 0,
    supplier: '',
    notes: ''
  });

  const units = [
    { value: 'kg', label: 'Kilogram' },
    { value: 'g', label: 'Gram' },
    { value: 'l', label: 'Lít' },
    { value: 'ml', label: 'Mililit' },
    { value: 'pcs', label: 'Cái' },
    { value: 'box', label: 'Hộp' }
  ];

  const categories = [
    { value: 'coffee', label: 'Cà phê' },
    { value: 'milk', label: 'Sữa' },
    { value: 'syrup', label: 'Si-rô' },
    { value: 'topping', label: 'Topping' },
    { value: 'food', label: 'Thực phẩm' },
    { value: 'beverage', label: 'Đồ uống' },
    { value: 'other', label: 'Khác' }
  ];

  useEffect(() => {
    loadIngredients();
    checkTodayStatus();
    loadComparisonData();
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
      const response = await axios.get(`${API}/api/simple-stock/check-today?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodayChecked(response.data.checked);
    } catch (error) {
      console.error('Error checking today status:', error);
    }
  };

  const loadComparisonData = async () => {
    try {
      const response = await axios.get(`${API}/api/simple-stock/comparison`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComparisonData(response.data);
    } catch (error) {
      console.error('Error loading comparison data:', error);
    }
  };

  const handleAdd = () => {
    setEditingIngredient(null);
    setFormData({
      name: '',
      category: 'coffee',
      unit: 'kg',
      currentStock: 0,
      unitPrice: 0,
      supplier: '',
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      category: ingredient.category || 'coffee',
      unit: ingredient.unit,
      currentStock: ingredient.currentStock,
      unitPrice: ingredient.unitPrice,
      supplier: ingredient.supplier,
      notes: ingredient.notes || ''
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
      const response = await axios.post(`${API}/api/simple-stock/start-check`, {}, {
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

  const updateStockCheck = (ingredientId: string, newStock: number) => {
    if (!stockCheck) return;

    const updatedCheck = { ...stockCheck };
    const itemIndex = updatedCheck.ingredients.findIndex(item => item.ingredientId === ingredientId);
    
    if (itemIndex >= 0) {
      updatedCheck.ingredients[itemIndex].newStock = newStock;
      updatedCheck.ingredients[itemIndex].difference = newStock - updatedCheck.ingredients[itemIndex].previousStock;
    }

    setStockCheck(updatedCheck);
  };

  const completeStockCheck = async () => {
    if (!stockCheck) return;

    try {
      setLoading(true);
      await axios.post(`${API}/api/simple-stock/complete-check`, {
        checkId: stockCheck._id,
        ingredients: stockCheck.ingredients
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Kiểm kho hoàn thành!');
      setStockCheck(null);
      setTodayChecked(true);
      loadIngredients();
      loadComparisonData();
    } catch (error) {
      console.error('Error completing stock check:', error);
      toast.error('Có lỗi xảy ra khi hoàn thành kiểm kho');
    } finally {
      setLoading(false);
    }
  };

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ingredient.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (ingredient: Ingredient) => {
    if (ingredient.currentStock === 0) return { status: 'Đã hết', color: 'text-red-600 bg-red-100' };
    if (ingredient.currentStock <= (ingredient.minStockLevel || 5)) return { status: 'Sắp hết', color: 'text-orange-600 bg-orange-100' };
    return { status: 'Còn hàng', color: 'text-green-600 bg-green-100' };
  };

  const handleImport = (ingredient: Ingredient) => {
    setImportData({
      ingredientId: ingredient._id,
      quantity: 0,
      unitPrice: ingredient.unitPrice,
      supplier: ingredient.supplier,
      notes: ''
    });
    setShowImportModal(true);
  };

  const handleImportSave = async () => {
    try {
      await axios.post(`${API}/api/simple-stock/import`, importData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Nhập hàng thành công!');
      setShowImportModal(false);
      loadIngredients();
      loadComparisonData();
    } catch (error) {
      console.error('Error importing:', error);
      toast.error('Có lỗi xảy ra khi nhập hàng');
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Chưa có';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSuggestions = () => {
    return ingredients.filter(ingredient => 
      ingredient.currentStock <= (ingredient.minStockLevel || 5)
    );
  };

  const handleBulkImport = async () => {
    if (bulkImportData.selectedIngredients.length === 0) {
      toast.error('Vui lòng chọn ít nhất một nguyên liệu');
      return;
    }

    // Kiểm tra số lượng nhập
    for (const ingredientId of bulkImportData.selectedIngredients) {
      const quantity = ingredientQuantities[ingredientId];
      if (!quantity || quantity <= 0) {
        toast.error('Vui lòng nhập số lượng cho tất cả nguyên liệu đã chọn');
        return;
      }
    }

    try {
      setLoading(true);
      const importPromises = bulkImportData.selectedIngredients.map(async (ingredientId) => {
        const ingredient = ingredients.find(ing => ing._id === ingredientId);
        if (!ingredient) return;

        const quantity = ingredientQuantities[ingredientId];

        const importData = {
          ingredientId,
          quantity: quantity,
          unitPrice: ingredient.unitPrice,
          supplier: bulkImportData.supplier || ingredient.supplier,
          notes: bulkImportData.notes || `Nhập hàng ngày ${bulkImportData.importDate}`,
          importDate: bulkImportData.importDate
        };

        return axios.post(`${API}/api/simple-stock/import`, importData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      });

      await Promise.all(importPromises);
      toast.success(`Nhập hàng thành công ${bulkImportData.selectedIngredients.length} nguyên liệu!`);
      setBulkImportData({
        selectedIngredients: [],
        importDate: new Date().toISOString().split('T')[0],
        supplier: '',
        notes: ''
      });
      setIngredientQuantities({});
      loadIngredients();
      loadComparisonData();
    } catch (error) {
      console.error('Error bulk importing:', error);
      toast.error('Có lỗi xảy ra khi nhập hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleIngredientToggle = (ingredientId: string) => {
    setBulkImportData(prev => ({
      ...prev,
      selectedIngredients: prev.selectedIngredients.includes(ingredientId)
        ? prev.selectedIngredients.filter(id => id !== ingredientId)
        : [...prev.selectedIngredients, ingredientId]
    }));
  };

  const handleQuickImport = async (ingredient: Ingredient, quantity: number) => {
    try {
      setLoading(true);
      const importData = {
        ingredientId: ingredient._id,
        quantity: quantity,
        unitPrice: ingredient.unitPrice,
        supplier: ingredient.supplier,
        notes: `Nhập hàng nhanh - ${new Date().toISOString().split('T')[0]}`,
        importDate: new Date().toISOString().split('T')[0]
      };

      await axios.post(`${API}/api/simple-stock/import`, importData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Nhập hàng thành công ${quantity} ${ingredient.unit} ${ingredient.name}!`);
      loadIngredients();
      loadComparisonData();
    } catch (error) {
      console.error('Error quick importing:', error);
      toast.error('Có lỗi xảy ra khi nhập hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý kho đơn giản</h1>
              <p className="text-gray-600 mt-1">Thêm nguyên liệu, kiểm kho và so sánh</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Today Status */}
              <div className={`flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                todayChecked 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {todayChecked ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Hôm nay đã kiểm kho
                  </>
                ) : (
                  <>
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Hôm nay chưa kiểm kho
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('add')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'add'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <PlusIcon className="h-5 w-5 mr-2" />
                Thêm nguyên liệu
              </div>
            </button>
            <button
              onClick={() => setActiveTab('check')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'check'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Kiểm kho
              </div>
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'compare'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                So sánh
              </div>
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'suggestions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                Gợi ý nhập hàng
              </div>
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <PlusIcon className="h-5 w-5 mr-2" />
                Nhập hàng
              </div>
            </button>
          </nav>
        </div>
      </div>

      <div className="p-6">
        {/* Add Tab */}
        {activeTab === 'add' && (
          <div className="space-y-6">
            {/* Search and Add */}
            <div className="flex justify-between items-center">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nguyên liệu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleAdd}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Thêm nguyên liệu mới
              </button>
            </div>

            {/* Ingredients List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIngredients.map((ingredient) => {
                const stockStatus = getStockStatus(ingredient);
                return (
                  <div key={ingredient._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{ingredient.name}</h3>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm text-gray-600">{ingredient.supplier}</span>
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                              {categories.find(cat => cat.value === ingredient.category)?.label || ingredient.category}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleImport(ingredient)}
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                            title="Nhập hàng"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(ingredient)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Sửa"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ingredient._id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Xóa"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Tồn kho:</span>
                          <span className="font-medium">{ingredient.currentStock} {ingredient.unit}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Giá:</span>
                          <span className="font-medium">{ingredient.unitPrice.toLocaleString()} VND</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Trạng thái:</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                            {stockStatus.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Nhập hàng cuối:</span>
                          <span className="text-xs text-gray-500">{formatDateTime(ingredient.lastImportDate)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Kiểm kho cuối:</span>
                          <span className="text-xs text-gray-500">{formatDateTime(ingredient.lastCheckDate)}</span>
                        </div>
                        {ingredient.lastImportQuantity && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Lần nhập cuối:</span>
                            <span className="text-xs text-gray-500">{ingredient.lastImportQuantity} {ingredient.unit}</span>
                          </div>
                        )}
                        {ingredient.notes && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Ghi chú:</span> {ingredient.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredIngredients.length === 0 && (
              <div className="text-center py-12">
                <PlusIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có nguyên liệu nào</h3>
                <p className="text-gray-600 mb-4">Hãy thêm nguyên liệu đầu tiên của bạn</p>
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                <p className="text-gray-600 mb-6">Nhập số lượng thực tế cho từng nguyên liệu</p>
                <button
                  onClick={startStockCheck}
                  disabled={loading}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Kiểm kho ngày {new Date().toLocaleDateString('vi-VN')}</h3>
                    <div className="text-sm text-gray-600">
                      {stockCheck.ingredients.length} nguyên liệu
                    </div>
                  </div>

                  <div className="space-y-4">
                    {stockCheck.ingredients.map((item, index) => (
                      <div key={item.ingredientId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{item.ingredientName}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.difference === 0 ? 'bg-green-100 text-green-800' :
                            item.difference > 0 ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.difference === 0 ? 'Khớp' : 
                             item.difference > 0 ? `+${item.difference}` : 
                             `${item.difference}`}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tồn kho cũ
                            </label>
                            <div className="text-lg font-semibold text-gray-900">
                              {item.previousStock}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tồn kho mới
                            </label>
                            <input
                              type="number"
                              value={item.newStock}
                              onChange={(e) => updateStockCheck(item.ingredientId, parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={completeStockCheck}
                      disabled={loading}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'Đang lưu...' : 'Hoàn thành kiểm kho'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gợi ý nhập hàng</h3>
              
              {getSuggestions().length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-800">Cần nhập hàng ngay</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Có {getSuggestions().length} nguyên liệu sắp hết hoặc đã hết hàng
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getSuggestions().map((ingredient) => {
                      const stockStatus = getStockStatus(ingredient);
                      return (
                        <div key={ingredient._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{ingredient.name}</h4>
                              <p className="text-sm text-gray-600">{ingredient.supplier}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                              {stockStatus.status}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tồn kho hiện tại:</span>
                              <span className="font-medium">{ingredient.currentStock} {ingredient.unit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Mức tối thiểu:</span>
                              <span className="font-medium">{ingredient.minStockLevel || 5} {ingredient.unit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Cần nhập thêm:</span>
                              <span className="font-medium text-red-600">
                                {Math.max(0, (ingredient.minStockLevel || 5) - ingredient.currentStock)} {ingredient.unit}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Giá:</span>
                              <span className="font-medium">{ingredient.unitPrice.toLocaleString()} VND</span>
                            </div>
                          </div>

                          <div className="mt-4 space-y-2">
                            <div className="flex space-x-2">
                              <input
                                type="number"
                                min="1"
                                step="0.01"
                                placeholder={`Số lượng nhập (${ingredient.unit})`}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                onChange={(e) => setIngredientQuantities(prev => ({
                                  ...prev,
                                  [ingredient._id]: parseFloat(e.target.value) || 0
                                }))}
                              />
                              <button
                                onClick={() => {
                                  const quantity = ingredientQuantities[ingredient._id];
                                  if (!quantity || quantity <= 0) {
                                    toast.error('Vui lòng nhập số lượng');
                                    return;
                                  }
                                  handleQuickImport(ingredient, quantity);
                                }}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
                              >
                                Nhập ngay
                              </button>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(ingredient)}
                                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => setActiveTab('import')}
                                className="px-3 py-2 border border-blue-300 text-blue-700 rounded-lg text-sm hover:bg-blue-50 transition-colors"
                              >
                                Nhập hàng chi tiết
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tất cả nguyên liệu đều đủ</h3>
                  <p className="text-gray-600">Không có nguyên liệu nào cần nhập thêm</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nhập hàng mới</h3>
              
              <div className="space-y-6">
                {/* Thông tin chung */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày nhập hàng</label>
                    <input
                      type="date"
                      value={bulkImportData.importDate}
                      onChange={(e) => setBulkImportData({...bulkImportData, importDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
                    <input
                      type="text"
                      value={bulkImportData.supplier}
                      onChange={(e) => setBulkImportData({...bulkImportData, supplier: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tên nhà cung cấp"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                    <input
                      type="text"
                      value={bulkImportData.notes}
                      onChange={(e) => setBulkImportData({...bulkImportData, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ghi chú nhập hàng"
                    />
                  </div>
                </div>

                {/* Danh sách nguyên liệu */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Chọn nguyên liệu nhập hàng</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ingredients.map((ingredient) => {
                      const isSelected = bulkImportData.selectedIngredients.includes(ingredient._id);
                      return (
                        <div
                          key={ingredient._id}
                          className={`border rounded-lg p-4 transition-all ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{ingredient.name}</h5>
                              <p className="text-sm text-gray-600">{ingredient.supplier}</p>
                              <p className="text-sm text-gray-500">
                                Tồn kho: {ingredient.currentStock} {ingredient.unit}
                              </p>
                              <p className="text-sm text-gray-500">
                                Giá: {ingredient.unitPrice.toLocaleString()} VND
                              </p>
                            </div>
                            <div className="ml-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleIngredientToggle(ingredient._id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </div>
                          </div>
                          
                          {/* Input số lượng nhập */}
                          {isSelected && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Số lượng nhập ({ingredient.unit})
                              </label>
                              <input
                                type="number"
                                min="1"
                                step="0.01"
                                value={ingredientQuantities[ingredient._id] || ''}
                                onChange={(e) => setIngredientQuantities(prev => ({
                                  ...prev,
                                  [ingredient._id]: parseFloat(e.target.value) || 0
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nhập số lượng"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Tồn kho sau nhập: {(ingredient.currentStock + (ingredientQuantities[ingredient._id] || 0)).toFixed(2)} {ingredient.unit}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Nút nhập hàng */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setBulkImportData({
                        selectedIngredients: [],
                        importDate: new Date().toISOString().split('T')[0],
                        supplier: '',
                        notes: ''
                      });
                      setIngredientQuantities({});
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleBulkImport}
                    disabled={loading || bulkImportData.selectedIngredients.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Đang nhập...' : `Nhập hàng (${bulkImportData.selectedIngredients.length} nguyên liệu)`}
                  </button>
                </div>
              </div>
            </div>

            {/* Lịch sử nhập hàng gần đây */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử nhập hàng gần đây</h3>
              <div className="text-center py-8 text-gray-500">
                <p>Chức năng lịch sử nhập hàng sẽ được phát triển trong phiên bản tiếp theo</p>
              </div>
            </div>
          </div>
        )}

        {/* Compare Tab */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">So sánh tồn kho</h3>
              
              {comparisonData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900">So với hôm qua</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {comparisonData.yesterdayComparison?.totalDifference || 0}
                      </p>
                      <p className="text-sm text-blue-700">Tổng chênh lệch</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900">So với lần nhập cuối</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {comparisonData.lastImportComparison?.totalDifference || 0}
                      </p>
                      <p className="text-sm text-green-700">Tổng chênh lệch</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-900">Tổng giá trị</h4>
                      <p className="text-2xl font-bold text-purple-600">
                        {(comparisonData.totalValue || 0).toLocaleString()} VND
                      </p>
                      <p className="text-sm text-purple-700">Tồn kho hiện tại</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Chi tiết so sánh</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              NGUYÊN LIỆU
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              TRONG KHO CÒN
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              HÔM NAY XÀI
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {comparisonData.details?.map((item: any, index: number) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center">
                                  <span className="font-medium text-lg">{item.currentStock || 0}</span>
                                  <span className="ml-2 text-sm text-gray-500">{item.unit}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className={`px-3 py-2 text-sm font-medium rounded-full ${
                                  (item.difference || 0) > 0 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {(item.difference || 0) > 0 ? '' : '+'}
                                  {item.difference || 0} {item.unit}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có dữ liệu so sánh</h3>
                  <p className="text-gray-600">Hãy thực hiện kiểm kho để có dữ liệu so sánh</p>
                </div>
              )}
            </div>
          </div>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {units.map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                    <input
                      type="number"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({...formData, currentStock: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VND)</label>
                  <input
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({...formData, unitPrice: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="1000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingIngredient ? 'Cập nhật' : 'Thêm mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Nhập hàng mới</h3>
              
              <form onSubmit={(e) => { e.preventDefault(); handleImportSave(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng nhập</label>
                  <input
                    type="number"
                    value={importData.quantity}
                    onChange={(e) => setImportData({...importData, quantity: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá nhập (VND)</label>
                  <input
                    type="number"
                    value={importData.unitPrice}
                    onChange={(e) => setImportData({...importData, unitPrice: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="1000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
                  <input
                    type="text"
                    value={importData.supplier}
                    onChange={(e) => setImportData({...importData, supplier: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    value={importData.notes}
                    onChange={(e) => setImportData({...importData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Nhập hàng
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

export default SimpleStockManagement;
