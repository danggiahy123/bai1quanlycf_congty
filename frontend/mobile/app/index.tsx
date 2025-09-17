import { useState, useEffect } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View, ScrollView, RefreshControl, FlatList } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { DEFAULT_API_URL } from '@/constants/api';

const API_URL = DEFAULT_API_URL;

type UserType = 'customer' | 'employee';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  bookingId?: {
    table: string;
    numberOfGuests: number;
    bookingDate: string;
    bookingTime: string;
    totalAmount: number;
    status: string;
  };
}

export default function IndexScreen() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (userType === 'customer' && userInfo) {
      loadNotifications();
    }
  }, [userType, userInfo]);

  const checkLoginStatus = async () => {
    try {
      const storedUserType = await AsyncStorage.getItem('userType');
      const storedUserInfo = await AsyncStorage.getItem('userInfo');
      
      if (storedUserType && storedUserInfo) {
        setUserType(storedUserType as UserType);
        setUserInfo(JSON.parse(storedUserInfo));
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userType', 'userInfo']);
      setUserType(null);
      setUserInfo(null);
      Alert.alert('Thành công', 'Đã đăng xuất');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) return;

      const response = await fetch(`${API_URL}/api/notifications/customer`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkLoginStatus();
    if (userType === 'customer') {
      await loadNotifications();
    }
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Đang tải...</ThemedText>
      </ThemedView>
    );
  }

  if (!userType || !userInfo) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Trang chủ' }} />
        <View style={styles.welcomeContainer}>
          <Ionicons name="restaurant" size={80} color="#16a34a" />
          <ThemedText type="title" style={styles.welcomeTitle}>
            Chào mừng đến với nhà hàng
          </ThemedText>
          <ThemedText style={styles.welcomeSubtitle}>
            Đăng nhập để sử dụng dịch vụ
          </ThemedText>
          
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Ionicons name="log-in" size={20} color="#fff" />
            <ThemedText style={styles.loginButtonText}>Đăng nhập</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  // Giao diện cho nhân viên
  if (userType === 'employee') {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Nhân viên' }} />
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Header */}
          <View style={styles.employeeHeader}>
            <View style={styles.userInfo}>
              <Ionicons name="person-circle" size={40} color="#dc2626" />
              <View style={styles.userDetails}>
                <ThemedText type="subtitle" style={styles.userName}>
                  {userInfo.fullName}
                </ThemedText>
                <ThemedText style={styles.userRole}>Nhân viên</ThemedText>
              </View>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="log-out" size={20} color="#dc2626" />
            </TouchableOpacity>
          </View>

          {/* Employee Features */}
          <View style={styles.featuresContainer}>
            <ThemedText type="title" style={styles.featuresTitle}>
              Quản lý nhà hàng
            </ThemedText>
            
            {/* Feature 1: Đặt bàn cho khách */}
            <TouchableOpacity 
              style={[styles.featureCard, { backgroundColor: '#dc2626' }]}
              onPress={() => router.push('/employee-bookings')}
            >
              <View style={styles.featureContent}>
                <Ionicons name="restaurant" size={32} color="#fff" />
                <View style={styles.featureText}>
                  <ThemedText style={styles.featureTitle}>Đặt bàn cho khách</ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    Quản lý booking của khách hàng
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* Feature 2: Thanh toán bàn */}
            <TouchableOpacity 
              style={[styles.featureCard, { backgroundColor: '#dc2626' }]}
              onPress={() => router.push('/employee-payments')}
            >
              <View style={styles.featureContent}>
                <Ionicons name="card" size={32} color="#fff" />
                <View style={styles.featureText}>
                  <ThemedText style={styles.featureTitle}>Thanh toán bàn</ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    Quản lý thanh toán cho các bàn
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  // Giao diện cho khách hàng (màu xanh lá)
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Trang chủ' }} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.customerHeader}>
          <View style={styles.userInfo}>
            <Ionicons name="person" size={40} color="#16a34a" />
            <View style={styles.userDetails}>
              <ThemedText type="subtitle" style={styles.userName}>
                {userInfo.fullName}
              </ThemedText>
              <ThemedText style={styles.userRole}>Khách hàng</ThemedText>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out" size={20} color="#16a34a" />
          </TouchableOpacity>
        </View>

        {/* Thông báo */}
        <View style={styles.notificationsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="notifications" size={20} color="#16a34a" />
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Thông báo từ quản lý
              </ThemedText>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </ThemedText>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={loadNotifications} style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color="#16a34a" />
            </TouchableOpacity>
          </View>
          
          {loadingNotifications ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="hourglass-outline" size={32} color="#16a34a" />
              <ThemedText style={styles.loadingText}>Đang tải thông báo...</ThemedText>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off" size={48} color="#9ca3af" />
              <ThemedText style={styles.emptyText}>Chưa có thông báo nào</ThemedText>
            </View>
          ) : (
            <>
            {notifications.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={item._id}
                style={[
                  styles.notificationCard,
                  !item.isRead && styles.unreadCard
                ]}
                onPress={() => !item.isRead && markAsRead(item._id)}
              >
                <View style={styles.notificationHeader}>
                  <View style={styles.notificationIconContainer}>
                    <Ionicons
                      name="restaurant"
                      size={20}
                      color="#16a34a"
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <ThemedText style={styles.notificationTitle}>
                      {item.title}
                    </ThemedText>
                    <ThemedText style={styles.notificationMessage}>
                      {item.message}
                    </ThemedText>
                    {item.bookingId && (
                      <View style={styles.bookingInfo}>
                        <ThemedText style={styles.bookingText}>
                          Bàn: {item.bookingId.table} | {new Date(item.bookingId.bookingDate).toLocaleDateString('vi-VN')} {item.bookingId.bookingTime}
                        </ThemedText>
                        <ThemedText style={styles.bookingAmount}>
                          {item.bookingId.totalAmount.toLocaleString('vi-VN')}đ
                        </ThemedText>
                        {/* Trạng thái đặt bàn */}
                        {item.type === 'booking_pending' && (
                          <View style={styles.statusContainer}>
                            <ThemedText style={styles.pendingStatus}>ĐANG CHỜ XÁC NHẬN</ThemedText>
                          </View>
                        )}
                        {item.type === 'booking_confirmed' && (
                          <View style={styles.statusContainer}>
                            <ThemedText style={styles.confirmedStatus}>BÀN ĐÃ ĐƯỢC DUYỆT</ThemedText>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>
                <ThemedText style={styles.notificationTime}>
                  {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                </ThemedText>
              </TouchableOpacity>
            ))}
            </>
          )}
          
          {notifications.length > 3 && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/home')}
            >
              <ThemedText style={styles.viewAllText}>Xem tất cả thông báo</ThemedText>
              <Ionicons name="chevron-forward" size={16} color="#16a34a" />
            </TouchableOpacity>
          )}
        </View>

        {/* Customer Features */}
        <View style={styles.featuresContainer}>
          <ThemedText type="title" style={styles.featuresTitle}>
            Dịch vụ nhà hàng
          </ThemedText>
          
          {/* Feature 1: Đặt bàn */}
          <TouchableOpacity 
            style={[styles.featureCard, { backgroundColor: '#16a34a' }]}
            onPress={() => router.push('/select-guests')}
          >
            <View style={styles.featureContent}>
              <Ionicons name="people" size={32} color="#fff" />
              <View style={styles.featureText}>
                <ThemedText style={styles.featureTitle}>Đặt bàn</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Đặt bàn cho bữa ăn của bạn
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 32,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    opacity: 0.7,
  },
  logoutButton: {
    padding: 8,
  },
  featuresContainer: {
    gap: 16,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featureCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  // Notification styles
  notificationsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    color: '#16a34a',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 8,
    color: '#9ca3af',
  },
  notificationCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  unreadCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
    borderLeftWidth: 3,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  notificationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  bookingInfo: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  bookingText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  bookingAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  statusContainer: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  pendingStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confirmedStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#16a34a',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'right',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  viewAllText: {
    color: '#16a34a',
    fontWeight: '600',
  },
});