import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOrder } from '@/components/order-context';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SelectDateTimeScreen() {
  const router = useRouter();
  const { state, setBookingInfo } = useOrder();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleNext = () => {
    // Kiểm tra ngày không được trong quá khứ
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    if (selectedDateOnly < today) {
      Alert.alert('Lỗi', 'Ngày đặt bàn không được trong quá khứ');
      return;
    }

    // Kiểm tra nếu chọn ngày hôm nay thì giờ phải trong tương lai
    if (selectedDateOnly.getTime() === today.getTime()) {
      const now = new Date();
      const selectedDateTime = new Date(selectedDate);
      selectedDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      
      if (selectedDateTime <= now) {
        Alert.alert('Lỗi', 'Giờ đặt bàn phải trong tương lai');
        return;
      }
    }

    // Lưu thông tin ngày giờ
    setBookingInfo({
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime.toTimeString().split(' ')[0].substring(0, 5)
    });

    router.push('/select-deposit');
  };

  const handleBack = () => {
    router.back();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setSelectedTime(selectedTime);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          Chọn ngày giờ
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Thông tin bàn */}
        <View style={styles.infoCard}>
          <ThemedText type="defaultSemiBold" style={styles.infoTitle}>
            Thông tin đặt bàn
          </ThemedText>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Bàn:</ThemedText>
            <ThemedText style={styles.infoValue}>{state.selectedTable?.name}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Số khách:</ThemedText>
            <ThemedText style={styles.infoValue}>{state.numberOfGuests} người</ThemedText>
          </View>
        </View>

        {/* Chọn ngày */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            📅 Chọn ngày
          </ThemedText>
          <TouchableOpacity 
            style={styles.pickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#16a34a" />
            <ThemedText style={styles.pickerText}>
              {formatDate(selectedDate)}
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Chọn giờ */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            🕐 Chọn giờ
          </ThemedText>
          <TouchableOpacity 
            style={styles.pickerButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={20} color="#16a34a" />
            <ThemedText style={styles.pickerText}>
              {formatTime(selectedTime)}
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Lưu ý */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <ThemedText style={styles.noteText}>
            • Ngày đặt bàn không được trong quá khứ{'\n'}
            • Nếu chọn ngày hôm nay, giờ phải trong tương lai{'\n'}
            • Thời gian mở cửa: 7:00 - 22:00
          </ThemedText>
        </View>
      </ScrollView>

      {/* Nút tiếp tục */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <ThemedText style={styles.nextButtonText}>Tiếp tục</ThemedText>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
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
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoTitle: {
    fontSize: 18,
    marginBottom: 15,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 15,
    color: '#333',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  noteCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    gap: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});