import { StyleSheet, TouchableOpacity, View, Alert, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOrder } from '@/components/order-context';
import { useTables } from '@/components/tables-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function OrderConfirmScreen() {
  const router = useRouter();
  const { state, totalAmount, clearOrder } = useOrder();
  const { markPending, isPending } = useTables();

  const sendToKitchen = async () => {
    try {
      if (state.tableId) {
        markPending(state.tableId);
      }

      // Lấy token và thông tin user
      const token = await AsyncStorage.getItem('userToken');
      const userInfo = await AsyncStorage.getItem('userInfo');
      
      if (!token || !userInfo) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        return;
      }

      const user = JSON.parse(userInfo);
      
      // Tạo booking thực sự
      const bookingData = {
        tableId: state.selectedTable?.id,
        numberOfGuests: state.numberOfGuests,
        bookingDate: new Date().toISOString().split('T')[0], // Ngày hôm nay
        bookingTime: new Date().toTimeString().split(' ')[0].substring(0, 5), // Giờ hiện tại
        menuItems: state.items.map(item => ({
          itemId: item.id,
          quantity: item.quantity
        })),
        notes: 'Đặt bàn trực tiếp tại quán'
      };

      // Gọi API tạo booking với retry logic
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.5.74:5000';
      let response;
      let success = false;
      
      try {
        console.log('Trying to create booking with data:', bookingData);
        response = await fetch(`${API_URL}/api/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bookingData)
        });
        console.log('Response status:', response.status);
        
        if (response.ok) {
          success = true;
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        // Retry with different URL
        try {
          response = await fetch(`http://192.168.5.74:5000/api/bookings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bookingData)
          });
          console.log('Retry response status:', response.status);
          
          if (response.ok) {
            success = true;
          }
        } catch (retryError) {
          console.error('Retry also failed:', retryError);
          throw retryError;
        }
      }

      if (success && response) {
        const result = await response.json();
        console.log('Booking created successfully:', result);
        
        // Hiển thị thông báo thành công
        Alert.alert(
          '✅ Đặt bàn thành công!',
          `Bạn đã đặt bàn ${state.selectedTable?.name} thành công!\n\n📋 Tổng cộng: ${totalAmount.toLocaleString('vi-VN')}đ\n🍽️ Số món: ${state.items.length} món\n👥 Số khách: ${state.numberOfGuests} người\n\nThông báo đã được gửi đến nhân viên. Họ sẽ xác nhận và chuẩn bị bàn cho bạn.`,
          [
            {
              text: 'Về trang chủ',
              onPress: () => {
                clearOrder();
                router.replace('/');
              }
            }
          ]
        );
      } else {
        console.error('Booking failed:', response?.status, response?.statusText);
        const errorData = response ? await response.json().catch(() => ({})) : {};
        Alert.alert('Lỗi', errorData.message || 'Không thể đặt bàn. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const goPayment = () => {
    router.push('/payment');
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Xác nhận đơn',
          headerStyle: { backgroundColor: '#16a34a' },
          headerTintColor: '#fff',
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Info */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="restaurant" size={40} color="#16a34a" />
          </View>
          <ThemedText type="title" style={styles.headerTitle}>
            Xác nhận đơn hàng
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Kiểm tra lại thông tin trước khi gửi
          </ThemedText>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="list" size={20} color="#16a34a" />
            <ThemedText style={styles.cardTitle}>Thông tin đơn hàng</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Bàn:</ThemedText>
            <ThemedText style={styles.infoValue}>{state.selectedTable?.name || 'Chưa chọn bàn'}</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Số khách:</ThemedText>
            <ThemedText style={styles.infoValue}>{state.numberOfGuests} người</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Số món:</ThemedText>
            <ThemedText style={styles.infoValue}>{state.items.length} món</ThemedText>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.itemsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="restaurant" size={20} color="#16a34a" />
            <ThemedText style={styles.cardTitle}>Chi tiết món ăn</ThemedText>
          </View>
          
          {state.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                <ThemedText style={styles.itemPrice}>
                  {item.price.toLocaleString('vi-VN')}đ
                </ThemedText>
              </View>
              <View style={styles.itemQuantity}>
                <ThemedText style={styles.quantityText}>x{item.quantity}</ThemedText>
              </View>
              <View style={styles.itemTotal}>
                <ThemedText style={styles.totalText}>
                  {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        {/* Total Amount */}
        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <ThemedText style={styles.totalLabel}>Tổng cộng:</ThemedText>
            <ThemedText style={styles.totalAmount}>
              {totalAmount.toLocaleString('vi-VN')}đ
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.sendButton} onPress={sendToKitchen}>
          <Ionicons name="send" size={20} color="#fff" />
          <ThemedText style={styles.sendButtonText}>Gửi thông báo</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 10,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  itemsCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemQuantity: {
    width: 40,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    color: '#16a34a',
    fontWeight: 'bold',
  },
  itemTotal: {
    width: 80,
    alignItems: 'flex-end',
  },
  totalText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: 'bold',
  },
  totalCard: {
    backgroundColor: '#16a34a',
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    gap: 12,
  },
  paymentButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sendButton: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});