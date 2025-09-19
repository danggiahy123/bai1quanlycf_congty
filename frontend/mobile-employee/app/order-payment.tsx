import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { tryApiCall } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

interface Table {
  _id: string;
  name: string;
  capacity: number;
  status: 'empty' | 'occupied';
  order?: {
    _id: string;
    items: Array<{
      name: string;
      price: number;
      quantity: number;
    }>;
    totalAmount: number;
    status: 'pending' | 'paid';
  };
  booking?: {
    _id: string;
    depositAmount: number;
    totalAmount: number;
  };
}

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  isAvailable: boolean;
}

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  price: number;
  specialRequests?: string;
}

export default function OrderPaymentScreen() {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr' | null>(null);

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

      // Load tables
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
        setTables(tablesResult.data || []);
      }

      if (menuResult.success) {
        const availableItems = (menuResult.data || []).filter((item: MenuItem) => item.isAvailable);
        setMenuItems(availableItems);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    if (table.order) {
      // Load existing order items
      const existingItems: OrderItem[] = table.order.items.map(item => ({
        menuItem: {
          _id: '',
          name: item.name,
          price: item.price,
          category: '',
          isAvailable: true,
        },
        quantity: item.quantity,
        price: item.price,
      }));
      setOrderItems(existingItems);
    } else {
      setOrderItems([]);
    }
  };

  const handleAddMenuItem = (menuItem: MenuItem) => {
    const existingItemIndex = orderItems.findIndex(
      item => item.menuItem._id === menuItem._id
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += 1;
      setOrderItems(updatedItems);
    } else {
      // Add new item
      const newItem: OrderItem = {
        menuItem,
        quantity: 1,
        price: menuItem.price,
      };
      setOrderItems([...orderItems, newItem]);
    }
    setShowMenuModal(false);
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      const updatedItems = orderItems.filter((_, i) => i !== index);
      setOrderItems(updatedItems);
    } else {
      const updatedItems = [...orderItems];
      updatedItems[index].quantity = quantity;
      setOrderItems(updatedItems);
    }
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateDepositRefund = () => {
    if (!selectedTable?.booking) return 0;
    const total = calculateTotal();
    return selectedTable.booking.depositAmount - total;
  };

  const calculateAdditionalPayment = () => {
    if (!selectedTable?.booking) return 0;
    const total = calculateTotal();
    return total - selectedTable.booking.depositAmount;
  };

  const handleSubmitOrder = async () => {
    if (!selectedTable) {
      Alert.alert('Lỗi', 'Vui lòng chọn bàn');
      return;
    }

    if (orderItems.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng thêm món ăn');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      const orderData = {
        table: selectedTable._id,
        items: orderItems.map(item => ({
          menuId: item.menuItem._id,
          name: item.menuItem.name,
          price: item.price,
          quantity: item.quantity,
          specialRequests: item.specialRequests,
        })),
        totalAmount: calculateTotal(),
        status: 'pending',
      };

      const result = await tryApiCall('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (result.success) {
        Alert.alert('Thành công', 'Đơn hàng đã được tạo');
        loadData(); // Reload tables
        setOrderItems([]);
        setSelectedTable(null);
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể tạo đơn hàng');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Lỗi', 'Không thể tạo đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedTable?.order) {
      Alert.alert('Lỗi', 'Không có đơn hàng để thanh toán');
      return;
    }

    if (!paymentMethod) {
      Alert.alert('Lỗi', 'Vui lòng chọn phương thức thanh toán');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      const paymentData = {
        orderId: selectedTable.order._id,
        paymentMethod,
        amount: selectedTable.order.totalAmount,
      };

      const result = await tryApiCall('/api/orders/payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (result.success) {
        const depositRefund = calculateDepositRefund();
        const additionalPayment = calculateAdditionalPayment();
        
        let message = 'Thanh toán thành công!\n\n';
        
        if (depositRefund > 0) {
          message += `Trả lại tiền cọc: ${formatCurrency(depositRefund)}`;
        } else if (additionalPayment > 0) {
          message += `Thanh toán thêm: ${formatCurrency(additionalPayment)}`;
        } else {
          message += 'Số tiền vừa đủ với tiền cọc';
        }

        Alert.alert('Thành công', message, [
          { text: 'OK', onPress: () => {
            setShowPaymentModal(false);
            loadData();
            setSelectedTable(null);
            setOrderItems([]);
          }}
        ]);
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể thanh toán');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Lỗi', 'Không thể thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const occupiedTables = tables.filter(table => table.status === 'occupied');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gọi món & Thanh toán</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Table Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn bàn</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {occupiedTables.map((table) => (
              <TouchableOpacity
                key={table._id}
                style={[
                  styles.tableCard,
                  selectedTable?._id === table._id && styles.selectedTableCard
                ]}
                onPress={() => handleTableSelect(table)}
              >
                <Text style={[
                  styles.tableName,
                  selectedTable?._id === table._id && styles.selectedTableName
                ]}>
                  {table.name}
                </Text>
                <Text style={[
                  styles.tableStatus,
                  selectedTable?._id === table._id && styles.selectedTableStatus
                ]}>
                  {table.order ? 'Có đơn hàng' : 'Chưa có đơn'}
                </Text>
                {table.booking && (
                  <Text style={[
                    styles.depositAmount,
                    selectedTable?._id === table._id && styles.selectedDepositAmount
                  ]}>
                    Cọc: {formatCurrency(table.booking.depositAmount)}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {selectedTable && (
          <>
            {/* Order Items */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Món đã chọn</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowMenuModal(true)}
                >
                  <Ionicons name="add" size={20} color="white" />
                  <Text style={styles.addButtonText}>Thêm món</Text>
                </TouchableOpacity>
              </View>

              {orderItems.length === 0 ? (
                <View style={styles.emptyOrder}>
                  <Text style={styles.emptyOrderText}>Chưa có món nào</Text>
                </View>
              ) : (
                <View style={styles.orderItems}>
                  {orderItems.map((item, index) => (
                    <View key={index} style={styles.orderItem}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.menuItem.name}</Text>
                        <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                      </View>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => handleUpdateQuantity(index, item.quantity - 1)}
                        >
                          <Ionicons name="remove" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => handleUpdateQuantity(index, item.quantity + 1)}
                        >
                          <Ionicons name="add" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Order Summary */}
            {orderItems.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tổng món ăn:</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(calculateTotal())}</Text>
                  </View>
                  {selectedTable.booking && (
                    <>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tiền cọc:</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(selectedTable.booking.depositAmount)}</Text>
                      </View>
                      {calculateDepositRefund() > 0 && (
                        <View style={[styles.summaryRow, styles.refundRow]}>
                          <Text style={styles.refundLabel}>Trả lại khách:</Text>
                          <Text style={styles.refundValue}>{formatCurrency(calculateDepositRefund())}</Text>
                        </View>
                      )}
                      {calculateAdditionalPayment() > 0 && (
                        <View style={[styles.summaryRow, styles.paymentRow]}>
                          <Text style={styles.paymentLabel}>Khách trả thêm:</Text>
                          <Text style={styles.paymentValue}>{formatCurrency(calculateAdditionalPayment())}</Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {!selectedTable.order ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.submitButton]}
                  onPress={handleSubmitOrder}
                  disabled={loading || orderItems.length === 0}
                >
                  <Text style={styles.actionButtonText}>
                    {loading ? 'Đang tạo...' : 'Tạo đơn hàng'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.paymentButton]}
                  onPress={() => setShowPaymentModal(true)}
                >
                  <Text style={styles.actionButtonText}>Thanh toán</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Menu Modal */}
      <Modal
        visible={showMenuModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowMenuModal(false)}>
              <Text style={styles.modalCancelText}>Đóng</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chọn món ăn</Text>
            <View style={styles.placeholder} />
          </View>

          <FlatList
            data={menuItems}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleAddMenuItem(item)}
              >
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemName}>{item.name}</Text>
                  <Text style={styles.menuItemCategory}>{item.category}</Text>
                  {item.description && (
                    <Text style={styles.menuItemDescription}>{item.description}</Text>
                  )}
                </View>
                <View style={styles.menuItemPrice}>
                  <Text style={styles.priceText}>{formatCurrency(item.price)}</Text>
                  <Ionicons name="add-circle" size={24} color={Colors.primary} />
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <Text style={styles.modalCancelText}>Đóng</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Thanh toán</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.paymentSummary}>
              <Text style={styles.paymentTitle}>Tóm tắt thanh toán</Text>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Tổng đơn hàng:</Text>
                <Text style={styles.paymentValue}>{formatCurrency(calculateTotal())}</Text>
              </View>
              {selectedTable?.booking && (
                <>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Tiền cọc:</Text>
                    <Text style={styles.paymentValue}>{formatCurrency(selectedTable.booking.depositAmount)}</Text>
                  </View>
                  {calculateDepositRefund() > 0 && (
                    <View style={[styles.paymentRow, styles.refundRow]}>
                      <Text style={styles.refundLabel}>Trả lại khách:</Text>
                      <Text style={styles.refundValue}>{formatCurrency(calculateDepositRefund())}</Text>
                    </View>
                  )}
                  {calculateAdditionalPayment() > 0 && (
                    <View style={[styles.paymentRow, styles.paymentRow]}>
                      <Text style={styles.paymentLabel}>Khách trả thêm:</Text>
                      <Text style={styles.paymentValue}>{formatCurrency(calculateAdditionalPayment())}</Text>
                    </View>
                  )}
                </>
              )}
            </View>

            <View style={styles.paymentMethods}>
              <Text style={styles.paymentTitle}>Phương thức thanh toán</Text>
              <TouchableOpacity
                style={[
                  styles.paymentMethodButton,
                  paymentMethod === 'cash' && styles.selectedPaymentMethod
                ]}
                onPress={() => setPaymentMethod('cash')}
              >
                <Ionicons name="cash" size={24} color={paymentMethod === 'cash' ? 'white' : Colors.primary} />
                <Text style={[
                  styles.paymentMethodText,
                  paymentMethod === 'cash' && styles.selectedPaymentMethodText
                ]}>
                  Tiền mặt
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.paymentMethodButton,
                  paymentMethod === 'qr' && styles.selectedPaymentMethod
                ]}
                onPress={() => setPaymentMethod('qr')}
              >
                <Ionicons name="qr-code" size={24} color={paymentMethod === 'qr' ? 'white' : Colors.primary} />
                <Text style={[
                  styles.paymentMethodText,
                  paymentMethod === 'qr' && styles.selectedPaymentMethodText
                ]}>
                  Quét QR
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.confirmPaymentButton, !paymentMethod && styles.disabledButton]}
              onPress={handlePayment}
              disabled={!paymentMethod || loading}
            >
              <Text style={styles.confirmPaymentText}>
                {loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
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
    flex: 1,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tableCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    minWidth: 120,
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
  tableStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  selectedTableStatus: {
    color: Colors.primary,
  },
  depositAmount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  selectedDepositAmount: {
    color: Colors.primary,
  },
  addButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyOrder: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyOrderText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  orderItems: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginHorizontal: 16,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  refundRow: {
    backgroundColor: '#E8F5E8',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  refundLabel: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  refundValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  paymentRow: {
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  actionButtons: {
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  paymentButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
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
  menuItem: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  menuItemCategory: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  menuItemPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  paymentSummary: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  paymentMethods: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  selectedPaymentMethod: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  paymentMethodText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  selectedPaymentMethodText: {
    color: 'white',
  },
  confirmPaymentButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: Colors.textSecondary,
  },
  confirmPaymentText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
