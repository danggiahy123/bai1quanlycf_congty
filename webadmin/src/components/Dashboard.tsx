import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
      const [statsRes, revenueRes, topItemsRes] = await Promise.all([
        axios.get(`${API}/api/dashboard/stats`, { headers }),
        axios.get(`${API}/api/dashboard/revenue?range=${timeRange}`, { headers }),
        axios.get(`${API}/api/dashboard/top-items`, { headers })
      ]);

      setStats(statsRes.data);
      setRevenueData(revenueRes.data);
      setTopItems(topItemsRes.data);
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Tổng quan hoạt động quán cà phê</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Tables */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng số bàn</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalTables}</p>
              <p className="text-sm text-gray-500">
                {stats.occupiedTables} đang sử dụng
              </p>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</p>
              <p className="text-sm text-gray-500">
                {stats.todayOrders} hôm nay
              </p>
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-sm text-gray-500">
                {formatCurrency(stats.todayRevenue)} hôm nay
              </p>
            </div>
          </div>
        </div>

        {/* Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Người dùng</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCustomers + stats.totalEmployees}</p>
              <p className="text-sm text-gray-500">
                {stats.totalCustomers} khách, {stats.totalEmployees} nhân viên
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Doanh thu</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setTimeRange('day')}
                className={`px-3 py-1 text-sm rounded-md ${
                  timeRange === 'day'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Ngày
              </button>
              <button
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1 text-sm rounded-md ${
                  timeRange === 'week'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Tuần
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1 text-sm rounded-md ${
                  timeRange === 'month'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Tháng
              </button>
            </div>
          </div>
          
          <div className="h-64">
            {revenueData.length > 0 ? (
              <div className="h-full flex items-end space-x-2">
                {revenueData.map((item, index) => {
                  const maxRevenue = Math.max(...revenueData.map(d => d.revenue));
                  const height = (item.revenue / maxRevenue) * 100;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${height}%` }}
                        title={`${formatDate(item.date)}: ${formatCurrency(item.revenue)}`}
                      ></div>
                      <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                        {formatDate(item.date)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Không có dữ liệu
              </div>
            )}
          </div>
        </div>

        {/* Top Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top món bán chạy</h3>
          
          <div className="space-y-4">
            {topItems.length > 0 ? (
              topItems.map((item, index) => (
                <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{item.totalSold} món</p>
                    <p className="text-sm text-gray-500">{formatCurrency(item.revenue)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                Không có dữ liệu
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Hoạt động gần đây</h3>
        <div className="space-y-4">
          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Bàn 5 đã thanh toán</p>
              <p className="text-xs text-gray-500">2 phút trước</p>
            </div>
            <div className="ml-auto text-sm font-semibold text-green-600">
              +150.000 VNĐ
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-blue-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Đơn hàng mới #1234</p>
              <p className="text-xs text-gray-500">5 phút trước</p>
            </div>
            <div className="ml-auto text-sm font-semibold text-blue-600">
              Bàn 3
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Khách hàng mới đăng ký</p>
              <p className="text-xs text-gray-500">10 phút trước</p>
            </div>
            <div className="ml-auto text-sm font-semibold text-yellow-600">
              +1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
