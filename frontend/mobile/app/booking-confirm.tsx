import { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOrder } from '@/components/order-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tryApiCall } from '@/constants/api';

export default function BookingConfirmScreen() {
  const router = useRouter();
  const { state, clearOrder } = useOrder();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userInfo');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };


  const calculateTotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
      return;
    }

    // Kiểm tra dữ liệu bắt buộc
    if (!state.selectedTable?.id) {
      Alert.alert('Lỗi', 'Vui lòng chọn bàn');
      return;
    }

    if (!state.numberOfGuests || state.numberOfGuests <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số người');
      return;
    }

    if (!state.bookingInfo?.date || !state.bookingInfo?.time) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày và giờ');
      return;
    }

    if (!state.items || state.items.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn món');
      return;
    }

    try {
      setIsSubmitting(true);

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        return;
      }

      // Chuẩn bị dữ liệu booking
      const bookingData = {
        tableId: state.selectedTable?.id,
        numberOfGuests: state.numberOfGuests,
        bookingDate: state.bookingInfo?.date,
        bookingTime: state.bookingInfo?.time,
        menuItems: state.items.map(item => ({
          itemId: item.id,
          quantity: item.quantity
        })),
        notes: ''
      };

      console.log('Booking data being sent:', bookingData);

      const result = await tryApiCall('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      if (result.success) {
        console.log('Booking successful with URL:', result.url);
        Alert.alert(
          'ĐẶT THÀNH CÔNG (CHỜ XÁC NHẬN)', 
          `Bàn ${state.selectedTable?.name} đã được đặt cho ${state.numberOfGuests} người vào ${state.bookingInfo?.date} lúc ${state.bookingInfo?.time}.\n\n✅ Thông báo đã được gửi đến nhân viên và quản lý.\n⏰ Nhân viên sẽ xác nhận trong vòng 5 phút.`,
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
        console.error('Booking failed:', result.error);
        Alert.alert('Lỗi đặt bàn', result.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Lỗi kết nối', 'Không thể kết nối đến server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title">Xác nhận đặt bàn</ThemedText>
          <ThemedText>Kiểm tra thông tin trước khi xác nhận</ThemedText>
        </View>

        {/* Thông tin bàn */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Thông tin bàn</ThemedText>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Bàn:</ThemedText>
              <ThemedText style={styles.infoValue}>{state.selectedTable?.name}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Số người:</ThemedText>
              <ThemedText style={styles.infoValue}>{state.numberOfGuests} người</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Ngày:</ThemedText>
              <ThemedText style={styles.infoValue}>{formatDate(state.bookingInfo?.date)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Giờ:</ThemedText>
              <ThemedText style={styles.infoValue}>{state.bookingInfo?.time}</ThemedText>
            </View>
          </View>
        </View>

        {/* Danh sách món */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Món đã chọn</ThemedText>
          <View style={styles.menuCard}>
            {state.items.map((item, index) => (
              <View key={index} style={styles.menuItem}>
                <View style={styles.menuItemInfo}>
                  <ThemedText style={styles.menuItemName}>{item.name}</ThemedText>
                </View>
                <View style={styles.menuItemQuantity}>
                  <ThemedText style={styles.menuItemQuantityText}>x{item.quantity}</ThemedText>
                </View>
                <View style={styles.menuItemPrice}>
                  <ThemedText style={styles.menuItemPriceText}>
                    {(item.price * item.quantity).toLocaleString()}đ
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Tổng tiền */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <ThemedText type="defaultSemiBold" style={styles.totalLabel}>Tổng cộng:</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.totalAmount}>
              {calculateTotal().toLocaleString()}đ
            </ThemedText>
          </View>
        </View>

        {/* Thông báo */}
        <View style={styles.noticeCard}>
          <ThemedText style={styles.noticeText}>
            📋 Đặt bàn của bạn sẽ được xác nhận bởi nhân viên trong thời gian sớm nhất.
          </ThemedText>
        </View>
      </ScrollView>

      {/* Nút xác nhận */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          onPress={handleConfirmBooking} 
          style={[styles.confirmButton, isSubmitting && styles.buttonDisabled]}
          disabled={isSubmitting}
        >
          <ThemedText type="defaultSemiBold" style={styles.confirmButtonText}>
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt bàn'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    marginBottom: 15,
    fontSize: 18,
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuItemQuantity: {
    marginHorizontal: 10,
  },
  menuItemQuantityText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuItemPrice: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  menuItemPriceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  totalSection: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
  },
  totalAmount: {
    fontSize: 20,
    color: '#16a34a',
  },
  noticeCard: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffeaa7',
    marginBottom: 20,
  },
  noticeText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingTop: 20,
  },
  confirmButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
