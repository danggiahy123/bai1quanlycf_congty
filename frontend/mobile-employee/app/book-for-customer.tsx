import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function BookForCustomerScreen() {
  const router = useRouter();
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearchCustomer = () => {
    if (!customerPhone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại khách hàng');
      return;
    }

    if (customerPhone.length < 10) {
      Alert.alert('Lỗi', 'Số điện thoại phải có ít nhất 10 số');
      return;
    }

    // Lưu SĐT khách hàng và chuyển đến trang đặt bàn
    router.push({
      pathname: '/select-guests',
      params: { customerPhone, isBookingForCustomer: 'true' }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt bàn giùm khách</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionIcon}>
            <Ionicons name="person-add" size={48} color="#3b82f6" />
          </View>
          <Text style={styles.instructionTitle}>Nhập thông tin khách hàng</Text>
          <Text style={styles.instructionText}>
            Nhập số điện thoại của khách hàng để tìm kiếm thông tin hoặc tạo mới
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Số điện thoại khách hàng *</Text>
          <TextInput
            style={styles.phoneInput}
            value={customerPhone}
            onChangeText={setCustomerPhone}
            placeholder="Nhập số điện thoại (VD: 0123456789)"
            keyboardType="phone-pad"
            maxLength={15}
          />
          <Text style={styles.helpText}>
            Hệ thống sẽ tự động tìm kiếm khách hàng có sẵn hoặc tạo mới
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.searchButton, loading && styles.disabledButton]}
          onPress={handleSearchCustomer}
          disabled={loading}
        >
          <Ionicons name="search" size={24} color="white" />
          <Text style={styles.searchButtonText}>
            {loading ? 'Đang tìm...' : 'Tìm khách hàng & Đặt bàn'}
          </Text>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.infoText}>Tìm thấy khách hàng → Sử dụng thông tin có sẵn</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="add-circle" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>Chưa có khách hàng → Tạo mới và đặt bàn</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="restaurant" size={20} color="#f59e0b" />
            <Text style={styles.infoText}>Sau khi đặt bàn, khách sẽ nhận thông báo</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#3b82f6',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  phoneInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
});
