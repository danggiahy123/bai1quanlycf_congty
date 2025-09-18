import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  CurrencyDollarIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

interface WastageAnalysisProps {
  API: string;
  token: string;
}

interface WastageData {
  period: string;
  totalWastageValue: number;
  totalWastageQuantity: number;
  topWastageCategories: Array<{
    category: string;
    totalQuantity: number;
    totalValue: number;
    count: number;
  }>;
  topWastageIngredients: Array<{
    ingredient: string;
    totalQuantity: number;
    totalValue: number;
    count: number;
    unit: string;
  }>;
}

const WastageAnalysis: React.FC<WastageAnalysisProps> = ({ API, token }) => {
  const [wastageData, setWastageData] = useState<WastageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    loadWastageData();
  }, [selectedPeriod]);

  const loadWastageData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/api/simple-inventory/wastage-analysis?days=${selectedPeriod}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWastageData(response.data);
    } catch (error) {
      console.error('Error loading wastage data:', error);
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

  const getCategoryColor = (index: number) => {
    const colors = [
      'bg-red-100 text-red-800',
      'bg-orange-100 text-orange-800',
      'bg-yellow-100 text-yellow-800',
      'bg-green-100 text-green-800',
      'bg-blue-100 text-blue-800'
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Phân tích hao hụt</h2>
            <p className="text-gray-600 mt-1">Phân tích hao hụt nguyên liệu và đưa ra khuyến nghị</p>
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
          >
            <option value={7}>7 ngày qua</option>
            <option value={30}>30 ngày qua</option>
            <option value={90}>90 ngày qua</option>
          </select>
        </div>
      </div>

      {wastageData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-8 w-8 text-red-500" />
                </div>
                <div className="ml-4 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate">Tổng giá trị hao hụt</dt>
                    <dd className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(wastageData.totalWastageValue)}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CubeIcon className="h-8 w-8 text-orange-500" />
                </div>
                <div className="ml-4 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate">Tổng số lượng hao hụt</dt>
                    <dd className="text-xl font-bold text-gray-900 mt-1">{wastageData.totalWastageQuantity.toFixed(2)}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-4 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate">Số lần kiểm kho</dt>
                    <dd className="text-xl font-bold text-gray-900 mt-1">
                      {wastageData.topWastageCategories.reduce((sum, cat) => sum + cat.count, 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Top Wastage Categories */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Hao hụt theo danh mục
              </h3>
              <div className="space-y-3">
                {wastageData.topWastageCategories.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getCategoryColor(index)}`}>
                        {category.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(category.totalValue)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {category.totalQuantity.toFixed(2)} đơn vị
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Wastage Ingredients */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Nguyên liệu hao hụt nhiều nhất
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Nguyên liệu
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Số lượng hao hụt
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Giá trị hao hụt
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Số lần
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {wastageData.topWastageIngredients.map((ingredient, index) => (
                      <tr key={ingredient.ingredient} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ingredient.ingredient}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ingredient.totalQuantity.toFixed(2)} {ingredient.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(ingredient.totalValue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ingredient.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-yellow-800">Khuyến nghị</h3>
                <div className="mt-3 text-sm text-yellow-700">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Kiểm tra định kỳ tồn kho để phát hiện hao hụt sớm</li>
                    <li>Thiết lập mức tồn kho tối thiểu phù hợp cho từng nguyên liệu</li>
                    <li>Đào tạo nhân viên về cách bảo quản nguyên liệu đúng cách</li>
                    <li>Xem xét thay đổi nhà cung cấp nếu hao hụt quá cao</li>
                    <li>Thực hiện kiểm kho hàng ngày để giảm thiểu hao hụt</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WastageAnalysis;
