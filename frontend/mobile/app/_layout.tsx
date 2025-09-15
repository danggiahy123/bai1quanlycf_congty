import { Stack } from 'expo-router';
import { OrderProvider } from '@/components/order-context';
import { TablesProvider } from '@/components/tables-context';

export default function RootLayout() {
  return (
    <TablesProvider>
      <OrderProvider>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Đăng nhập' }} />
          <Stack.Screen name="register" options={{ title: 'Đăng ký' }} />
          <Stack.Screen name="register-info" options={{ title: 'Thông tin đăng ký' }} />
          <Stack.Screen name="home" options={{ title: 'Trang chủ' }} />
          <Stack.Screen name="select-table" options={{ title: 'Chọn bàn' }} />
          <Stack.Screen name="select-items" options={{ title: 'Chọn món' }} />
          <Stack.Screen name="order-confirm" options={{ title: 'Xác nhận' }} />
          <Stack.Screen name="payment" options={{ title: 'Thanh toán' }} />
          <Stack.Screen name="payment-success" options={{ headerShown: false }} />
        </Stack>
      </OrderProvider>
    </TablesProvider>
  );
}


