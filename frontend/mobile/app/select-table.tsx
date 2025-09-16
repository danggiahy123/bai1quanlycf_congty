import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOrder } from '@/components/order-context';
import { useTables } from '@/components/tables-context';

export default function SelectTableScreen() {
  const router = useRouter();
  const { state, setTable } = useOrder();
  const { isOccupied, occupyTable, isPending } = useTables();
  const params = useLocalSearchParams<{ mode?: string }>();

  const API_URL = (process.env.EXPO_PUBLIC_API_URL as string) || 'http://localhost:5000';
  const [tables, setTables] = useState<{ id: string; name: string; status: 'empty' | 'occupied'; note?: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
    setTable(id);
    try {
      await fetch(`${API_URL}/api/tables/${id}/occupy`, { method: 'POST' });
    } catch {}
    occupyTable(id);
    if (isPending(id)) {
      router.push('/order-confirm');
      return;
    }
    if (params.mode === 'payment') {
      router.push('/payment');
    } else {
      router.push('/select-items');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Chọn bàn' }} />
      <ThemedText>Số khách: {state.numberOfGuests}</ThemedText>
      <View style={styles.grid}>
        {loading && <ThemedText>Đang tải...</ThemedText>}
        {!!error && <ThemedText>Không tải được danh sách bàn: {error}</ThemedText>}
        {tables.map((t) => {
          const occupied = t.status === 'occupied' || isOccupied(t.id);
          return (
            <View key={t.id} style={[styles.table, occupied && styles.busy]}>
              <TouchableOpacity disabled={occupied} onPress={() => select(t.id)}>
                <ThemedText type="defaultSemiBold">{t.name}</ThemedText>
              </TouchableOpacity>
              <ThemedText>{isPending(t.id) ? 'CHỜ THANH TOÁN' : occupied ? 'Đang dùng (chưa thanh toán)' : 'Trống'}</ThemedText>
              {occupied && (
                <View style={{ width: '100%', marginTop: 6 }}>
                  <TouchableOpacity style={[styles.fullBtn, styles.addOrderBtn]} onPress={() => { setTable(t.id); router.push('/select-items'); }}>
                    <ThemedText style={{ color: '#fff', textAlign: 'center' }}>ORDER THÊM</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.fullBtn, styles.payNowBtn]} onPress={() => router.push('/payment')}>
                    <ThemedText style={{ color: '#fff', textAlign: 'center' }}>THANH TOÁN NGAY</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  table: { width: '47%', borderWidth: StyleSheet.hairlineWidth, borderColor: '#aaa', borderRadius: 10, padding: 12, alignItems: 'center', gap: 6 },
  fullBtn: { width: '100%' },
  addOrderBtn: { backgroundColor: '#2563eb', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 8 },
  payNowBtn: { backgroundColor: '#16a34a', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  busy: { opacity: 0.4 },
});


