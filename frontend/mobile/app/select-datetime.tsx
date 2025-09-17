import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOrder } from '@/components/order-context';

export default function SelectDateTimeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { state, setBookingInfo } = useOrder();
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  // Tạo danh sách ngày (7 ngày tới)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('vi-VN', { 
          weekday: 'short', 
          day: 'numeric',
          month: 'short'
        })
      });
    }
    return dates;
  };

  // Tạo danh sách giờ (8:00 - 22:00)
  const getAvailableTimes = () => {
    const times = [];
    for (let hour = 8; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push({
          value: timeString,
          label: timeString
        });
      }
    }
    return times;
  };

  const handleNext = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn ngày và giờ');
      return;
    }

    // Kiểm tra thời gian đặt bàn
    const bookingDateTime = new Date(`${selectedDate}T${selectedTime}`);
    const now = new Date();
    
    if (bookingDateTime <= now) {
      Alert.alert('Lỗi', 'Thời gian đặt bàn phải trong tương lai');
      return;
    }

    setBookingInfo({
      date: selectedDate,
      time: selectedTime
    });

    router.push('/booking-confirm');
  };

  const dates = getAvailableDates();
  const times = getAvailableTimes();

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="title">Chọn thời gian</ThemedText>
          <ThemedText>Chọn ngày và giờ đặt bàn</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>📅 Chọn ngày</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {dates.map((date) => (
              <TouchableOpacity
                key={date.value}
                style={[
                  styles.dateOption,
                  selectedDate === date.value && styles.selectedDateOption
                ]}
                onPress={() => setSelectedDate(date.value)}
              >
                <ThemedText style={[
                  styles.dateText,
                  selectedDate === date.value && styles.selectedDateText
                ]}>
                  {date.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>🕐 Chọn giờ</ThemedText>
          <View style={styles.timeContainer}>
            {times.map((time) => (
              <TouchableOpacity
                key={time.value}
                style={[
                  styles.timeOption,
                  selectedTime === time.value && styles.selectedTimeOption
                ]}
                onPress={() => setSelectedTime(time.value)}
              >
                <ThemedText style={[
                  styles.timeText,
                  selectedTime === time.value && styles.selectedTimeText
                ]}>
                  {time.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          onPress={handleNext} 
          style={[styles.button, (!selectedDate || !selectedTime) && styles.buttonDisabled]}
          disabled={!selectedDate || !selectedTime}
        >
          <ThemedText type="defaultSemiBold" style={styles.buttonText}>
            {!selectedDate || !selectedTime ? 'Chọn ngày và giờ' : 'Tiếp tục →'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Space for fixed button
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 10,
    fontSize: 16,
  },
  dateScroll: {
    marginBottom: 5,
  },
  dateOption: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    marginRight: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedDateOption: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  dateText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedDateText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  timeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeOption: {
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: 70,
    alignItems: 'center',
  },
  selectedTimeOption: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  selectedTimeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  button: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
