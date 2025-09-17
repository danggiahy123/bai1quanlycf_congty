import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOrder } from '@/components/order-context';
import { useTables } from '@/components/tables-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_API_URL } from '@/constants/api';

export default function SelectTableScreen() {
  const router = useRouter();
  const { state, setTable, setGuests } = useOrder();
  const { isOccupied, occupyTable, isPending } = useTables();
  const params = useLocalSearchParams<{ mode?: string; numberOfGuests?: string }>();

  const API_URL = DEFAULT_API_URL;
  const [tables, setTables] = useState<{ id: string; name: string; status: 'empty' | 'occupied'; note?: string; occupiedBy?: string }[]>([]);
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
        <ThemedText style={styles.guestsText}>
          Số khách: {params.numberOfGuests || state.numberOfGuests}
        </ThemedText>
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
                  <ThemedText type="defaultSemiBold" style={styles.tableName}>{t.name}</ThemedText>
                  <ThemedText style={[styles.tableStatus, occupied && styles.occupiedText]}>
                    {occupied ? 'Bàn đã đặt' : 'Trống'}
                  </ThemedText>
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
  guestsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
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
    gap: 16, 
    justifyContent: 'space-between',
  },
  table: { 
    width: '47%', 
    aspectRatio: 1.2,
    backgroundColor: '#fff',
    borderWidth: 2, 
    borderColor: '#16a34a', 
    borderRadius: 16, 
    padding: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
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
    justifyContent: 'center',
    flex: 1,
  },
  tableName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 8,
  },
  tableStatus: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
    marginBottom: 4,
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


