import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DEFAULT_API_URL } from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';

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

interface PaymentScreenProps {
  route?: {
    params: {
      tableId: string;
      totalAmount: number;
    };
  };
}

export default function PaymentScreen({ route }: PaymentScreenProps) {
  const router = useRouter();
  const { tableId, totalAmount } = route?.params || { tableId: '', totalAmount: 0 };
  
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [paymentInfo, setPaymentInfo] = useState({
    accountNumber: '2246811357',
    accountName: 'DANG GIA HY',
    bankCode: '970407',
    amount: totalAmount,
    description: `Thanh toan ban ${tableId}`
  });
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'cancelled'>('pending');

  // Lấy danh sách ngân hàng
  const fetchBanks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${DEFAULT_API_URL}/api/payment/banks`);
      const data = await response.json();
      
      if (data.success) {
        setBanks(data.data);
        // Tìm Techcombank
        const techcombank = data.data.find((bank: Bank) => bank.code === 'TCB');
        if (techcombank) {
          setSelectedBank(techcombank);
          setPaymentInfo(prev => ({ ...prev, bankCode: techcombank.bin }));
        }
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể tải danh sách ngân hàng');
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách ngân hàng');
    } finally {
      setLoading(false);
    }
  };

  // Tạo QR code thanh toán
  const generateQRCode = async () => {
    if (!selectedBank) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngân hàng');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${DEFAULT_API_URL}/api/payment/generate-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountNumber: paymentInfo.accountNumber,
          accountName: paymentInfo.accountName,
          bankCode: paymentInfo.bankCode,
          amount: totalAmount,
          description: `Thanh toan ban ${tableId}`
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setQrCode(data.data.qrCode);
        setPaymentStatus('pending');
        Alert.alert('Thành công', 'Tạo QR code thành công!');
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể tạo QR code');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      Alert.alert('Lỗi', 'Không thể tạo QR code');
    } finally {
      setLoading(false);
    }
  };

  // Xác nhận thanh toán thành công
  const confirmPayment = async () => {
    try {
      // Gọi API xác nhận thanh toán
      const response = await fetch(`${DEFAULT_API_URL}/api/orders/by-table/${tableId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setPaymentStatus('paid');
        Alert.alert('Thành công', 'Xác nhận thanh toán thành công!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Lỗi', 'Không thể xác nhận thanh toán');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      Alert.alert('Lỗi', 'Không thể xác nhận thanh toán');
    }
  };

  // Hủy thanh toán
  const cancelPayment = () => {
    setPaymentStatus('cancelled');
    setQrCode('');
    Alert.alert('Thông báo', 'Đã hủy thanh toán');
  };

  useEffect(() => {
    fetchBanks();
    setPaymentInfo(prev => ({ 
      ...prev, 
      amount: totalAmount,
      description: `Thanh toan ban ${tableId}`
    }));
  }, [totalAmount, tableId]);

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: `Thanh toán bàn ${tableId}`,
          headerStyle: { backgroundColor: '#16a34a' },
          headerTintColor: '#fff',
        }} 
      />
      
      <ThemedView style={styles.container}>
        {/* Header thông tin */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Ionicons name="restaurant" size={24} color="#16a34a" />
            <ThemedText style={styles.headerText}>
              Bàn: {tableId}
            </ThemedText>
          </View>
          <View style={styles.amountContainer}>
            <ThemedText style={styles.amountLabel}>Tổng tiền:</ThemedText>
            <ThemedText style={styles.amountValue}>
              {totalAmount.toLocaleString('vi-VN')}đ
            </ThemedText>
          </View>
        </View>

        {!qrCode ? (
          <View style={styles.content}>
            <View style={styles.card}>
              <ThemedText style={styles.cardTitle}>Chọn ngân hàng</ThemedText>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bankScroll}>
                {banks.map((bank) => (
                  <TouchableOpacity
                    key={bank.id}
                    style={[
                      styles.bankItem,
                      selectedBank?.id === bank.id && styles.bankItemSelected
                    ]}
                    onPress={() => {
                      setSelectedBank(bank);
                      setPaymentInfo(prev => ({ ...prev, bankCode: bank.bin }));
                    }}
                  >
                    <Image source={{ uri: bank.logo }} style={styles.bankLogo} />
                    <ThemedText style={styles.bankName}>{bank.shortName}</ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.generateButton, !selectedBank && styles.generateButtonDisabled]}
                onPress={generateQRCode}
                disabled={loading || !selectedBank}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="qr-code" size={20} color="#fff" />
                    <ThemedText style={styles.generateButtonText}>Tạo QR Code</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            {paymentStatus === 'pending' && (
              <View style={styles.card}>
                <View style={styles.pendingContainer}>
                  <Ionicons name="time" size={48} color="#f59e0b" />
                  <ThemedText style={styles.pendingText}>
                    Đang chờ khách hàng thanh toán...
                  </ThemedText>
                </View>
                
                <View style={styles.qrContainer}>
                  <Image 
                    source={{ uri: qrCode }} 
                    style={styles.qrCode}
                    resizeMode="contain"
                  />
                </View>
                
                <View style={styles.paymentInfo}>
                  <ThemedText style={styles.paymentText}>
                    Quét mã QR để chuyển tiền đến {paymentInfo.accountName}
                  </ThemedText>
                  <ThemedText style={styles.paymentSubtext}>
                    {selectedBank?.name} - {paymentInfo.accountNumber}
                  </ThemedText>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={confirmPayment}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <ThemedText style={styles.buttonText}>Xác nhận đã thanh toán</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelPayment}
                  >
                    <Ionicons name="close-circle" size={20} color="#fff" />
                    <ThemedText style={styles.buttonText}>Hủy</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {paymentStatus === 'paid' && (
              <View style={styles.card}>
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-circle" size={64} color="#10b981" />
                  <ThemedText style={styles.successText}>
                    Thanh toán thành công!
                  </ThemedText>
                  <ThemedText style={styles.successSubtext}>
                    Đang chuyển về trang quản lý...
                  </ThemedText>
                </View>
              </View>
            )}

            {paymentStatus === 'cancelled' && (
              <View style={styles.card}>
                <View style={styles.cancelledContainer}>
                  <Ionicons name="close-circle" size={64} color="#ef4444" />
                  <ThemedText style={styles.cancelledText}>
                    Đã hủy thanh toán
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => {
                      setQrCode('');
                      setPaymentStatus('pending');
                    }}
                  >
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <ThemedText style={styles.buttonText}>Tạo lại QR Code</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#16a34a',
    padding: 20,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  amountContainer: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#111827',
  },
  bankScroll: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  bankItem: {
    alignItems: 'center',
    padding: 15,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    minWidth: 80,
  },
  bankItemSelected: {
    borderColor: '#16a34a',
    backgroundColor: '#dcfce7',
  },
  bankLogo: {
    width: 32,
    height: 32,
    marginBottom: 8,
  },
  bankName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  generateButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  pendingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pendingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
    marginTop: 10,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrCode: {
    width: 250,
    height: 250,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  paymentInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  paymentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 5,
  },
  paymentSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  cancelledContainer: {
    alignItems: 'center',
    padding: 20,
  },
  cancelledText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
});
