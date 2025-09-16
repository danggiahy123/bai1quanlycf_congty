import { useMemo, useState } from 'react';
import { Image, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOrder } from '@/components/order-context';
import { useTables } from '@/components/tables-context';

export default function PaymentScreen() {
  const router = useRouter();
  const { state, totalAmount, clearOrder } = useOrder();
  const { freeTable } = useTables();
  const API_URL = (process.env.EXPO_PUBLIC_API_URL as string) || 'http://localhost:5000';
  const [cash, setCash] = useState('');
  const [method, setMethod] = useState<'cash' | 'transfer'>('cash');

  const change = useMemo(() => {
    const paid = parseInt(cash || '0', 10);
    return Math.max(0, paid - totalAmount);
  }, [cash, totalAmount]);

  const pay = async () => {
    const tableId = state.tableId;
    if (tableId) {
      try {
        await fetch(`${API_URL}/api/orders/by-table/${tableId}/pay`, { method: 'POST' });
      } catch {}
      freeTable(tableId);
    }
    clearOrder();
    router.replace('/payment-success');
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Thanh toán' }} />
      <ThemedText type="defaultSemiBold">Tổng tiền: {totalAmount.toLocaleString()}đ</ThemedText>
      <View style={{ height: 12 }} />
      <ThemedText>Phương thức thanh toán</ThemedText>
      <View style={styles.methods}>
        <TouchableOpacity style={[styles.methodBtn, method === 'cash' && styles.methodActive]} onPress={() => setMethod('cash')}>
          <ThemedText style={method === 'cash' ? styles.methodActiveText : undefined}>Tiền mặt</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.methodBtn, method === 'transfer' && styles.methodActive]} onPress={() => setMethod('transfer')}>
          <ThemedText style={method === 'transfer' ? styles.methodActiveText : undefined}>Chuyển khoản</ThemedText>
        </TouchableOpacity>
      </View>
      <View style={{ height: 12 }} />
      {method === 'cash' ? (
        <>
          <ThemedText>Tiền khách đưa</ThemedText>
          <TextInput value={cash} onChangeText={setCash} inputMode="numeric" placeholder="Nhập số tiền" placeholderTextColor="#999" style={styles.input} />
          <View style={{ height: 8 }} />
          <ThemedText>Tiền thối: {change.toLocaleString()}đ</ThemedText>
        </>
      ) : (
        <>
          <ThemedText>Quét mã để chuyển khoản</ThemedText>
          <View style={styles.qrBox}>
            {/* TODO: Thay bằng QR thật khi đã thêm transfer-qr.png */}
            <Image
              source={require('@/assets/image.png')}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>
          <View style={{ height: 8 }} />
          <ThemedText>Nhập mã giao dịch (tùy chọn)</ThemedText>
          <TextInput inputMode="numeric" placeholder="Ví dụ: 20250915001" placeholderTextColor="#999" style={styles.input} />
        </>
      )}

      <TouchableOpacity style={styles.payBtn} onPress={pay} disabled={method === 'cash' ? ((parseInt(cash || '0', 10) || 0) < totalAmount) : false}>
        <ThemedText style={{ color: '#fff' }}>Thanh toán</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  methods: { flexDirection: 'row', gap: 8 },
  methodBtn: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#aaa', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  methodActive: { backgroundColor: '#e0f2fe', borderColor: '#0ea5e9' },
  methodActiveText: { color: '#0ea5e9' },
  input: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#aaa', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff', marginTop: 8 },
  payBtn: { marginTop: 16, backgroundColor: '#16a34a', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  qrBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  qrImage: { width: 220, height: 220, borderRadius: 12 },
});

