import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOrder } from '@/components/order-context';

const DEPOSIT_OPTIONS = [
  { amount: 50000, label: '50,000đ', description: 'Cọc tối thiểu' },
  { amount: 100000, label: '100,000đ', description: 'Cọc tiêu chuẩn' },
  { amount: 200000, label: '200,000đ', description: 'Cọc cao cấp' },
  { amount: 500000, label: '500,000đ', description: 'Cọc VIP' },
];

export default function SelectDepositScreen() {
  const router = useRouter();
  const { state, totalAmount, setDepositAmount } = useOrder();
  const [selectedDeposit, setSelectedDeposit] = useState<number>(50000);

  const handleNext = () => {
    if (selectedDeposit < 50000) {
      Alert.alert('Lỗi', 'Số tiền cọc tối thiểu là 50,000đ');
      return;
    }
    setDepositAmount(selectedDeposit);
    router.push('/order-confirm');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Ionicons name="card" size={20} color="#16a34a" />
          <ThemedText style={styles.headerText}>
            Bàn: {state.tableId} • Số khách: {state.numberOfGuests}
          </ThemedText>
        </View>
        <TouchableOpacity 
          onPress={handleBack} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color="#16a34a" />
          <ThemedText style={styles.backButtonText}>Quay lại</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Thông tin đơn hàng */}
        <View style={styles.orderSummary}>
          <ThemedText type="defaultSemiBold" style={styles.summaryTitle}>
            📋 Tóm tắt đơn hàng
          </ThemedText>
          <View style={styles.summaryItem}>
            <ThemedText style={styles.summaryLabel}>Số món đã chọn:</ThemedText>
            <ThemedText style={styles.summaryValue}>{state.items.length} món</ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText style={styles.summaryLabel}>Tổng tiền món:</ThemedText>
            <ThemedText style={styles.summaryValue}>{totalAmount.toLocaleString('vi-VN')}đ</ThemedText>
          </View>
        </View>

        {/* Chọn số tiền cọc */}
        <View style={styles.depositSection}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            💰 Chọn số tiền cọc
          </ThemedText>
          <ThemedText style={styles.sectionDescription}>
            Vui lòng chọn số tiền cọc để đảm bảo đặt bàn. Số tiền cọc sẽ được trừ vào hóa đơn cuối cùng.
          </ThemedText>

          <View style={styles.depositOptions}>
            {DEPOSIT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.amount}
                style={[
                  styles.depositOption,
                  selectedDeposit === option.amount && styles.depositOptionSelected
                ]}
                onPress={() => setSelectedDeposit(option.amount)}
              >
                <View style={styles.depositOptionContent}>
                  <View style={styles.depositOptionHeader}>
                    <ThemedText 
                      type="defaultSemiBold" 
                      style={[
                        styles.depositAmount,
                        selectedDeposit === option.amount && styles.depositAmountSelected
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                    {selectedDeposit === option.amount && (
                      <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                    )}
                  </View>
                  <ThemedText 
                    style={[
                      styles.depositDescription,
                      selectedDeposit === option.amount && styles.depositDescriptionSelected
                    ]}
                  >
                    {option.description}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Thông tin thanh toán */}
        <View style={styles.paymentInfo}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            💳 Thông tin thanh toán
          </ThemedText>
          <View style={styles.paymentDetails}>
            <View style={styles.paymentRow}>
              <ThemedText style={styles.paymentLabel}>Tổng tiền món:</ThemedText>
              <ThemedText style={styles.paymentValue}>{totalAmount.toLocaleString('vi-VN')}đ</ThemedText>
            </View>
            <View style={styles.paymentRow}>
              <ThemedText style={styles.paymentLabel}>Tiền cọc:</ThemedText>
              <ThemedText style={styles.paymentValue}>{selectedDeposit.toLocaleString('vi-VN')}đ</ThemedText>
            </View>
            <View style={[styles.paymentRow, styles.paymentTotal]}>
              <ThemedText type="defaultSemiBold" style={styles.paymentTotalLabel}>
                Còn lại phải trả:
              </ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.paymentTotalValue}>
                {(totalAmount - selectedDeposit).toLocaleString('vi-VN')}đ
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Lưu ý */}
        <View style={styles.noteSection}>
          <View style={styles.noteHeader}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <ThemedText type="defaultSemiBold" style={styles.noteTitle}>
              Lưu ý quan trọng
            </ThemedText>
          </View>
          <ThemedText style={styles.noteText}>
            • Số tiền cọc sẽ được trừ vào hóa đơn cuối cùng{'\n'}
            • Nếu hủy đặt bàn, tiền cọc sẽ được hoàn lại{'\n'}
            • Thanh toán cọc bằng QR code ngân hàng{'\n'}
            • Đặt bàn chỉ có hiệu lực sau khi thanh toán cọc thành công
          </ThemedText>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.nextButton} 
          onPress={handleNext}
        >
          <Ionicons name="arrow-forward" size={20} color="#fff" />
          <ThemedText style={styles.nextButtonText}>
            Tiếp tục xác nhận đơn hàng
          </ThemedText>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#374151',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  backButtonText: {
    marginLeft: 4,
    color: '#16a34a',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderSummary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    color: '#111827',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  depositSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  depositOptions: {
    gap: 12,
  },
  depositOption: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fff',
  },
  depositOptionSelected: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  depositOptionContent: {
    flex: 1,
  },
  depositOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  depositAmount: {
    fontSize: 18,
    color: '#111827',
  },
  depositAmountSelected: {
    color: '#16a34a',
  },
  depositDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  depositDescriptionSelected: {
    color: '#16a34a',
  },
  paymentInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentDetails: {
    gap: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  paymentValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  paymentTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    marginTop: 8,
  },
  paymentTotalLabel: {
    fontSize: 16,
    color: '#111827',
  },
  paymentTotalValue: {
    fontSize: 16,
    color: '#16a34a',
  },
  noteSection: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    marginLeft: 8,
    fontSize: 16,
    color: '#1e40af',
  },
  noteText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
