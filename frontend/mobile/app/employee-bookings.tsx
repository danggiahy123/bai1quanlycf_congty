import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.5.17:5000';

interface Booking {
  _id: string;
  customer: {
    fullName: string;
    phone: string;
  };
  table: {
    name: string;
  };
  numberOfGuests: number;
  bookingDate: string;
  bookingTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
}

export default function EmployeeBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');

  const loadBookings = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        return;
      }

      const response = await fetch(`${API_URL}/api/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      } else {
        console.error('Failed to load bookings:', response.status);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Lỗi', 'Không thể kết nối đến server');
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const confirmBooking = async (bookingId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/api/bookings/${bookingId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        Alert.alert('Thành công', 'Đã xác nhận đặt bàn');
        loadBookings();
      } else {
        Alert.alert('Lỗi', 'Không thể xác nhận đặt bàn');
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      Alert.alert('Lỗi', 'Không thể xác nhận đặt bàn');
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        Alert.alert('Thành công', 'Đã hủy đặt bàn');
        loadBookings();
      } else {
        Alert.alert('Lỗi', 'Không thể hủy đặt bàn');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Alert.alert('Lỗi', 'Không thể hủy đặt bàn');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#16a34a';
      case 'cancelled': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const renderBooking = ({ item }: { item: Booking }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <ThemedText type="subtitle" style={styles.customerName}>
          {item.customer.fullName}
        </ThemedText>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.bookingInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="restaurant" size={16} color="#6b7280" />
          <ThemedText style={styles.infoText}>Bàn: {item.table.name}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="people" size={16} color="#6b7280" />
          <ThemedText style={styles.infoText}>{item.numberOfGuests} người</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={16} color="#6b7280" />
          <ThemedText style={styles.infoText}>
            {new Date(item.bookingDate).toLocaleDateString('vi-VN')} {item.bookingTime}
          </ThemedText>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call" size={16} color="#6b7280" />
          <ThemedText style={styles.infoText}>{item.customer.phone}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="cash" size={16} color="#6b7280" />
          <ThemedText style={styles.infoText}>{item.totalAmount.toLocaleString()}đ</ThemedText>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.quickBookButton]}
          onPress={() => {
            Alert.alert(
              'Đặt bàn ngay',
              'Tính năng đặt bàn nhanh cho khách hàng',
              [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Đặt ngay', onPress: () => {
                  // TODO: Implement quick booking
                  Alert.alert('Thành công', 'Đã đặt bàn ngay cho khách');
                }}
              ]
            );
          }}
        >
          <Ionicons name="add-circle" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>ĐẶT BÀN NGAY</Text>
        </TouchableOpacity>
        
        {item.status === 'pending' && (
          <View style={styles.confirmCancelButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => confirmBooking(item._id)}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>XÁC NHẬN BÀN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => cancelBooking(item._id)}
            >
              <Ionicons name="close" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>HUỶ</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  useEffect(() => {
    loadBookings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Đặt bàn cho khách',
          headerStyle: { backgroundColor: '#dc2626' },
          headerTintColor: '#fff',
        }} 
      />
      
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {['all', 'pending', 'confirmed', 'cancelled'].map((filterType) => (
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
               filterType === 'pending' ? 'Chờ xác nhận' :
               filterType === 'confirmed' ? 'Đã xác nhận' : 'Đã hủy'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{bookings.filter(b => b.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Chờ xác nhận</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{bookings.filter(b => b.status === 'confirmed').length}</Text>
          <Text style={styles.statLabel}>Đã xác nhận</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {bookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}đ
          </Text>
          <Text style={styles.statLabel}>Tổng doanh thu</Text>
        </View>
      </View>

      {/* Bookings List */}
      <FlatList
        data={filteredBookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeFilterButton: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
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
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  bookingInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  actionButtons: {
    marginTop: 16,
    gap: 12,
  },
  quickBookButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  confirmCancelButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  confirmButton: {
    backgroundColor: '#16a34a',
  },
  cancelButton: {
    backgroundColor: '#dc2626',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
});
