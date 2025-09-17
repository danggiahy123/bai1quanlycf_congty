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
  const [deletingNotification, setDeletingNotification] = useState<string | null>(null);

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
      
      // Load both personal notifications and general notifications
      const promises = [];
      
      if (token) {
        // Personal notifications
        promises.push(
          fetch(`${API_URL}/api/notifications/customer`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
        );
      }
      
      // General notifications (for all customers)
      promises.push(
        fetch(`${API_URL}/api/notifications/general`)
      );

      const responses = await Promise.all(promises);
      let allNotifications = [];
      let totalUnreadCount = 0;

      for (const response of responses) {
        if (response.ok) {
          const data = await response.json();
          if (data.notifications) {
            allNotifications = [...allNotifications, ...data.notifications];
          }
          if (data.unreadCount) {
            totalUnreadCount += data.unreadCount;
          }
        }
      }

      // Sort by creation date and remove duplicates
      allNotifications = allNotifications
        .filter((notification, index, self) => 
          index === self.findIndex(n => n._id === notification._id)
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setNotifications(allNotifications);
      setUnreadCount(totalUnreadCount);
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

  const deleteNotification = async (notificationId: string) => {
    try {
      setDeletingNotification(notificationId);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        // Giảm unread count nếu thông báo chưa đọc
        const notification = notifications.find(notif => notif._id === notificationId);
        if (notification && !notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setDeletingNotification(null);
    }
  };

  const clearOldNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      // Xóa tất cả thông báo đã đọc
      const readNotifications = notifications.filter(notif => notif.isRead);
      
      for (const notification of readNotifications) {
        await deleteNotification(notification._id);
      }
    } catch (error) {
      console.error('Error clearing old notifications:', error);
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
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroBackground}>
            <View style={styles.heroContent}>
              <View style={styles.welcomeText}>
                <ThemedText style={styles.heroTitle}>Chào mừng,</ThemedText>
                <ThemedText style={styles.heroSubtitle}>{userInfo.fullName}</ThemedText>
                <ThemedText style={styles.heroDescription}>Khách hàng VIP</ThemedText>
              </View>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Ionicons name="log-out" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <TouchableOpacity 
            style={styles.primaryAction}
            onPress={() => router.push('/select-guests')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="restaurant" size={32} color="#fff" />
            </View>
            <View style={styles.actionContent}>
              <ThemedText style={styles.actionTitle}>ĐẶT BÀN NGAY</ThemedText>
              <ThemedText style={styles.actionSubtitle}>Chọn bàn và món ăn</ThemedText>
            </View>
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>


        {/* Notifications */}
        <View style={styles.notificationsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="notifications" size={20} color="#16a34a" />
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Thông báo mới
              </ThemedText>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </ThemedText>
                </View>
              )}
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={clearOldNotifications} style={styles.clearButton}>
                <Ionicons name="trash" size={16} color="#ef4444" />
                <ThemedText style={styles.clearButtonText}>Xóa cũ</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={loadNotifications} style={styles.refreshButton}>
                <Ionicons name="refresh" size={20} color="#16a34a" />
              </TouchableOpacity>
            </View>
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
              <View
                key={item._id}
                style={[
                  styles.notificationCard,
                  !item.isRead && styles.unreadCard,
                  item.isRead && styles.readCard
                ]}
              >
                <TouchableOpacity
                  style={styles.notificationContent}
                  onPress={() => !item.isRead && markAsRead(item._id)}
                  disabled={item.isRead}
                >
                  <View style={styles.notificationHeader}>
                    <View style={styles.notificationIconContainer}>
                      <Ionicons
                        name="restaurant"
                        size={20}
                        color={item.isRead ? "#9ca3af" : "#16a34a"}
                      />
                    </View>
                    <View style={styles.notificationTextContent}>
                      <View style={styles.titleRow}>
                        <ThemedText style={[
                          styles.notificationTitle,
                          item.isRead && styles.readText
                        ]}>
                          {item.title}
                        </ThemedText>
                        {item.isRead && (
                          <View style={styles.readBadge}>
                            <ThemedText style={styles.readBadgeText}>ĐÃ ĐỌC</ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText style={[
                        styles.notificationMessage,
                        item.isRead && styles.readText
                      ]}>
                        {item.message}
                      </ThemedText>
                      {item.bookingId && (
                        <View style={styles.bookingInfo}>
                          <ThemedText style={[
                            styles.bookingText,
                            item.isRead && styles.readText
                          ]}>
                            Bàn: {item.bookingId.table} | {new Date(item.bookingId.bookingDate).toLocaleDateString('vi-VN')} {item.bookingId.bookingTime}
                          </ThemedText>
                          <ThemedText style={[
                            styles.bookingAmount,
                            item.isRead && styles.readText
                          ]}>
                            {item.bookingId.totalAmount.toLocaleString('vi-VN')}đ
                          </ThemedText>
                          {/* Trạng thái đặt bàn */}
                          {item.type === 'booking_pending' && (
                            <View style={styles.statusContainer}>
                              <ThemedText style={[
                                styles.pendingStatus,
                                item.isRead && styles.readStatus
                              ]}>ĐANG CHỜ XÁC NHẬN</ThemedText>
                            </View>
                          )}
                          {item.type === 'booking_confirmed' && (
                            <View style={styles.statusContainer}>
                              <ThemedText style={[
                                styles.confirmedStatus,
                                item.isRead && styles.readStatus
                              ]}>BÀN ĐÃ ĐƯỢC DUYỆT</ThemedText>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                    {!item.isRead && <View style={styles.unreadDot} />}
                  </View>
                  <ThemedText style={[
                    styles.notificationTime,
                    item.isRead && styles.readText
                  ]}>
                    {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                  </ThemedText>
                </TouchableOpacity>
                
                {/* Nút xóa thông báo */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteNotification(item._id)}
                  disabled={deletingNotification === item._id}
                >
                  {deletingNotification === item._id ? (
                    <Ionicons name="hourglass-outline" size={16} color="#9ca3af" />
                  ) : (
                    <Ionicons name="trash" size={16} color="#ef4444" />
                  )}
                </TouchableOpacity>
              </View>
            ))}
            </>
          )}
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
  // Hero Section
  heroSection: {
    marginBottom: 20,
  },
  heroBackground: {
    backgroundColor: '#16a34a',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  heroDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  logoutText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '600',
  },
  // Quick Actions
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  primaryAction: {
    backgroundColor: '#16a34a',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },

  // Stats Section
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsContent: {
    marginLeft: 12,
  },
  statsNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  statsLabel: {
    fontSize: 12,
    color: '#6b7280',
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
    borderRadius: 16,
    padding: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },

  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  featureItem: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  // Notification styles
  notificationsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    gap: 4,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
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
    position: 'relative',
  },
  unreadCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
    borderLeftWidth: 3,
  },
  readCard: {
    backgroundColor: '#f8f9fa',
    borderColor: '#9ca3af',
    borderLeftWidth: 3,
    opacity: 0.7,
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
  notificationTextContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  readBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  readBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
  },
  readText: {
    opacity: 0.6,
  },
  readStatus: {
    opacity: 0.5,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#fef2f2',
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