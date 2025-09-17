import { StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useOrder } from '@/components/order-context';

export default function BookingSuccessScreen() {
  const router = useRouter();
  const { clearOrder } = useOrder();
  const params = useLocalSearchParams<{
    bookingId?: string;
    tableName?: string;
    depositAmount?: string;
  }>();

  const handleGoHome = () => {
    clearOrder();
    router.replace('/');
  };

  const handleViewBooking = () => {
    // Có thể chuyển đến màn hình xem chi tiết booking
    Alert.alert('Thông báo', 'Tính năng xem chi tiết booking sẽ được phát triển');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {/* Icon thành công */}
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#10b981" />
        </View>

        {/* Tiêu đề */}
        <ThemedText type="title" style={styles.title}>
          🎉 ĐẶT BÀN THÀNH CÔNG!
        </ThemedText>

        {/* Thông báo */}
        <ThemedText style={styles.message}>
          Cảm ơn bạn đã đặt bàn tại quán cà phê của chúng tôi!
        </ThemedText>

        {/* Thông tin booking */}
        {params.bookingId && (
          <View style={styles.bookingInfo}>
            <ThemedText type="defaultSemiBold" style={styles.infoTitle}>
              Thông tin đặt bàn
            </ThemedText>
            
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Mã đặt bàn:</ThemedText>
              <ThemedText style={styles.infoValue}>{params.bookingId}</ThemedText>
            </View>
            
            {params.tableName && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Bàn:</ThemedText>
                <ThemedText style={styles.infoValue}>{params.tableName}</ThemedText>
              </View>
            )}
            
            {params.depositAmount && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Tiền cọc:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {parseInt(params.depositAmount).toLocaleString('vi-VN')}đ
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Lưu ý */}
        <View style={styles.noteContainer}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <ThemedText style={styles.noteText}>
            • Vui lòng đến đúng giờ đã đặt{'\n'}
            • Liên hệ quán nếu có thay đổi{'\n'}
            • Thông báo đã được gửi đến nhân viên
          </ThemedText>
        </View>

        {/* Nút hành động */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleGoHome}
          >
            <Ionicons name="home" size={20} color="#fff" />
            <ThemedText style={styles.primaryButtonText}>Về trang chủ</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleViewBooking}
          >
            <Ionicons name="eye" size={20} color="#10b981" />
            <ThemedText style={styles.secondaryButtonText}>Xem chi tiết</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  bookingInfo: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    color: '#111827',
    fontWeight: '600',
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    width: '100%',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
    marginLeft: 12,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  secondaryButtonText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
