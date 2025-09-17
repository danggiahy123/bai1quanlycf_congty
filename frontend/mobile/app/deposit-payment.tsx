import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert, ScrollView, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tryApiCall } from '@/constants/api';

interface Bank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
}

export default function DepositPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    bookingId: string; 
    tableId: string; 
    depositAmount: string;
    tableName: string;
  }>();

  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [paymentInfo, setPaymentInfo] = useState({
    accountNumber: '2246811357',
    accountName: 'DANG GIA HY',
    bankCode: '970407',
    amount: parseInt(params.depositAmount || '0'),
    description: `Coc ban ${params.tableId}`
  });
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'cancelled' | 'checking'>('pending');
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
    fetchBanks();
    // Tự động tạo QR code ngay khi vào màn hình
    generateQRCodeAuto();
  }, []);

  // Tự động tạo QR code với thông tin mặc định
  const generateQRCodeAuto = async () => {
    try {
      setLoading(true);
      const result = await tryApiCall('/api/payment/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountNumber: paymentInfo.accountNumber,
          accountName: paymentInfo.accountName,
          bankCode: paymentInfo.bankCode,
          amount: paymentInfo.amount,
          description: paymentInfo.description
        })
      });

      if (result.success) {
        setQrCode(result.data.qrCode);
        setPaymentStatus('pending');
        console.log('✅ QR code đã được tạo tự động');
      } else {
        console.error('❌ Lỗi tạo QR code tự động:', result.error);
      }
    } catch (error) {
      console.error('Error generating QR code auto:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Lấy danh sách ngân hàng
  const fetchBanks = async () => {
    try {
      setLoading(true);
      const result = await tryApiCall('/api/payment/banks');
      
      if (result.success) {
        setBanks(result.data);
        // Tìm Techcombank
        const techcombank = result.data.find((bank: Bank) => bank.code === 'TCB');
        if (techcombank) {
          setSelectedBank(techcombank);
          setPaymentInfo(prev => ({ ...prev, bankCode: techcombank.bin }));
          // Auto-generate QR code
          setTimeout(() => {
            generateQRCode();
          }, 1000);
        }
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể tải danh sách ngân hàng');
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
      Alert.alert('Lỗi', 'Lỗi khi tải danh sách ngân hàng');
    } finally {
      setLoading(false);
    }
  };

  // Tạo QR code thanh toán cọc
  const generateQRCode = async () => {
    if (!selectedBank) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngân hàng');
      return;
    }

    try {
      setLoading(true);
      const result = await tryApiCall('/api/payment/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountNumber: paymentInfo.accountNumber,
          accountName: paymentInfo.accountName,
          bankCode: paymentInfo.bankCode,
          amount: paymentInfo.amount,
          description: paymentInfo.description
        })
      });

      if (result.success) {
        setQrCode(result.data.qrCode);
        setPaymentStatus('pending');
        Alert.alert('Thành công', 'Tạo QR code thanh toán cọc thành công!');
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể tạo QR code');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      Alert.alert('Lỗi', 'Lỗi khi tạo QR code');
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra thanh toán tự động
  const checkPaymentAutomatically = async () => {
    try {
      setCheckingPayment(true);
      setPaymentStatus('checking');
      
      Alert.alert('Thông báo', '🔍 Đang kiểm tra thanh toán...');
      
      const result = await tryApiCall('/api/payment/check-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: params.bookingId,
          amount: paymentInfo.amount,
          transactionType: 'deposit'
        })
      });

      if (result.success) {
        // Thành công - xác nhận thanh toán cọc
        setPaymentStatus('paid');
        setCheckingPayment(false);
        Alert.alert('Thành công', '✅ ĐÃ NHẬN THẤY THANH TOÁN! Bàn đã được cọc.');
        
        // Gọi API xác nhận thanh toán cọc
        await confirmDepositPaymentAPI();
        
        setTimeout(() => {
          router.replace('/');
        }, 2000);
      } else {
        setCheckingPayment(false);
        setPaymentStatus('pending');
        Alert.alert('Thông báo', '❌ ' + (result.error || 'Chưa phát hiện thanh toán. Vui lòng thử lại sau khi chuyển khoản.'));
      }
    } catch (error) {
      console.error('Error checking payment:', error);
      setCheckingPayment(false);
      setPaymentStatus('pending');
      Alert.alert('Lỗi', '❌ Lỗi kết nối khi kiểm tra thanh toán');
    }
  };

  // Xác nhận thanh toán thủ công (admin)
  const confirmPaymentManually = async () => {
    try {
      setCheckingPayment(true);
      setPaymentStatus('checking');
      
      Alert.alert('Thông báo', '🔧 Đang xác nhận thanh toán thủ công...');
      
      const result = await tryApiCall('/api/payment/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: params.bookingId,
          amount: paymentInfo.amount,
          transactionType: 'deposit'
        })
      });

      if (result.success) {
        // Thành công - xác nhận thanh toán cọc
        setPaymentStatus('paid');
        setCheckingPayment(false);
        Alert.alert('Thành công', '✅ ĐÃ XÁC NHẬN THANH TOÁN! Bàn đã được cọc.');
        
        // Gọi API xác nhận thanh toán cọc
        await confirmDepositPaymentAPI();
        
        setTimeout(() => {
          router.replace('/');
        }, 2000);
      } else {
        setCheckingPayment(false);
        setPaymentStatus('pending');
        Alert.alert('Lỗi', '❌ ' + (result.error || 'Lỗi khi xác nhận thanh toán'));
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      setCheckingPayment(false);
      setPaymentStatus('pending');
      Alert.alert('Lỗi', '❌ Lỗi kết nối khi xác nhận thanh toán');
    }
  };

  // API xác nhận thanh toán cọc
  const confirmDepositPaymentAPI = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const result = await tryApiCall(`/api/bookings/${params.bookingId}/confirm-deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (result.success) {
        console.log('✅ Đã xác nhận thanh toán cọc thành công');
      } else {
        console.error('❌ Lỗi xác nhận thanh toán cọc');
      }
    } catch (error) {
      console.error('Error confirming deposit payment:', error);
    }
  };

  // Xác nhận thanh toán cọc thành công (manual)
  const confirmDepositPayment = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const result = await tryApiCall(`/api/bookings/${params.bookingId}/confirm-deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (result.success) {
        setPaymentStatus('paid');
        Alert.alert('Thành công', '✅ Thanh toán cọc thành công! Bàn đã được cọc.');
        setTimeout(() => {
          router.replace('/');
        }, 1500);
      } else {
        Alert.alert('Lỗi', `❌ Lỗi thanh toán cọc: ${result.error || 'Có lỗi xảy ra'}`);
      }
    } catch (error) {
      console.error('Deposit payment error:', error);
      Alert.alert('Lỗi', '❌ Lỗi kết nối. Vui lòng thử lại.');
    }
  };

  // Hủy thanh toán cọc
  const cancelDepositPayment = () => {
    setPaymentStatus('cancelled');
    setQrCode('');
    Alert.alert('Thông báo', 'Đã hủy thanh toán cọc');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            💰 THANH TOÁN CỌC
          </ThemedText>
          <View style={styles.placeholder} />
        </View>

        {/* Thông tin cọc */}
        <View style={styles.depositInfo}>
          <ThemedText type="defaultSemiBold" style={styles.depositTitle}>
            🎉 ĐẶT BÀN THÀNH CÔNG!
          </ThemedText>
          <ThemedText style={styles.bookingInfo}>
            Bàn {params.tableName} • Booking ID: {params.bookingId?.slice(-8)}
          </ThemedText>
          <View style={styles.amountContainer}>
            <ThemedText style={styles.amountLabel}>Số tiền cọc:</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.amountValue}>
              {paymentInfo.amount.toLocaleString('vi-VN')}đ
            </ThemedText>
          </View>
        </View>

        {!qrCode ? (
          <View style={styles.loadingContainer}>
            <View style={styles.spinner} />
            <ThemedText style={styles.loadingText}>
              Đang tạo QR code thanh toán cọc...
            </ThemedText>
            <ThemedText style={styles.loadingSubText}>
              Vui lòng chờ trong giây lát
            </ThemedText>
          </View>
        ) : (
          <View style={styles.qrContainer}>
            {paymentStatus === 'pending' && (
              <>
                <View style={styles.qrHeader}>
                  <ThemedText type="defaultSemiBold" style={styles.qrTitle}>
                    💳 QR CODE THANH TOÁN CỌC
                  </ThemedText>
                  <ThemedText style={styles.qrSubtitle}>
                    Quét mã QR để thanh toán cọc {paymentInfo.amount.toLocaleString('vi-VN')}đ
                  </ThemedText>
                </View>
                
                <View style={styles.qrCodeContainer}>
                  <Image 
                    source={{ uri: qrCode }} 
                    style={styles.qrCode}
                    resizeMode="contain"
                    onError={(error) => {
                      console.error('QR Code load error:', error);
                      Alert.alert('Lỗi', 'Không thể tải QR code. Vui lòng thử lại.');
                    }}
                    onLoad={() => {
                      console.log('QR Code loaded successfully:', qrCode);
                    }}
                  />
                  <ThemedText style={styles.qrDebugText}>
                    Debug: {qrCode ? 'QR URL loaded' : 'No QR URL'}
                  </ThemedText>
                </View>
                
                <View style={styles.paymentInfo}>
                  <ThemedText style={styles.infoTitle}>Thông tin chuyển khoản:</ThemedText>
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>Tài khoản:</ThemedText>
                    <ThemedText style={styles.infoValue}>{paymentInfo.accountName}</ThemedText>
                  </View>
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>Số tài khoản:</ThemedText>
                    <ThemedText style={styles.infoValue}>{paymentInfo.accountNumber}</ThemedText>
                  </View>
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>Ngân hàng:</ThemedText>
                    <ThemedText style={styles.infoValue}>{selectedBank?.name}</ThemedText>
                  </View>
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.infoLabel}>Nội dung:</ThemedText>
                    <ThemedText style={styles.infoValue}>{paymentInfo.description}</ThemedText>
                  </View>
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    onPress={checkPaymentAutomatically}
                    disabled={checkingPayment}
                    style={[styles.checkButton, checkingPayment && styles.buttonDisabled]}
                  >
                    <ThemedText style={styles.checkButtonText}>
                      {checkingPayment ? '🔍 ĐANG KIỂM TRA...' : '🔍 KIỂM TRA THANH TOÁN TỰ ĐỘNG'}
                    </ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={confirmPaymentManually}
                    disabled={checkingPayment}
                    style={[styles.confirmButton, checkingPayment && styles.buttonDisabled]}
                  >
                    <ThemedText style={styles.confirmButtonText}>
                      {checkingPayment ? '🔧 ĐANG XÁC NHẬN...' : '🔧 XÁC NHẬN THANH TOÁN THỦ CÔNG'}
                    </ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={cancelDepositPayment}
                    style={styles.cancelButton}
                  >
                    <ThemedText style={styles.cancelButtonText}>
                      ❌ Hủy thanh toán
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {paymentStatus === 'checking' && (
              <View style={styles.statusContainer}>
                <View style={styles.spinner} />
                <ThemedText type="defaultSemiBold" style={styles.statusTitle}>
                  🔍 Đang kiểm tra thanh toán...
                </ThemedText>
                <ThemedText style={styles.statusSubtitle}>
                  Vui lòng chờ trong giây lát
                </ThemedText>
              </View>
            )}

            {paymentStatus === 'paid' && (
              <View style={styles.statusContainer}>
                <Ionicons name="checkmark-circle" size={80} color="#16a34a" />
                <ThemedText type="defaultSemiBold" style={styles.successTitle}>
                  ✅ Thanh toán cọc thành công!
                </ThemedText>
                <ThemedText style={styles.successSubtitle}>
                  Bàn {params.tableName} đã được cọc {paymentInfo.amount.toLocaleString('vi-VN')}đ
                </ThemedText>
                <ThemedText style={styles.redirectText}>
                  Đang chuyển về trang chủ...
                </ThemedText>
              </View>
            )}

            {paymentStatus === 'cancelled' && (
              <View style={styles.statusContainer}>
                <Ionicons name="close-circle" size={80} color="#ef4444" />
                <ThemedText type="defaultSemiBold" style={styles.cancelTitle}>
                  ❌ Đã hủy thanh toán cọc
                </ThemedText>
                <TouchableOpacity
                  onPress={() => {
                    setQrCode('');
                    setPaymentStatus('pending');
                    generateQRCode();
                  }}
                  style={styles.retryButton}
                >
                  <ThemedText style={styles.retryButtonText}>
                    Tạo lại QR Code
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  depositInfo: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  depositTitle: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  bookingInfo: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    color: '#666',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  amountLabel: {
    fontSize: 16,
    color: '#92400e',
  },
  amountValue: {
    fontSize: 20,
    color: '#92400e',
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  spinner: {
    width: 50,
    height: 50,
    borderWidth: 4,
    borderColor: '#f3f4f6',
    borderTopColor: '#f59e0b',
    borderRadius: 25,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  loadingSubText: {
    fontSize: 14,
    color: '#6b7280',
  },
  qrContainer: {
    padding: 20,
  },
  qrHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrTitle: {
    fontSize: 18,
    color: '#f59e0b',
    textAlign: 'center',
    marginBottom: 8,
  },
  qrSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrCode: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
  },
  qrDebugText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  paymentInfo: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 12,
  },
  checkButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    alignItems: 'center',
    padding: 40,
  },
  statusTitle: {
    fontSize: 18,
    color: '#3b82f6',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  successTitle: {
    fontSize: 18,
    color: '#16a34a',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 15,
  },
  redirectText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  cancelTitle: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
