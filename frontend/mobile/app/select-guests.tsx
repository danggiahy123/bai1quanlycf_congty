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
      Alert.alert('Lỗi', 'Vui lòng chọn số khách từ 1 trở lên');
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
          <Ionicons name="people" size={50} color="#16a34a" />
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