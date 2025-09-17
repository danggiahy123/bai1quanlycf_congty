import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';

export default function SelectGuestsScreen() {
  const router = useRouter();
  const [numberOfGuests, setNumberOfGuests] = useState('');

  const handleContinue = () => {
    const guests = parseInt(numberOfGuests);
    
    if (!numberOfGuests || isNaN(guests) || guests < 1) {
      Alert.alert('Lỗi', 'Vui lòng nhập số khách từ 1 trở lên');
      return;
    }

    // Lưu số khách và chuyển đến màn hình chọn bàn
    router.push({
      pathname: '/select-table',
      params: { numberOfGuests: guests.toString() }
    });
  };

  const quickSelect = (guests: number) => {
    setNumberOfGuests(guests.toString());
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Chọn số khách',
          headerStyle: { backgroundColor: '#16a34a' },
          headerTintColor: '#fff',
        }} 
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="people" size={60} color="#16a34a" />
          <ThemedText type="title" style={styles.title}>
            Số khách
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Nhập số lượng khách sẽ đến
          </ThemedText>
        </View>

        {/* Quick Select Buttons */}
        <View style={styles.quickSelectContainer}>
          <ThemedText style={styles.quickSelectTitle}>Chọn nhanh:</ThemedText>
          <View style={styles.quickSelectGrid}>
            {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50].map((guests) => (
              <TouchableOpacity
                key={guests}
                style={[
                  styles.quickSelectButton,
                  numberOfGuests === guests.toString() && styles.quickSelectButtonActive
                ]}
                onPress={() => quickSelect(guests)}
              >
                <ThemedText style={[
                  styles.quickSelectText,
                  numberOfGuests === guests.toString() && styles.quickSelectTextActive
                ]}>
                  {guests}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Manual Input */}
        <View style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Hoặc nhập số khách:</ThemedText>
          <View style={styles.inputWrapper}>
            <Ionicons name="people" size={20} color="#16a34a" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nhập số khách"
              value={numberOfGuests}
              onChangeText={setNumberOfGuests}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !numberOfGuests && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!numberOfGuests}
        >
          <Ionicons name="arrow-forward" size={20} color="#fff" />
          <ThemedText style={styles.continueButtonText}>Tiếp tục</ThemedText>
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={16} color="#6b7280" />
          <ThemedText style={styles.infoText}>
            Không giới hạn số khách
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#16a34a',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  quickSelectContainer: {
    marginBottom: 32,
  },
  quickSelectTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  quickSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
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
  },
  quickSelectButtonActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  quickSelectText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  quickSelectTextActive: {
    color: '#fff',
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 18,
    textAlign: 'center',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  continueButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
  },
});