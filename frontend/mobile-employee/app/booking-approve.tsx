import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { tryApiCall } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

interface Booking {
  _id: string;
  customer: {
    fullName: string;
    phone: string;
    email: string;
  };
  table: {
    name: string;
    capacity: number;
  };
  numberOfGuests: number;
  bookingDate: string;
  bookingTime: string;
  totalAmount: number;
  depositAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  note?: string;
  createdAt: string;
}

export default function BookingApproveScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [selectedStatus]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        router.replace('/login');
        return;
      }

      const result = await tryApiCall('/api/bookings/employee', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (result.success) {
        let filteredBookings = result.data.bookings || [];
        
        if (selectedStatus !== 'all') {
          filteredBookings = filteredBookings.filter((booking: Booking) => 
            booking.status === selectedStatus
          );
        }
        
        setBookings(filteredBookings);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đặt bàn');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleStatusChange = async (bookingId: string, newStatus: 'confirmed' | 'cancelled') => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const result = await tryApiCall(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (result.success) {
        Alert.alert(
          'Thành công',
          `Đặt bàn đã được ${newStatus === 'confirmed' ? 'xác nhận' : 'hủy'}`,
          [{ text: 'OK', onPress: loadBookings }]
        );
        setShowDetailModal(false);
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDateTime = (dateString: string, timeString: string) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('vi-VN');
    return `${formattedDate} lúc ${timeString}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'confirmed':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const statusFilters = [
    { key: 'all', label: 'Tất cả', count: bookings.length },
    { key: 'pending', label: 'Chờ xác nhận', count: bookings.filter(b => b.status === 'pending').length },
    { key: 'confirmed', label: 'Đã xác nhận', count: bookings.filter(b => b.status === 'confirmed').length },
    { key: 'cancelled', label: 'Đã hủy', count: bookings.filter(b => b.status === 'cancelled').length },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Duyệt bàn cho khách</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Status Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {statusFilters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedStatus === filter.key && styles.activeFilterButton
            ]}
            onPress={() => setSelectedStatus(filter.key as any)}
          >
            <Text style={[
              styles.filterText,
              selectedStatus === filter.key && styles.activeFilterText
            ]}>
              {filter.label}
            </Text>
            <View style={[
              styles.filterBadge,
              selectedStatus === filter.key && styles.activeFilterBadge
            ]}>
              <Text style={[
                styles.filterBadgeText,
                selectedStatus === filter.key && styles.activeFilterBadgeText
              ]}>
                {filter.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bookings List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>Không có đặt bàn nào</Text>
          </View>
        ) : (
          bookings.map((booking) => (
            <TouchableOpacity
              key={booking._id}
              style={styles.bookingCard}
              onPress={() => {
                setSelectedBooking(booking);
                setShowDetailModal(true);
              }}
            >
              <View style={styles.bookingHeader}>
                <View style={styles.bookingInfo}>
                  <Text style={styles.customerName}>{booking.customer.fullName}</Text>
                  <Text style={styles.customerPhone}>{booking.customer.phone}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
                </View>
              </View>

              <View style={styles.bookingDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="restaurant" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>Bàn {booking.table.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="people" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>{booking.numberOfGuests} người</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar" size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>
                    {formatDateTime(booking.bookingDate, booking.bookingTime)}
                  </Text>
                </View>
              </View>

              <View style={styles.bookingFooter}>
                <View style={styles.amountContainer}>
                  <Text style={styles.amountLabel}>Tổng tiền:</Text>
                  <Text style={styles.amountValue}>{formatCurrency(booking.totalAmount)}</Text>
                </View>
                <View style={styles.amountContainer}>
                  <Text style={styles.amountLabel}>Cọc:</Text>
                  <Text style={styles.amountValue}>{formatCurrency(booking.depositAmount)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Booking Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedBooking && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Text style={styles.modalCancelText}>Đóng</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Chi tiết đặt bàn</Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Tên:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.customer.fullName}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>SĐT:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.customer.phone}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.customer.email}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Thông tin đặt bàn</Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Bàn:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.table.name}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Số khách:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.numberOfGuests} người</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Ngày giờ:</Text>
                  <Text style={styles.detailValue}>
                    {formatDateTime(selectedBooking.bookingDate, selectedBooking.bookingTime)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Tổng tiền:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedBooking.totalAmount)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Tiền cọc:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedBooking.depositAmount)}</Text>
                </View>
                {selectedBooking.note && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Ghi chú:</Text>
                    <Text style={styles.detailValue}>{selectedBooking.note}</Text>
                  </View>
                )}
              </View>

              {selectedBooking.status === 'pending' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.confirmButton]}
                    onPress={() => handleStatusChange(selectedBooking._id, 'confirmed')}
                  >
                    <Ionicons name="checkmark" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Xác nhận</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleStatusChange(selectedBooking._id, 'cancelled')}
                  >
                    <Ionicons name="close" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Hủy</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  filtersContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
  },
  filtersContent: {
    paddingHorizontal: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  activeFilterButton: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: Colors.text,
    marginRight: 8,
  },
  activeFilterText: {
    color: 'white',
  },
  filterBadge: {
    backgroundColor: Colors.textSecondary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activeFilterBadge: {
    backgroundColor: 'white',
  },
  filterBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  activeFilterBadgeText: {
    color: Colors.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  bookingDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    backgroundColor: Colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalCancelText: {
    color: 'white',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    flex: 2,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
