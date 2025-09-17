import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOrder } from '@/components/order-context';
import { useTables } from '@/components/tables-context';
import { useSocket } from '@/components/socket-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_API_URL } from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';

export default function SelectTableScreen() {
  const router = useRouter();
  const { state, setTable, setGuests } = useOrder();
  const { isOccupied, occupyTable, isPending } = useTables();
  const { socket, isConnected } = useSocket();
  const params = useLocalSearchParams<{ mode?: string; numberOfGuests?: string }>();

  const API_URL = DEFAULT_API_URL;
  const [tables, setTables] = useState<{ 
    id: string; 
    name: string; 
    status: 'empty' | 'occupied'; 
    note?: string; 
    occupiedBy?: string;
    capacity?: number;
    location?: string;
    features?: string[];
    price?: number;
    description?: string;
    isPremium?: boolean;
  }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  // Load user info
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userData = await AsyncStorage.getItem('userInfo');
        if (userData) {
          setUserInfo(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      }
    };
    loadUserInfo();
  }, []);

  // Cập nhật numberOfGuests từ params
  useEffect(() => {
    if (params.numberOfGuests) {
      const guests = parseInt(params.numberOfGuests);
      if (!isNaN(guests) && guests > 0) {
        setGuests(guests);
      }
    }
  }, [params.numberOfGuests]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/api/tables`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const mapped = (Array.isArray(data) ? data : []).map((t: any) => ({
          id: String(t._id ?? t.id),
          name: String(t.name ?? ''),
          status: (t.status === 'occupied' ? 'occupied' : 'empty') as 'empty' | 'occupied',
          note: t.note ? String(t.note) : undefined,
          capacity: t.capacity || 4,
          location: t.location || 'main_hall',
          features: t.features || [],
          price: t.price || 0,
          description: t.description || '',
          isPremium: t.isPremium || false,
        }));
        if (mounted) setTables(mapped);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Load failed');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [API_URL]);

  // Socket.IO real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleTableStatusChange = (data: any) => {
      console.log('🔄 Table status changed:', data);
      setTables(prevTables => 
        prevTables.map(table => 
          table.id === data.tableId 
            ? { ...table, status: data.status }
            : table
        )
      );
    };

    const handleBookingStatusChange = (data: any) => {
      console.log('📅 Booking status changed:', data);
      // Update table status if booking affects table
      if (data.tableId) {
        setTables(prevTables => 
          prevTables.map(table => 
            table.id === data.tableId 
              ? { ...table, status: data.status === 'confirmed' ? 'occupied' : 'empty' }
              : table
          )
        );
      }
    };

    const handleOrderStatusChange = (data: any) => {
      console.log('🛒 Order status changed:', data);
      // Update table status based on order
      if (data.tableId) {
        setTables(prevTables => 
          prevTables.map(table => 
            table.id === data.tableId 
              ? { ...table, status: data.status === 'paid' ? 'empty' : 'occupied' }
              : table
          )
        );
      }
    };

    // Listen for real-time events
    socket.on('table_status_changed', handleTableStatusChange);
    socket.on('booking_status_changed', handleBookingStatusChange);
    socket.on('order_status_changed', handleOrderStatusChange);

    return () => {
      socket.off('table_status_changed', handleTableStatusChange);
      socket.off('booking_status_changed', handleBookingStatusChange);
      socket.off('order_status_changed', handleOrderStatusChange);
    };
  }, [socket]);

  // Helper functions
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

  const select = async (id: string) => {
    const table = tables.find(t => t.id === id);
    if (table) {
      // Chỉ lưu thông tin bàn vào state, không occupy ngay
      setTable({ id: table.id, name: table.name });
      console.log('Selected table:', table.id, table.name);
    }
    
    // Chuyển đến màn hình chọn món
    router.push('/select-items');
  };

  const handleContinue = () => {
    if (!state.selectedTable) {
      Alert.alert('Lỗi', 'Vui lòng chọn một bàn trước khi tiếp tục');
      return;
    }
    router.push('/select-items');
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Chọn bàn' }} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <ThemedText style={styles.guestsText}>
            Số khách: {params.numberOfGuests || state.numberOfGuests}
          </ThemedText>
          <View style={styles.connectionStatus}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: isConnected ? '#16a34a' : '#ef4444' }
            ]} />
            <ThemedText style={styles.statusText}>
              {isConnected ? 'Kết nối real-time' : 'Mất kết nối'}
            </ThemedText>
          </View>
        </View>
        {state.selectedTable && (
          <ThemedText style={styles.selectedTableText}>
            Đã chọn: {state.selectedTable.name}
          </ThemedText>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {loading && <ThemedText>Đang tải...</ThemedText>}
          {!!error && <ThemedText>Không tải được danh sách bàn: {error}</ThemedText>}
          {tables.map((t) => {
            const occupied = t.status === 'occupied' || isOccupied(t.id);
            const isSelected = state.selectedTable?.id === t.id;
            const isCapacitySuitable = t.capacity && state.numberOfGuests ? t.capacity >= state.numberOfGuests : true;
            
            return (
              <TouchableOpacity 
                key={t.id} 
                style={[
                  styles.table, 
                  occupied && styles.busy,
                  isSelected && styles.selected,
                  !isCapacitySuitable && styles.capacityWarning,
                  t.isPremium && styles.premiumTable
                ]} 
                onPress={() => {
                  if (occupied) {
                    // Kiểm tra xem bàn này có phải do user hiện tại đặt không
                    if (t.occupiedBy && t.occupiedBy === userInfo?.id) {
                      router.push('/payment');
                    } else {
                      Alert.alert('Thông báo', 'Bàn này đã được đặt bởi khách hàng khác. Bạn chỉ có thể xem bill của bàn mình đặt.');
                    }
                  } else {
                    select(t.id);
                  }
                }}
              >
                <View style={styles.tableContent}>
                  {/* Header với tên bàn và VIP badge */}
                  <View style={styles.tableHeader}>
                    <ThemedText type="defaultSemiBold" style={styles.tableName}>{t.name}</ThemedText>
                    {t.isPremium && (
                      <View style={styles.vipBadge}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <ThemedText style={styles.vipText}>VIP</ThemedText>
                      </View>
                    )}
                  </View>

                  {/* Thông tin cơ bản */}
                  <View style={styles.tableInfo}>
                    <View style={styles.infoRow}>
                      <Ionicons name="people" size={14} color="#6b7280" />
                      <ThemedText style={styles.infoText}>{t.capacity} người</ThemedText>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Ionicons name={getLocationIcon(t.location || 'main_hall')} size={14} color="#6b7280" />
                      <ThemedText style={styles.infoText}>{getLocationText(t.location || 'main_hall')}</ThemedText>
                    </View>

                    {t.price > 0 && (
                      <View style={styles.infoRow}>
                        <Ionicons name="card" size={14} color="#6b7280" />
                        <ThemedText style={styles.infoText}>{t.price.toLocaleString()}đ</ThemedText>
                      </View>
                    )}
                  </View>

                  {/* Features */}
                  {t.features && t.features.length > 0 && (
                    <View style={styles.featuresContainer}>
                      {t.features.slice(0, 3).map((feature, index) => (
                        <View key={index} style={styles.featureTag}>
                          <Ionicons name={getFeatureIcon(feature)} size={10} color="#16a34a" />
                        </View>
                      ))}
                      {t.features.length > 3 && (
                        <ThemedText style={styles.moreFeaturesText}>+{t.features.length - 3}</ThemedText>
                      )}
                    </View>
                  )}

                  {/* Status */}
                  <ThemedText style={[styles.tableStatus, occupied && styles.occupiedText]}>
                    {occupied ? 'Bàn đã đặt' : 'Trống'}
                  </ThemedText>

                  {/* Warnings */}
                  {!isCapacitySuitable && !occupied && (
                    <ThemedText style={styles.warningText}>⚠️ Quá đông</ThemedText>
                  )}

                  {occupied && (
                    <ThemedText style={styles.tableAction}>
                      {t.occupiedBy === userInfo?.id ? 'XEM LẠI BILL' : 'BÀN ĐÃ ĐẶT'}
                    </ThemedText>
                  )}
                  {isSelected && !occupied && (
                    <ThemedText style={styles.selectedText}>✓ ĐÃ CHỌN</ThemedText>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {state.selectedTable && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <ThemedText style={styles.continueButtonText}>Tiếp tục chọn món</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  guestsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
  },
  selectedTableText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Space for footer button
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12, 
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  table: { 
    width: '48%', 
    minHeight: 160,
    maxHeight: 200,
    backgroundColor: '#fff',
    borderWidth: 2, 
    borderColor: '#16a34a', 
    borderRadius: 16, 
    padding: 10, 
    alignItems: 'center', 
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selected: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
    borderWidth: 3,
  },
  tableContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    width: '100%',
    minHeight: 140,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  vipText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  tableInfo: {
    width: '100%',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 1,
  },
  infoText: {
    fontSize: 11,
    color: '#6b7280',
    flex: 1,
    flexWrap: 'wrap',
  },
  featuresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  featureTag: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreFeaturesText: {
    fontSize: 10,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  premiumTable: {
    borderColor: '#FFD700',
    backgroundColor: '#fffbf0',
  },
  capacityWarning: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  warningText: {
    fontSize: 10,
    color: '#f59e0b',
    fontWeight: '600',
    textAlign: 'center',
  },
  tableName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16a34a',
    flex: 1,
    flexWrap: 'wrap',
  },
  tableStatus: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
    marginBottom: 2,
  },
  occupiedText: {
    color: '#ef4444',
  },
  tableAction: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  selectedText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  continueButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fullBtn: { width: '100%' },
  viewBillBtn: { backgroundColor: '#3b82f6', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  busy: { 
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
});


