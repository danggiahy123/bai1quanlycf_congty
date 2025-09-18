import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface StockCheckProps {
  API: string;
  token: string;
}

interface Ingredient {
  _id: string;
  name: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  category: string;
}

interface StockCheckItem {
  ingredient: Ingredient;
  systemStock: number;
  actualStock: number;
  difference: number;
  status: 'match' | 'over' | 'under' | 'missing';
  notes?: string;
}

const StockCheck: React.FC<StockCheckProps> = ({ API, token }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [checkItems, setCheckItems] = useState<StockCheckItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [checkDate, setCheckDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadIngredients();
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
    } finally {
      setLoading(false);
    }
  };

  const startStockCheck = () => {
    const items: StockCheckItem[] = ingredients.map(ingredient => ({
      ingredient,
      systemStock: ingredient.currentStock,
      actualStock: ingredient.currentStock, // Default to system stock
      difference: 0,
      status: 'match',
      notes: ''
    }));
    setCheckItems(items);
    setChecking(true);
    setCompleted(false);
  };

  const updateActualStock = (index: number, actualStock: number) => {
    const updatedItems = [...checkItems];
    const item = updatedItems[index];
    
    item.actualStock = actualStock;
    item.difference = actualStock - item.systemStock;
    
    if (actualStock === item.systemStock) {
      item.status = 'match';
    } else if (actualStock > item.systemStock) {
      item.status = 'over';
    } else if (actualStock < item.systemStock) {
      item.status = 'under';
    } else if (actualStock === 0) {
      item.status = 'missing';
    }
    
    setCheckItems(updatedItems);
  };

  const updateNotes = (index: number, notes: string) => {
    const updatedItems = [...checkItems];
    updatedItems[index].notes = notes;
    setCheckItems(updatedItems);
  };

  const completeStockCheck = async () => {
    try {
      setLoading(true);
      
      // Prepare adjustment data
      const adjustments = checkItems
        .filter(item => item.difference !== 0)
        .map(item => ({
          ingredientId: item.ingredient._id,
          adjustment: item.difference,
          reason: 'stock_check',
          notes: item.notes || `Kiểm kho ngày ${checkDate}`
        }));

      if (adjustments.length > 0) {
        await axios.post(`${API}/api/inventory/adjust-stock`, {
          adjustments,
          checkDate,
          notes: `Kiểm kho định kỳ ngày ${checkDate}`
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setCompleted(true);
    } catch (error) {
      console.error('Error completing stock check:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'match':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'over':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'under':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case 'missing':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'match':
        return 'Khớp';
      case 'over':
        return 'Thừa';
      case 'under':
        return 'Thiếu';
      case 'missing':
        return 'Mất';
      default:
        return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'match':
        return 'text-green-600 bg-green-100';
      case 'over':
        return 'text-yellow-600 bg-yellow-100';
      case 'under':
        return 'text-orange-600 bg-orange-100';
      case 'missing':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Kiểm kho</h2>
        <p className="text-gray-600">So sánh tồn kho thực tế với hệ thống</p>
      </div>

      {!checking && !completed && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bắt đầu kiểm kho</h3>
            <p className="text-gray-600 mb-6">
              Quá trình kiểm kho sẽ so sánh số lượng thực tế trong kho với dữ liệu hệ thống.
              Bạn sẽ cần nhập số lượng thực tế cho từng nguyên liệu.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày kiểm kho
              </label>
              <input
                type="date"
                value={checkDate}
                onChange={(e) => setCheckDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={startStockCheck}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
            >
              Bắt đầu kiểm kho
            </button>
          </div>
        </div>
      )}

      {checking && !completed && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Danh sách kiểm kho</h3>
              <div className="text-sm text-gray-500">
                {checkItems.filter(item => item.actualStock !== item.systemStock).length} / {checkItems.length} có thay đổi
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nguyên liệu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tồn kho hệ thống
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tồn kho thực tế
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chênh lệch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ghi chú
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {checkItems.map((item, index) => (
                    <tr key={item.ingredient._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.ingredient.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.ingredient.category} • {item.ingredient.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.systemStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.actualStock}
                          onChange={(e) => updateActualStock(index, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${
                          item.difference > 0 ? 'text-green-600' : 
                          item.difference < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {item.difference > 0 ? '+' : ''}{item.difference}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(item.status)}
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                            {getStatusText(item.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => updateNotes(index, e.target.value)}
                          placeholder="Ghi chú..."
                          className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setChecking(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={completeStockCheck}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Hoàn thành kiểm kho'}
              </button>
            </div>
          </div>
        </div>
      )}

      {completed && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Kiểm kho hoàn thành</h3>
            <p className="text-gray-600 mb-6">
              Quá trình kiểm kho đã được hoàn thành và dữ liệu đã được cập nhật.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Tổng số nguyên liệu kiểm tra: {checkItems.length}</p>
              <p>Có thay đổi: {checkItems.filter(item => item.difference !== 0).length}</p>
              <p>Khớp hoàn toàn: {checkItems.filter(item => item.status === 'match').length}</p>
            </div>
            <div className="mt-6">
              <button
                onClick={() => {
                  setChecking(false);
                  setCompleted(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Kiểm kho mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockCheck;
