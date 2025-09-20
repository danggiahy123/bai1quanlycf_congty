import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';

export default function SelectGuestsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [numberOfGuests, setNumberOfGuests] = useState('');
  const [isBookingForCustomer, setIsBookingForCustomer] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    // Kiểm tra xem có phải đặt bàn giùm khách không
    if (params.isBookingForCustomer === 'true' && params.customerPhone) {
      setIsBookingForCustomer(true);
      setCustomerPhone(params.customerPhone as string);
    }
  }, [params]);

  const handleContinue = () => {
    const guests = parseInt(numberOfGuests);
    
    if (!numberOfGuests || isNaN(guests) || guests < 1) {
      Alert.alert('Lỗi', 'Vui lòng chọn số khách từ 1 trở lên');
      return;
    }

    // Lưu số khách và chuyển đến màn hình chọn bàn
    const nextParams: any = { numberOfGuests: guests.toString() };
    
    // Nếu đặt bàn giùm khách, truyền thêm thông tin
    if (isBookingForCustomer) {
      nextParams.isBookingForCustomer = 'true';
      nextParams.customerPhone = customerPhone;
    }
    
    router.push({
      pathname: '/select-table',
      params: nextParams
    });
  };

  const quickSelect = (guests: number) => {
    setNumberOfGuests(guests.toString());
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: isBookingForCustomer ? `Đặt bàn cho ${customerPhone}` : 'Chọn số khách',
          headerStyle: { backgroundColor: isBookingForCustomer ? '#3b82f6' : '#16a34a' },
          headerTintColor: '#fff',
        }} 
      />
      
      <View style={styles.content}>
        {/* Thông tin khách hàng nếu đặt bàn giùm */}
        {isBookingForCustomer && (
          <View style={styles.customerInfo}>
            <View style={styles.customerInfoHeader}>
              <Ionicons name="person" size={24} color="#3b82f6" />
              <ThemedText style={styles.customerInfoTitle}>Đặt bàn giùm khách</ThemedText>
            </View>
            <ThemedText style={styles.customerPhone}>SĐT: {customerPhone}</ThemedText>
          </View>
        )}

        <View style={styles.header}>
          <Ionicons name="people" size={50} color={isBookingForCustomer ? "#3b82f6" : "#16a34a"} />
          <ThemedText type="title" style={styles.title}>
            Số khách
          </ThemedText>
        </View>

        <View style={styles.quickSelect}>
          <View style={styles.quickSelectButtons}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.quickSelectButton,
                  numberOfGuests === num.toString() && styles.quickSelectButtonActive
                ]}
                onPress={() => quickSelect(num)}
              >
                <Text style={[
                  styles.quickSelectButtonText,
                  numberOfGuests === num.toString() && styles.quickSelectButtonTextActive
                ]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputSection}>
          <TextInput
            style={styles.input}
            value={numberOfGuests}
            onChangeText={setNumberOfGuests}
            placeholder="Hoặc nhập số khách"
            keyboardType="numeric"
            maxLength={2}
          />
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <ThemedText style={styles.continueButtonText}>Tiếp tục</ThemedText>
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#16a34a',
    marginTop: 16,
  },
  quickSelect: {
    marginBottom: 32,
  },
  quickSelectButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  quickSelectButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickSelectButtonActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  quickSelectButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  quickSelectButtonTextActive: {
    color: '#fff',
  },
  inputSection: {
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlign: 'center',
    color: '#374151',
  },
  customerInfo: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  customerInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  customerInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  customerPhone: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});