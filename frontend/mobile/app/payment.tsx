import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { DEFAULT_API_URL } from '@/constants/api';
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

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId?: string;
    tableId?: string;
    depositAmount?: string;
    tableName?: string;
  }>();
  
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [paymentInfo, setPaymentInfo] = useState({
    accountNumber: '2246811357',
    accountName: 'DANG GIA HY',
    bankCode: '970407',
    amount: params.depositAmount || '',
    description: `Coc ban ${params.tableName || 'N/A'}`
  });

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

    if (!paymentInfo.accountNumber || !paymentInfo.accountName) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin tài khoản');
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
          amount: paymentInfo.amount ? parseInt(paymentInfo.amount) : 0,
          description: paymentInfo.description
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setQrCode(data.data.qrCode);
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

  // Tra cứu thông tin tài khoản
  const lookupAccount = async () => {
    if (!selectedBank || !paymentInfo.accountNumber) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngân hàng và nhập số tài khoản');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${DEFAULT_API_URL}/api/payment/lookup-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountNumber: paymentInfo.accountNumber,
          bankCode: paymentInfo.bankCode
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPaymentInfo(prev => ({ 
          ...prev, 
          accountName: data.data.accountName || prev.accountName 
        }));
        Alert.alert('Thành công', 'Tra cứu thông tin tài khoản thành công!');
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể tra cứu thông tin tài khoản');
      }
    } catch (error) {
      console.error('Error looking up account:', error);
      Alert.alert('Lỗi', 'Không thể tra cứu tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  // Tự động tạo QR code khi có thông tin booking
  useEffect(() => {
    if (params.bookingId && params.depositAmount && selectedBank) {
      generateQRCode();
    }
  }, [params.bookingId, params.depositAmount, selectedBank]);

  // Xác nhận thanh toán cọc
  const confirmPayment = async () => {
    if (!params.bookingId) {
      Alert.alert('Lỗi', 'Không có thông tin booking');
      return;
    }

    try {
      setLoading(true);
      const result = await tryApiCall(`/api/bookings/${params.bookingId}/confirm-deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (result.success) {
        // Chuyển đến màn hình thành công
        router.replace({
          pathname: '/booking-success',
          params: {
            bookingId: params.bookingId,
            tableName: params.tableName,
            depositAmount: params.depositAmount
          }
        });
      } else {
        Alert.alert('Lỗi', result.error || 'Xác nhận thanh toán thất bại');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      Alert.alert('Lỗi', 'Lỗi kết nối khi xác nhận thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const screenWidth = Dimensions.get('window').width;

  return (
    <>
      <Stack.Screen options={{ title: '💳 Thanh toán' }} />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>💳 Thanh toán chuyển khoản</Text>
          <Text style={styles.subtitle}>Quét mã QR để chuyển tiền</Text>
        </View>

        {/* Thông tin tài khoản */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin tài khoản nhận tiền</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số tài khoản</Text>
            <TextInput
              style={styles.input}
              value={paymentInfo.accountNumber}
              onChangeText={(text) => setPaymentInfo(prev => ({ ...prev, accountNumber: text }))}
              placeholder="Nhập số tài khoản"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên chủ tài khoản</Text>
            <TextInput
              style={styles.input}
              value={paymentInfo.accountName}
              onChangeText={(text) => setPaymentInfo(prev => ({ ...prev, accountName: text }))}
              placeholder="Nhập tên chủ tài khoản"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ngân hàng</Text>
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
                  <Text style={styles.bankName}>{bank.shortName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số tiền (VND)</Text>
            <TextInput
              style={styles.input}
              value={paymentInfo.amount}
              onChangeText={(text) => setPaymentInfo(prev => ({ ...prev, amount: text }))}
              placeholder="Nhập số tiền"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nội dung chuyển khoản</Text>
            <TextInput
              style={styles.input}
              value={paymentInfo.description}
              onChangeText={(text) => setPaymentInfo(prev => ({ ...prev, description: text }))}
              placeholder="Nhập nội dung chuyển khoản"
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.lookupButton]}
              onPress={lookupAccount}
              disabled={loading || !selectedBank || !paymentInfo.accountNumber}
            >
              <Text style={styles.buttonText}>🔍 Tra cứu</Text>
        </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.generateButton]}
              onPress={generateQRCode}
              disabled={loading || !selectedBank || !paymentInfo.accountNumber || !paymentInfo.accountName}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>📱 Tạo QR</Text>
              )}
        </TouchableOpacity>
      </View>
        </View>

        {/* QR Code */}
        {qrCode && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>QR Code thanh toán</Text>
            <View style={styles.qrContainer}>
            <Image
                source={{ uri: qrCode }} 
                style={[styles.qrCode, { width: screenWidth * 0.7, height: screenWidth * 0.7 }]}
              resizeMode="contain"
            />
              <Text style={styles.qrText}>
                Quét mã QR để chuyển tiền đến {paymentInfo.accountName}
              </Text>
              <Text style={styles.qrSubtext}>
                {selectedBank?.name} - {paymentInfo.accountNumber}
              </Text>
              {paymentInfo.amount && (
                <Text style={styles.amountText}>
                  {parseInt(paymentInfo.amount).toLocaleString('vi-VN')} VND
                </Text>
              )}
            </View>
            
            {/* Nút xác nhận thanh toán */}
            {params.bookingId && (
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={confirmPayment}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>✅ Đã chuyển khoản - Xác nhận</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  card: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 10,
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
    color: '#333',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  bankScroll: {
    flexDirection: 'row',
  },
  bankItem: {
    alignItems: 'center',
    padding: 10,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    minWidth: 80,
  },
  bankItemSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e8',
  },
  bankLogo: {
    width: 30,
    height: 30,
    marginBottom: 5,
  },
  bankName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  lookupButton: {
    backgroundColor: '#FF9800',
  },
  generateButton: {
    backgroundColor: '#4CAF50',
  },
  confirmButton: {
    backgroundColor: '#10b981',
    marginTop: 15,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrCode: {
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  qrText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  qrSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  amountText: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});