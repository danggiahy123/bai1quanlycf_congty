import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface ImportExportProps {
  API: string;
  token: string;
}

interface Ingredient {
  _id: string;
  name: string;
  currentStock: number;
  unit: string;
  category: string;
  unitPrice: number;
}

interface Transaction {
  _id: string;
  ingredient: string;
  ingredientName: string;
  transactionType: 'import' | 'export';
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  reason: string;
  notes: string;
  performedBy: string;
  performedByName: string;
  createdAt: string;
}

const ImportExport: React.FC<ImportExportProps> = ({ API, token }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'history'>('import');
  const [showModal, setShowModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState({
    quantity: 0,
    unitPrice: 0,
    reason: '',
    notes: '',
    performedBy: 'admin',
    performedByName: 'Quản trị viên'
  });

  useEffect(() => {
    loadIngredients();
    loadTransactions();
  }, []);

  const loadIngredients = async () => {
    try {
      const response = await axios.get(`${API}/api/ingredients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIngredients(response.data.ingredients || []);
    } catch (error) {
      console.error('Error loading ingredients:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/api/inventory-transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (ingredient: Ingredient, type: 'import' | 'export') => {
    setSelectedIngredient(ingredient);
    setActiveTab(type);
    setFormData({
      quantity: 0,
      unitPrice: ingredient.unitPrice,
      reason: type === 'import' ? 'purchase' : 'usage',
      notes: '',
      performedBy: 'admin',
      performedByName: 'Quản trị viên'
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedIngredient(null);
    setFormData({
      quantity: 0,
      unitPrice: 0,
      reason: '',
      notes: '',
      performedBy: 'admin',
      performedByName: 'Quản trị viên'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient) return;

    try {
      setLoading(true);
      const transactionData = {
        ingredient: selectedIngredient._id,
        transactionType: activeTab,
        quantity: formData.quantity,
        unitPrice: formData.unitPrice,
        totalAmount: formData.quantity * formData.unitPrice,
        reason: formData.reason,
        notes: formData.notes,
        performedBy: formData.performedBy,
        performedByName: formData.performedByName
      };

      await axios.post(`${API}/api/inventory-transactions`, transactionData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Reload data
      await Promise.all([loadIngredients(), loadTransactions()]);
      closeModal();
    } catch (error) {
      console.error('Error creating transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getTransactionIcon = (type: string) => {
    return type === 'import' ? 
      <ArrowDownTrayIcon className="h-5 w-5 text-green-500" /> : 
      <ArrowUpTrayIcon className="h-5 w-5 text-red-500" />;
  };

  const getTransactionColor = (type: string) => {
    return type === 'import' ? 
      'text-green-600 bg-green-100' : 
      'text-red-600 bg-red-100';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Nhập/Xuất kho</h2>
        <p className="text-gray-600">Quản lý giao dịch nhập và xuất nguyên liệu</p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'import', name: 'Nhập kho', icon: ArrowDownTrayIcon },
            { id: 'export', name: 'Xuất kho', icon: ArrowUpTrayIcon },
            { id: 'history', name: 'Lịch sử giao dịch', icon: DocumentTextIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Import/Export Tab */}
      {(activeTab === 'import' || activeTab === 'export') && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {activeTab === 'import' ? 'Nhập kho' : 'Xuất kho'} nguyên liệu
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ingredients.map((ingredient) => (
                  <div key={ingredient._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{ingredient.name}</h4>
                      <span className="text-xs text-gray-500">{ingredient.category}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Tồn kho: {ingredient.currentStock} {ingredient.unit}
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      Giá: {formatCurrency(ingredient.unitPrice)}/{ingredient.unit}
                    </div>
                    <button
                      onClick={() => openModal(ingredient, activeTab)}
                      className={`w-full px-3 py-2 text-sm rounded-md ${
                        activeTab === 'import'
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {activeTab === 'import' ? 'Nhập kho' : 'Xuất kho'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Lịch sử giao dịch</h3>
              
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Loại
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nguyên liệu
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số lượng
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Đơn giá
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thành tiền
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lý do
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thực hiện bởi
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thời gian
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getTransactionIcon(transaction.transactionType)}
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getTransactionColor(transaction.transactionType)}`}>
                                {transaction.transactionType === 'import' ? 'Nhập' : 'Xuất'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.ingredientName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.quantity} {transaction.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(transaction.unitPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(transaction.totalAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.reason}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.performedByName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(transaction.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedIngredient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {activeTab === 'import' ? 'Nhập kho' : 'Xuất kho'} - {selectedIngredient.name}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số lượng
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                      required
                    />
                    <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-700">
                      {selectedIngredient.unit}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đơn giá
                  </label>
                  <input
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({...formData, unitPrice: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="1000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lý do
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Chọn lý do</option>
                    {activeTab === 'import' ? (
                      <>
                        <option value="purchase">Mua hàng</option>
                        <option value="return">Trả hàng</option>
                        <option value="adjustment">Điều chỉnh</option>
                        <option value="other">Khác</option>
                      </>
                    ) : (
                      <>
                        <option value="usage">Sử dụng</option>
                        <option value="waste">Hỏng/Thất thoát</option>
                        <option value="transfer">Chuyển kho</option>
                        <option value="other">Khác</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Thành tiền:</span>
                      <span className="font-medium">
                        {formatCurrency(formData.quantity * formData.unitPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 rounded-md text-white ${
                      activeTab === 'import' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    } disabled:opacity-50`}
                  >
                    {loading ? 'Đang xử lý...' : (activeTab === 'import' ? 'Nhập kho' : 'Xuất kho')}
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

export default ImportExport;
