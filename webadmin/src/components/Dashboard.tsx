import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChartBarIcon, 
  UsersIcon, 
  ShoppingCartIcon, 
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalTables: number;
  occupiedTables: number;
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  totalCustomers: number;
  totalEmployees: number;
}

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

interface TopItem {
  _id: string;
  name: string;
  totalSold: number;
  revenue: number;
  category: string;
}

interface RecentActivity {
  _id: string;
  type: 'booking' | 'payment' | 'order' | 'inventory';
  description: string;
  amount?: number;
  tableName?: string;
  createdAt: string;
}

interface DashboardProps {
  API: string;
  token: string;
}

const Dashboard: React.FC<DashboardProps> = ({ API, token }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalTables: 0,
    occupiedTables: 0,
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    totalCustomers: 0,
    totalEmployees: 0
  });
  
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch all data in parallel
      const [statsRes, revenueRes, topItemsRes, activitiesRes] = await Promise.all([
        axios.get(`${API}/api/dashboard/stats`, { headers }),
        axios.get(`${API}/api/dashboard/revenue?range=${timeRange}`, { headers }),
        axios.get(`${API}/api/dashboard/top-items`, { headers }),
        axios.get(`${API}/api/dashboard/recent-activities`, { headers })
      ]);

      setStats(statsRes.data);
      setRevenueData(revenueRes.data || []);
      setTopItems(topItemsRes.data || []);
      setRecentActivities(activitiesRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
    const date = new Date(dateString);
    if (timeRange === 'day') {
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } else if (timeRange === 'week') {
      return `Tuần ${Math.ceil(date.getDate() / 7)}`;
    } else {
      return date.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' });
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 sm:p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 sm:space-x-4 mb-4">
          <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-500 text-sm sm:text-lg">Tổng quan hoạt động quán cà phê</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Tables */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-4 rounded-xl bg-blue-500 text-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Tổng số bàn</p>
            <p className="text-3xl font-bold text-gray-800 mb-2">{stats.totalTables}</p>
            <div className="flex items-center text-sm text-gray-400">
              <span>{stats.occupiedTables} đang sử dụng</span>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-4 rounded-xl bg-green-500 text-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Tổng đơn hàng</p>
            <p className="text-3xl font-bold text-gray-800 mb-2">{stats.totalOrders}</p>
            <div className="flex items-center text-sm text-gray-400">
              <span>{stats.todayOrders} hôm nay</span>
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-4 rounded-xl bg-yellow-500 text-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Tổng doanh thu</p>
            <p className="text-3xl font-bold text-gray-800 mb-2">{formatCurrency(stats.totalRevenue)}</p>
            <div className="flex items-center text-sm text-gray-400">
              <span>{formatCurrency(stats.todayRevenue)} hôm nay</span>
            </div>
          </div>
        </div>

        {/* Users */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-4 rounded-xl bg-purple-500 text-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Người dùng</p>
            <p className="text-3xl font-bold text-gray-800 mb-2">{stats.totalCustomers + stats.totalEmployees}</p>
            <div className="flex items-center text-sm text-gray-400">
              <span>{stats.totalCustomers} khách, {stats.totalEmployees} nhân viên</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-lg border">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-500 rounded-xl text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Doanh thu</h3>
                  <p className="text-gray-500 font-medium text-sm sm:text-base">
                    {timeRange === 'day' && '7 ngày gần đây'}
                    {timeRange === 'week' && '6 tuần gần đây'}
                    {timeRange === 'month' && '6 tháng gần đây'}
                  </p>
                </div>
              </div>
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setTimeRange('day')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                    timeRange === 'day'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Ngày
                </button>
                <button
                  onClick={() => setTimeRange('week')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                    timeRange === 'week'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Tuần
                </button>
                <button
                  onClick={() => setTimeRange('month')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                    timeRange === 'month'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Tháng
                </button>
              </div>
            </div>
            
            <div className="h-64 sm:h-80 relative">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                </div>
              ) : revenueData && revenueData.length > 0 ? (
                <div className="h-full">
                  {/* Simple chart placeholder */}
                  <div className="h-full flex items-end justify-center space-x-2">
                    {revenueData.map((item, index) => {
                      const maxRevenue = Math.max(...revenueData.map(d => d.revenue || 0));
                      const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                      
                      return (
                        <div key={index} className="flex flex-col items-center group relative">
                          <div
                            className="w-8 bg-blue-500 rounded-t-lg hover:bg-blue-600 transition-colors"
                            style={{ height: `${Math.max(height, 8)}%`, minHeight: '20px' }}
                          ></div>
                          <div className="text-xs text-gray-500 mt-2 text-center">
                            {formatDate(item.date)}
                          </div>
                          {/* Tooltip */}
                          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {formatCurrency(item.revenue)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Không có dữ liệu</h4>
                    <p className="text-gray-500">Chưa có dữ liệu doanh thu cho khoảng thời gian này</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Items */}
        <div className="bg-white rounded-2xl shadow-lg border">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-green-500 rounded-xl text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Top món bán chạy</h3>
                <p className="text-gray-500 font-medium text-sm sm:text-base">Món ăn được yêu thích nhất</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {topItems.length > 0 ? (
                topItems.map((item, index) => (
                  <div key={item._id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300">
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-yellow-600' :
                        'bg-blue-500'
                      }`}>
                        {index === 0 ? '👑' : index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 truncate text-sm sm:text-base">{item.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="font-bold text-gray-800 text-sm sm:text-lg">{item.totalSold} món</p>
                      <p className="text-xs sm:text-sm font-semibold text-green-600">{formatCurrency(item.revenue)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <h4 className="text-lg font-bold text-gray-800 mb-2">Không có dữ liệu</h4>
                  <p className="text-gray-500">Chưa có thống kê món bán chạy</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white rounded-2xl shadow-lg border">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-purple-500 rounded-xl text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Hoạt động gần đây</h3>
              <p className="text-gray-500 font-medium text-sm sm:text-base">Các hoạt động mới nhất trong hệ thống</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => {
                const getActivityIcon = (type: string) => {
                  switch (type) {
                    case 'booking':
                      return (
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      );
                    case 'payment':
                      return (
                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                      );
                    case 'order':
                      return (
                        <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center text-white">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      );
                    case 'inventory':
                      return (
                        <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      );
                    default:
                      return (
                        <div className="w-10 h-10 bg-gray-400 rounded-xl flex items-center justify-center text-white">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      );
                  }
                };

                const getActivityTextColor = (type: string) => {
                  switch (type) {
                    case 'booking':
                      return 'text-blue-600';
                    case 'payment':
                      return 'text-green-600';
                    case 'order':
                      return 'text-yellow-600';
                    case 'inventory':
                      return 'text-purple-600';
                    default:
                      return 'text-gray-600';
                  }
                };

                const formatTimeAgo = (dateString: string) => {
                  const now = new Date();
                  const activityDate = new Date(dateString);
                  const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));
                  
                  if (diffInMinutes < 1) return 'Vừa xong';
                  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
                  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
                  return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
                };

                return (
                  <div key={activity._id} className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300">
                    <div className="flex-shrink-0 mr-3 sm:mr-4">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.createdAt)}</p>
                    </div>
                    {activity.amount && (
                      <div className={`ml-auto text-xs sm:text-sm font-bold ${getActivityTextColor(activity.type)} flex-shrink-0`}>
                        {formatCurrency(activity.amount)}
                      </div>
                    )}
                    {activity.tableName && (
                      <div className={`ml-auto text-xs sm:text-sm font-bold ${getActivityTextColor(activity.type)} flex-shrink-0`}>
                        {activity.tableName}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <h4 className="text-lg font-bold text-gray-800 mb-2">Không có hoạt động</h4>
                <p className="text-gray-500">Chưa có hoạt động gần đây</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;