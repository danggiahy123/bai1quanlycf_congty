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
    // Không tự động tạo QR code ngay, chờ fetchBanks xong
  }, []);

  // Tự động tạo QR code với thông tin mặc định
  const generateQRCodeAuto = async () => {
    try {
      setLoading(true);
      console.log('🔄 Đang tạo QR code với thông tin:', paymentInfo);
      
      // Kiểm tra thông tin bắt buộc
      if (!paymentInfo.accountNumber || !paymentInfo.accountName || !paymentInfo.bankCode || !paymentInfo.amount) {
        console.error('❌ Thiếu thông tin bắt buộc:', paymentInfo);
        // Tạo QR code trực tiếp với VietQR API
        const directQRUrl = `https://img.vietqr.io/image/${paymentInfo.bankCode}-${paymentInfo.accountNumber}-compact2.png?amount=${paymentInfo.amount}&addInfo=${encodeURIComponent(paymentInfo.description)}`;
        setQrCode(directQRUrl);
        setPaymentStatus('pending');
        console.log('✅ Đã tạo QR code trực tiếp (thiếu thông tin):', directQRUrl);
        return;
      }
      
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

      console.log('📡 Kết quả tạo QR code:', result);

      if (result.success && result.data && result.data.qrCode) {
        setQrCode(result.data.qrCode);
        setPaymentStatus('pending');
        console.log('✅ QR code đã được tạo tự động:', result.data.qrCode);
      } else {
        console.warn('⚠️ API response không đúng format, tạo QR code trực tiếp');
        // Thử tạo QR code trực tiếp với VietQR API
        const directQRUrl = `https://img.vietqr.io/image/${paymentInfo.bankCode}-${paymentInfo.accountNumber}-compact2.png?amount=${paymentInfo.amount}&addInfo=${encodeURIComponent(paymentInfo.description)}&accountName=${encodeURIComponent(paymentInfo.accountName)}`;
        setQrCode(directQRUrl);
        setPaymentStatus('pending');
        console.log('✅ Đã tạo QR code trực tiếp:', directQRUrl);
      }
    } catch (error) {
      console.error('❌ Lỗi tạo QR code tự động:', error);
      // Thử tạo QR code trực tiếp với VietQR API
      const directQRUrl = `https://img.vietqr.io/image/${paymentInfo.bankCode}-${paymentInfo.accountNumber}-compact2.png?amount=${paymentInfo.amount}&addInfo=${encodeURIComponent(paymentInfo.description)}&accountName=${encodeURIComponent(paymentInfo.accountName)}`;
      setQrCode(directQRUrl);
      setPaymentStatus('pending');
      console.log('✅ Đã tạo QR code trực tiếp (fallback):', directQRUrl);
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
      
      console.log('📡 Kết quả fetchBanks:', result);
      
      if (result.success && result.data && result.data.data && Array.isArray(result.data.data)) {
        setBanks(result.data.data);
        // Tìm Techcombank
        const techcombank = result.data.data.find((bank: Bank) => bank.code === 'TCB');
        if (techcombank) {
          setSelectedBank(techcombank);
          setPaymentInfo(prev => ({ ...prev, bankCode: techcombank.bin }));
          // Auto-generate QR code sau khi có thông tin ngân hàng
          setTimeout(() => {
            generateQRCodeAuto();
          }, 1000);
        } else {
          // Nếu không tìm thấy Techcombank, tạo QR code với thông tin mặc định
          setTimeout(() => {
            generateQRCodeAuto();
          }, 1000);
        }
      } else {
        console.error('Error fetching banks:', result.error || 'Data không hợp lệ');
        // Vẫn tạo QR code với thông tin mặc định nếu không tải được danh sách ngân hàng
        setTimeout(() => {
          generateQRCodeAuto();
        }, 1000);
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
      // Vẫn tạo QR code với thông tin mặc định nếu có lỗi
      setTimeout(() => {
        generateQRCodeAuto();
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  // Tạo QR code thanh toán cọc
  const generateQRCode = async () => {
    try {
      setLoading(true);
      console.log('🔄 Đang tạo QR code với thông tin:', paymentInfo);
      
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

      console.log('📡 Kết quả tạo QR code:', result);

      if (result.success) {
        setQrCode(result.data.qrCode);
        setPaymentStatus('pending');
        console.log('✅ QR code đã được tạo:', result.data.qrCode);
      } else {
        console.error('❌ Lỗi tạo QR code:', result.error);
        // Thử tạo QR code trực tiếp với VietQR API
        const directQRUrl = `https://img.vietqr.io/image/${paymentInfo.bankCode}-${paymentInfo.accountNumber}-compact2.png?amount=${paymentInfo.amount}&addInfo=${encodeURIComponent(paymentInfo.description)}`;
        setQrCode(directQRUrl);
        setPaymentStatus('pending');
        console.log('✅ Đã tạo QR code trực tiếp:', directQRUrl);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      // Thử tạo QR code trực tiếp với VietQR API
      const directQRUrl = `https://img.vietqr.io/image/${paymentInfo.bankCode}-${paymentInfo.accountNumber}-compact2.png?amount=${paymentInfo.amount}&addInfo=${encodeURIComponent(paymentInfo.description)}`;
      setQrCode(directQRUrl);
      setPaymentStatus('pending');
      console.log('✅ Đã tạo QR code trực tiếp (fallback):', directQRUrl);
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

      // API check-payment luôn trả về false vì không thể tự động kiểm tra ngân hàng
      // Chúng ta sẽ chỉ tạo giao dịch khi người dùng xác nhận thủ công
      if (result.success === false) {
        // Hệ thống không thể tự động kiểm tra thanh toán
        setCheckingPayment(false);
        setPaymentStatus('pending');
        Alert.alert(
          '⏳ CHƯA PHÁT HIỆN THANH TOÁN', 
          'Hệ thống chưa phát hiện giao dịch chuyển khoản.\n\n' +
          'Có thể do:\n' +
          '• Giao dịch chưa được xử lý\n' +
          '• Thông tin chuyển khoản chưa đúng\n' +
          '• Cần thời gian để xử lý\n\n' +
          '📱 Vui lòng:\n' +
          '1. Quét QR code và chuyển khoản\n' +
          '2. Đợi 1-2 phút để giao dịch được xử lý\n' +
          '3. Thử lại hoặc xác nhận thủ công',
          [
            { text: 'Thử lại', onPress: () => checkPaymentAutomatically() },
            { text: 'Xác nhận thủ công', onPress: () => confirmPaymentManually() },
            { text: 'Hủy', style: 'cancel' }
          ]
        );
      } else if (result.success === true) {
        // API trả về success=true nhưng chưa thanh toán (bình thường)
        setCheckingPayment(false);
        setPaymentStatus('pending');
        console.log('ℹ️ API trả về success=true, chưa phát hiện thanh toán');
        Alert.alert(
          '⏳ CHƯA PHÁT HIỆN THANH TOÁN',
          'Hệ thống chưa phát hiện giao dịch thanh toán.\n\n' +
          'Vui lòng:\n' +
          '1. Kiểm tra lại giao dịch chuyển khoản\n' +
          '2. Đợi vài phút rồi thử lại\n' +
          '3. Hoặc xác nhận thanh toán thủ công',
          [
            { text: 'Thử lại', onPress: () => checkPaymentAutomatically() },
            { text: 'Xác nhận thủ công', onPress: () => confirmPaymentManually() },
            { text: 'Hủy', style: 'cancel' }
          ]
        );
      } else {
        // Trường hợp không xác định
        setCheckingPayment(false);
        setPaymentStatus('pending');
        console.log('⚠️ API trả về response không xác định:', result);
        Alert.alert(
          '⚠️ LỖI KHÔNG XÁC ĐỊNH',
          'Hệ thống trả về kết quả không xác định.\n\n' +
          'Vui lòng xác nhận thanh toán thủ công.',
          [
            { text: 'Xác nhận thủ công', onPress: () => confirmPaymentManually() },
            { text: 'Hủy', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Lỗi kiểm tra thanh toán:', error);
      setCheckingPayment(false);
      setPaymentStatus('pending');
      Alert.alert(
        '❌ LỖI KẾT NỐI',
        `Không thể kiểm tra trạng thái thanh toán.\n\n` +
        `Lỗi: ${error.message || 'Kết nối bị gián đoạn'}\n\n` +
        `Vui lòng kiểm tra kết nối internet và thử lại.`,
        [
          { text: 'Thử lại', onPress: () => checkPaymentAutomatically() },
          { text: 'Xác nhận thủ công', onPress: () => confirmPaymentManually() },
          { text: 'Hủy', style: 'cancel' }
        ]
      );
    }
  };

  // Xác nhận đã thanh toán - chờ admin xác nhận
  const confirmPaymentManually = async () => {
    Alert.alert(
      'Xác nhận đã thanh toán',
      '💰 Bạn đã chuyển khoản thành công?\n\n' +
      'Nhấn "Xác nhận" để gửi yêu cầu xác nhận.\n' +
      'Admin sẽ kiểm tra và xác nhận trong vài phút.',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xác nhận', 
          onPress: async () => {
            try {
              setCheckingPayment(true);
              const token = await AsyncStorage.getItem('userToken');
              
              if (!token) {
                Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
                return;
              }

              // Gọi API tạo giao dịch cọc QR code và chờ xác nhận
              const result = await tryApiCall('/api/payment/confirm-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  bookingId: params.bookingId,
                  amount: paymentInfo.amount,
                  transactionType: 'deposit',
                  paymentMethod: 'qr_code' // Đánh dấu là thanh toán QR code
                })
              });

              if (result.success) {
                setPaymentStatus('checking');
                setCheckingPayment(false);
                Alert.alert(
                  '✅ ĐÃ CỌC THÀNH CÔNG, ĐANG ĐỢI QUÁN XÁC NHẬN',
                  'Bạn đã thanh toán cọc thành công!\n\n' +
                  'Quán sẽ xác nhận trong vài phút.\n' +
                  'Bạn sẽ nhận được thông báo khi được duyệt.',
                  [
                    {
                      text: 'Về trang chủ',
                      onPress: () => router.replace('/')
                    }
                  ]
                );
              } else {
                setCheckingPayment(false);
                setPaymentStatus('pending');
                console.error('❌ Lỗi xác nhận thanh toán:', result);
                Alert.alert(
                  '❌ XÁC NHẬN THANH TOÁN THẤT BẠI',
                  `Không thể xác nhận thanh toán cọc.\n\n` +
                  `Lỗi: ${result.error || result.message || 'Không xác định'}\n\n` +
                  `Vui lòng thử lại hoặc liên hệ quán để được hỗ trợ.`,
                  [
                    { text: 'Thử lại', onPress: () => confirmPaymentManually() },
                    { text: 'Hủy', style: 'cancel' }
                  ]
                );
              }
            } catch (error) {
              console.error('❌ Lỗi kết nối khi xác nhận thanh toán:', error);
              setCheckingPayment(false);
              setPaymentStatus('pending');
              Alert.alert(
                '❌ LỖI KẾT NỐI',
                `Không thể kết nối đến server.\n\n` +
                `Lỗi: ${error.message || 'Kết nối bị gián đoạn'}\n\n` +
                `Vui lòng kiểm tra kết nối internet và thử lại.`,
                [
                  { text: 'Thử lại', onPress: () => confirmPaymentManually() },
                  { text: 'Hủy', style: 'cancel' }
                ]
              );
            }
          }
        }
      ]
    );
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
                

                {/* Thông tin chuyển khoản */}
                <View style={styles.bankInfoContainer}>
                  <ThemedText type="defaultSemiBold" style={styles.bankInfoTitle}>
                    🏦 THÔNG TIN CHUYỂN KHOẢN
                  </ThemedText>
                  <View style={styles.bankInfoRow}>
                    <ThemedText style={styles.bankInfoLabel}>Tên TK:</ThemedText>
                    <ThemedText style={styles.bankInfoValue}>DANG GIA HY</ThemedText>
                  </View>
                  <View style={styles.bankInfoRow}>
                    <ThemedText style={styles.bankInfoLabel}>Số TK:</ThemedText>
                    <ThemedText style={styles.bankInfoValue}>2246811357</ThemedText>
                  </View>
                  <View style={styles.bankInfoRow}>
                    <ThemedText style={styles.bankInfoLabel}>Ngân hàng:</ThemedText>
                    <ThemedText style={styles.bankInfoValue}>Techcombank (970407)</ThemedText>
                  </View>
                  <View style={styles.bankInfoRow}>
                    <ThemedText style={styles.bankInfoLabel}>Số tiền:</ThemedText>
                    <ThemedText style={[styles.bankInfoValue, styles.amountHighlight]}>
                      {paymentInfo.amount.toLocaleString('vi-VN')} VND
                    </ThemedText>
                  </View>
                  <View style={styles.bankInfoRow}>
                    <ThemedText style={styles.bankInfoLabel}>Nội dung:</ThemedText>
                    <ThemedText style={styles.bankInfoValue}>Coc ban {params.tableName}</ThemedText>
                  </View>
                  
                  {/* Thông báo về VietQR */}
                  <View style={styles.vietqrNotice}>
                    <ThemedText style={styles.vietqrNoticeText}>
                      💡 QR code sử dụng VietQR - chuẩn quốc gia Việt Nam
                    </ThemedText>
                    <ThemedText style={styles.vietqrNoticeSubText}>
                      Tương thích với tất cả app ngân hàng Việt Nam
                    </ThemedText>
                  </View>
                </View>

                {/* Hướng dẫn thanh toán */}
                <View style={styles.instructionContainer}>
                  <ThemedText type="defaultSemiBold" style={styles.instructionTitle}>
                    📱 HƯỚNG DẪN THANH TOÁN
                  </ThemedText>
                  <ThemedText style={styles.instructionText}>
                    1. Quét QR code bằng app ngân hàng{'\n'}
                    2. Hoặc chuyển khoản thủ công theo thông tin trên{'\n'}
                    3. Chuyển đúng số tiền: {paymentInfo.amount.toLocaleString('vi-VN')}đ{'\n'}
                    4. Nhấn "ĐÃ THANH TOÁN - XÁC NHẬN NGAY"{'\n'}
                    5. Admin sẽ kiểm tra và xác nhận trong vài phút
                  </ThemedText>
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
                      {checkingPayment ? '🔧 ĐANG XÁC NHẬN...' : '✅ ĐÃ THANH TOÁN - XÁC NHẬN NGAY'}
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
  bankInfoContainer: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bankInfoTitle: {
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  bankInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  bankInfoLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  bankInfoValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  amountHighlight: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '700',
  },
  vietqrNotice: {
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  vietqrNoticeText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
    textAlign: 'center',
  },
  vietqrNoticeSubText: {
    fontSize: 11,
    color: '#a16207',
    textAlign: 'center',
    marginTop: 2,
  },
  instructionContainer: {
    backgroundColor: '#f0f9ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  instructionTitle: {
    fontSize: 16,
    color: '#0c4a6e',
    textAlign: 'center',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#0c4a6e',
    lineHeight: 20,
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
