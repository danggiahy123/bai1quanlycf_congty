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

import { DEFAULT_API_URL } from '@/constants/api';

const API_URL = DEFAULT_API_URL;

interface Table {
  _id: string;
  name: string;
  status: 'empty' | 'occupied';
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

export default function EmployeePaymentsScreen() {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'empty'>('all');

  const loadTables = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        return;
      }

      const response = await fetch(`${API_URL}/api/tables`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTables(data || []);
      } else {
        console.error('Failed to load tables:', response.status);
        setTables([]);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      Alert.alert('Lỗi', 'Không thể kết nối đến server');
      setTables([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processPayment = async (tableId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/api/orders/by-table/${tableId}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        Alert.alert('Thành công', 'Thanh toán thành công! Thông báo đã được gửi cho khách hàng.');
        loadTables();
      } else {
        Alert.alert('Lỗi', 'Không thể thực hiện thanh toán');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Lỗi', 'Không thể thực hiện thanh toán');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'empty': return '#16a34a';
      case 'occupied': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'empty': return 'Trống';
      case 'occupied': return 'Đang dùng';
      default: return status;
    }
  };

  const filteredTables = tables.filter(table => {
    if (filter === 'all') return true;
    if (filter === 'occupied') return table.status === 'occupied';
    if (filter === 'empty') return table.status === 'empty';
    return true;
  });

  const occupiedTables = tables.filter(t => t.status === 'occupied');

  const renderTable = ({ item }: { item: Table }) => (
    <View style={styles.tableCard}>
      <View style={styles.tableHeader}>
        <ThemedText type="subtitle" style={styles.tableName}>
          {item.name}
        </ThemedText>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      {item.order && (
        <View style={styles.orderInfo}>
          <ThemedText style={styles.orderTitle}>Đơn hàng:</ThemedText>
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

      {item.status === 'occupied' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.orderButton]}
            onPress={() => {
              // TODO: Navigate to order screen
              Alert.alert('Chức năng', 'Order thêm món cho bàn ' + item.name);
            }}
          >
            <Ionicons name="add-circle" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>ORDER THÊM</Text>
          </TouchableOpacity>
          
          {item.order?.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.payButton]}
              onPress={() => processPayment(item._id)}
            >
              <Ionicons name="card" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>THANH TOÁN</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  useEffect(() => {
    loadTables();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadTables();
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Quản lý bàn khách',
          headerStyle: { backgroundColor: '#dc2626' },
          headerTintColor: '#fff',
        }} 
      />
      
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {['all', 'occupied', 'empty'].map((filterType) => (
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
               filterType === 'occupied' ? 'Bàn có khách' : 'Bàn trống'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="restaurant" size={24} color="#f59e0b" />
          <View style={styles.statContent}>
            <Text style={styles.statNumber}>{occupiedTables.length}</Text>
            <Text style={styles.statLabel}>Bàn chưa thanh toán</Text>
          </View>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  listContainer: {
    padding: 16,
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tableName: {
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
  orderInfo: {
    marginBottom: 16,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
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
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6b7280',
    marginHorizontal: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
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
  orderButton: {
    backgroundColor: '#3b82f6',
  },
  payButton: {
    backgroundColor: '#dc2626',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
