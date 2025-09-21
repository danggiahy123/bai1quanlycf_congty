import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { dashboardAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalMenuItems: number;
  availableTables: number;
}

const SimpleDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalMenuItems: 0,
    availableTables: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading stats from API...');
      const response = await dashboardAPI.getStats();
      console.log('✅ API Response:', response.data);
      setStats(response.data);
    } catch (err: any) {
      console.error('❌ Error loading stats:', err);
      
      // More detailed error message
      let errorMessage = 'Không thể kết nối đến server.';
      if (err.code === 'ECONNREFUSED') {
        errorMessage = 'API server không chạy. Vui lòng khởi động server.';
      } else if (err.response) {
        errorMessage = `Lỗi server: ${err.response.status} - ${err.response.statusText}`;
      } else if (err.request) {
        errorMessage = 'Không thể kết nối đến API server.';
      }
      
      setError(errorMessage);
      
      // Fallback data
      setStats({
        totalOrders: 1247,
        totalRevenue: 45678900,
        totalCustomers: 342,
        totalMenuItems: 28,
        availableTables: 12
      });
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" color="border-green-500" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-green-50 via-green-100 to-green-200 dark:from-green-950 dark:via-green-900 dark:to-green-800">
      <div className="max-w-7xl mx-auto h-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 sm:mb-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg sm:text-xl">🍃</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                Cafe Admin Dashboard
              </h1>
              <p className="text-sm sm:text-base text-green-600 dark:text-green-400 font-medium">
                Quản lý quán cà phê với giao diện xanh lá hiện đại
              </p>
            </div>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tổng đơn hàng
                </CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalOrders.toLocaleString()}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  +12% so với tháng trước
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tổng doanh thu
                </CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.totalRevenue)}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  +8% so với tháng trước
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Khách hàng
                </CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalCustomers.toLocaleString()}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  +5% so với tháng trước
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Món ăn
                </CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalMenuItems}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Món có sẵn
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Bàn trống
                </CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.availableTables}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Bàn có sẵn
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4"
        >
          <button
            onClick={loadStats}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            🔄 Làm mới dữ liệu
          </button>
          <button
            onClick={() => {
              console.log('🧪 Testing API connection...');
              fetch('http://192.168.1.161:5000/api/dashboard/stats')
                .then(res => res.json())
                .then(data => {
                  console.log('✅ Direct API test success:', data);
                  setStats(data);
                })
                .catch(err => {
                  console.error('❌ Direct API test failed:', err);
                  setError('API test failed: ' + err.message);
                });
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            🧪 Test API
          </button>
          <button className="px-6 py-3 bg-gradient-to-r from-green-100 to-green-200 dark:from-green-800 dark:to-green-900 hover:from-green-200 hover:to-green-300 dark:hover:from-green-700 dark:hover:to-green-800 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            📊 Xem báo cáo chi tiết
          </button>
          <button className="px-6 py-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 hover:from-green-100 hover:to-green-200 dark:hover:from-green-800 dark:hover:to-green-700 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-600 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            ⚙️ Cài đặt
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default SimpleDashboard;
