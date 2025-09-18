import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ChartBarIcon, 
  ClipboardDocumentListIcon, 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface InventoryDashboardProps {
  API: string;
  token: string;
  onNavigate?: (tab: string) => void;
}

interface InventoryStats {
  totalIngredients: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  todayImports: number;
  todayExports: number;
  criticalItems: Array<{
    name: string;
    currentStock: number;
    minStock: number;
    unit: string;
  }>;
}

interface DailyReport {
  date: string;
  imports: number;
  exports: number;
  netChange: number;
  totalValue: number;
  transactions: Array<{
    type: 'import' | 'export';
    ingredient: string;
    quantity: number;
    unit: string;
    reason: string;
    timestamp: string;
  }>;
}

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ API, token, onNavigate }) => {
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'overview' | 'daily-report' | 'check-stock' | 'import-export'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, [selectedDate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, reportRes] = await Promise.all([
        axios.get(`${API}/api/inventory/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/api/inventory/daily-report?date=${selectedDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setStats(statsRes.data);
      setDailyReport(reportRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Quản lý kho</h1>
            <p className="text-gray-600">Theo dõi và quản lý nguyên liệu trong kho</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Tổng quan', icon: ChartBarIcon },
              { id: 'daily-report', name: 'Báo cáo', icon: ClipboardDocumentListIcon },
              { id: 'check-stock', name: 'Kiểm kho', icon: ExclamationTriangleIcon },
              { id: 'import-export', name: 'Nhập/Xuất', icon: ArrowUpTrayIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-6">

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate">Tổng nguyên liệu</dt>
                    <dd className="text-2xl font-bold text-gray-900 mt-1">{stats.totalIngredients}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-4 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate">Sắp hết hàng</dt>
                    <dd className="text-2xl font-bold text-gray-900 mt-1">{stats.lowStockItems}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                </div>
                <div className="ml-4 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate">Hết hàng</dt>
                    <dd className="text-2xl font-bold text-gray-900 mt-1">{stats.outOfStockItems}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-4 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate">Tổng giá trị</dt>
                    <dd className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalValue)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Items Alert */}
          {stats.criticalItems.length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-red-800">Cảnh báo: Nguyên liệu cần bổ sung</h3>
                  <div className="mt-3 text-sm text-red-700">
                    <ul className="list-disc pl-5 space-y-2">
                      {stats.criticalItems.map((item, index) => (
                        <li key={index} className="font-medium">
                          {item.name}: {item.currentStock} {item.unit} (Tối thiểu: {item.minStock} {item.unit})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Today's Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Hoạt động hôm nay</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{stats.todayImports}</div>
                  <div className="text-sm font-medium text-gray-600 mt-1">Lần nhập kho</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">{stats.todayExports}</div>
                  <div className="text-sm font-medium text-gray-600 mt-1">Lần xuất kho</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className={`text-3xl font-bold ${stats.todayImports - stats.todayExports >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.todayImports - stats.todayExports >= 0 ? '+' : ''}{stats.todayImports - stats.todayExports}
                  </div>
                  <div className="text-sm font-medium text-gray-600 mt-1">Tăng/giảm ròng</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Report Tab */}
      {activeTab === 'daily-report' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Báo cáo hàng ngày</h3>
                <p className="text-gray-600 mt-1">Theo dõi hoạt động nhập xuất kho</p>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              />
            </div>
          </div>

          {dailyReport && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-6">Tóm tắt ngày {selectedDate}</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-700 font-medium">Tổng nhập:</span>
                    <span className="text-xl font-bold text-green-600">{dailyReport.imports}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-gray-700 font-medium">Tổng xuất:</span>
                    <span className="text-xl font-bold text-red-600">{dailyReport.exports}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-700 font-medium">Thay đổi ròng:</span>
                    <span className={`text-xl font-bold ${dailyReport.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {dailyReport.netChange >= 0 ? '+' : ''}{dailyReport.netChange}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700 font-medium">Tổng giá trị:</span>
                    <span className="text-xl font-bold text-gray-900">{formatCurrency(dailyReport.totalValue)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-6">Giao dịch chi tiết</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {dailyReport.transactions.map((transaction, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
                          transaction.type === 'import' 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {transaction.type === 'import' ? 'Nhập' : 'Xuất'}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{transaction.ingredient}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {transaction.quantity} {transaction.unit}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Check Stock Tab */}
      {activeTab === 'check-stock' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Kiểm kho</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">Thực hiện kiểm tra tồn kho thực tế so với hệ thống để đảm bảo tính chính xác</p>
            <button 
              onClick={() => onNavigate?.('stock-check')}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              Bắt đầu kiểm kho
            </button>
          </div>
        </div>
      )}

      {/* Import/Export Tab */}
      {activeTab === 'import-export' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow">
              <ArrowDownTrayIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nhập kho</h3>
              <p className="text-gray-600 mb-6">Thêm nguyên liệu mới vào kho</p>
              <button 
                onClick={() => onNavigate?.('import-export')}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Nhập kho
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow">
              <ArrowUpTrayIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Xuất kho</h3>
              <p className="text-gray-600 mb-6">Xuất nguyên liệu ra khỏi kho</p>
              <button 
                onClick={() => onNavigate?.('import-export')}
                className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                Xuất kho
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default InventoryDashboard;
