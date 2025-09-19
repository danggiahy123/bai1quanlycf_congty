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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userInfo');
            router.replace('/login');
          },
        },
      ]
    );
  };

  const mainFeatures = [
    {
      id: 'booking',
      title: 'Đặt bàn cho khách',
      subtitle: 'Tạo đặt bàn trực tiếp',
      icon: 'restaurant',
      color: '#FF6B6B',
      onPress: () => router.push('/booking-create'),
    },
    {
      id: 'approve',
      title: 'Duyệt bàn cho khách',
      subtitle: 'Xác nhận đặt bàn',
      icon: 'checkmark-circle',
      color: '#4ECDC4',
      onPress: () => router.push('/booking-approve'),
    },
    {
      id: 'order-payment',
      title: 'Gọi món & Thanh toán',
      subtitle: 'Thêm món và xử lý thanh toán',
      icon: 'card',
      color: '#45B7D1',
      onPress: () => router.push('/order-payment'),
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Ionicons name="restaurant" size={48} color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="white" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {userInfo?.fullName || 'Nhân viên'}
              </Text>
              <Text style={styles.userRole}>Nhân viên nhà hàng</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.pendingBookings}</Text>
            <Text style={styles.statLabel}>Chờ xác nhận</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.confirmedBookings}</Text>
            <Text style={styles.statLabel}>Đã xác nhận</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.emptyTables}</Text>
            <Text style={styles.statLabel}>Bàn trống</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.occupiedTables}</Text>
            <Text style={styles.statLabel}>Bàn đang dùng</Text>
          </View>
        </View>
      </View>

      {/* Main Features */}
      <View style={styles.featuresContainer}>
        <Text style={styles.sectionTitle}>Quản lý nhà hàng</Text>
        <View style={styles.featuresGrid}>
          {mainFeatures.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={[styles.featureCard, { borderLeftColor: feature.color }]}
              onPress={feature.onPress}
            >
              <View style={styles.featureContent}>
                <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                  <Ionicons name={feature.icon as any} size={24} color="white" />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.text} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Revenue Summary */}
      <View style={styles.revenueContainer}>
        <Text style={styles.sectionTitle}>Doanh thu hôm nay</Text>
        <View style={styles.revenueCard}>
          <Text style={styles.revenueAmount}>
            {formatCurrency(stats.totalRevenue)}
          </Text>
          <Text style={styles.revenueLabel}>
            {stats.confirmedBookings} đặt bàn đã xác nhận
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  userRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
  featuresContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  revenueContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  revenueCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  revenueAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  revenueLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});