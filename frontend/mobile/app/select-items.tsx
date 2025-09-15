import { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOrder } from '@/components/order-context';
import { TouchableOpacity as Btn } from 'react-native';

export default function SelectItemsScreen() {
  const router = useRouter();
  const { state, addItem, updateItemQuantity, removeItem, totalAmount } = useOrder();

  const menu = useMemo(
    () => [
      { id: 'm1', name: 'Cà phê đen', price: 20000 },
      { id: 'm2', name: 'Cà phê sữa', price: 25000 },
      { id: 'm3', name: 'Trà đào', price: 30000 },
      { id: 'm4', name: 'Sinh tố bơ', price: 35000 },
      { id: 'm5', name: 'Bánh ngọt', price: 28000 },
    ],
    []
  );

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
        {menu.map((m) => (
          <View key={m.id} style={styles.menuItem}>
            <View style={{ flex: 1 }}>
              <ThemedText type="defaultSemiBold">{m.name}</ThemedText>
              <ThemedText>{m.price.toLocaleString()}đ</ThemedText>
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
  menuItem: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: '#aaa', borderRadius: 10, padding: 12, gap: 12 },
  actions: { },
  addBtn: { backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#aaa', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  removeBtn: { backgroundColor: '#ef4444', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  footer: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nextBtn: { backgroundColor: '#16a34a', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
});


