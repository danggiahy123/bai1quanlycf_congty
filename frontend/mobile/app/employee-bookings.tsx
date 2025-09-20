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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DEFAULT_API_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = DEFAULT_API_URL;

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

export default function EmployeeBookingsScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1); // 1: Chọn khách hàng, 2: Chọn số khách, 3: Chọn bàn, 4: Chọn món, 5: Chọn ngày giờ, 6: Chọn cọc, 7: Xác nhận
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [foundCustomers, setFoundCustomers] = useState<Customer[]>([]);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showQRDisplay, setShowQRDisplay] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [qrLoading, setQrLoading] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [showManualPayment, setShowManualPayment] = useState(false);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedMenuItems, setSelectedMenuItems] = useState<Array<{item: MenuItem; quantity: number}>>([]);

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
    depositAmount: 50000, // Mặc định 50k
    note: '',
    bookingType: 'quick' as 'quick' | 'registered', // 'quick' = đặt bàn nhanh, 'registered' = khách có tài khoản
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

      // Load employee info from token
      try {
        // Decode JWT token to get employee info
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          setEmployeeName(payload.name || payload.username || 'Nhân viên');
          console.log('👤 Employee name from token:', payload.name || payload.username || 'Nhân viên');
        } else {
          setEmployeeName('Nhân viên');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setEmployeeName('Nhân viên');
      }

      // Load available tables
      const tablesResult = await fetch(`${API_URL}/api/tables`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      // Load menu items
      const menuResult = await fetch(`${API_URL}/api/menu`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (tablesResult.ok) {
        const tablesData = await tablesResult.json();
        console.log('📋 Tables data:', tablesData);
        const availableTables = (tablesData || []).filter((table: Table) => table.status === 'empty');
        console.log('🪑 Available tables:', availableTables);
        setTables(availableTables);
      }

      if (menuResult.ok) {
        const menuData = await menuResult.json();
        setMenuItems(menuData.data || menuData || []);
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
      const result = await fetch(`${API_URL}/api/bookings/search-customers?phone=${encodeURIComponent(phone)}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (result.ok) {
        const data = await result.json();
        const customers = data.customers || [];
        
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
            customerEmail: customer.email,
            bookingType: 'registered'
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
            customerEmail: '',
            bookingType: 'quick'
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
      customerEmail: customer.email,
      bookingType: 'registered'
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
      customerEmail: '',
      bookingType: 'quick'
    }));
  };

  const handleTableSelect = (table: Table) => {
    setFormData(prev => ({
      ...prev,
      tableId: table._id.toString(), // Đảm bảo là string
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
        const result = await fetch(`${API_URL}/api/payment/generate-qr`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentInfo)
        });

        const responseData = await result.json();

        if (result.ok && responseData.success && responseData.data && responseData.data.qrCode) {
          setQrCode(responseData.data.qrCode);
          console.log('✅ QR code từ API:', responseData.data.qrCode);
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

  const resetForm = () => {
    setFormData({
      customerId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      tableId: '',
      tableName: '',
      numberOfGuests: 1,
      bookingDate: new Date().toISOString().split('T')[0],
      bookingTime: new Date().toTimeString().slice(0, 5),
      depositAmount: 50000,
      note: '',
      bookingType: 'quick'
    });
    setFoundCustomer(null);
    setFoundCustomers([]);
    setSelectedMenuItems([]);
    setCurrentStep(1);
    setCurrentBooking(null);
    setQrCode('');
    setPaymentStatus('pending');
    setShowManualPayment(false);
    loadData(); // Reload tables
  };

  // Kiểm tra trạng thái thanh toán
  const checkPaymentStatus = async () => {
    if (!currentBooking?.id) {
      Alert.alert('Lỗi', 'Không có thông tin booking');
      return;
    }

    setCheckingPayment(true);
    try {
      const response = await fetch(`${DEFAULT_API_URL}/api/payment/check-status/${currentBooking.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        if (result.data.paid) {
          setPaymentStatus('completed');
          Alert.alert(
            '✅ Đã nhận được thanh toán',
            `Khách hàng đã thanh toán ${result.data.amount?.toLocaleString()}đ thành công!\nThời gian: ${new Date(result.data.paidAt).toLocaleString()}`,
            [
              {
                text: 'Gửi thông báo lên admin',
                onPress: () => sendPaymentNotificationToAdmin(result.data)
              },
              { text: 'Đóng', style: 'cancel' }
            ]
          );
        } else {
          setPaymentStatus('not_paid');
          Alert.alert(
            '❌ Chưa nhận được thanh toán',
            'Khách hàng chưa chuyển khoản. Vui lòng nhắc khách hàng thanh toán hoặc sử dụng thanh toán thủ công.',
            [
              {
                text: 'Thanh toán thủ công',
                onPress: () => setShowManualPayment(true)
              },
              { text: 'Đóng', style: 'cancel' }
            ]
          );
        }
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể kiểm tra trạng thái thanh toán');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      Alert.alert('Lỗi', 'Không thể kết nối đến server');
    } finally {
      setCheckingPayment(false);
    }
  };

  // Gửi thông báo thanh toán lên admin
  const sendPaymentNotificationToAdmin = async (paymentData: any) => {
    try {
      const response = await fetch(`${DEFAULT_API_URL}/api/payment/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: currentBooking.id,
          amount: paymentData.amount,
          transactionType: 'deposit',
          paymentMethod: 'bank_transfer',
          notes: `Thanh toán tự động - ${paymentData.transactionId}`
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert('✅ Thành công', 'Đã gửi thông báo thanh toán lên admin để xác nhận!');
        setShowQRDisplay(false);
        resetForm();
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể gửi thông báo');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      Alert.alert('Lỗi', 'Không thể gửi thông báo lên admin');
    }
  };


  // Thanh toán thủ công
  const confirmManualPayment = async () => {
    if (!currentBooking?.id) {
      Alert.alert('Lỗi', 'Không có thông tin booking');
      return;
    }

    try {
      const response = await fetch(`${DEFAULT_API_URL}/api/payment/confirm-manual/${currentBooking.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: currentBooking.depositAmount,
          transactionType: 'deposit',
          notes: `Thanh toán thủ công bởi nhân viên: ${employeeName}`
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert(
          '✅ Thanh toán thủ công thành công',
          'Đã xác nhận thanh toán thủ công và gửi thông báo lên admin để duyệt!',
          [
            {
              text: 'Đóng',
              onPress: () => {
                setShowManualPayment(false);
                setShowQRDisplay(false);
                resetForm();
              }
            }
          ]
        );
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể xác nhận thanh toán thủ công');
      }
    } catch (error) {
      console.error('Error confirming manual payment:', error);
      Alert.alert('Lỗi', 'Không thể kết nối đến server');
    }
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
        notes: formData.note || '',
        depositAmount: parseInt(formData.depositAmount.toString()),
        // Thêm thông tin khách hàng nếu có
        ...(formData.customerId ? {
          customer: formData.customerId
        } : {
          customerInfo: {
            fullName: formData.customerName,
            phone: formData.customerPhone,
            email: formData.customerEmail || ''
          }
        })
      };

      console.log('📤 Sending booking data:', bookingData);

      const result = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const responseData = await result.json();
      console.log('📥 Booking response:', responseData);

      if (result.ok) {
        // Nếu có yêu cầu cọc, hiển thị QR code để đưa cho khách hàng
        if (formData.depositAmount > 0) {
          // Lưu thông tin booking để hiển thị QR code
          setCurrentBooking({
            ...responseData.booking,
            tableName: formData.tableName,
            customerName: formData.customerName
          });
          
          // Hiển thị modal QR code
          setShowQRDisplay(true);
          
          // Tạo QR code
          await generateQRCode({
            ...responseData.booking,
            tableName: formData.tableName,
            depositAmount: responseData.booking.depositAmount
          });
        } else {
          Alert.alert(
            'Thành công',
            'Đặt bàn đã được tạo thành công và gửi thông báo đến admin để duyệt',
            [{ text: 'OK', onPress: () => resetForm() }]
          );
        }
      } else {
        console.error('❌ Booking error:', responseData);
        Alert.alert('Lỗi', responseData.message || responseData.error || 'Không thể tạo đặt bàn');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Lỗi', 'Không thể tạo đặt bàn');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !formData.customerName) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên khách hàng');
      return;
    }
    if (currentStep === 3 && !formData.tableId) {
      Alert.alert('Lỗi', 'Vui lòng chọn bàn');
      return;
    }
    if (currentStep === 6 && formData.depositAmount < 50000) {
      Alert.alert('Lỗi', 'Số tiền cọc tối thiểu là 50,000đ');
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <ThemedText style={styles.stepTitle}>Chọn đối tượng khách hàng</ThemedText>
      
      {/* Phone Number Input */}
      <View style={styles.inputGroup}>
        <ThemedText style={styles.inputLabel}>Số điện thoại</ThemedText>
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
          <ThemedText style={styles.searchingText}>Đang tìm kiếm...</ThemedText>
        )}
        </View>

      {/* Customer Name Input */}
      <View style={styles.inputGroup}>
        <ThemedText style={styles.inputLabel}>Tên khách hàng *</ThemedText>
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
              <ThemedText style={styles.customerAvatarText}>
                {foundCustomer.fullName.charAt(0).toUpperCase()}
              </ThemedText>
        </View>
            <View style={styles.customerDetails}>
              <ThemedText style={styles.customerName}>{foundCustomer.fullName}</ThemedText>
              <ThemedText style={styles.customerPhone}>{foundCustomer.phone}</ThemedText>
              {foundCustomer.email && (
                <ThemedText style={styles.customerEmail}>{foundCustomer.email}</ThemedText>
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
                customerEmail: '',
                bookingType: 'quick'
              }));
            }}
            style={styles.clearButton}
          >
            <Ionicons name="close" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      )}

      {/* Customer List (multiple results) */}
      {showCustomerList && foundCustomers.length > 0 && (
        <View style={styles.customerListContainer}>
          <ThemedText style={styles.customerListTitle}>Chọn khách hàng ({foundCustomers.length})</ThemedText>
          {foundCustomers.map((customer) => (
            <TouchableOpacity
              key={customer._id}
              style={styles.customerListItem}
              onPress={() => handleCustomerSelect(customer)}
            >
              <View style={styles.customerAvatar}>
                <ThemedText style={styles.customerAvatarText}>
                  {customer.fullName.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
              <View style={styles.customerDetails}>
                <ThemedText style={styles.customerName}>{customer.fullName}</ThemedText>
                <ThemedText style={styles.customerPhone}>{customer.phone}</ThemedText>
                {customer.email && (
                  <ThemedText style={styles.customerEmail}>{customer.email}</ThemedText>
                )}
        </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>
          ))}
        </View>
      )}
      </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <ThemedText style={styles.stepTitle}>Số lượng khách</ThemedText>
      
      <View style={styles.guestsContainer}>
            <TouchableOpacity
          style={styles.guestButton}
          onPress={() => setFormData(prev => ({
            ...prev,
            numberOfGuests: Math.max(1, prev.numberOfGuests - 1)
          }))}
        >
          <Ionicons name="remove" size={20} color="#16a34a" />
            </TouchableOpacity>
        <ThemedText style={styles.guestNumber}>{formData.numberOfGuests}</ThemedText>
            <TouchableOpacity
          style={styles.guestButton}
          onPress={() => setFormData(prev => ({
            ...prev,
            numberOfGuests: prev.numberOfGuests + 1
          }))}
        >
          <Ionicons name="add" size={20} color="#16a34a" />
            </TouchableOpacity>
          </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <ThemedText style={styles.stepTitle}>Chọn bàn</ThemedText>
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
            <ThemedText style={[
              styles.tableName,
              formData.tableId === table._id && styles.selectedTableName
            ]}>
              {table.name}
            </ThemedText>
            <ThemedText style={[
              styles.tableCapacity,
              formData.tableId === table._id && styles.selectedTableCapacity
            ]}>
              {table.capacity} người
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <ThemedText style={styles.stepTitle}>Chọn món ăn (Tùy chọn)</ThemedText>
      
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setShowMenuModal(true)}
      >
        <ThemedText style={styles.menuButtonText}>
          {selectedMenuItems.length > 0 ? `${selectedMenuItems.length} món đã chọn` : 'Chọn món ăn'}
        </ThemedText>
        <Ionicons name="chevron-down" size={16} color="#16a34a" />
      </TouchableOpacity>
      
      {/* Selected Menu Items */}
      {selectedMenuItems.length > 0 && (
        <View style={styles.selectedMenuContainer}>
          {selectedMenuItems.map((item, index) => (
            <View key={item.item._id} style={styles.selectedMenuItem}>
              <View style={styles.menuItemInfo}>
                <ThemedText style={styles.menuItemName}>{item.item.name}</ThemedText>
                <ThemedText style={styles.menuItemPrice}>
                  {item.item.price.toLocaleString()}đ x {item.quantity}
                </ThemedText>
              </View>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleMenuQuantityChange(item.item._id, item.quantity - 1)}
                >
                  <Ionicons name="remove" size={16} color="#16a34a" />
                </TouchableOpacity>
                <ThemedText style={styles.quantityText}>{item.quantity}</ThemedText>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleMenuQuantityChange(item.item._id, item.quantity + 1)}
                >
                  <Ionicons name="add" size={16} color="#16a34a" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          
          {/* Total Amount */}
          <View style={styles.totalAmountContainer}>
            <ThemedText style={styles.totalAmountLabel}>Tổng tiền món:</ThemedText>
            <ThemedText style={styles.totalAmountValue}>
              {calculateTotalAmount().toLocaleString()}đ
            </ThemedText>
          </View>
          </View>
        )}
      </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <ThemedText style={styles.stepTitle}>Ngày và giờ</ThemedText>
      
      <View style={styles.dateTimeContainer}>
        <View style={styles.inputGroup}>
          <ThemedText style={styles.inputLabel}>Ngày</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.bookingDate}
            onChangeText={(text) => setFormData(prev => ({ ...prev, bookingDate: text }))}
            placeholder="YYYY-MM-DD"
          />
        </View>
        <View style={styles.inputGroup}>
          <ThemedText style={styles.inputLabel}>Giờ</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.bookingTime}
            onChangeText={(text) => setFormData(prev => ({ ...prev, bookingTime: text }))}
            placeholder="HH:MM"
          />
        </View>
      </View>
      
    </View>
  );

  const renderStep6 = () => (
    <View style={styles.stepContainer}>
      <ThemedText style={styles.stepTitle}>Chọn số tiền cọc</ThemedText>
      
      <View style={styles.depositSection}>
        <ThemedText style={styles.sectionDescription}>
          Vui lòng chọn số tiền cọc để đảm bảo đặt bàn. Số tiền cọc sẽ được trừ vào hóa đơn cuối cùng.
        </ThemedText>

        <View style={styles.depositOptions}>
          {[
            { amount: 50000, label: '50,000đ', description: 'Cọc tối thiểu' },
            { amount: 100000, label: '100,000đ', description: 'Cọc tiêu chuẩn' },
            { amount: 200000, label: '200,000đ', description: 'Cọc cao cấp' },
            { amount: 500000, label: '500,000đ', description: 'Cọc VIP' },
          ].map((option) => (
            <TouchableOpacity
              key={option.amount}
              style={[
                styles.depositOption,
                formData.depositAmount === option.amount && styles.depositOptionSelected
              ]}
              onPress={() => setFormData(prev => ({ ...prev, depositAmount: option.amount }))}
            >
              <View style={styles.depositOptionContent}>
                <View style={styles.depositOptionHeader}>
                  <ThemedText 
                    type="defaultSemiBold" 
                    style={[
                      styles.depositAmount,
                      formData.depositAmount === option.amount && styles.depositAmountSelected
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                  {formData.depositAmount === option.amount && (
                    <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                  )}
                </View>
                <ThemedText 
                  style={[
                    styles.depositDescription,
                    formData.depositAmount === option.amount && styles.depositDescriptionSelected
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
            <ThemedText style={styles.paymentValue}>{calculateTotalAmount().toLocaleString('vi-VN')}đ</ThemedText>
          </View>
          <View style={styles.paymentRow}>
            <ThemedText style={styles.paymentLabel}>Tiền cọc:</ThemedText>
            <ThemedText style={styles.paymentValue}>{formData.depositAmount.toLocaleString('vi-VN')}đ</ThemedText>
          </View>
          <View style={[styles.paymentRow, styles.paymentTotal]}>
            <ThemedText type="defaultSemiBold" style={styles.paymentTotalLabel}>
              Còn lại phải trả:
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.paymentTotalValue}>
              {(calculateTotalAmount() - formData.depositAmount).toLocaleString('vi-VN')}đ
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Ghi chú */}
      <View style={styles.inputGroup}>
        <ThemedText style={styles.inputLabel}>Ghi chú (Tùy chọn)</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.note}
          onChangeText={(text) => setFormData(prev => ({ ...prev, note: text }))}
          placeholder="Yêu cầu đặc biệt..."
          multiline
          numberOfLines={3}
        />
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
    </View>
  );

  const renderStep7 = () => (
    <View style={styles.stepContainer}>
      <ThemedText style={styles.stepTitle}>Xác nhận đặt bàn</ThemedText>
      
      <View style={styles.confirmationCard}>
        <ThemedText style={styles.confirmationTitle}>Thông tin đặt bàn</ThemedText>
        
        <View style={styles.confirmationRow}>
          <ThemedText style={styles.confirmationLabel}>Khách hàng:</ThemedText>
          <ThemedText style={styles.confirmationValue}>{formData.customerName}</ThemedText>
        </View>
        
        <View style={styles.confirmationRow}>
          <ThemedText style={styles.confirmationLabel}>SĐT:</ThemedText>
          <ThemedText style={styles.confirmationValue}>{formData.customerPhone}</ThemedText>
        </View>
        
        <View style={styles.confirmationRow}>
          <ThemedText style={styles.confirmationLabel}>Bàn:</ThemedText>
          <ThemedText style={styles.confirmationValue}>{formData.tableName}</ThemedText>
        </View>
        
        <View style={styles.confirmationRow}>
          <ThemedText style={styles.confirmationLabel}>Số khách:</ThemedText>
          <ThemedText style={styles.confirmationValue}>{formData.numberOfGuests} người</ThemedText>
        </View>
        
        <View style={styles.confirmationRow}>
          <ThemedText style={styles.confirmationLabel}>Ngày giờ:</ThemedText>
          <ThemedText style={styles.confirmationValue}>
            {formData.bookingDate} lúc {formData.bookingTime}
          </ThemedText>
      </View>

        {selectedMenuItems.length > 0 && (
          <View style={styles.confirmationRow}>
            <ThemedText style={styles.confirmationLabel}>Món ăn:</ThemedText>
            <ThemedText style={styles.confirmationValue}>
              {selectedMenuItems.length} món - {calculateTotalAmount().toLocaleString()}đ
            </ThemedText>
          </View>
        )}
        
        <View style={styles.confirmationRow}>
          <ThemedText style={styles.confirmationLabel}>Tiền cọc:</ThemedText>
          <ThemedText style={styles.confirmationValue}>{formData.depositAmount.toLocaleString()}đ</ThemedText>
        </View>
        
        {formData.note && (
          <View style={styles.confirmationRow}>
            <ThemedText style={styles.confirmationLabel}>Ghi chú:</ThemedText>
            <ThemedText style={styles.confirmationValue}>{formData.note}</ThemedText>
          </View>
        )}
      </View>
    </View>
  );

  const getStepTitle = () => {
    const titles = [
      'Chọn khách hàng',
      'Số lượng khách', 
      'Chọn bàn',
      'Chọn món ăn',
      'Ngày và giờ',
      'Chọn cọc',
      'Xác nhận'
    ];
    return titles[currentStep - 1] || '';
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Đặt bàn cho khách',
          headerStyle: { backgroundColor: '#16a34a' },
          headerTintColor: '#fff',
        }} 
      />
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / 7) * 100}%` }]} />
        </View>
        <ThemedText style={styles.progressText}>
          Bước {currentStep}/7: {getStepTitle()}
        </ThemedText>
      </View>

      {/* Step Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
        {currentStep === 6 && renderStep6()}
        {currentStep === 7 && renderStep7()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={prevStep}>
            <Ionicons name="arrow-back" size={20} color="#16a34a" />
            <ThemedText style={styles.backButtonText}>Quay lại</ThemedText>
          </TouchableOpacity>
        )}
        
        {currentStep < 7 ? (
          <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
            <ThemedText style={styles.nextButtonText}>Tiếp tục</ThemedText>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <ThemedText style={styles.submitButtonText}>
              {loading ? 'Đang tạo...' : 'Tạo đặt bàn'}
            </ThemedText>
          </TouchableOpacity>
        )}
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
              <ThemedText style={styles.modalCancelText}>Hủy</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.modalTitle}>Chọn món ăn</ThemedText>
            <TouchableOpacity onPress={() => setShowMenuModal(false)}>
              <ThemedText style={styles.modalDoneText}>Xong</ThemedText>
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
                    <ThemedText style={styles.menuItemName}>{item.name}</ThemedText>
                    <ThemedText style={styles.menuItemDescription}>{item.description}</ThemedText>
                    <ThemedText style={styles.menuItemPrice}>{item.price.toLocaleString()}đ</ThemedText>
                  </View>
                  <View style={styles.menuItemControls}>
                    {quantity > 0 && (
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => handleMenuQuantityChange(item._id, quantity - 1)}
                      >
                        <Ionicons name="remove" size={16} color="#16a34a" />
                      </TouchableOpacity>
                    )}
                    {quantity > 0 && (
                      <ThemedText style={styles.quantityText}>{quantity}</ThemedText>
                    )}
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => handleMenuSelect(item)}
                    >
                      <Ionicons 
                        name={quantity > 0 ? "add" : "add-circle-outline"} 
                        size={20} 
                        color="#16a34a" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        </View>
      </Modal>

      {/* QR Code Display Modal */}
      <Modal
        visible={showQRDisplay}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowQRDisplay(false)}
      >
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalContainer}>
            <View style={styles.qrModalHeader}>
              <ThemedText style={styles.qrModalTitle}>💳 QR CODE THANH TOÁN CỌC</ThemedText>
              <TouchableOpacity 
                onPress={() => setShowQRDisplay(false)} 
                style={styles.qrCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.qrModalScrollView}
              contentContainerStyle={styles.qrModalContent}
              showsVerticalScrollIndicator={false}
            >
              <ThemedText style={styles.qrModalSubtitle}>
                Đưa mã QR cho khách hàng để thanh toán cọc {currentBooking?.depositAmount?.toLocaleString()}đ
              </ThemedText>
              
              <View style={styles.instructionContainer}>
                <ThemedText style={styles.instructionTitle}>📋 Hướng dẫn:</ThemedText>
                <ThemedText style={styles.instructionText}>1. Đưa QR code cho khách hàng</ThemedText>
                <ThemedText style={styles.instructionText}>2. Khách hàng quét và chuyển khoản</ThemedText>
                <ThemedText style={styles.instructionText}>3. Thông báo sẽ gửi lên webadmin</ThemedText>
                <ThemedText style={styles.instructionText}>4. Quản lý xác nhận thanh toán</ThemedText>
              </View>

              {qrLoading ? (
                <View style={styles.qrLoadingContainer}>
                  <View style={styles.qrSpinner} />
                  <ThemedText style={styles.qrLoadingText}>Đang tạo QR code...</ThemedText>
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
                </View>
              ) : (
                <View style={styles.qrErrorContainer}>
                  <ThemedText style={styles.qrErrorText}>Không thể tạo QR code</ThemedText>
                </View>
              )}

              <View style={styles.qrInfoContainer}>
                <ThemedText style={styles.qrInfoTitle}>Thông tin chuyển khoản:</ThemedText>
                <ThemedText style={styles.qrInfoText}>Ngân hàng: Techcombank</ThemedText>
                <ThemedText style={styles.qrInfoText}>Số tài khoản: 2246811357</ThemedText>
                <ThemedText style={styles.qrInfoText}>Chủ tài khoản: DANG GIA HY</ThemedText>
                <ThemedText style={styles.qrInfoText}>Nội dung: Coc ban {currentBooking?.tableName}</ThemedText>
              </View>
            </ScrollView>

              <View style={styles.qrModalButtons}>
                <TouchableOpacity 
                  style={[styles.qrCheckButton, checkingPayment && styles.qrCheckButtonDisabled]}
                  onPress={checkPaymentStatus}
                  disabled={checkingPayment}
                >
                  {checkingPayment ? (
                    <ThemedText style={styles.qrCheckButtonText}>Đang kiểm tra...</ThemedText>
                  ) : (
                    <ThemedText style={styles.qrCheckButtonText}>KIỂM TRA THANH TOÁN</ThemedText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.qrManualButton}
                  onPress={() => setShowManualPayment(true)}
                >
                  <ThemedText style={styles.qrManualButtonText}>THANH TOÁN THỦ CÔNG</ThemedText>
                </TouchableOpacity>
              </View>
              
          </View>
        </View>
      </Modal>

      {/* Manual Payment Modal */}
      <Modal
        visible={showManualPayment}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowManualPayment(false)}
      >
        <View style={styles.manualPaymentOverlay}>
          <View style={styles.manualPaymentContainer}>
            <View style={styles.manualPaymentHeader}>
              <ThemedText style={styles.manualPaymentTitle}>💳 THANH TOÁN THỦ CÔNG</ThemedText>
              <TouchableOpacity 
                onPress={() => setShowManualPayment(false)} 
                style={styles.manualPaymentCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.manualPaymentContent}>
              <ThemedText style={styles.manualPaymentSubtitle}>
                Xác nhận thanh toán thủ công cho khách hàng
              </ThemedText>
              
              <View style={styles.manualPaymentInfo}>
                <ThemedText style={styles.manualPaymentInfoTitle}>Thông tin thanh toán:</ThemedText>
                <ThemedText style={styles.manualPaymentInfoText}>Khách hàng: {formData.customerName}</ThemedText>
                <ThemedText style={styles.manualPaymentInfoText}>Số tiền: {currentBooking?.depositAmount?.toLocaleString()}đ</ThemedText>
                <ThemedText style={styles.manualPaymentInfoText}>Bàn: {currentBooking?.tableName}</ThemedText>
                <ThemedText style={styles.manualPaymentInfoText}>Nhân viên: {employeeName}</ThemedText>
              </View>

              <View style={styles.manualPaymentWarning}>
                <ThemedText style={styles.manualPaymentWarningText}>
                  ⚠️ Lưu ý: Thanh toán thủ công sẽ được gửi lên admin để xác nhận. Chỉ sử dụng khi khách hàng đã thanh toán bằng tiền mặt hoặc phương thức khác.
                </ThemedText>
              </View>
            </View>

            <View style={styles.manualPaymentButtons}>
              <TouchableOpacity 
                style={styles.manualPaymentCancelButton}
                onPress={() => setShowManualPayment(false)}
              >
                <ThemedText style={styles.manualPaymentCancelButtonText}>Đóng</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.manualPaymentConfirmButton}
                onPress={confirmManualPayment}
              >
                <ThemedText style={styles.manualPaymentConfirmButtonText}>Xác nhận thanh toán</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#374151',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  searchingText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  foundCustomerContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#16a34a',
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
    backgroundColor: '#16a34a',
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
    color: '#16a34a',
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 12,
    color: '#6b7280',
  },
  clearButton: {
    padding: 8,
  },
  customerListContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  customerListTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  customerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  guestsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
  },
  guestButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
    marginHorizontal: 20,
  },
  tablesContainer: {
    marginTop: 8,
  },
  tableCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
    minWidth: 80,
  },
  selectedTableCard: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  tableName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  selectedTableName: {
    color: '#16a34a',
  },
  tableCapacity: {
    fontSize: 12,
    color: '#6b7280',
  },
  selectedTableCapacity: {
    color: '#16a34a',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'space-between',
  },
  menuButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedMenuContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  selectedMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  menuItemPrice: {
    fontSize: 14,
    color: '#6b7280',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginHorizontal: 12,
  },
  totalAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
  },
  totalAmountLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  totalAmountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmationCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  confirmationLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  confirmationValue: {
    fontSize: 14,
    color: '#374151',
    flex: 2,
    textAlign: 'right',
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#16a34a',
    flex: 1,
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#16a34a',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    backgroundColor: '#16a34a',
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
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  menuItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    padding: 8,
  },
  // Deposit Section Styles
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
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
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
  // QR Code Modal Styles
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 20,
    maxHeight: '90%',
    width: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    flex: 1,
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    flex: 1,
    textAlign: 'center',
  },
  qrCloseButton: {
    padding: 5,
  },
  qrModalScrollView: {
    flex: 1,
  },
  qrModalContent: {
    padding: 20,
    paddingBottom: 10,
  },
  qrModalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  instructionContainer: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 20,
  },
  qrLoadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  qrSpinner: {
    width: 40,
    height: 40,
    borderWidth: 4,
    borderColor: '#f3f3f3',
    borderTopColor: '#16a34a',
    borderRadius: 20,
    marginBottom: 16,
  },
  qrLoadingText: {
    fontSize: 16,
    color: '#666',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrCodeImage: {
    width: 200,
    height: 200,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
  },
  qrErrorContainer: {
    alignItems: 'center',
    padding: 40,
  },
  qrErrorText: {
    fontSize: 16,
    color: '#e74c3c',
  },
  qrInfoContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  qrInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 8,
  },
  qrInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  qrModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  qrCheckButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 10,
    marginRight: 8,
    alignItems: 'center',
  },
  qrCheckButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  qrCheckButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  qrManualButton: {
    flex: 1,
    backgroundColor: '#16a34a',
    padding: 15,
    borderRadius: 10,
    marginLeft: 8,
    alignItems: 'center',
  },
  qrManualButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  // Manual Payment Modal Styles
  manualPaymentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualPaymentContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  manualPaymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  manualPaymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
    flex: 1,
    textAlign: 'center',
  },
  manualPaymentCloseButton: {
    padding: 5,
  },
  manualPaymentContent: {
    padding: 20,
  },
  manualPaymentSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  manualPaymentInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  manualPaymentInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
  },
  manualPaymentInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  manualPaymentWarning: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  manualPaymentWarningText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  manualPaymentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  manualPaymentCancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  manualPaymentCancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  manualPaymentConfirmButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  manualPaymentConfirmButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});