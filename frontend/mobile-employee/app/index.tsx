import { useState, useEffect } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View, ScrollView, RefreshControl, FlatList } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { DEFAULT_API_URL } from '@/constants/api';
import { useSocket } from '@/hooks/useSocket';

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
  const socket = useSocket();

  useEffect(() => {
    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (userType === 'employee' && userInfo) {
      loadNotifications();
    }
  }, [userType, userInfo]);

  // Socket.IO listeners
  useEffect(() => {
    if (!socket || userType !== 'employee') return;

    // Lắng nghe thông báo mới
    socket.on('new_notification', (data) => {
      console.log('📱 Nhận thông báo mới:', data);
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Lắng nghe thông báo cọc thành công
    socket.on('payment_confirmed', (data) => {
      console.log('💰 Nhận thông báo cọc thành công:', data);
      // Reload notifications để cập nhật
      loadNotifications();
    });

    return () => {
      socket.off('new_notification');
      socket.off('payment_confirmed');
    };
  }, [socket, userType]);

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
          fetch(`${API_URL}/api/notifications/employee`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
        );
      }
      
      // General notifications (for all employees)
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
    if (userType === 'employee') {
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
        <Stack.Screen options={{ title: 'Nhân viên' }} />
        <View style={styles.welcomeContainer}>
          {/* Logo và tên quán */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="cafe" size={60} color="#8B4513" />
            </View>
            <ThemedText type="title" style={styles.restaurantName}>
              Quán Coffee waterdg
            </ThemedText>
            <ThemedText style={styles.restaurantSubtitle}>
              Chào mừng nhân viên đến với quán cà phê
            </ThemedText>
          </View>

          {/* Giới thiệu đơn giản */}
          <View style={styles.introContainer}>
            <ThemedText style={styles.introTitle}>Đăng nhập nhân viên</ThemedText>
            <ThemedText style={styles.introText}>
              Vui lòng đăng nhập để sử dụng các tính năng dành cho nhân viên.
            </ThemedText>
          </View>
          
          {/* Nút đăng nhập */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Ionicons name="log-in" size={24} color="#fff" />
            <ThemedText style={styles.loginButtonText}>Đăng nhập nhân viên</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  // Giao diện cho nhân viên (copy 100% từ khách hàng + thêm tính năng đặt bàn giùm khách)
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Nhân viên' }} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          <View style={styles.patternCircle1} />
          <View style={styles.patternCircle2} />
          <View style={styles.patternCircle3} />
          <View style={styles.patternCircle4} />
          <View style={styles.patternCircle5} />
        </View>

        {/* Hero Section - Integrated with blue background */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <View style={styles.welcomeSection}>
              <View style={styles.greetingContainer}>
                <View style={styles.greetingTextContainer}>
                  <ThemedText style={styles.heroGreeting}>Xin chào nhân viên,</ThemedText>
                  <ThemedText style={styles.heroName}>{userInfo.fullName}</ThemedText>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                  <Ionicons name="log-out-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
            
          </View>
        </View>

        {/* Quick Actions - Redesigned for Employee */}
        <View style={styles.quickActionsSection}>
          {/* Đặt bàn cho khách - Tính năng chính */}
          <TouchableOpacity 
            style={styles.primaryAction}
            onPress={() => router.push('/book-for-customer')}
          >
            <View style={styles.actionGradient}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="person-add" size={32} color="#3b82f6" />
              </View>
              <View style={styles.actionContent}>
                <ThemedText style={styles.actionTitle}>ĐẶT BÀN GIÙM KHÁCH</ThemedText>
                <ThemedText style={styles.actionSubtitle}>Nhập SĐT khách và đặt bàn</ThemedText>
              </View>
              <View style={styles.actionArrow}>
                <Ionicons name="arrow-forward" size={24} color="#3b82f6" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Đặt bàn cho mình - Tính năng phụ */}
          <TouchableOpacity 
            style={styles.secondaryAction}
            onPress={() => router.push('/select-guests')}
          >
            <View style={styles.secondaryActionGradient}>
              <View style={styles.secondaryActionIconContainer}>
                <Ionicons name="restaurant" size={24} color="#10b981" />
              </View>
              <View style={styles.secondaryActionContent}>
                <ThemedText style={styles.secondaryActionTitle}>Đặt bàn cho mình</ThemedText>
                <ThemedText style={styles.secondaryActionSubtitle}>Đặt bàn cá nhân</ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <View style={styles.notificationsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="notifications" size={20} color="#3b82f6" />
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
                <Ionicons name="refresh" size={20} color="#3b82f6" />
              </TouchableOpacity>
            </View>
          </View>
          
          {loadingNotifications ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="hourglass-outline" size={32} color="#3b82f6" />
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
                      {item.type === 'deposit_pending_approval' ? (
                        <Ionicons
                          name="card"
                          size={24}
                          color={item.isRead ? "#9ca3af" : "#f59e0b"}
                        />
                      ) : item.type === 'deposit_confirmed' ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={item.isRead ? "#9ca3af" : "#10b981"}
                        />
                      ) : (
                        <Ionicons
                          name="restaurant"
                          size={20}
                          color={item.isRead ? "#9ca3af" : "#3b82f6"}
                        />
                      )}
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
                          ]} numberOfLines={1}>
                            🏷️ Bàn: {item.bookingId?.table || 'N/A'}
                          </ThemedText>
                          <ThemedText style={[
                            styles.bookingText,
                            item.isRead && styles.readText
                          ]} numberOfLines={1}>
                            📅 {item.bookingId?.bookingDate ? new Date(item.bookingId.bookingDate).toLocaleDateString('vi-VN') : 'N/A'} lúc {item.bookingId?.bookingTime || 'N/A'}
                          </ThemedText>
                          <ThemedText style={[
                            styles.bookingAmount,
                            item.isRead && styles.readText
                          ]}>
                            💰 {item.bookingId?.totalAmount?.toLocaleString('vi-VN') || '0'}đ
                          </ThemedText>
                          {/* Trạng thái đặt bàn */}
                          {item.type === 'deposit_pending_approval' && (
                            <View style={styles.statusContainer}>
                              <View style={styles.statusBadge}>
                                <Ionicons name="time" size={16} color="#f59e0b" />
                                <ThemedText style={[
                                  styles.pendingStatus,
                                  item.isRead && styles.readStatus
                                ]}>ĐANG CHỜ XÁC NHẬN</ThemedText>
                              </View>
                            </View>
                          )}
                          {item.type === 'deposit_confirmed' && (
                            <View style={styles.statusContainer}>
                              <View style={styles.statusBadge}>
                                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                                <ThemedText style={[
                                  styles.confirmedStatus,
                                  item.isRead && styles.readStatus
                                ]}>XÁC NHẬN THÀNH CÔNG</ThemedText>
                              </View>
                            </View>
                          )}
                          {item.type === 'booking_pending' && (
                            <View style={styles.statusContainer}>
                              <View style={styles.statusBadge}>
                                <Ionicons name="time" size={16} color="#f59e0b" />
                                <ThemedText style={[
                                  styles.pendingStatus,
                                  item.isRead && styles.readStatus
                                ]}>ĐANG CHỜ XÁC NHẬN</ThemedText>
                              </View>
                            </View>
                          )}
                          {item.type === 'booking_confirmed' && (
                            <View style={styles.statusContainer}>
                              <View style={styles.statusBadge}>
                                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                                <ThemedText style={[
                                  styles.confirmedStatus,
                                  item.isRead && styles.readStatus
                                ]}>BÀN ĐÃ ĐƯỢC DUYỆT</ThemedText>
                              </View>
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
    backgroundColor: '#3b82f6',
    position: 'relative',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
    position: 'relative',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    zIndex: 0,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  restaurantSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  introContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  introText: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
    textAlign: 'center',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Hero Section - Redesigned
  heroSection: {
    marginBottom: 24,
    position: 'relative',
    zIndex: 1,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  patternCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    top: 50,
    right: -30,
  },
  patternCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    top: 200,
    right: 20,
  },
  patternCircle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    bottom: 200,
    left: -20,
  },
  patternCircle4: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    top: 400,
    left: 50,
  },
  patternCircle5: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fff',
    bottom: 100,
    right: 100,
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greetingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  greetingTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  heroGreeting: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 2,
    fontWeight: '500',
  },
  heroName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 25,
    minWidth: 50,
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  // Quick Actions - Redesigned for Employee
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
    position: 'relative',
    zIndex: 1,
  },
  primaryAction: {
    borderRadius: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  actionGradient: {
    backgroundColor: '#ffffff',
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    opacity: 0.9,
  },
  actionArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Secondary Action
  secondaryAction: {
    borderRadius: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  secondaryActionGradient: {
    backgroundColor: '#ffffff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  secondaryActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  secondaryActionContent: {
    flex: 1,
  },
  secondaryActionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 2,
  },
  secondaryActionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    opacity: 0.9,
  },
  
  // Notification styles
  notificationsSection: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    zIndex: 1,
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
    color: '#3b82f6',
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
    color: '#3b82f6',
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
    padding: 10,
    marginBottom: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    position: 'relative',
    maxWidth: '100%',
  },
  unreadCard: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
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
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    minWidth: 0,
  },
  notificationTextContent: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    flex: 1,
  },
  readBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    flexShrink: 0,
  },
  readBadgeText: {
    fontSize: 9,
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
    color: '#3b82f6',
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
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  bookingAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statusContainer: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    color: '#10b981',
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
});
