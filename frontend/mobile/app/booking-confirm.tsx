import { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert, ScrollView, TextInput, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [showQRPayment, setShowQRPayment] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  // Sử dụng depositAmount từ context thay vì state local
  const depositAmount = state.depositAmount?.toString() || '';
  // Không cần modal chọn cọc nữa vì đã chọn ở màn hình trước

  useEffect(() => {
    loadUser();
  }, []);

  // Tạo QR code khi hiển thị thanh toán
  useEffect(() => {
    if (showQRPayment && bookingData) {
      generateQRCode();
    }
  }, [showQRPayment, bookingData]);

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

  // Tạo QR code thanh toán
  const generateQRCode = async () => {
    if (!bookingData) return;
    
    try {
      setQrLoading(true);
      const result = await tryApiCall('/api/payment/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountNumber: '2246811357',
          accountName: 'DANG GIA HY',
          bankCode: '970407',
          amount: parseInt(bookingData.depositAmount),
          description: `Coc ban ${bookingData.tableName}`
        })
      });

      if (result.success) {
        setQrCode(result.data.qrCode);
        console.log('✅ QR code đã được tạo');
      } else {
        console.error('❌ Lỗi tạo QR code:', result.error);
        Alert.alert('Lỗi', 'Không thể tạo QR code thanh toán');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      Alert.alert('Lỗi', 'Lỗi kết nối khi tạo QR code');
    } finally {
      setQrLoading(false);
    }
  };

  // Xác nhận thanh toán cọc
  const confirmDepositPayment = async () => {
    if (!bookingData) return;
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      const result = await tryApiCall(`/api/bookings/${bookingData.bookingId}/confirm-deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (result.success) {
        Alert.alert(
          '🎉 THÀNH CÔNG!', 
          `Đã cọc ${parseInt(bookingData.depositAmount).toLocaleString()}đ cho bàn ${bookingData.tableName}.\n\n✅ Cọc ngay thành công!`,
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
        Alert.alert('Lỗi', result.error || 'Xác nhận cọc thất bại');
      }
    } catch (error) {
      console.error('Error confirming deposit:', error);
      Alert.alert('Lỗi', 'Lỗi kết nối khi xác nhận cọc');
    }
  };

  // Hủy thanh toán
  const cancelPayment = () => {
    setShowQRPayment(false);
    setQrCode('');
    setBookingData(null);
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

    // BẮT BUỘC PHẢI CHỌN CỌC
    if (!depositAmount || parseInt(depositAmount) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn số tiền cọc (tối thiểu 50,000đ)');
      return;
    }

    if (parseInt(depositAmount) < 50000) {
      Alert.alert('Lỗi', 'Số tiền cọc tối thiểu là 50,000đ');
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
        notes: '',
        depositAmount: depositAmount ? parseInt(depositAmount) : 0
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
        
        // Nếu có cọc, hiển thị QR thanh toán ngay trong màn hình này
        if (depositAmount && parseInt(depositAmount) > 0) {
          // Hiển thị QR thanh toán ngay lập tức, giống Web Admin
          setShowQRPayment(true);
          setBookingData({
            bookingId: result.data?.booking?.id || result.data?.bookingId || result.data?._id,
            tableId: state.selectedTable?.id,
            depositAmount: depositAmount,
            tableName: state.selectedTable?.name
          });
        } else {
          // Không cọc, thông báo bình thường
          Alert.alert(
            'ĐẶT THÀNH CÔNG (CHỜ XÁC NHẬN)', 
            `Bàn ${state.selectedTable?.name} đã được đặt cho ${state.numberOfGuests} người vào ${state.bookingInfo?.date} lúc ${state.bookingInfo?.time}.\n\n✅ Cọc ngay để giữ bàn.\n⏰ Nhân viên sẽ xác nhận trong vòng 5 phút.`,
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
        }
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

  // depositOptions đã được chuyển sang màn hình select-deposit

  // Các hàm này không cần nữa vì sử dụng context

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

        {/* Số tiền cọc đã chọn */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>💰 Số tiền cọc đã chọn</ThemedText>
          <View style={styles.depositCard}>
            <View style={styles.depositDisplay}>
              <ThemedText style={styles.depositDisplayText}>
                {state.depositAmount ? `${parseInt(state.depositAmount).toLocaleString()}đ` : 'Chưa chọn cọc'}
              </ThemedText>
            </View>
            <ThemedText style={styles.depositNote}>
              💡 Số tiền cọc sẽ được hiển thị trong mục thanh toán bàn của quản lý
            </ThemedText>
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
          {depositAmount && parseInt(depositAmount) > 0 && (
            <View style={styles.totalRow}>
              <ThemedText type="defaultSemiBold" style={styles.depositLabel}>Số tiền cọc:</ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.depositAmount}>
                {parseInt(depositAmount).toLocaleString()}đ
              </ThemedText>
            </View>
          )}
        </View>

        {/* Thông báo */}
        <View style={styles.noticeCard}>
          <ThemedText style={styles.noticeText}>
            💰 CỌC NGAY để giữ bàn và hoàn tất đặt bàn.
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

      {/* QR Payment Modal - Hiển thị ngay khi có cọc */}
      {showQRPayment && (
        <View style={styles.qrPaymentOverlay}>
          <View style={styles.qrPaymentModal}>
            <View style={styles.qrPaymentHeader}>
              <ThemedText type="title" style={styles.qrPaymentTitle}>
                💳 THANH TOÁN CỌC
              </ThemedText>
              <TouchableOpacity onPress={cancelPayment} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.qrPaymentContent}>
              <ThemedText style={styles.qrPaymentSubtitle}>
                Quét mã QR để thanh toán cọc {parseInt(bookingData?.depositAmount || 0).toLocaleString()}đ
              </ThemedText>

              {qrLoading ? (
                <View style={styles.qrLoadingContainer}>
                  <View style={styles.qrSpinner} />
                  <ThemedText style={styles.qrLoadingText}>Đang tạo QR code...</ThemedText>
                </View>
              ) : qrCode ? (
                <View style={styles.qrCodeContainer}>
                  <Image 
                    source={{ uri: qrCode }} 
                    style={styles.qrCodeImage}
                    resizeMode="contain"
                    onError={(error) => {
                      console.error('QR Code load error:', error);
                      Alert.alert('Lỗi', 'Không thể tải QR code');
                    }}
                  />
                </View>
              ) : (
                <View style={styles.qrErrorContainer}>
                  <ThemedText style={styles.qrErrorText}>Không thể tạo QR code</ThemedText>
                </View>
              )}

              <View style={styles.paymentInfo}>
                <ThemedText style={styles.paymentInfoTitle}>Thông tin chuyển khoản:</ThemedText>
                <View style={styles.paymentInfoRow}>
                  <ThemedText style={styles.paymentInfoLabel}>Tài khoản:</ThemedText>
                  <ThemedText style={styles.paymentInfoValue}>DANG GIA HY</ThemedText>
                </View>
                <View style={styles.paymentInfoRow}>
                  <ThemedText style={styles.paymentInfoLabel}>Số TK:</ThemedText>
                  <ThemedText style={styles.paymentInfoValue}>2246811357</ThemedText>
                </View>
                <View style={styles.paymentInfoRow}>
                  <ThemedText style={styles.paymentInfoLabel}>Ngân hàng:</ThemedText>
                  <ThemedText style={styles.paymentInfoValue}>Techcombank</ThemedText>
                </View>
                <View style={styles.paymentInfoRow}>
                  <ThemedText style={styles.paymentInfoLabel}>Số tiền:</ThemedText>
                  <ThemedText style={styles.paymentInfoValue}>{parseInt(bookingData?.depositAmount || 0).toLocaleString()}đ</ThemedText>
                </View>
              </View>

              <View style={styles.qrPaymentButtons}>
                <TouchableOpacity 
                  onPress={confirmDepositPayment}
                  style={styles.confirmPaymentButton}
                >
                  <ThemedText style={styles.confirmPaymentButtonText}>
                    ✅ Đã chuyển khoản - Xác nhận
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={cancelPayment}
                  style={styles.cancelPaymentButton}
                >
                  <ThemedText style={styles.cancelPaymentButtonText}>
                    ❌ Hủy thanh toán
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Modal chọn cọc đã được chuyển sang màn hình select-deposit */}
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
  depositCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  depositInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  depositNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  depositLabel: {
    fontSize: 16,
    color: '#666',
  },
  depositAmount: {
    fontSize: 16,
    color: '#ff6b35',
  },
  depositDisplay: {
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    alignItems: 'center',
  },
  depositDisplayText: {
    fontSize: 18,
    color: '#0ea5e9',
    fontWeight: 'bold',
  },
  depositButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  depositButtonText: {
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#ff6b35',
    marginLeft: 5,
  },
  // QR Payment Modal Styles
  qrPaymentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  qrPaymentModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 20,
    maxHeight: '90%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  qrPaymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  qrPaymentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  closeButton: {
    padding: 5,
  },
  qrPaymentContent: {
    padding: 20,
  },
  qrPaymentSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  qrLoadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  qrSpinner: {
    width: 50,
    height: 50,
    borderWidth: 4,
    borderColor: '#f3f4f6',
    borderTopColor: '#f59e0b',
    borderRadius: 25,
    marginBottom: 15,
  },
  qrLoadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrCodeImage: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
  },
  qrErrorContainer: {
    alignItems: 'center',
    padding: 40,
  },
  qrErrorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  paymentInfo: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  paymentInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  paymentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  paymentInfoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  paymentInfoValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  qrPaymentButtons: {
    gap: 12,
  },
  confirmPaymentButton: {
    backgroundColor: '#10b981',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmPaymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelPaymentButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelPaymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
