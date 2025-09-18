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
  location: string;
  features: string[];
  price: number;
  description?: string;
  isPremium: boolean;
  note?: string;
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

export default function TablesScreen() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'empty' | 'occupied'>('all');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showTableDetails, setShowTableDetails] = useState(false);
  const [tableBooking, setTableBooking] = useState<Booking | null>(null);

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

  const occupyTable = async (tableId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const result = await tryApiCall(`/api/tables/${tableId}/occupy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          performedBy: 'employee',
          performedByName: 'Nhân viên',
          customerName: 'Khách hàng',
        }),
      });

      if (result.success) {
        Alert.alert('Thành công', 'Đã đánh dấu bàn đang sử dụng');
        loadTables();
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể cập nhật trạng thái bàn');
      }
    } catch (error) {
      console.error('Error occupying table:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái bàn');
    }
  };

  const freeTable = async (tableId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const result = await tryApiCall(`/api/tables/${tableId}/free`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          performedBy: 'employee',
          performedByName: 'Nhân viên',
        }),
      });

      if (result.success) {
        Alert.alert('Thành công', 'Đã giải phóng bàn');
        loadTables();
        setTableBooking(null);
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể giải phóng bàn');
      }
    } catch (error) {
      console.error('Error freeing table:', error);
      Alert.alert('Lỗi', 'Không thể giải phóng bàn');
    }
  };

  const returnTable = async (tableId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const result = await tryApiCall(`/api/tables/${tableId}/return`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          performedBy: 'employee',
          performedByName: 'Nhân viên',
        }),
      });

      if (result.success) {
        Alert.alert('Thành công', 'Đã trả bàn và xóa dữ liệu chưa thanh toán');
        loadTables();
        setTableBooking(null);
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể trả bàn');
      }
    } catch (error) {
      console.error('Error returning table:', error);
      Alert.alert('Lỗi', 'Không thể trả bàn');
    }
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

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'window': return 'sunny';
      case 'air_conditioned': return 'snow';
      case 'outdoor': return 'leaf';
      case 'private_room': return 'lock-closed';
      case 'main_hall': return 'people';
      default: return 'restaurant';
    }
  };

  const getLocationText = (location: string) => {
    switch (location) {
      case 'window': return 'Cửa sổ';
      case 'air_conditioned': return 'Máy lạnh';
      case 'outdoor': return 'Ngoài trời';
      case 'private_room': return 'Phòng riêng';
      case 'main_hall': return 'Sảnh chính';
      default: return 'Thường';
    }
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'wifi': return 'wifi';
      case 'power_outlet': return 'flash';
      case 'quiet': return 'volume-mute';
      case 'romantic': return 'heart';
      case 'business': return 'briefcase';
      case 'family_friendly': return 'people';
      case 'wheelchair_accessible': return 'accessibility';
      default: return 'checkmark';
    }
  };

  const filteredTables = tables.filter(table => {
    if (filter === 'all') return true;
    return table.status === filter;
  });

  const emptyTables = tables.filter(t => t.status === 'empty').length;
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;

  const openTableDetails = async (table: Table) => {
    setSelectedTable(table);
    if (table.status === 'occupied') {
      await loadTableBooking(table._id);
    }
    setShowTableDetails(true);
  };

  const renderTable = ({ item }: { item: Table }) => (
    <TouchableOpacity
      style={styles.tableCard}
      onPress={() => openTableDetails(item)}
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

      <View style={styles.tableDetails}>
        <View style={styles.detailRow}>
          <Ionicons name={getLocationIcon(item.location)} size={16} color={Colors.light.icon} />
          <Text style={styles.detailText}>{getLocationText(item.location)}</Text>
        </View>
        
        {item.features.length > 0 && (
          <View style={styles.featuresRow}>
            {item.features.slice(0, 3).map((feature, index) => (
              <View key={index} style={styles.featureTag}>
                <Ionicons name={getFeatureIcon(feature) as any} size={12} color={Colors.light.primary} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
            {item.features.length > 3 && (
              <Text style={styles.moreFeaturesText}>+{item.features.length - 3}</Text>
            )}
          </View>
        )}

        {item.isPremium && (
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={12} color="#ffd700" />
            <Text style={styles.premiumText}>VIP</Text>
          </View>
        )}
      </View>

      {item.note && (
        <Text style={styles.tableNote}>{item.note}</Text>
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
        <Text style={styles.headerTitle}>Quản lý bàn</Text>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{emptyTables}</Text>
            <Text style={styles.statLabel}>Trống</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{occupiedTables}</Text>
            <Text style={styles.statLabel}>Đang dùng</Text>
          </View>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {['all', 'empty', 'occupied'].map((filterType) => (
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
               filterType === 'empty' ? 'Bàn trống' : 'Đang dùng'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tables Grid */}
      <FlatList
        data={filteredTables}
        renderItem={renderTable}
        keyExtractor={(item) => item._id}
        numColumns={2}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
      />

      {/* Table Details Modal */}
      <Modal
        visible={showTableDetails}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedTable?.name} - {selectedTable?.capacity} người
            </Text>
            <TouchableOpacity
              onPress={() => setShowTableDetails(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedTable && (
              <>
                {/* Table Status */}
                <View style={styles.statusSection}>
                  <View style={[styles.statusCard, { 
                    backgroundColor: getStatusColor(selectedTable.status) + '20',
                    borderColor: getStatusColor(selectedTable.status)
                  }]}>
                    <Ionicons 
                      name={selectedTable.status === 'empty' ? 'restaurant-outline' : 'people'} 
                      size={24} 
                      color={getStatusColor(selectedTable.status)} 
                    />
                    <Text style={[styles.statusTitle, { color: getStatusColor(selectedTable.status) }]}>
                      {getStatusText(selectedTable.status)}
                    </Text>
                  </View>
                </View>

                {/* Table Info */}
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Thông tin bàn</Text>
                  
                  <View style={styles.infoRow}>
                    <Ionicons name="restaurant" size={20} color={Colors.light.icon} />
                    <Text style={styles.infoLabel}>Tên bàn:</Text>
                    <Text style={styles.infoValue}>{selectedTable.name}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="people" size={20} color={Colors.light.icon} />
                    <Text style={styles.infoLabel}>Sức chứa:</Text>
                    <Text style={styles.infoValue}>{selectedTable.capacity} người</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name={getLocationIcon(selectedTable.location)} size={20} color={Colors.light.icon} />
                    <Text style={styles.infoLabel}>Vị trí:</Text>
                    <Text style={styles.infoValue}>{getLocationText(selectedTable.location)}</Text>
                  </View>

                  {selectedTable.price > 0 && (
                    <View style={styles.infoRow}>
                      <Ionicons name="cash" size={20} color={Colors.light.icon} />
                      <Text style={styles.infoLabel}>Phí đặt bàn:</Text>
                      <Text style={styles.infoValue}>{selectedTable.price.toLocaleString()}đ</Text>
                    </View>
                  )}

                  {selectedTable.isPremium && (
                    <View style={styles.infoRow}>
                      <Ionicons name="star" size={20} color="#ffd700" />
                      <Text style={styles.infoLabel}>Loại:</Text>
                      <Text style={[styles.infoValue, { color: '#ffd700' }]}>Bàn VIP</Text>
                    </View>
                  )}
                </View>

                {/* Features */}
                {selectedTable.features.length > 0 && (
                  <View style={styles.featuresSection}>
                    <Text style={styles.sectionTitle}>Tính năng</Text>
                    <View style={styles.featuresGrid}>
                      {selectedTable.features.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                          <Ionicons name={getFeatureIcon(feature) as any} size={16} color={Colors.light.primary} />
                          <Text style={styles.featureName}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Current Booking */}
                {selectedTable.status === 'occupied' && tableBooking && (
                  <View style={styles.bookingSection}>
                    <Text style={styles.sectionTitle}>Thông tin đặt bàn</Text>
                    <View style={styles.bookingCard}>
                      <View style={styles.bookingInfo}>
                        <Text style={styles.bookingCustomer}>
                          {tableBooking.customerInfo?.fullName || tableBooking.customer.fullName}
                        </Text>
                        <Text style={styles.bookingPhone}>
                          {tableBooking.customerInfo?.phone || tableBooking.customer.phone}
                        </Text>
                        <Text style={styles.bookingDetails}>
                          {tableBooking.numberOfGuests} người • {new Date(tableBooking.bookingDate).toLocaleDateString('vi-VN')} {tableBooking.bookingTime}
                        </Text>
                        <Text style={styles.bookingAmount}>
                          Tổng: {tableBooking.totalAmount.toLocaleString()}đ
                          {tableBooking.depositAmount > 0 && ` (Cọc: ${tableBooking.depositAmount.toLocaleString()}đ)`}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Description */}
                {selectedTable.description && (
                  <View style={styles.descriptionSection}>
                    <Text style={styles.sectionTitle}>Mô tả</Text>
                    <Text style={styles.descriptionText}>{selectedTable.description}</Text>
                  </View>
                )}

                {/* Note */}
                {selectedTable.note && (
                  <View style={styles.noteSection}>
                    <Text style={styles.sectionTitle}>Ghi chú</Text>
                    <Text style={styles.noteText}>{selectedTable.note}</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalFooter}>
            {selectedTable?.status === 'empty' ? (
              <TouchableOpacity
                style={styles.occupyButton}
                onPress={() => {
                  occupyTable(selectedTable._id);
                  setShowTableDetails(false);
                }}
              >
                <Ionicons name="people" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Đánh dấu đang dùng</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.freeButton]}
                  onPress={() => {
                    freeTable(selectedTable._id);
                    setShowTableDetails(false);
                  }}
                >
                  <Ionicons name="restaurant-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Giải phóng</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.returnButton]}
                  onPress={() => {
                    returnTable(selectedTable._id);
                    setShowTableDetails(false);
                  }}
                >
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Trả bàn</Text>
                </TouchableOpacity>
              </View>
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
  row: {
    justifyContent: 'space-between',
  },
  tableCard: {
    width: '48%',
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
  tableDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  featureText: {
    fontSize: 10,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  moreFeaturesText: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffd70020',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
    alignSelf: 'flex-start',
  },
  premiumText: {
    fontSize: 10,
    color: '#ffd700',
    fontWeight: '600',
  },
  tableNote: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
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
  statusSection: {
    marginBottom: 24,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    minWidth: 100,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
    flex: 1,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  featureName: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  bookingSection: {
    marginBottom: 24,
  },
  bookingCard: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  bookingInfo: {
    gap: 8,
  },
  bookingCustomer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  bookingPhone: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  bookingDetails: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  bookingAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.success,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 24,
  },
  noteSection: {
    marginBottom: 24,
  },
  noteText: {
    fontSize: 16,
    color: Colors.light.text,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  freeButton: {
    backgroundColor: Colors.light.success,
  },
  returnButton: {
    backgroundColor: Colors.light.warning,
  },
  occupyButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
