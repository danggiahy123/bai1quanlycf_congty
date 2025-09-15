import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOrder } from '@/components/order-context';
import { useTables } from '@/components/tables-context';
import { TouchableOpacity as Btn } from 'react-native';

export default function OrderConfirmScreen() {
  const router = useRouter();
  const { state, totalAmount } = useOrder();
  const { markPending, isPending } = useTables();

  const sendToKitchen = () => {
    if (state.tableId) {
      markPending(state.tableId);
    }
    router.replace('/select-table');
  };

  const goPayment = () => {
    router.push('/payment');
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Xác nhận đơn' }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <ThemedText type="defaultSemiBold">Bàn: {state.tableId} - Khách: {state.numberOfGuests}</ThemedText>
        <Btn onPress={() => router.push('/select-table')} style={{ paddingVertical: 6, paddingHorizontal: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: '#aaa', borderRadius: 8 }}>
          <ThemedText>Quay lại</ThemedText>
        </Btn>
      </View>
      <View style={styles.list}>
        {state.items.map((it) => (
          <View key={it.id} style={styles.row}>
            <ThemedText style={{ flex: 1 }}>{it.name}</ThemedText>
            <ThemedText>x{it.quantity}</ThemedText>
            <ThemedText style={{ width: 90, textAlign: 'right' }}>{(it.price * it.quantity).toLocaleString()}đ</ThemedText>
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <ThemedText type="defaultSemiBold">Tổng: {totalAmount.toLocaleString()}đ</ThemedText>
        {isPending(state.tableId || '') ? (
          <TouchableOpacity style={[styles.nextBtn, { backgroundColor: '#16a34a' }]} onPress={goPayment}>
            <ThemedText style={{ color: '#fff' }}>Thanh toán</ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextBtn} onPress={sendToKitchen}>
            <ThemedText style={{ color: '#fff' }}>Gửi bếp</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  list: { gap: 8, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#ddd', paddingBottom: 8 },
  footer: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nextBtn: { backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
});


