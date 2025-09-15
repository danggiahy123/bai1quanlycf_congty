import { useMemo } from 'react';
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

  const tables = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: `T${i + 1}`,
        name: `Bàn ${i + 1}`,
        isAvailable: true,
      })),
    []
  );

  const select = (id: string) => {
    setTable(id);
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
        {tables.map((t) => (
          <TouchableOpacity key={t.id} style={[styles.table, (!t.isAvailable || isOccupied(t.id)) && styles.busy]} disabled={!t.isAvailable} onPress={() => select(t.id)}>
            <ThemedText type="defaultSemiBold">{t.name}</ThemedText>
            <ThemedText>{isPending(t.id) ? 'CHỜ THANH TOÁN' : isOccupied(t.id) ? 'Đang dùng (chưa thanh toán)' : t.isAvailable ? 'Trống' : 'Đang dùng'}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  table: { width: '47%', borderWidth: StyleSheet.hairlineWidth, borderColor: '#aaa', borderRadius: 10, padding: 12, alignItems: 'center', gap: 6 },
  busy: { opacity: 0.4 },
});


