import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useOrder } from '@/components/order-context';
import { useTables } from '@/components/tables-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { state, clearOrder } = useOrder();
  const { freeTable } = useTables();
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Thanh toán thành công</ThemedText>
      <ThemedText>Đơn hàng đã được hoàn tất.</ThemedText>
      <View style={{ height: 16 }} />
      <TouchableOpacity
        style={styles.btn}
        onPress={() => {
          if (state.tableId) {
            freeTable(state.tableId);
          }
          clearOrder();
          router.replace('/');
        }}
      >
        <ThemedText style={{ color: '#fff' }}>Về trang chủ</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  btn: { marginTop: 8, backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
});


