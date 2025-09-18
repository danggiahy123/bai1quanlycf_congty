import { StyleSheet, TouchableOpacity, View, Alert, ScrollView, Image, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOrder } from '@/components/order-context';
import { useTables } from '@/components/tables-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { tryApiCall } from '@/constants/api';

export default function OrderConfirmScreen() {
  const router = useRouter();
  const { state, totalAmount, clearOrder } = useOrder();
  const { markPending, isPending } = useTables();
  
  // State cho QR payment
  const [showQRPayment, setShowQRPayment] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tạo QR code thanh toán
  const generateQRCode = async (depositAmount) => {
    try {
      setQrLoading(true);
      console.log('🔄 Đang tạo QR code với số tiền:', depositAmount);
      
      // Tạo QR code URL trực tiếp (fallback)
      const qrCodeUrl = `https://img.vietqr.io/image/970407-2246811357-compact2.png?amount=${depositAmount}&addInfo=${encodeURIComponent(`Coc ban ${state.selectedTable?.name || 'N/A'}`)}`;
      
      console.log('🔗 QR Code URL:', qrCodeUrl);
      
      // Thử gọi API trước
      try {
        const result = await tryApiCall('/api/payment/generate-qr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountNumber: '2246811357',
            accountName: 'DANG GIA HY',
            bankCode: '970407',
            amount: depositAmount,
            description: `Coc ban ${state.selectedTable?.name || 'N/A'}`
          })
        });

        if (result.success && result.data && result.data.success) {
          setQrCode(result.data.qrCode);
          console.log('✅ QR code đã được tạo từ API');
        } else {
          console.warn('⚠️ API failed, sử dụng fallback URL');
          setQrCode(qrCodeUrl);
        }
      } catch (apiError) {
        console.warn('⚠️ API error, sử dụng fallback URL:', apiError);
        setQrCode(qrCodeUrl);
      }
      
    } catch (error) {
      console.error('Error generating QR code:', error);
      Alert.alert('Lỗi', 'Lỗi kết nối khi tạo QR code');
    } finally {
      setQrLoading(false);
    }
  };

  // Xử lý cọc ngay
  const handleDepositPayment = async () => {
    try {
      setIsSubmitting(true);
      
      // Lấy token và thông tin user
      const token = await AsyncStorage.getItem('userToken');
      const userInfo = await AsyncStorage.getItem('userInfo');
      
      if (!token || !userInfo) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        return;
      }

      const user = JSON.parse(userInfo);
      
      // Kiểm tra ngày giờ đã được chọn chưa
      if (!state.bookingInfo?.date || !state.bookingInfo?.time) {
        Alert.alert('Lỗi', 'Vui lòng chọn ngày và giờ đặt bàn');
        return;
      }

      // Tạo booking thực sự
      const bookingData = {
        tableId: state.selectedTable?.id,
        numberOfGuests: state.numberOfGuests,
        bookingDate: state.bookingInfo.date,
        bookingTime: state.bookingInfo.time,
        menuItems: state.items.map(item => ({
          itemId: item.id,
          quantity: item.quantity
        })),
        notes: 'Đặt bàn trực tiếp tại quán',
        depositAmount: state.depositAmount || 50000 // Sử dụng cọc từ context, mặc định 50k
      };

      // Tạo booking với cọc
      const result = await tryApiCall('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      if (result.success) {
        console.log('✅ Booking created successfully');
        
        // Chuyển đến màn hình thanh toán cọc QR
        router.push({
          pathname: '/deposit-payment',
          params: {
            bookingId: result.data?.booking?.id || result.data?.bookingId || result.data?._id,
            tableId: state.selectedTable?.id,
            depositAmount: bookingData.depositAmount,
            tableName: state.selectedTable?.name
          }
        });
        
      } else {
        console.error('❌ Booking failed:', result.error);
        Alert.alert('Lỗi', result.error || 'Không thể tạo đơn hàng');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kiểm tra thanh toán tự động
  const checkPaymentAutomatically = async () => {
    if (!bookingData) return;
    
    try {
      console.log('🔍 Đang kiểm tra thanh toán tự động...');
      
      const result = await tryApiCall('/api/payment/check-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: bookingData.bookingId,
          amount: bookingData.depositAmount,
          transactionType: 'deposit'
        })
      });

      if (result.success && result.data?.status === 'completed') {
        console.log('✅ Đã phát hiện thanh toán!');
        Alert.alert(
          '✅ ĐÃ CỌC THÀNH CÔNG, ĐANG ĐỢI QUÁN XÁC NHẬN', 
          'Bạn đã thanh toán cọc thành công!\n\n' +
          'Quán sẽ xác nhận trong vài phút.\n' +
          '📞 Liên hệ quán nếu cần hỗ trợ.',
          [
            { text: 'OK', onPress: () => router.replace('/') }
          ]
        );
      } else {
        Alert.alert(
          '⏳ CHƯA PHÁT HIỆN THANH TOÁN',
          'Hệ thống chưa phát hiện giao dịch chuyển khoản.\n\n' +
          'Có thể do:\n' +
          '• Giao dịch chưa được xử lý\n' +
          '• Thông tin chuyển khoản chưa đúng\n' +
          '• Cần thời gian để xử lý\n\n' +
          'Vui lòng thử lại sau 30 giây hoặc liên hệ quán.',
          [
            { text: 'Thử lại sau 30s', onPress: () => setTimeout(checkPaymentAutomatically, 30000) },
            { text: 'Liên hệ quán', onPress: () => {} },
            { text: 'Hủy', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Lỗi kiểm tra thanh toán:', error);
      Alert.alert(
        '❌ LỖI KẾT NỐI',
        `Không thể kiểm tra trạng thái thanh toán.\n\n` +
        `Lỗi: ${error.message || 'Kết nối bị gián đoạn'}\n\n` +
        `Vui lòng kiểm tra kết nối internet và thử lại.`,
        [
          { text: 'Thử lại', onPress: () => checkPaymentAutomatically() },
          { text: 'Hủy', style: 'cancel' }
        ]
      );
    }
  };


  // Hủy thanh toán
  const cancelPayment = () => {
    setShowQRPayment(false);
    setQrCode('');
    setBookingData(null);
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
            <ThemedText style={styles.totalLabel}>Tổng tiền món:</ThemedText>
            <ThemedText style={styles.totalAmount}>
              {totalAmount.toLocaleString('vi-VN')}đ
            </ThemedText>
          </View>
          <View style={styles.totalRow}>
            <ThemedText style={styles.totalLabel}>💰 Tiền cọc:</ThemedText>
            <ThemedText style={styles.depositAmount}>
              {(state.depositAmount || 50000).toLocaleString('vi-VN')}đ
            </ThemedText>
          </View>
          <View style={[styles.totalRow, styles.finalTotal]}>
            <ThemedText style={styles.finalTotalLabel}>Còn lại phải trả:</ThemedText>
            <ThemedText style={styles.finalTotalAmount}>
              {(totalAmount - (state.depositAmount || 50000)).toLocaleString('vi-VN')}đ
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.sendButton} onPress={handleDepositPayment} disabled={isSubmitting}>
          <Ionicons name="card" size={20} color="#fff" />
          <ThemedText style={styles.sendButtonText}>CỌC NGAY</ThemedText>
        </TouchableOpacity>
      </View>

      {/* QR Payment Modal */}
      {showQRPayment && (
        <Modal
          visible={showQRPayment}
          transparent={true}
          animationType="slide"
          onRequestClose={cancelPayment}
        >
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


                <View style={styles.qrPaymentButtons}>
                  <TouchableOpacity 
                    onPress={checkPaymentAutomatically}
                    style={styles.checkPaymentButton}
                  >
                    <ThemedText style={styles.checkPaymentButtonText}>
                      🔍 Kiểm tra thanh toán tự động
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
        </Modal>
      )}
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
  depositAmount: {
    fontSize: 18,
    color: '#16a34a',
    fontWeight: 'bold',
  },
  finalTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    marginTop: 8,
  },
  finalTotalLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  finalTotalAmount: {
    fontSize: 20,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  // QR Payment Modal Styles
  qrPaymentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
  checkPaymentButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkPaymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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