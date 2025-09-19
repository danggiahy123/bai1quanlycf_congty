import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { tryApiCall } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

interface Customer {
  _id: string;
  fullName: string;
  phone: string;
  email: string;
}

interface Table {
  _id: string;
  name: string;
  capacity: number;
  status: 'empty' | 'occupied';
}

export default function BookingCreateScreen() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    tableId: '',
    tableName: '',
    numberOfGuests: 1,
    bookingDate: new Date().toISOString().split('T')[0],
    bookingTime: new Date().toTimeString().slice(0, 5),
    depositAmount: 0,
    note: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        router.replace('/login');
        return;
      }

      // Load customers
      const customersResult = await tryApiCall('/api/customers', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      // Load available tables
      const tablesResult = await tryApiCall('/api/tables', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (customersResult.success) {
        setCustomers(customersResult.data || []);
      }

      if (tablesResult.success) {
        const availableTables = (tablesResult.data || []).filter((table: Table) => table.status === 'empty');
        setTables(availableTables);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      customerId: customer._id,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      customerEmail: customer.email,
    }));
    setShowCustomerModal(false);
  };

  const handleTableSelect = (table: Table) => {
    setFormData(prev => ({
      ...prev,
      tableId: table._id,
      tableName: table.name,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.customerId || !formData.tableId) {
      Alert.alert('Lỗi', 'Vui lòng chọn khách hàng và bàn');
      return;
    }

    if (formData.numberOfGuests < 1) {
      Alert.alert('Lỗi', 'Số lượng khách phải lớn hơn 0');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      const bookingData = {
        customer: formData.customerId,
        table: formData.tableId,
        numberOfGuests: formData.numberOfGuests,
        bookingDate: formData.bookingDate,
        bookingTime: formData.bookingTime,
        depositAmount: formData.depositAmount,
        note: formData.note,
        status: 'pending',
      };

      const result = await tryApiCall('/api/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (result.success) {
        Alert.alert(
          'Thành công',
          'Đặt bàn đã được tạo thành công',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể tạo đặt bàn');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Lỗi', 'Không thể tạo đặt bàn');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt bàn cho khách</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Customer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn khách hàng</Text>
          <TouchableOpacity
            style={styles.inputContainer}
            onPress={() => setShowCustomerModal(true)}
          >
            <Text style={[styles.inputText, !formData.customerName && styles.placeholderText]}>
              {formData.customerName || 'Chọn khách hàng'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Table Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn bàn</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tablesContainer}>
            {tables.map((table) => (
              <TouchableOpacity
                key={table._id}
                style={[
                  styles.tableCard,
                  formData.tableId === table._id && styles.selectedTableCard
                ]}
                onPress={() => handleTableSelect(table)}
              >
                <Text style={[
                  styles.tableName,
                  formData.tableId === table._id && styles.selectedTableName
                ]}>
                  {table.name}
                </Text>
                <Text style={[
                  styles.tableCapacity,
                  formData.tableId === table._id && styles.selectedTableCapacity
                ]}>
                  {table.capacity} người
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Number of Guests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Số lượng khách</Text>
          <View style={styles.guestsContainer}>
            <TouchableOpacity
              style={styles.guestButton}
              onPress={() => setFormData(prev => ({
                ...prev,
                numberOfGuests: Math.max(1, prev.numberOfGuests - 1)
              }))}
            >
              <Ionicons name="remove" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.guestNumber}>{formData.numberOfGuests}</Text>
            <TouchableOpacity
              style={styles.guestButton}
              onPress={() => setFormData(prev => ({
                ...prev,
                numberOfGuests: prev.numberOfGuests + 1
              }))}
            >
              <Ionicons name="add" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date and Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ngày và giờ</Text>
          <View style={styles.dateTimeContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ngày</Text>
              <TextInput
                style={styles.input}
                value={formData.bookingDate}
                onChangeText={(text) => setFormData(prev => ({ ...prev, bookingDate: text }))}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Giờ</Text>
              <TextInput
                style={styles.input}
                value={formData.bookingTime}
                onChangeText={(text) => setFormData(prev => ({ ...prev, bookingTime: text }))}
                placeholder="HH:MM"
              />
            </View>
          </View>
        </View>

        {/* Deposit Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiền cọc (VNĐ)</Text>
          <TextInput
            style={styles.input}
            value={formData.depositAmount.toString()}
            onChangeText={(text) => setFormData(prev => ({ 
              ...prev, 
              depositAmount: parseInt(text) || 0 
            }))}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>

        {/* Note */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ghi chú</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.note}
            onChangeText={(text) => setFormData(prev => ({ ...prev, note: text }))}
            placeholder="Yêu cầu đặc biệt..."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Đang tạo...' : 'Tạo đặt bàn'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Customer Selection Modal */}
      <Modal
        visible={showCustomerModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chọn khách hàng</Text>
            <View style={styles.placeholder} />
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm khách hàng..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />

          <FlatList
            data={filteredCustomers}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.customerItem}
                onPress={() => handleCustomerSelect(item)}
              >
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{item.fullName}</Text>
                  <Text style={styles.customerPhone}>{item.phone}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
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
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  placeholderText: {
    color: Colors.textSecondary,
  },
  tablesContainer: {
    marginTop: 8,
  },
  tableCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    minWidth: 80,
  },
  selectedTableCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  tableName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  selectedTableName: {
    color: Colors.primary,
  },
  tableCapacity: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  selectedTableCapacity: {
    color: Colors.primary,
  },
  guestsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  guestButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginHorizontal: 20,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: Colors.textSecondary,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    backgroundColor: Colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalCancelText: {
    color: 'white',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customerItem: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
