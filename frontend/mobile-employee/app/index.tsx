import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { tryApiCall } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  occupiedTables: number;
  emptyTables: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalRevenue: 0,
    occupiedTables: 0,
    emptyTables: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        return;
      }

      // Load user info
      const userData = await AsyncStorage.getItem('userInfo');
      if (userData) {
        setUserInfo(JSON.parse(userData));
      }

      // Load bookings stats
      const bookingsResult = await tryApiCall('/api/bookings/employee', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Load tables stats
      const tablesResult = await tryApiCall('/api/tables', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (bookingsResult.success && tablesResult.success) {
        const bookings = bookingsResult.data.bookings || [];
        const tables = tablesResult.data || [];
        
        const totalRevenue = bookings
          .filter(b => b.status === 'confirmed')
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        setStats({
          totalBookings: bookings.length,
          pendingBookings: bookings.filter(b => b.status === 'pending').length,
          confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
          totalRevenue,
          occupiedTables: tables.filter(t => t.status === 'occupied').length,
          emptyTables: tables.filter(t => t.status === 'empty').length,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const quickActions = [
    {
      title: 'Đặt bàn cho khách',
      subtitle: 'Tạo booking cho khách hàng',
      icon: 'restaurant',
      color: '#FF6B6B',
      onPress: () => router.push('/bookings'),
    },
    {
      title: 'Duyệt bàn cho khách',
      subtitle: 'Xác nhận và quản lý đặt bàn',
      icon: 'checkmark-circle',
      color: '#4ECDC4',
      onPress: () => router.push('/bookings'),
    },
    {
      title: 'Thanh toán bàn',
      subtitle: 'Xử lý thanh toán cho các bàn',
      icon: 'card',
      color: '#45B7D1',
      onPress: () => router.push('/payments'),
    },
    {
      title: 'Order thêm món',
      subtitle: 'Thêm món ăn cho khách',
      icon: 'add-circle',
      color: '#96CEB4',
      onPress: () => router.push('/order'),
    },
  ];

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="restaurant" size={64} color={Colors.light.primary} />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Header */}
      <View style={styles.welcomeHeader}>
        <View>
          <Text style={styles.welcomeText}>Xin chào!</Text>
          <Text style={styles.userName}>{userInfo?.fullName || 'Nhân viên'}</Text>
          <Text style={styles.userRole}>Nhân viên nhà hàng</Text>
        </View>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color="#fff" />
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Đặt bàn chờ"
          value={stats.pendingBookings}
          icon="time"
          color={Colors.light.warning}
        />
        <StatCard
          title="Đã xác nhận"
          value={stats.confirmedBookings}
          icon="checkmark-circle"
          color={Colors.light.success}
        />
        <StatCard
          title="Bàn trống"
          value={stats.emptyTables}
          icon="restaurant-outline"
          color={Colors.light.primary}
        />
        <StatCard
          title="Bàn đang dùng"
          value={stats.occupiedTables}
          icon="people"
          color={Colors.light.error}
        />
      </View>

      {/* Revenue Card */}
      <View style={styles.revenueCard}>
        <View style={styles.revenueHeader}>
          <Ionicons name="trending-up" size={24} color={Colors.light.success} />
          <Text style={styles.revenueTitle}>Doanh thu hôm nay</Text>
        </View>
        <Text style={styles.revenueAmount}>
          {stats.totalRevenue.toLocaleString()}đ
        </Text>
        <Text style={styles.revenueSubtitle}>
          Từ {stats.confirmedBookings} đặt bàn đã xác nhận
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quản lý nhà hàng</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.quickActionCard, { borderLeftColor: action.color, borderLeftWidth: 4 }]}
              onPress={action.onPress}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon as any} size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionTitle}>{action.title}</Text>
              <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} style={styles.arrowIcon} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.recentActivitySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
          <TouchableOpacity onPress={() => router.push('/notifications')}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activityCard}>
          <Ionicons name="notifications" size={20} color={Colors.light.primary} />
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Hệ thống đã sẵn sàng</Text>
            <Text style={styles.activityTime}>Vừa xong</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.light.primary,
  },
  welcomeText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  revenueCard: {
    margin: 16,
    backgroundColor: Colors.light.card,
    padding: 20,
    borderRadius: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  revenueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.success,
    marginBottom: 4,
  },
  revenueSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  quickActionsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 44) / 2,
    backgroundColor: Colors.light.card,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  arrowIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -8,
  },
  recentActivitySection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityContent: {
    marginLeft: 12,
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});
