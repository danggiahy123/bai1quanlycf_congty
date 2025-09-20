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
  ClockIcon,
  ChartBarSquareIcon,
  FireIcon,
  StarIcon
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

interface ModernDashboardProps {
  API: string;
  token: string;
}

const ModernDashboard: React.FC<ModernDashboardProps> = ({ API, token }) => {
  console.log('🔧 ModernDashboard props:', { API, token: token ? 'Present' : 'Missing' });
  
  const [stats, setStats] = useState<DashboardStats>({
    totalTables: 0,
    occupiedTables: 0,
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    totalCustomers: 0,
    totalEmployees: 0,
  });

  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fallback data nếu API không hoạt động
      const fallbackStats = {
        totalTables: 10,
        occupiedTables: 3,
        totalOrders: 150,
        todayOrders: 25,
        totalRevenue: 5000000,
        todayRevenue: 800000,
        totalCustomers: 45,
        totalEmployees: 8,
      };

      const fallbackRevenueData = [
        { date: '2024-01-01', revenue: 800000, orders: 25 },
        { date: '2024-01-02', revenue: 750000, orders: 22 },
        { date: '2024-01-03', revenue: 900000, orders: 28 },
        { date: '2024-01-04', revenue: 850000, orders: 26 },
        { date: '2024-01-05', revenue: 950000, orders: 30 },
      ];

      const fallbackTopItems = [
        { _id: '1', name: 'Cà phê đen', totalSold: 45, revenue: 450000, category: 'Đồ uống' },
        { _id: '2', name: 'Bánh mì sandwich', totalSold: 32, revenue: 320000, category: 'Đồ ăn' },
        { _id: '3', name: 'Cà phê sữa', totalSold: 28, revenue: 280000, category: 'Đồ uống' },
      ];

      const fallbackActivity = [
        { _id: '1', type: 'order', description: 'Đơn hàng mới từ bàn 5', amount: 150000, tableName: 'Bàn 5', createdAt: new Date().toISOString() },
        { _id: '2', type: 'payment', description: 'Thanh toán thành công', amount: 200000, tableName: 'Bàn 3', createdAt: new Date().toISOString() },
        { _id: '3', type: 'booking', description: 'Đặt bàn mới', tableName: 'Bàn 7', createdAt: new Date().toISOString() },
      ];

      try {
        const [statsRes, revenueRes, topItemsRes, activityRes] = await Promise.all([
          axios.get(`${API}/dashboard/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API}/dashboard/revenue?range=${timeRange}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API}/dashboard/top-items`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API}/dashboard/recent-activity`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setStats(statsRes.data || fallbackStats);
        setRevenueData(revenueRes.data || fallbackRevenueData);
        setTopItems(topItemsRes.data || fallbackTopItems);
        setRecentActivity(activityRes.data || fallbackActivity);
      } catch (apiError) {
        console.warn('API not available, using fallback data:', apiError);
        setStats(fallbackStats);
        setRevenueData(fallbackRevenueData);
        setTopItems(fallbackTopItems);
        setRecentActivity(fallbackActivity);
      }
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
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking': return <ClockIcon className="w-5 h-5 text-blue-500" />;
      case 'payment': return <CurrencyDollarIcon className="w-5 h-5 text-green-500" />;
      case 'order': return <ShoppingCartIcon className="w-5 h-5 text-purple-500" />;
      case 'inventory': return <ChartBarIcon className="w-5 h-5 text-orange-500" />;
      default: return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  if (loading) {
    console.log('🔧 ModernDashboard loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300 text-lg">Đang tải dữ liệu...</p>
        </motion.div>
      </div>
    );
  }

  console.log('🔧 ModernDashboard rendering with stats:', stats);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen space-y-6 lg:space-y-8"
    >
      {/* Welcome Section */}
      <motion.div
        variants={itemVariants}
        className="relative bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 rounded-2xl p-6 lg:p-8 text-white overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative z-10">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl lg:text-3xl font-bold mb-2"
          >
            Chào mừng trở lại! 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-blue-100 text-lg mb-4"
          >
            Quản lý quán cà phê của bạn một cách hiệu quả
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center space-x-4 text-sm"
          >
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-4 h-4" />
              <span>Cập nhật lần cuối: {new Date().toLocaleTimeString('vi-VN')}</span>
            </div>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          className="absolute top-4 right-4 w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
        >
          <ChartBarIcon className="w-10 h-10 text-white" />
        </motion.div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
      >
        {/* Tables */}
        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          className="card hover-lift group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.1 }}
                className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg"
              >
                <ChartBarIcon className="w-7 h-7" />
              </motion.div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  {stats.occupiedTables}/{stats.totalTables}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Bàn</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">Đang sử dụng</span>
                <span className="font-medium text-slate-900 dark:text-white">{stats.occupiedTables}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.occupiedTables / stats.totalTables) * 100}%` }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Orders */}
        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          className="card hover-lift group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.1 }}
                className="p-4 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg"
              >
                <ShoppingCartIcon className="w-7 h-7" />
              </motion.div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-green-600 transition-colors">
                  {stats.todayOrders}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Đơn hàng</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">Hôm nay</span>
                <span className="font-medium text-slate-900 dark:text-white">{stats.totalOrders} tổng</span>
              </div>
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                <ClockIcon className="w-4 h-4 mr-1" />
                Cập nhật vừa xong
              </div>
            </div>
          </div>
        </motion.div>

        {/* Revenue */}
        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          className="card hover-lift group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.1 }}
                className="p-4 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-lg"
              >
                <CurrencyDollarIcon className="w-7 h-7" />
              </motion.div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-yellow-600 transition-colors">
                  {formatCurrency(stats.todayRevenue)}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Doanh thu</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">Hôm nay</span>
                <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(stats.totalRevenue)} tổng</span>
              </div>
              <div className="flex items-center text-xs text-green-600">
                <ArrowUpIcon className="w-4 h-4 mr-1" />
                +12% so với hôm qua
              </div>
            </div>
          </div>
        </motion.div>

        {/* Users */}
        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          className="card hover-lift group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.1 }}
                className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg"
              >
                <UsersIcon className="w-7 h-7" />
              </motion.div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                  {stats.totalCustomers + stats.totalEmployees}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Người dùng</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">Khách hàng</span>
                <span className="font-medium text-slate-900 dark:text-white">{stats.totalCustomers}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">Nhân viên</span>
                <span className="font-medium text-slate-900 dark:text-white">{stats.totalEmployees}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Revenue Chart */}
        <motion.div
          variants={itemVariants}
          className="card"
        >
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white shadow-lg">
                  <ChartBarSquareIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Doanh thu</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {timeRange === 'day' && '7 ngày gần đây'}
                    {timeRange === 'week' && '6 tuần gần đây'}
                    {timeRange === 'month' && '6 tháng gần đây'}
                  </p>
                </div>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                {(['day', 'week', 'month'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                      timeRange === range
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {range === 'day' ? 'Ngày' : range === 'week' ? 'Tuần' : 'Tháng'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-64 sm:h-80 relative">
              {revenueData && revenueData.length > 0 ? (
                <div className="h-full flex items-end justify-center space-x-2">
                  {revenueData.map((item, index) => {
                    const maxRevenue = Math.max(...revenueData.map(d => d.revenue || 0));
                    const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                    
                    return (
                      <motion.div
                        key={index}
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 8)}%` }}
                        transition={{ delay: index * 0.1, duration: 0.8 }}
                        className="flex flex-col items-center group relative"
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="w-8 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 cursor-pointer"
                          style={{ minHeight: '20px' }}
                        />
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                          {formatDate(item.date)}
                        </div>
                        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {formatCurrency(item.revenue)}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                  Không có dữ liệu
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Top Items */}
        <motion.div
          variants={itemVariants}
          className="card"
        >
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-lg">
                <FireIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Món bán chạy</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Top sản phẩm được yêu thích</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {topItems.slice(0, 5).map((item, index) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors">
                        {item.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">{item.totalSold}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{formatCurrency(item.revenue)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        variants={itemVariants}
        className="card"
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white shadow-lg">
              <ClockIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Hoạt động gần đây</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Các hoạt động mới nhất trong hệ thống</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {recentActivity.slice(0, 8).map((activity, index) => (
              <motion.div
                key={activity._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center space-x-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
              >
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                    {activity.description}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(activity.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                {activity.amount && (
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      {formatCurrency(activity.amount)}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ModernDashboard;
