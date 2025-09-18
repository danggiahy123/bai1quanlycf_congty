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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { tryApiCall } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Table {
  _id: string;
  name: string;
  status: 'empty' | 'occupied';
  capacity: number;
  order?: {
    _id: string;
    items: Array<{
      name: string;
      price: number;
      quantity: number;
    }>;
    totalAmount: number;
    status: 'pending' | 'paid';
  };
}

interface Booking {
  _id: string;
  customer: {
    fullName: string;
    phone: string;
  };
  numberOfGuests: number;
  bookingDate: string;
  bookingTime: string;
  totalAmount: number;
  depositAmount: number;
  status: string;
  customerInfo?: {
    fullName: string;
    phone: string;
  };
}

export default function PaymentsScreen() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'empty'>('all');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [tableBooking, setTableBooking] = useState<Booking | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qr'>('cash');

  const loadTables = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        return;
      }

      const result = await tryApiCall('/api/tables', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (result.success) {
        setTables(result.data || []);
      } else {
        throw new Error(result.error || 'Không thể tải dữ liệu');
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách bàn');
      setTables([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadTableBooking = async (tableId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const result = await tryApiCall(`/api/bookings/by-table/${tableId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (result.success) {
        setTableBooking(result.data);
      } else {
        setTableBooking(null);
      }
    } catch (error) {
      console.error('Error loading table booking:', error);
      setTableBooking(null);
    }
  };

  const processPayment = async (tableId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const result = await tryApiCall(`/api/orders/by-table/${tableId}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (result.success) {
        Alert.alert('Thành công', 'Thanh toán thành công! Thông báo đã được gửi cho khách hàng.');
        loadTables();
        setShowPaymentModal(false);
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể thực hiện thanh toán');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Lỗi', 'Không thể thực hiện thanh toán');
    }
  };

  const openPaymentModal = async (table: Table) => {
    setSelectedTable(table);
    if (table.status === 'occupied') {
      await loadTableBooking(table._id);
    }
    setShowPaymentModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'empty': return Colors.light.success;
      case 'occupied': return Colors.light.warning;
      default: return Colors.light.icon;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'empty': return 'Trống';
      case 'occupied': return 'Đang dùng';
      default: return status;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return 'cash';
      case 'card': return 'card';
      case 'qr': return 'qr-code';
      default: return 'card';
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'Tiền mặt';
      case 'card': return 'Thẻ';
      case 'qr': return 'QR Code';
      default: return 'Tiền mặt';
    }
  };

  const filteredTables = tables.filter(table => {
    if (filter === 'all') return true;
    if (filter === 'unpaid') return table.status === 'occupied' && table.order?.status === 'pending';
    if (filter === 'empty') return table.status === 'empty';
    return true;
  });

  const occupiedTables = tables.filter(t => t.status === 'occupied' && t.order?.status === 'pending');
  const totalRevenue = tables
    .filter(t => t.status === 'occupied' && t.order?.status === 'paid')
    .reduce((sum, t) => sum + (t.order?.totalAmount || 0), 0);

  const renderTable = ({ item }: { item: Table }) => (
    <TouchableOpacity
      style={styles.tableCard}
      onPress={() => openPaymentModal(item)}
    >
      <View style={styles.tableHeader}>
        <View style={styles.tableInfo}>
          <Text style={styles.tableName}>{item.name}</Text>
          <Text style={styles.tableCapacity}>{item.capacity} người</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      {item.order && (
        <View style={styles.orderInfo}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderTitle}>Đơn hàng</Text>
            <View style={[styles.orderStatusBadge, { 
              backgroundColor: item.order.status === 'paid' ? Colors.light.success : Colors.light.warning 
            }]}>
              <Text style={styles.orderStatusText}>
                {item.order.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </Text>
            </View>
          </View>
          
          {item.order.items.map((orderItem, index) => (
            <View key={index} style={styles.orderItem}>
              <Text style={styles.itemName}>{orderItem.name}</Text>
              <Text style={styles.itemQuantity}>x{orderItem.quantity}</Text>
              <Text style={styles.itemPrice}>{(orderItem.price * orderItem.quantity).toLocaleString()}đ</Text>
            </View>
          ))}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng:</Text>
            <Text style={styles.totalAmount}>{item.order.totalAmount.toLocaleString()}đ</Text>
          </View>
        </View>
      )}

      {item.status === 'occupied' && item.order?.status === 'pending' && (
        <View style={styles.paymentAction}>
          <Ionicons name="card" size={20} color={Colors.light.primary} />
          <Text style={styles.paymentActionText}>Nhấn để thanh toán</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  useEffect(() => {
    loadTables();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadTables();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thanh toán bàn</Text>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{occupiedTables.length}</Text>
            <Text style={styles.statLabel}>Chưa thanh toán</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalRevenue.toLocaleString()}đ</Text>
            <Text style={styles.statLabel}>Doanh thu</Text>
          </View>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {['all', 'unpaid', 'empty'].map((filterType) => (
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
               filterType === 'unpaid' ? 'Chưa thanh toán' : 'Bàn trống'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tables List */}
      <FlatList
        data={filteredTables}
        renderItem={renderTable}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Thanh toán - {selectedTable?.name}
            </Text>
            <TouchableOpacity
              onPress={() => setShowPaymentModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedTable && (
              <>
                {/* Table Info */}
                <View style={styles.tableInfoSection}>
                  <View style={styles.tableInfoCard}>
                    <Ionicons name="restaurant" size={24} color={Colors.light.primary} />
                    <View style={styles.tableInfoContent}>
                      <Text style={styles.tableInfoName}>{selectedTable.name}</Text>
                      <Text style={styles.tableInfoCapacity}>{selectedTable.capacity} người</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedTable.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(selectedTable.status)}</Text>
                    </View>
                  </View>
                </View>

                {/* Booking Info */}
                {tableBooking && (
                  <View style={styles.bookingSection}>
                    <Text style={styles.sectionTitle}>Thông tin đặt bàn</Text>
                    <View style={styles.bookingCard}>
                      <Text style={styles.bookingCustomer}>
                        {tableBooking.customerInfo?.fullName || tableBooking.customer.fullName}
                      </Text>
                      <Text style={styles.bookingPhone}>
                        {tableBooking.customerInfo?.phone || tableBooking.customer.phone}
                      </Text>
                      <Text style={styles.bookingDetails}>
                        {tableBooking.numberOfGuests} người • {new Date(tableBooking.bookingDate).toLocaleDateString('vi-VN')} {tableBooking.bookingTime}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Order Items */}
                {selectedTable.order && (
                  <View style={styles.orderSection}>
                    <Text style={styles.sectionTitle}>Chi tiết đơn hàng</Text>
                    <View style={styles.orderCard}>
                      {selectedTable.order.items.map((item, index) => (
                        <View key={index} style={styles.orderItem}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                          <Text style={styles.itemPrice}>{(item.price * item.quantity).toLocaleString()}đ</Text>
                        </View>
                      ))}
                      
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Tổng cộng:</Text>
                        <Text style={styles.totalAmount}>{selectedTable.order.totalAmount.toLocaleString()}đ</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Payment Method */}
                <View style={styles.paymentMethodSection}>
                  <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
                  <View style={styles.paymentMethods}>
                    {['cash', 'card', 'qr'].map((method) => (
                      <TouchableOpacity
                        key={method}
                        style={[
                          styles.paymentMethodOption,
                          paymentMethod === method && styles.selectedPaymentMethod
                        ]}
                        onPress={() => setPaymentMethod(method as any)}
                      >
                        <Ionicons 
                          name={getPaymentMethodIcon(method) as any} 
                          size={24} 
                          color={paymentMethod === method ? '#fff' : Colors.light.primary} 
                        />
                        <Text style={[
                          styles.paymentMethodText,
                          paymentMethod === method && styles.selectedPaymentMethodText
                        ]}>
                          {getPaymentMethodText(method)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {/* Payment Actions */}
          <View style={styles.modalFooter}>
            {selectedTable?.order?.status === 'paid' ? (
              <View style={styles.paidStatus}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.light.success} />
                <Text style={styles.paidText}>Đã thanh toán</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.payButton}
                onPress={() => processPayment(selectedTable?._id || '')}
              >
                <Ionicons name="card" size={20} color="#fff" />
                <Text style={styles.payButtonText}>
                  Thanh toán {selectedTable?.order?.totalAmount.toLocaleString()}đ
                </Text>
              </TouchableOpacity>
            )}
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
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
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
  listContainer: {
    padding: 16,
  },
  tableCard: {
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
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tableInfo: {
    flex: 1,
  },
  tableName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  tableCapacity: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  orderInfo: {
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  itemQuantity: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginHorizontal: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  paymentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.light.primaryLight,
    borderRadius: 8,
    gap: 8,
  },
  paymentActionText: {
    color: Colors.light.primary,
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
  tableInfoSection: {
    marginBottom: 24,
  },
  tableInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  tableInfoContent: {
    flex: 1,
  },
  tableInfoName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  tableInfoCapacity: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  bookingSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  bookingCard: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  bookingCustomer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  bookingPhone: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  bookingDetails: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  orderSection: {
    marginBottom: 24,
  },
  orderCard: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  paymentMethodSection: {
    marginBottom: 24,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentMethodOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    gap: 8,
  },
  selectedPaymentMethod: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  selectedPaymentMethodText: {
    color: '#fff',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  paidStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: Colors.light.successLight,
    borderRadius: 8,
    gap: 8,
  },
  paidText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.success,
  },
  payButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  payButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
