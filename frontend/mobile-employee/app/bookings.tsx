import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { tryApiCall } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Booking {
  _id: string;
  customer: {
    fullName: string;
    phone: string;
    email?: string;
  };
  table: {
    name: string;
  };
  numberOfGuests: number;
  bookingDate: string;
  bookingTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  totalAmount: number;
  depositAmount: number;
  createdAt: string;
  customerInfo?: {
    fullName: string;
    phone: string;
    email?: string;
  };
}

interface Table {
  _id: string;
  name: string;
  status: 'empty' | 'occupied';
  capacity: number;
  location: string;
  features: string[];
}

interface Customer {
  _id: string;
  fullName: string;
  phone: string;
  email: string;
}

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [showQuickBooking, setShowQuickBooking] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [quickBookingForm, setQuickBookingForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    tableId: '',
    numberOfGuests: 1,
    bookingDate: new Date().toISOString().split('T')[0],
    bookingTime: new Date().toTimeString().slice(0, 5),
    specialRequests: '',
    depositAmount: '50000',
  });

  const loadBookings = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        return;
      }

      const result = await tryApiCall('/api/bookings/employee', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (result.success) {
        setBookings(result.data.bookings || []);
      } else {
        throw new Error(result.error || 'Không thể tải dữ liệu');
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đặt bàn');
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadTables = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const result = await tryApiCall('/api/tables', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (result.success) {
        setTables(result.data || []);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const searchCustomers = async (query: string) => {
    if (query.length < 2) {
      setCustomers([]);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const result = await tryApiCall(`/api/bookings/search-customers?name=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (result.success) {
        setCustomers(result.data.customers || []);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  const confirmBooking = async (bookingId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const result = await tryApiCall(`/api/bookings/${bookingId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentMethod: 'cash',
          depositAmount: 0,
        }),
      });

      if (result.success) {
        Alert.alert('Thành công', 'Đã xác nhận đặt bàn');
        loadBookings();
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể xác nhận đặt bàn');
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      Alert.alert('Lỗi', 'Không thể xác nhận đặt bàn');
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const result = await tryApiCall(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: 'Hủy bởi nhân viên',
        }),
      });

      if (result.success) {
        Alert.alert('Thành công', 'Đã hủy đặt bàn');
        loadBookings();
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể hủy đặt bàn');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Alert.alert('Lỗi', 'Không thể hủy đặt bàn');
    }
  };

  const createQuickBooking = async () => {
    if (!quickBookingForm.customerPhone || !quickBookingForm.tableId) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const result = await tryApiCall('/api/bookings/admin-quick-booking', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: selectedCustomer?._id || null,
          customerName: quickBookingForm.customerName,
          customerPhone: quickBookingForm.customerPhone,
          customerEmail: quickBookingForm.customerEmail,
          tableId: quickBookingForm.tableId,
          numberOfGuests: quickBookingForm.numberOfGuests,
          bookingDate: quickBookingForm.bookingDate,
          bookingTime: quickBookingForm.bookingTime,
          specialRequests: quickBookingForm.specialRequests,
          depositAmount: parseInt(quickBookingForm.depositAmount),
        }),
      });

      if (result.success) {
        Alert.alert('Thành công', 'Đã tạo đặt bàn thành công');
        setShowQuickBooking(false);
        setQuickBookingForm({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          tableId: '',
          numberOfGuests: 1,
          bookingDate: new Date().toISOString().split('T')[0],
          bookingTime: new Date().toTimeString().slice(0, 5),
          specialRequests: '',
          depositAmount: '50000',
        });
        setSelectedCustomer(null);
        loadBookings();
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể tạo đặt bàn');
      }
    } catch (error) {
      console.error('Error creating quick booking:', error);
      Alert.alert('Lỗi', 'Không thể tạo đặt bàn');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.light.warning;
      case 'confirmed': return Colors.light.success;
      case 'cancelled': return Colors.light.error;
      default: return Colors.light.icon;
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

  const availableTables = tables.filter(table => table.status === 'empty');

  const renderBooking = ({ item }: { item: Booking }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <Text style={styles.customerName}>
          {item.customerInfo?.fullName || item.customer.fullName}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.bookingInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="restaurant" size={16} color={Colors.light.icon} />
          <Text style={styles.infoText}>Bàn: {item.table.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="people" size={16} color={Colors.light.icon} />
          <Text style={styles.infoText}>{item.numberOfGuests} người</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={16} color={Colors.light.icon} />
          <Text style={styles.infoText}>
            {new Date(item.bookingDate).toLocaleDateString('vi-VN')} {item.bookingTime}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call" size={16} color={Colors.light.icon} />
          <Text style={styles.infoText}>
            {item.customerInfo?.phone || item.customer.phone}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="cash" size={16} color={Colors.light.icon} />
          <Text style={styles.infoText}>
            {item.totalAmount.toLocaleString()}đ
            {item.depositAmount > 0 && ` (Cọc: ${item.depositAmount.toLocaleString()}đ)`}
          </Text>
        </View>
      </View>

      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton]}
            onPress={() => confirmBooking(item._id)}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Xác nhận</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => cancelBooking(item._id)}
          >
            <Ionicons name="close" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Hủy</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  useEffect(() => {
    loadBookings();
    loadTables();
  }, []);

  useEffect(() => {
    if (searchText) {
      searchCustomers(searchText);
    } else {
      setCustomers([]);
    }
  }, [searchText]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  return (
    <View style={styles.container}>
      {/* Header with Quick Booking Button */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Quản lý đặt bàn</Text>
          <TouchableOpacity
            style={styles.quickBookingButton}
            onPress={() => setShowQuickBooking(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.quickBookingText}>Đặt bàn nhanh</Text>
          </TouchableOpacity>
        </View>
      </View>

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

      {/* Quick Booking Modal */}
      <Modal
        visible={showQuickBooking}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Đặt bàn nhanh</Text>
            <TouchableOpacity
              onPress={() => setShowQuickBooking(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Customer Search */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tìm khách hàng (tùy chọn)</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên hoặc số điện thoại..."
                value={searchText}
                onChangeText={setSearchText}
                onFocus={() => setShowCustomerSearch(true)}
              />
              {showCustomerSearch && customers.length > 0 && (
                <View style={styles.customerList}>
                  {customers.map((customer) => (
                    <TouchableOpacity
                      key={customer._id}
                      style={styles.customerItem}
                      onPress={() => {
                        setSelectedCustomer(customer);
                        setQuickBookingForm(prev => ({
                          ...prev,
                          customerName: customer.fullName,
                          customerPhone: customer.phone,
                          customerEmail: customer.email,
                        }));
                        setSearchText('');
                        setShowCustomerSearch(false);
                      }}
                    >
                      <Text style={styles.customerName}>{customer.fullName}</Text>
                      <Text style={styles.customerPhone}>{customer.phone}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Customer Info */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tên khách hàng *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên khách hàng"
                value={quickBookingForm.customerName}
                onChangeText={(text) => setQuickBookingForm(prev => ({ ...prev, customerName: text }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Số điện thoại *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập số điện thoại"
                value={quickBookingForm.customerPhone}
                onChangeText={(text) => setQuickBookingForm(prev => ({ ...prev, customerPhone: text }))}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập email (tùy chọn)"
                value={quickBookingForm.customerEmail}
                onChangeText={(text) => setQuickBookingForm(prev => ({ ...prev, customerEmail: text }))}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Chọn bàn *</Text>
              <View style={styles.tableGrid}>
                {availableTables.map((table) => (
                  <TouchableOpacity
                    key={table._id}
                    style={[
                      styles.tableOption,
                      quickBookingForm.tableId === table._id && styles.selectedTableOption
                    ]}
                    onPress={() => setQuickBookingForm(prev => ({ ...prev, tableId: table._id }))}
                  >
                    <Text style={[
                      styles.tableOptionText,
                      quickBookingForm.tableId === table._id && styles.selectedTableOptionText
                    ]}>
                      {table.name}
                    </Text>
                    <Text style={[
                      styles.tableOptionSubtext,
                      quickBookingForm.tableId === table._id && styles.selectedTableOptionSubtext
                    ]}>
                      {table.capacity} người
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Số khách *</Text>
              <View style={styles.guestSelector}>
                <TouchableOpacity
                  style={styles.guestButton}
                  onPress={() => setQuickBookingForm(prev => ({ 
                    ...prev, 
                    numberOfGuests: Math.max(1, prev.numberOfGuests - 1) 
                  }))}
                >
                  <Ionicons name="remove" size={20} color={Colors.light.primary} />
                </TouchableOpacity>
                <Text style={styles.guestNumber}>{quickBookingForm.numberOfGuests}</Text>
                <TouchableOpacity
                  style={styles.guestButton}
                  onPress={() => setQuickBookingForm(prev => ({ 
                    ...prev, 
                    numberOfGuests: Math.min(20, prev.numberOfGuests + 1) 
                  }))}
                >
                  <Ionicons name="add" size={20} color={Colors.light.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ngày đặt bàn *</Text>
              <TextInput
                style={styles.input}
                value={quickBookingForm.bookingDate}
                onChangeText={(text) => setQuickBookingForm(prev => ({ ...prev, bookingDate: text }))}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Giờ đặt bàn *</Text>
              <TextInput
                style={styles.input}
                value={quickBookingForm.bookingTime}
                onChangeText={(text) => setQuickBookingForm(prev => ({ ...prev, bookingTime: text }))}
                placeholder="HH:MM"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Yêu cầu đặc biệt</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Nhập yêu cầu đặc biệt (tùy chọn)"
                value={quickBookingForm.specialRequests}
                onChangeText={(text) => setQuickBookingForm(prev => ({ ...prev, specialRequests: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Số tiền cọc (đ)</Text>
              <TextInput
                style={styles.input}
                placeholder="50000"
                value={quickBookingForm.depositAmount}
                onChangeText={(text) => setQuickBookingForm(prev => ({ ...prev, depositAmount: text }))}
                keyboardType="numeric"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => setShowQuickBooking(false)}
            >
              <Text style={styles.cancelModalButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmModalButton}
              onPress={createQuickBooking}
            >
              <Text style={styles.confirmModalButtonText}>Tạo đặt bàn</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  header: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  quickBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickBookingText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
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
  listContainer: {
    padding: 16,
  },
  bookingCard: {
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
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
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
    color: Colors.light.text,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
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
    backgroundColor: Colors.light.success,
  },
  cancelButton: {
    backgroundColor: Colors.light.error,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.light.background,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  customerList: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 150,
  },
  customerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  customerPhone: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tableOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedTableOption: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  tableOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  selectedTableOptionText: {
    color: '#fff',
  },
  tableOptionSubtext: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  selectedTableOptionSubtext: {
    color: 'rgba(255,255,255,0.8)',
  },
  guestSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  guestButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    minWidth: 40,
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  cancelModalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  confirmModalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  confirmModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
