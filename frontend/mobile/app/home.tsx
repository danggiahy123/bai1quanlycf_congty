import { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Alert, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOrder } from '@/components/order-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationCard from '@/components/NotificationCard';
import { Ionicons } from '@expo/vector-icons';
import { tryApiCall } from '@/constants/api';

type User = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
};

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  bookingId?: {
    _id: string;
    bookingDate: string;
    bookingTime: string;
    table: string;
    totalAmount: number;
    status: string;
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const { state, setGuests } = useOrder();
  const [localGuests, setLocalGuests] = useState(state.numberOfGuests ? String(state.numberOfGuests) : '');
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUser();
    loadNotifications();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userInfo');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const result = await tryApiCall('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (result.success) {
        setNotifications(result.data.notifications);
        setUnreadCount(result.data.unreadCount);
      } else {
        console.error('Error loading notifications:', result.error);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const result = await tryApiCall(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (result.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const result = await tryApiCall(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (result.success) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
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
            router.replace('/');
          },
        },
      ]
    );
  };

  const goNext = () => {
    router.push('/select-guests');
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header đơn giản với thông tin user */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          {user && (
            <View style={styles.userInfo}>
              <ThemedText style={styles.welcomeText}>Xin chào {user.fullName}</ThemedText>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Ionicons name="log-out-outline" size={16} color="#10b981" />
                <ThemedText style={styles.logoutText}>Đăng xuất</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Phần chính - Đặt bàn ngay */}
      <View style={styles.mainCard}>
        <TouchableOpacity onPress={goNext} style={styles.mainButton}>
          <Ionicons name="restaurant" size={24} color="#fff" />
          <ThemedText style={styles.mainButtonText}>ĐẶT BÀN NGAY</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Phần thanh toán */}
      <View style={styles.paymentCard}>
        <TouchableOpacity 
          onPress={() => router.push('/payment')} 
          style={styles.paymentButton}
        >
          <Ionicons name="card" size={24} color="#fff" />
          <ThemedText style={styles.paymentButtonText}>💳 THANH TOÁN</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Phần hiển thị thông báo */}
      <View style={styles.notificationsSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="notifications" size={20} color="#10b981" />
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
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color="#10b981" />
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="hourglass-outline" size={32} color="#10b981" />
            <ThemedText style={styles.loadingText}>Đang tải thông báo...</ThemedText>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={48} color="#9ca3af" />
            <ThemedText style={styles.emptyText}>Chưa có thông báo nào</ThemedText>
          </View>
        ) : (
          <FlatList
            data={notifications.slice(0, 5)} // Chỉ hiển thị 5 thông báo gần nhất
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <NotificationCard
                notification={item}
                onPress={() => !item.isRead && markAsRead(item._id)}
                onDelete={() => deleteNotification(item._id)}
              />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
        
        {notifications.length > 5 && (
          <TouchableOpacity style={styles.viewAllButton}>
            <ThemedText style={styles.viewAllText}>Xem tất cả thông báo</ThemedText>
            <Ionicons name="chevron-forward" size={16} color="#10b981" />
          </TouchableOpacity>
        )}
      </View>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4', // Màu nền xanh lá nhạt
    padding: 20,
  },
  headerCard: { 
    width: '100%', 
    backgroundColor: '#fff',
    padding: 16, 
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    alignItems: 'center' 
  },
  userInfo: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  welcomeText: { 
    color: '#111827', 
    fontSize: 16, 
    fontWeight: '500',
  },
  logoutButton: { 
    backgroundColor: '#f0fdf4', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  logoutText: { 
    color: '#10b981', 
    fontSize: 14,
    fontWeight: '500',
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mainButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentCard: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  notificationsSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 400,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 8,
  },
  viewAllText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
});


