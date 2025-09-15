import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOrder } from '@/components/order-context';

export default function HomeScreen() {
  const router = useRouter();
  const { state, setGuests } = useOrder();
  const [localGuests, setLocalGuests] = useState(state.numberOfGuests ? String(state.numberOfGuests) : '');

  const goNext = () => {
    const num = parseInt(localGuests || '0', 10);
    setGuests(Number.isNaN(num) ? 0 : num);
    router.push('/select-table');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerCard}>
        <ThemedText type="title">Quy trình Order</ThemedText>
        <View style={styles.flowRow}>
          <ThemedText>Nhập số lượng khách</ThemedText>
          <ThemedText style={styles.arrow}>→</ThemedText>
          <ThemedText>Chọn bàn</ThemedText>
          <ThemedText style={styles.arrow}>→</ThemedText>
          <ThemedText>Chọn món</ThemedText>
          <ThemedText style={styles.arrow}>→</ThemedText>
          <ThemedText>Xác nhận món</ThemedText>
          <ThemedText style={styles.arrow}>→</ThemedText>
          <ThemedText>Thanh toán</ThemedText>
        </View>
      </View>

      <View style={styles.card}>
        <ThemedText type="defaultSemiBold">Số lượng khách</ThemedText>
        <TextInput
          value={localGuests}
          onChangeText={setLocalGuests}
          inputMode="numeric"
          placeholder="Nhập số khách"
          placeholderTextColor="#999"
          style={styles.input}
        />
        <TouchableOpacity onPress={goNext} style={styles.button}>
          <ThemedText type="defaultSemiBold" style={styles.buttonText}>Chọn bàn</ThemedText>
        </TouchableOpacity>
      </View>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: 20,
  },
  headerCard: { width: '100%', backgroundColor: '#0ea5e9', padding: 16, borderRadius: 14, gap: 10 },
  flowRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  arrow: { opacity: 0.8 },
  card: { marginTop: 16, backgroundColor: '#fff', padding: 16, borderRadius: 14, gap: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  input: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#aaa', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff', marginTop: 8 },
  button: { marginTop: 16, backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff' },
});


