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
  Image,
  ActivityIndicator,
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
  username?: string;
}

interface Table {
  _id: string;
  name: string;
  capacity: number;
  status: 'empty' | 'occupied';
}

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
}

export default function BookingsScreen() {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [searching, setSearching] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [foundCustomers, setFoundCustomers] = useState<Customer[]>([]);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [selectedMenuItems, setSelectedMenuItems] = useState<Array<{item: MenuItem; quantity: number}>>([]);
  
  // QR Code states
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [qrLoading, setQrLoading] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'paid' | 'failed'>('pending');
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    tableId: '',
    tableName: '',
    numberOfGuests: 1,
    bookingDate: new Date().toISOString().split('T')[0],
    bookingTime: new Date().toTimeString().slice(0, 5),
    depositAmount: 50000, // Tối thiểu 50,000đ
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

      // Load available tables
      const tablesResult = await tryApiCall('/api/tables', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      // Load menu items
      const menuResult = await tryApiCall('/api/menu', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (tablesResult.success) {
        const availableTables = (tablesResult.data || []).filter((table: Table) => table.status === 'empty');
        setTables(availableTables);
      }

      if (menuResult.success) {
        setMenuItems(menuResult.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Tìm kiếm khách hàng theo SĐT
  const searchCustomerByPhone = async (phone: string) => {
    if (!phone || phone.length < 8) {
      setFoundCustomer(null);
      setFoundCustomers([]);
      setShowCustomerList(false);
      return;
    }

    setSearching(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const result = await tryApiCall(`/api/bookings/search-customers?phone=${encodeURIComponent(phone)}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (result.success) {
        const customers = result.data.customers || [];
        
        if (customers.length === 1) {
          // Chỉ có 1 khách hàng - tự động chọn
          const customer = customers[0];
          setFoundCustomer(customer);
          setFoundCustomers([]);
          setShowCustomerList(false);
          setFormData(prev => ({
            ...prev,
            customerId: customer._id,
            customerName: customer.fullName,
            customerPhone: customer.phone,
          }));
        } else if (customers.length > 1) {
          // Có nhiều khách hàng - hiển thị danh sách
          setFoundCustomers(customers);
          setFoundCustomer(null);
          setShowCustomerList(true);
        } else {
          // Không tìm thấy - đặt bàn nhanh
          setFoundCustomer(null);
          setFoundCustomers([]);
          setShowCustomerList(false);
          setFormData(prev => ({
            ...prev,
            customerId: '',
            customerName: '',
            customerPhone: phone,
          }));
        }
      }
    } catch (error) {
      console.error('Error searching customer:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      customerId: customer._id,
      customerName: customer.fullName,
      customerPhone: customer.phone,
    }));
    setFoundCustomer(customer);
    setFoundCustomers([]);
    setShowCustomerList(false);
  };

  const handleQuickBookingName = (name: string) => {
    setFormData(prev => ({
      ...prev,
      customerName: name,
      customerId: '',
    }));
  };

  const handleTableSelect = (table: Table) => {
    setFormData(prev => ({
      ...prev,
      tableId: table._id,
      tableName: table.name,
    }));
  };

  const handleMenuSelect = (menuItem: MenuItem) => {
    const existingItem = selectedMenuItems.find(item => item.item._id === menuItem._id);
    if (existingItem) {
      setSelectedMenuItems(prev => 
        prev.map(item => 
          item.item._id === menuItem._id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedMenuItems(prev => [...prev, { item: menuItem, quantity: 1 }]);
    }
  };

  const handleMenuQuantityChange = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedMenuItems(prev => prev.filter(item => item.item._id !== menuItemId));
    } else {
      setSelectedMenuItems(prev => 
        prev.map(item => 
          item.item._id === menuItemId 
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  const calculateTotalAmount = () => {
    return selectedMenuItems.reduce((total, item) => total + (item.item.price * item.quantity), 0);
  };

  // Tạo QR code thanh toán cọc
  const generateQRCode = async (booking: any) => {
    try {
      setQrLoading(true);
      setPaymentStatus('pending');
      console.log('🔄 Đang tạo QR code cho booking:', booking);
      
      // Thông tin thanh toán
      const paymentInfo = {
        accountNumber: '2246811357',
        accountName: 'DANG GIA HY',
        bankCode: '970407',
        amount: booking.depositAmount || booking.booking?.depositAmount,
        description: `Coc ban ${booking.tableName || booking.booking?.tableName}`
      };

      console.log('💳 Payment info:', paymentInfo);

      // Thử gọi API backend trước
      try {
        const result = await tryApiCall('/api/payment/generate-qr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentInfo)
        });

        if (result.success && result.data && result.data.qrCode) {
          setQrCode(result.data.qrCode);
          console.log('✅ QR code từ API:', result.data.qrCode);
        } else {
          throw new Error('API response invalid');
        }
      } catch (apiError) {
        console.warn('⚠️ API error, tạo QR trực tiếp:', apiError);
        // Fallback: Tạo QR code trực tiếp với VietQR API
        const directQRUrl = `https://img.vietqr.io/image/${paymentInfo.bankCode}-${paymentInfo.accountNumber}-compact2.png?amount=${paymentInfo.amount}&addInfo=${encodeURIComponent(paymentInfo.description)}&accountName=${encodeURIComponent(paymentInfo.accountName)}`;
        setQrCode(directQRUrl);
        console.log('✅ QR code trực tiếp:', directQRUrl);
      }
      
    } catch (error) {
      console.error('Error generating QR code:', error);
      Alert.alert('Lỗi', 'Không thể tạo QR code thanh toán');
    } finally {
      setQrLoading(false);
    }
  };

  // Kiểm tra trạng thái thanh toán
  const checkPaymentStatus = async () => {
    if (!currentBooking) return;
    
    try {
      setCheckingPayment(true);
      setPaymentStatus('checking');
      
      const token = await AsyncStorage.getItem('userToken');
      const result = await tryApiCall(`/api/payment/check-status/${currentBooking._id}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (result.success) {
        if (result.data.paid) {
          setPaymentStatus('paid');
          Alert.alert('✅ Thành công', 'Đã xác nhận thanh toán cọc!');
        } else {
          setPaymentStatus('failed');
          Alert.alert('❌ Chưa thanh toán', 'Chưa nhận được thanh toán cọc từ ngân hàng');
        }
      } else {
        setPaymentStatus('failed');
        Alert.alert('❌ Lỗi', result.message || 'Không thể kiểm tra trạng thái thanh toán');
      }
    } catch (error) {
      console.error('Error checking payment:', error);
      setPaymentStatus('failed');
      Alert.alert('❌ Lỗi', 'Không thể kiểm tra trạng thái thanh toán');
    } finally {
      setCheckingPayment(false);
    }
  };

  // Xác nhận thanh toán thủ công
  const confirmPaymentManually = async () => {
    if (!currentBooking) return;
    
    Alert.alert(
      'Xác nhận thanh toán thủ công',
      `Bạn có chắc chắn khách hàng đã thanh toán cọc ${currentBooking.depositAmount?.toLocaleString()}đ?\n\nSau khi xác nhận, đặt bàn sẽ được kích hoạt ngay lập tức.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              setCheckingPayment(true);
              const token = await AsyncStorage.getItem('userToken');
              
              const result = await tryApiCall(`/api/payment/confirm-manual/${currentBooking._id}`, {
                method: 'POST',
                headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  amount: currentBooking.depositAmount,
                  transactionType: 'deposit'
                })
              });

              if (result.success) {
                setPaymentStatus('paid');
                Alert.alert('✅ Thành công', result.message || 'Đã xác nhận thanh toán cọc thủ công!');
              } else {
                Alert.alert('❌ Lỗi', result.message || 'Không thể xác nhận thanh toán');
              }
            } catch (error) {
              console.error('Error confirming payment:', error);
              Alert.alert('❌ Lỗi', 'Không thể xác nhận thanh toán');
            } finally {
              setCheckingPayment(false);
            }
          }
        }
      ]
    );
  };

  const handleSubmit = async () => {
    if (!formData.customerName || !formData.tableId) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên khách hàng và chọn bàn');
      return;
    }

    if (formData.numberOfGuests < 1) {
      Alert.alert('Lỗi', 'Số lượng khách phải lớn hơn 0');
      return;
    }

    if (formData.depositAmount < 50000) {
      Alert.alert('Lỗi', 'Số tiền cọc tối thiểu là 50,000đ');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      const totalAmount = calculateTotalAmount();
      
      const bookingData = {
        tableId: formData.tableId,
        numberOfGuests: formData.numberOfGuests,
        bookingDate: formData.bookingDate,
        bookingTime: formData.bookingTime,
        menuItems: selectedMenuItems.map(item => ({
          itemId: item.item._id,
          quantity: item.quantity
        })),
        notes: formData.note,
        depositAmount: Math.max(formData.depositAmount, 50000), // Đảm bảo tối thiểu 50,000đ
        // Thêm thông tin khách hàng nếu có
        ...(formData.customerId ? {
          customer: formData.customerId
        } : {
          customerInfo: {
            fullName: formData.customerName,
            phone: formData.customerPhone,
            email: ''
          }
        })
      };

      console.log('📤 Sending booking data:', bookingData);

      const result = await tryApiCall('/api/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      console.log('📥 Booking response:', result);

      if (result.success) {
        // Lưu thông tin booking để hiển thị QR code
        setCurrentBooking({
          ...result.booking,
          tableName: formData.tableName,
          customerName: formData.customerName
        });
        
        // Hiển thị modal QR code
        setShowQRModal(true);
        
        // Tạo QR code
        await generateQRCode({
          ...result.booking,
          tableName: formData.tableName,
          depositAmount: result.booking.depositAmount
        });
      } else {
        console.error('Booking error:', result.error);
        Alert.alert('Lỗi', result.error || 'Không thể tạo đặt bàn');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Lỗi', 'Không thể tạo đặt bàn');
    } finally {
      setLoading(false);
    }
  };

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
        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
          
          {/* Phone Number Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số điện thoại *</Text>
            <TextInput
              style={styles.input}
              value={formData.customerPhone}
              onChangeText={(phone) => {
                setFormData(prev => ({ ...prev, customerPhone: phone }));
                searchCustomerByPhone(phone);
              }}
              placeholder="Nhập số điện thoại để tìm kiếm..."
              keyboardType="phone-pad"
            />
            {searching && (
              <Text style={styles.searchingText}>Đang tìm kiếm...</Text>
            )}
          </View>

          {/* Customer Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tên khách hàng *</Text>
            <TextInput
              style={styles.input}
              value={formData.customerName}
              onChangeText={handleQuickBookingName}
              placeholder="Nhập tên khách hàng"
            />
          </View>

          {/* Found Customer Display */}
          {foundCustomer && (
            <View style={styles.foundCustomerContainer}>
              <View style={styles.foundCustomerInfo}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerAvatarText}>
                    {foundCustomer.fullName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.customerDetails}>
                  <Text style={styles.customerName}>{foundCustomer.fullName}</Text>
                  <Text style={styles.customerPhone}>{foundCustomer.phone}</Text>
                  {foundCustomer.email && (
                    <Text style={styles.customerEmail}>{foundCustomer.email}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setFoundCustomer(null);
                  setFormData(prev => ({
                    ...prev,
                    customerId: '',
                    customerName: '',
                    customerPhone: '',
                  }));
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close" size={20} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Customer List (multiple results) */}
          {showCustomerList && foundCustomers.length > 0 && (
            <View style={styles.customerListContainer}>
              <Text style={styles.customerListTitle}>Chọn khách hàng ({foundCustomers.length})</Text>
              {foundCustomers.map((customer) => (
                <TouchableOpacity
                  key={customer._id}
                  style={styles.customerListItem}
                  onPress={() => handleCustomerSelect(customer)}
                >
                  <View style={styles.customerAvatar}>
                    <Text style={styles.customerAvatarText}>
                      {customer.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.customerDetails}>
                    <Text style={styles.customerName}>{customer.fullName}</Text>
                    <Text style={styles.customerPhone}>{customer.phone}</Text>
                    {customer.email && (
                      <Text style={styles.customerEmail}>{customer.email}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
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
              <Ionicons name="remove" size={20} color={Colors.light.primary} />
            </TouchableOpacity>
            <Text style={styles.guestNumber}>{formData.numberOfGuests}</Text>
            <TouchableOpacity
              style={styles.guestButton}
              onPress={() => setFormData(prev => ({
                ...prev,
                numberOfGuests: prev.numberOfGuests + 1
              }))}
            >
              <Ionicons name="add" size={20} color={Colors.light.primary} />
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

        {/* Menu Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chọn món ăn</Text>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowMenuModal(true)}
            >
              <Text style={styles.menuButtonText}>
                {selectedMenuItems.length > 0 ? `${selectedMenuItems.length} món` : 'Chọn món'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
          
          {/* Selected Menu Items */}
          {selectedMenuItems.length > 0 && (
            <View style={styles.selectedMenuContainer}>
              {selectedMenuItems.map((item, index) => (
                <View key={item.item._id} style={styles.selectedMenuItem}>
                  <View style={styles.menuItemInfo}>
                    <Text style={styles.menuItemName}>{item.item.name}</Text>
                    <Text style={styles.menuItemPrice}>
                      {item.item.price.toLocaleString()}đ x {item.quantity}
                    </Text>
                  </View>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleMenuQuantityChange(item.item._id, item.quantity - 1)}
                    >
                      <Ionicons name="remove" size={16} color={Colors.light.primary} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleMenuQuantityChange(item.item._id, item.quantity + 1)}
                    >
                      <Ionicons name="add" size={16} color={Colors.light.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              
              {/* Total Amount */}
              <View style={styles.totalAmountContainer}>
                <Text style={styles.totalAmountLabel}>Tổng tiền món:</Text>
                <Text style={styles.totalAmountValue}>
                  {calculateTotalAmount().toLocaleString()}đ
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Deposit Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiền cọc (VNĐ) *</Text>
          <TextInput
            style={styles.input}
            value={formData.depositAmount.toString()}
            onChangeText={(text) => setFormData(prev => ({ 
              ...prev, 
              depositAmount: parseInt(text) || 50000 
            }))}
            keyboardType="numeric"
            placeholder="50000"
          />
          <Text style={styles.helpText}>Tối thiểu: 50,000đ</Text>
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

      {/* Menu Selection Modal */}
      <Modal
        visible={showMenuModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowMenuModal(false)}>
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chọn món ăn</Text>
            <TouchableOpacity onPress={() => setShowMenuModal(false)}>
              <Text style={styles.modalDoneText}>Xong</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={menuItems}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => {
              const selectedItem = selectedMenuItems.find(selected => selected.item._id === item._id);
              const quantity = selectedItem ? selectedItem.quantity : 0;
              
              return (
                <View style={styles.menuItemCard}>
                  <View style={styles.menuItemInfo}>
                    <Text style={styles.menuItemName}>{item.name}</Text>
                    <Text style={styles.menuItemDescription}>{item.description}</Text>
                    <Text style={styles.menuItemPrice}>{item.price.toLocaleString()}đ</Text>
                  </View>
                  <View style={styles.menuItemControls}>
                    {quantity > 0 && (
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => handleMenuQuantityChange(item._id, quantity - 1)}
                      >
                        <Ionicons name="remove" size={16} color={Colors.light.primary} />
                      </TouchableOpacity>
                    )}
                    {quantity > 0 && (
                      <Text style={styles.quantityText}>{quantity}</Text>
                    )}
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => handleMenuSelect(item)}
                    >
                      <Ionicons 
                        name={quantity > 0 ? "add" : "add-circle-outline"} 
                        size={20} 
                        color={Colors.light.primary} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        </View>
      </Modal>

      {/* QR Code Payment Modal */}
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalContainer}>
            {/* Header */}
            <View style={styles.qrModalHeader}>
              <View style={styles.qrHeaderContent}>
                <Text style={styles.qrModalTitle}>💳 THANH TOÁN CỌC</Text>
                <Text style={styles.qrAmountText}>
                  {currentBooking?.depositAmount?.toLocaleString()}đ
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowQRModal(false)} 
                style={styles.qrCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.qrModalContent} 
              contentContainerStyle={styles.qrModalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Payment Status */}
              <View style={styles.paymentStatusContainer}>
                <View style={[
                  styles.statusIndicator,
                  paymentStatus === 'paid' && styles.statusPaid,
                  paymentStatus === 'checking' && styles.statusChecking,
                  paymentStatus === 'failed' && styles.statusFailed
                ]}>
                  <Ionicons 
                    name={
                      paymentStatus === 'paid' ? 'checkmark-circle' :
                      paymentStatus === 'checking' ? 'time' :
                      paymentStatus === 'failed' ? 'close-circle' : 'ellipse-outline'
                    } 
                    size={20} 
                    color={
                      paymentStatus === 'paid' ? '#27ae60' :
                      paymentStatus === 'checking' ? '#f39c12' :
                      paymentStatus === 'failed' ? '#e74c3c' : '#95a5a6'
                    } 
                  />
                  <Text style={[
                    styles.statusText,
                    paymentStatus === 'paid' && styles.statusTextPaid,
                    paymentStatus === 'checking' && styles.statusTextChecking,
                    paymentStatus === 'failed' && styles.statusTextFailed
                  ]}>
                    {paymentStatus === 'paid' ? 'Đã thanh toán' :
                     paymentStatus === 'checking' ? 'Đang kiểm tra...' :
                     paymentStatus === 'failed' ? 'Chưa thanh toán' : 'Chờ thanh toán'}
                  </Text>
                </View>
              </View>

              {/* QR Code */}
              {qrLoading ? (
                <View style={styles.qrLoadingContainer}>
                  <ActivityIndicator size="large" color={Colors.light.primary} />
                  <Text style={styles.qrLoadingText}>Đang tạo QR code...</Text>
                </View>
              ) : qrCode ? (
                <View style={styles.qrCodeContainer}>
                  <Image 
                    source={{ uri: qrCode }} 
                    style={styles.qrCodeImage}
                    resizeMode="contain"
                    onError={(error) => {
                      console.error('QR Code load error:', error);
                      Alert.alert('Lỗi', 'Không thể tải QR code');
                    }}
                  />
                  <Text style={styles.qrInstructionText}>
                    Quét mã QR để thanh toán
                  </Text>
                </View>
              ) : (
                <View style={styles.qrErrorContainer}>
                  <Ionicons name="alert-circle" size={48} color="#e74c3c" />
                  <Text style={styles.qrErrorText}>Không thể tạo QR code</Text>
                </View>
              )}

              {/* Bank Info - Compact */}
              <View style={styles.qrInfoContainer}>
                <View style={styles.bankInfoRow}>
                  <Ionicons name="business" size={16} color="#666" />
                  <Text style={styles.qrInfoText}>Techcombank</Text>
                </View>
                <View style={styles.bankInfoRow}>
                  <Ionicons name="card" size={16} color="#666" />
                  <Text style={styles.qrInfoText}>2246811357</Text>
                </View>
                <View style={styles.bankInfoRow}>
                  <Ionicons name="person" size={16} color="#666" />
                  <Text style={styles.qrInfoText}>DANG GIA HY</Text>
                </View>
                <View style={styles.bankInfoRow}>
                  <Ionicons name="document-text" size={16} color="#666" />
                  <Text style={styles.qrInfoText}>Coc ban {currentBooking?.tableName}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.qrActionButtons}>
                <TouchableOpacity 
                  style={[styles.qrCheckButton, checkingPayment && styles.qrButtonDisabled]}
                  onPress={checkPaymentStatus}
                  disabled={checkingPayment || paymentStatus === 'paid'}
                >
                  <Ionicons 
                    name={checkingPayment ? "hourglass" : "refresh"} 
                    size={20} 
                    color="white" 
                  />
                  <Text style={styles.qrCheckButtonText}>
                    {checkingPayment ? 'Đang kiểm tra...' : 'KIỂM TRA'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.qrConfirmButton, checkingPayment && styles.qrButtonDisabled]}
                  onPress={confirmPaymentManually}
                  disabled={checkingPayment || paymentStatus === 'paid'}
                >
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.qrConfirmButtonText}>XÁC NHẬN THỦ CÔNG</Text>
                </TouchableOpacity>
              </View>

              {/* Test Button - Chỉ hiển thị khi chưa thanh toán */}
              {paymentStatus !== 'paid' && (
                <View style={styles.qrTestButtons}>
                  <TouchableOpacity 
                    style={[styles.qrTestButton, checkingPayment && styles.qrButtonDisabled]}
                    onPress={async () => {
                      if (!currentBooking) return;
                      
                      try {
                        setCheckingPayment(true);
                        const result = await tryApiCall('/api/payment/webhook-simulation', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            bookingId: currentBooking._id,
                            amount: currentBooking.depositAmount,
                            transactionType: 'deposit'
                          })
                        });

                        if (result.success) {
                          setPaymentStatus('paid');
                          Alert.alert('🤖 Test thành công', 'Hệ thống đã tự động nhận thanh toán!');
                        } else {
                          Alert.alert('❌ Test thất bại', result.message || 'Không thể test thanh toán tự động');
                        }
                      } catch (error) {
                        console.error('Error testing auto payment:', error);
                        Alert.alert('❌ Lỗi', 'Không thể test thanh toán tự động');
                      } finally {
                        setCheckingPayment(false);
                      }
                    }}
                    disabled={checkingPayment}
                  >
                    <Ionicons name="flash" size={16} color="white" />
                    <Text style={styles.qrTestButtonText}>TEST TỰ ĐỘNG</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Bottom Buttons */}
              <View style={styles.qrModalButtons}>
                <TouchableOpacity 
                  style={styles.qrCancelButton}
                  onPress={() => setShowQRModal(false)}
                >
                  <Text style={styles.qrCancelButtonText}>Đóng</Text>
                </TouchableOpacity>
                {paymentStatus === 'paid' && (
                  <TouchableOpacity 
                    style={styles.qrDoneButton}
                    onPress={() => {
                      setShowQRModal(false);
                      router.back();
                    }}
                  >
                    <Text style={styles.qrDoneButtonText}>Hoàn thành</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Colors.light.primary,
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
    color: Colors.light.text,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchingText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  foundCustomerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  foundCustomerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  clearButton: {
    padding: 8,
  },
  customerListContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  customerListTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.text,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  customerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  menuButtonText: {
    fontSize: 14,
    color: Colors.light.text,
    marginRight: 8,
  },
  selectedMenuContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  selectedMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  menuItemPrice: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginHorizontal: 12,
  },
  totalAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  totalAmountLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  totalAmountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
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
    borderColor: Colors.light.border,
    minWidth: 80,
  },
  selectedTableCard: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '10',
  },
  tableName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  selectedTableName: {
    color: Colors.light.primary,
  },
  tableCapacity: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  selectedTableCapacity: {
    color: Colors.light.primary,
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
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginHorizontal: 20,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: Colors.light.textSecondary,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    backgroundColor: Colors.light.primary,
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
  modalDoneText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  menuItemDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  menuItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    padding: 8,
  },
  helpText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  // QR Code Modal Styles
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModalContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    margin: 16,
    maxHeight: '90%',
    width: '92%',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    flexDirection: 'column',
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexShrink: 0,
  },
  qrHeaderContent: {
    flex: 1,
    alignItems: 'center',
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  qrAmountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  qrCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  qrModalContent: {
    flex: 1,
  },
  qrModalScrollContent: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  // Payment Status
  paymentStatusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statusPaid: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
  },
  statusChecking: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
  },
  statusFailed: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    color: '#6c757d',
  },
  statusTextPaid: {
    color: '#155724',
  },
  statusTextChecking: {
    color: '#856404',
  },
  statusTextFailed: {
    color: '#721c24',
  },
  // QR Code
  qrLoadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  qrLoadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginTop: 16,
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  qrCodeImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  qrInstructionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  qrErrorContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  qrErrorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginTop: 12,
    fontWeight: '500',
  },
  // Bank Info
  qrInfoContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  bankInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qrInfoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  // Action Buttons
  qrActionButtons: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  qrCheckButton: {
    flex: 1,
    backgroundColor: '#3498db',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  qrCheckButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  qrConfirmButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  qrConfirmButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  qrButtonDisabled: {
    opacity: 0.6,
  },
  // Test Buttons
  qrTestButtons: {
    marginBottom: 20,
    alignItems: 'center',
  },
  qrTestButton: {
    backgroundColor: '#9b59b6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  qrTestButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  // Bottom Buttons
  qrModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  qrCancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  qrCancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  qrDoneButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginLeft: 12,
    alignItems: 'center',
    elevation: 2,   
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  qrDoneButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});