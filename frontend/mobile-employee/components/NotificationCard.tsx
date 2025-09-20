import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

interface NotificationCardProps {
  notification: Notification;
  onPress: () => void;
  onDelete: () => void;
}

export default function NotificationCard({ notification, onPress, onDelete }: NotificationCardProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
        return 'checkmark-circle';
      case 'booking_cancelled':
        return 'close-circle';
      case 'booking_reminder':
        return 'time';
      case 'payment_completed':
        return 'card';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
        return '#10b981';
      case 'booking_cancelled':
        return '#ef4444';
      case 'booking_reminder':
        return '#f59e0b';
      case 'payment_completed':
        return '#16a34a';
      default:
        return '#10b981';
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

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.isRead && styles.unreadContainer
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getNotificationIcon(notification.type) as any}
            size={20}
            color={getNotificationColor(notification.type)}
          />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.message}>{notification.message}</Text>
          {notification.bookingId && (
            <View style={styles.bookingInfo}>
              <Text style={styles.bookingText} numberOfLines={2}>
                🏷️ Bàn: {notification.bookingId.table}
              </Text>
              <Text style={styles.bookingText} numberOfLines={1}>
                📅 {new Date(notification.bookingId.bookingDate).toLocaleDateString('vi-VN')} lúc {notification.bookingId.bookingTime}
              </Text>
              <Text style={styles.bookingAmount}>
                💰 {notification.bookingId.totalAmount.toLocaleString('vi-VN')}đ
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
      <Text style={styles.time}>{formatDate(notification.createdAt)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxWidth: '100%',
  },
  unreadContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  message: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  bookingInfo: {
    marginTop: 6,
    padding: 6,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
  bookingText: {
    fontSize: 11,
    color: '#6b7280',
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  bookingAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  time: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
});
