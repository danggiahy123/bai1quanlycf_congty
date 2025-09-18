import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  FlatList,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { tryApiCall } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSocket } from '../hooks/useSocket';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  bookingId?: {
    _id: string;
    table: string;
    numberOfGuests: number;
    bookingDate: string;
    bookingTime: string;
    totalAmount: number;
    status: string;
  };
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const socket = useSocket();

  useEffect(() => {
    loadNotifications();
  }, []);

  // Socket.IO listeners
  useEffect(() => {
    if (!socket) return;

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
  }, [socket]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        return;
      }

      const result = await tryApiCall('/api/notifications/employee', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (result.success) {
        setNotifications(result.data.notifications || []);
        setUnreadCount(result.data.unreadCount || 0);
      } else {
        throw new Error(result.error || 'Không thể tải thông báo');
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Lỗi', 'Không thể kết nối đến server');
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const result = await tryApiCall(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
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

  const markAllAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const result = await tryApiCall('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (result.success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
        Alert.alert('Thành công', 'Đã đánh dấu tất cả thông báo đã đọc');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('Lỗi', 'Không thể đánh dấu tất cả thông báo');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
        return 'restaurant';
      case 'booking_cancelled':
        return 'close-circle';
      case 'payment_completed':
        return 'card';
      case 'deposit_confirmed':
        return 'cash';
      case 'order_status_changed':
        return 'receipt';
      case 'table_status_changed':
        return 'grid';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
        return Colors.light.success;
      case 'booking_cancelled':
        return Colors.light.error;
      case 'payment_completed':
        return Colors.light.primary;
      case 'deposit_confirmed':
        return Colors.light.warning;
      case 'order_status_changed':
        return Colors.light.primary;
      case 'table_status_changed':
        return Colors.light.success;
      default:
        return Colors.light.icon;
    }
  };

  const getNotificationTypeText = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
        return 'Đặt bàn';
      case 'booking_cancelled':
        return 'Hủy bàn';
      case 'payment_completed':
        return 'Thanh toán';
      case 'deposit_confirmed':
        return 'Cọc tiền';
      case 'order_status_changed':
        return 'Đơn hàng';
      case 'table_status_changed':
        return 'Bàn';
      default:
        return 'Thông báo';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Vừa xong';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} giờ trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.isRead && styles.unreadCard
      ]}
      onPress={() => markAsRead(item._id)}
    >
      <View style={styles.notificationHeader}>
        <View style={[styles.notificationIconContainer, { backgroundColor: getNotificationColor(item.type) + '20' }]}>
          <Ionicons
            name={getNotificationIcon(item.type) as any}
            size={24}
            color={getNotificationColor(item.type)}
          />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationTitleRow}>
            <Text style={styles.notificationType}>
              {getNotificationTypeText(item.type)}
            </Text>
            <Text style={styles.notificationTime}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
          <Text style={styles.notificationTitle}>
            {item.title}
          </Text>
          <Text style={styles.notificationMessage}>
            {item.message}
          </Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
      
      {item.bookingId && (
        <View style={styles.bookingInfo}>
          <View style={styles.bookingInfoRow}>
            <Ionicons name="restaurant" size={16} color={Colors.light.icon} />
            <Text style={styles.bookingText}>
              Bàn {item.bookingId.table} • {item.bookingId.numberOfGuests} người
            </Text>
          </View>
          <View style={styles.bookingInfoRow}>
            <Ionicons name="calendar" size={16} color={Colors.light.icon} />
            <Text style={styles.bookingText}>
              {new Date(item.bookingId.bookingDate).toLocaleDateString('vi-VN')} • {item.bookingId.bookingTime}
            </Text>
          </View>
          <View style={styles.bookingInfoRow}>
            <Ionicons name="cash" size={16} color={Colors.light.icon} />
            <Text style={styles.bookingText}>
              {item.bookingId.totalAmount.toLocaleString()}đ • {item.bookingId.status}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="notifications" size={64} color={Colors.light.primary} />
        <Text style={styles.loadingText}>Đang tải thông báo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            Thông báo {unreadCount > 0 && `(${unreadCount})`}
          </Text>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllReadButton}
              onPress={markAllAsRead}
            >
              <Ionicons name="checkmark-done" size={20} color="#fff" />
              <Text style={styles.markAllReadText}>Đọc tất cả</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {['all', 'unread', 'read'].map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterButton,
              filter === filterType && styles.activeFilterButton
            ]}
            onPress={() => setFilter(filterType as any)}
          >
            <Text style={[
              styles.filterText,
              filter === filterType && styles.activeFilterText
            ]}>
              {filterType === 'all' ? 'Tất cả' : 
               filterType === 'unread' ? 'Chưa đọc' : 'Đã đọc'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{notifications.length}</Text>
          <Text style={styles.statLabel}>Tổng thông báo</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{unreadCount}</Text>
          <Text style={styles.statLabel}>Chưa đọc</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{notifications.length - unreadCount}</Text>
          <Text style={styles.statLabel}>Đã đọc</Text>
        </View>
      </View>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off" size={64} color={Colors.light.icon} />
          <Text style={styles.emptyTitle}>
            {filter === 'unread' ? 'Không có thông báo chưa đọc' :
             filter === 'read' ? 'Không có thông báo đã đọc' :
             'Chưa có thông báo'}
          </Text>
          <Text style={styles.emptyMessage}>
            {filter === 'unread' ? 'Tất cả thông báo đã được đọc' :
             filter === 'read' ? 'Chưa có thông báo nào được đọc' :
             'Thông báo sẽ xuất hiện khi có hoạt động mới'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.light.primary]}
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
  header: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  markAllReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  markAllReadText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  activeFilterButton: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationType: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
    marginLeft: 8,
    marginTop: 4,
  },
  bookingInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  bookingInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  bookingText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});
