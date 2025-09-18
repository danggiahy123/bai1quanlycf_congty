import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { tryApiCall } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image?: string;
  isAvailable: boolean;
  ingredients?: Array<{
    ingredient: {
      _id: string;
      name: string;
      currentStock: number;
      minStockLevel: number;
    };
    quantity: number;
  }>;
}

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  price: number;
  specialRequests?: string;
}

interface Table {
  _id: string;
  name: string;
  status: 'empty' | 'occupied';
  capacity: number;
  order?: {
    _id: string;
    items: OrderItem[];
    totalAmount: number;
    status: 'pending' | 'paid';
  };
}

export default function OrderScreen() {
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [specialRequests, setSpecialRequests] = useState('');

  const loadTables = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        return;
      }

      const result = await tryApiCall('/api/tables', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (result.success) {
        setTables(result.data || []);
      } else {
        throw new Error(result.error || 'Không thể tải dữ liệu');
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách bàn');
      setTables([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const result = await tryApiCall('/api/menu', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (result.success) {
        setMenuItems(result.data.menuItems || []);
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
    }
  };

  const loadTableOrder = async (tableId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const result = await tryApiCall(`/api/orders/by-table/${tableId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (result.success) {
        setOrderItems(result.data?.items || []);
      } else {
        setOrderItems([]);
      }
    } catch (error) {
      console.error('Error loading table order:', error);
      setOrderItems([]);
    }
  };

  const addToOrder = async () => {
    if (!selectedTable || orderItems.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn món ăn');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const result = await tryApiCall(`/api/orders/by-table/${selectedTable._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: orderItems.map(item => ({
            menuItemId: item.menuItem._id,
            quantity: item.quantity,
            specialRequests: item.specialRequests,
          })),
        }),
      });

      if (result.success) {
        Alert.alert('Thành công', 'Đã thêm món vào đơn hàng');
        setShowOrderModal(false);
        setOrderItems([]);
        setSpecialRequests('');
        loadTables();
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể thêm món vào đơn hàng');
      }
    } catch (error) {
      console.error('Error adding to order:', error);
      Alert.alert('Lỗi', 'Không thể thêm món vào đơn hàng');
    }
  };

  const openOrderModal = async (table: Table) => {
    setSelectedTable(table);
    if (table.status === 'occupied') {
      await loadTableOrder(table._id);
    } else {
      setOrderItems([]);
    }
    setShowOrderModal(true);
  };

  const addMenuItemToOrder = (menuItem: MenuItem) => {
    const existingItem = orderItems.find(item => item.menuItem._id === menuItem._id);
    
    if (existingItem) {
      setOrderItems(prev => 
        prev.map(item => 
          item.menuItem._id === menuItem._id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setOrderItems(prev => [...prev, {
        menuItem,
        quantity: 1,
        price: menuItem.price,
        specialRequests: '',
      }]);
    }
  };

  const removeMenuItemFromOrder = (menuItemId: string) => {
    setOrderItems(prev => prev.filter(item => item.menuItem._id !== menuItemId));
  };

  const updateOrderItemQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeMenuItemFromOrder(menuItemId);
      return;
    }

    setOrderItems(prev => 
      prev.map(item => 
        item.menuItem._id === menuItemId 
          ? { ...item, quantity }
          : item
      )
    );
  };

  const updateOrderItemSpecialRequests = (menuItemId: string, specialRequests: string) => {
    setOrderItems(prev => 
      prev.map(item => 
        item.menuItem._id === menuItemId 
          ? { ...item, specialRequests }
          : item
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'empty': return Colors.light.success;
      case 'occupied': return Colors.light.warning;
      default: return Colors.light.icon;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'empty': return 'Trống';
      case 'occupied': return 'Đang dùng';
      default: return status;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'drinks': return 'wine';
      case 'food': return 'restaurant';
      case 'dessert': return 'ice-cream';
      case 'appetizer': return 'leaf';
      default: return 'restaurant';
    }
  };

  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))];

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory && item.isAvailable;
  });

  const occupiedTables = tables.filter(t => t.status === 'occupied');
  const totalOrderAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const renderTable = ({ item }: { item: Table }) => (
    <TouchableOpacity
      style={styles.tableCard}
      onPress={() => openOrderModal(item)}
    >
      <View style={styles.tableHeader}>
        <View style={styles.tableInfo}>
          <Text style={styles.tableName}>{item.name}</Text>
          <Text style={styles.tableCapacity}>{item.capacity} người</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      {item.order && (
        <View style={styles.orderInfo}>
          <Text style={styles.orderTitle}>Đơn hàng hiện tại</Text>
          <Text style={styles.orderItemsCount}>
            {item.order.items.length} món • {item.order.totalAmount.toLocaleString()}đ
          </Text>
        </View>
      )}

      <View style={styles.actionButton}>
        <Ionicons name="add-circle" size={20} color={Colors.light.primary} />
        <Text style={styles.actionButtonText}>
          {item.status === 'occupied' ? 'Thêm món' : 'Tạo đơn hàng'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity
      style={styles.menuItemCard}
      onPress={() => addMenuItemToOrder(item)}
    >
      <View style={styles.menuItemHeader}>
        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemName}>{item.name}</Text>
          <Text style={styles.menuItemCategory}>{item.category}</Text>
        </View>
        <Text style={styles.menuItemPrice}>{item.price.toLocaleString()}đ</Text>
      </View>
      
      {item.description && (
        <Text style={styles.menuItemDescription}>{item.description}</Text>
      )}

      <View style={styles.menuItemFooter}>
        <Ionicons name={getCategoryIcon(item.category) as any} size={16} color={Colors.light.icon} />
        <Text style={styles.menuItemCategoryText}>{item.category}</Text>
        <Ionicons name="add-circle" size={20} color={Colors.light.primary} />
      </View>
    </TouchableOpacity>
  );

  const renderOrderItem = ({ item }: { item: OrderItem }) => (
    <View style={styles.orderItemCard}>
      <View style={styles.orderItemHeader}>
        <Text style={styles.orderItemName}>{item.menuItem.name}</Text>
        <TouchableOpacity
          onPress={() => removeMenuItemFromOrder(item.menuItem._id)}
          style={styles.removeButton}
        >
          <Ionicons name="close" size={16} color={Colors.light.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.orderItemControls}>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            onPress={() => updateOrderItemQuantity(item.menuItem._id, item.quantity - 1)}
            style={styles.quantityButton}
          >
            <Ionicons name="remove" size={16} color={Colors.light.primary} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => updateOrderItemQuantity(item.menuItem._id, item.quantity + 1)}
            style={styles.quantityButton}
          >
            <Ionicons name="add" size={16} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.orderItemPrice}>
          {(item.price * item.quantity).toLocaleString()}đ
        </Text>
      </View>

      <TextInput
        style={styles.specialRequestsInput}
        placeholder="Yêu cầu đặc biệt (tùy chọn)"
        value={item.specialRequests}
        onChangeText={(text) => updateOrderItemSpecialRequests(item.menuItem._id, text)}
        multiline
        numberOfLines={2}
      />
    </View>
  );

  useEffect(() => {
    loadTables();
    loadMenuItems();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadTables();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gọi món thêm</Text>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{occupiedTables.length}</Text>
            <Text style={styles.statLabel}>Bàn đang dùng</Text>
          </View>
        </View>
      </View>

      {/* Tables List */}
      <FlatList
        data={tables}
        renderItem={renderTable}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Order Modal */}
      <Modal
        visible={showOrderModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedTable?.name} - Gọi món thêm
            </Text>
            <TouchableOpacity
              onPress={() => setShowOrderModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Search and Category Filter */}
            <View style={styles.searchSection}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={Colors.light.icon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm kiếm món ăn..."
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category && styles.activeCategoryButton
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text style={[
                      styles.categoryText,
                      selectedCategory === category && styles.activeCategoryText
                    ]}>
                      {category === 'all' ? 'Tất cả' : category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Current Order Items */}
            {orderItems.length > 0 && (
              <View style={styles.currentOrderSection}>
                <Text style={styles.sectionTitle}>Đơn hàng hiện tại</Text>
                <FlatList
                  data={orderItems}
                  renderItem={renderOrderItem}
                  keyExtractor={(item) => item.menuItem._id}
                  scrollEnabled={false}
                />
                <View style={styles.orderTotal}>
                  <Text style={styles.totalLabel}>Tổng cộng:</Text>
                  <Text style={styles.totalAmount}>{totalOrderAmount.toLocaleString()}đ</Text>
                </View>
              </View>
            )}

            {/* Menu Items */}
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>Thực đơn</Text>
              <FlatList
                data={filteredMenuItems}
                renderItem={renderMenuItem}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
                numColumns={2}
                columnWrapperStyle={styles.menuRow}
              />
            </View>
          </ScrollView>

          {/* Modal Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowOrderModal(false)}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, orderItems.length === 0 && styles.disabledButton]}
              onPress={addToOrder}
              disabled={orderItems.length === 0}
            >
              <Text style={styles.confirmButtonText}>
                Thêm {orderItems.length} món
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  header: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  listContainer: {
    padding: 16,
  },
  tableCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tableInfo: {
    flex: 1,
  },
  tableName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  tableCapacity: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  orderInfo: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  orderItemsCount: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: Colors.light.primaryLight,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: Colors.light.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  searchSection: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: 8,
  },
  activeCategoryButton: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#fff',
    fontWeight: '600',
  },
  currentOrderSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  orderItemCard: {
    backgroundColor: Colors.light.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  orderItemControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    minWidth: 24,
    textAlign: 'center',
  },
  orderItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  specialRequestsInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  menuSection: {
    marginBottom: 24,
  },
  menuRow: {
    justifyContent: 'space-between',
  },
  menuItemCard: {
    width: '48%',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  menuItemCategory: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  menuItemDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  menuItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemCategoryText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    flex: 1,
    marginLeft: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: Colors.light.icon,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
