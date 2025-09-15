import { useEffect, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOrder } from '@/components/order-context';
import { TouchableOpacity as Btn } from 'react-native';

export default function SelectItemsScreen() {
  const router = useRouter();
  const { state, addItem, updateItemQuantity, removeItem, totalAmount } = useOrder();

  const API_URL = (process.env.EXPO_PUBLIC_API_URL as string) || 'http://localhost:5000';
  const [menu, setMenu] = useState<{ id: string; name: string; price: number; image?: string; note?: string; size?: string[] }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/api/menu`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const mapped = (Array.isArray(data) ? data : []).map((m: any) => ({
          id: String(m._id ?? m.id),
          name: String(m.name ?? ''),
          price: Number(m.price ?? 0),
          image: m.image ? String(m.image) : undefined,
          note: m.note ? String(m.note) : undefined,
          size: Array.isArray(m.size) ? m.size.map((s: any) => String(s)) : (m.size ? [String(m.size)] : []),
        }));
        if (mounted) setMenu(mapped);
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

  const qty = (id: string) => state.items.find((x) => x.id === id)?.quantity || 0;

  const addOnly = (id: string) => {
    const found = menu.find((m) => m.id === id);
    if (found) {
      addItem(found);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Chọn món' }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <ThemedText>Bàn: {state.tableId} • Số khách: {state.numberOfGuests}</ThemedText>
        <Btn onPress={() => router.push('/select-table')} style={{ paddingVertical: 6, paddingHorizontal: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: '#aaa', borderRadius: 8 }}>
          <ThemedText>Quay lại</ThemedText>
        </Btn>
      </View>
      <View style={styles.menu}>
        {loading && <ThemedText>Đang tải...</ThemedText>}
        {!!error && <ThemedText>Không tải được menu: {error}</ThemedText>}
        {menu.map((m) => (
          <View key={m.id} style={styles.menuItem}>
            {m.image ? (
              <Image
                source={{ uri: m.image.startsWith('http') ? m.image : `${API_URL}${m.image}` }}
                style={{ width: 64, height: 64, borderRadius: 8 }}
                contentFit="cover"
              />
            ) : (
              <View style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: '#eee' }} />
            )}
            <View style={{ flex: 1 }}>
              <ThemedText type="defaultSemiBold" style={{ color: '#000' }}>
                {m.name}{m.size && m.size.length ? ` • ${m.size.join('/')}` : ''}
              </ThemedText>
              <ThemedText style={{ color: '#2563eb', marginTop: 2 }}>{m.price.toLocaleString()}đ</ThemedText>
              {!!m.note && <ThemedText style={{ color: '#6b7280', marginTop: 2 }} numberOfLines={1}>{m.note}</ThemedText>}
            </View>
            <View style={styles.actions}>
              {qty(m.id) === 0 ? (
                <TouchableOpacity style={styles.addBtn} onPress={() => addOnly(m.id)}>
                  <ThemedText style={{ color: '#fff' }}>Thêm</ThemedText>
                </TouchableOpacity>
              ) : (
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateItemQuantity(m.id, Math.max(0, qty(m.id) - 1))}>
                    <ThemedText>-</ThemedText>
                  </TouchableOpacity>
                  <ThemedText>{qty(m.id)}</ThemedText>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateItemQuantity(m.id, qty(m.id) + 1)}>
                    <ThemedText>+</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(m.id)}>
                    <ThemedText style={{ color: '#fff' }}>Xóa</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <ThemedText type="defaultSemiBold">Tổng: {totalAmount.toLocaleString()}đ</ThemedText>
        <TouchableOpacity style={styles.nextBtn} onPress={() => router.push('/order-confirm')} disabled={state.items.length === 0}>
          <ThemedText style={{ color: '#fff' }}>Xác nhận</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  menu: { gap: 10, marginTop: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1, borderRadius: 12, padding: 12, gap: 12 },
  actions: { },
  addBtn: { backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#aaa', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  removeBtn: { backgroundColor: '#ef4444', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  footer: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nextBtn: { backgroundColor: '#16a34a', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
});


