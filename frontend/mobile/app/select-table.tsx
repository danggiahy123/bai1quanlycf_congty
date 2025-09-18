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
                  isSelected && styles.selected
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
                  <ThemedText style={styles.tableName}>
                    {t.name}
                  </ThemedText>
                  
                  <ThemedText style={[styles.tableStatus, occupied && styles.occupiedText]}>
                    {occupied ? 'BÀN ĐÃ ĐẶT' : 'TRỐNG'}
                  </ThemedText>

                  {occupied && (
                    <ThemedText style={styles.tableAction}>
                      {t.occupiedBy === userInfo?.id ? 'XEM BILL' : 'ĐÃ ĐẶT'}
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  guestsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    color: '#666',
  },
  selectedTableText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 100,
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 15, 
    justifyContent: 'space-between',
  },
  table: { 
    width: '47%', 
    height: 140,
    backgroundColor: '#fff',
    borderWidth: 2, 
    borderColor: '#16a34a', 
    borderRadius: 8, 
    padding: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  selected: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
    borderWidth: 3,
  },
  busy: {
    borderColor: '#16a34a',
    backgroundColor: '#fef2f2',
    opacity: 0.6,
  },
  tableContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  tableName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 6,
  },
  tableStatus: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  occupiedText: {
    color: '#dc2626',
  },
  tableAction: {
    fontSize: 10,
    color: '#dc2626',
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedText: {
    fontSize: 10,
    color: '#16a34a',
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
  },
  continueButton: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});


