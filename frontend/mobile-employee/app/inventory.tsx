import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { tryApiCall } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

interface Ingredient {
  _id: string;
  name: string;
  currentStock: number;
  minStockLevel: number;
  unit: string;
  unitPrice: number;
  category: string;
  supplier?: string;
}

interface InventoryTransaction {
  _id: string;
  ingredient: Ingredient;
  transactionType: 'import' | 'export';
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  reason: string;
  department: string;
  createdAt: string;
}

export default function InventoryScreen() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'ingredients' | 'transactions'>('overview');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [transactionForm, setTransactionForm] = useState({
    quantity: '',
    unitPrice: '',
    reason: '',
    department: 'Kitchen',
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

      // Load ingredients
      const ingredientsResult = await tryApiCall('/api/ingredients', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      // Load recent transactions
      const transactionsResult = await tryApiCall('/api/inventory-transactions/recent', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (ingredientsResult.success) {
        setIngredients(ingredientsResult.data || []);
      }

      if (transactionsResult.success) {
        setTransactions(transactionsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading inventory data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu kho');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleTransaction = async (type: 'import' | 'export') => {
    if (!selectedIngredient) return;

    if (!transactionForm.quantity || !transactionForm.unitPrice || !transactionForm.reason) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      const transactionData = {
        ingredient: selectedIngredient._id,
        transactionType: type,
        quantity: parseInt(transactionForm.quantity),
        unitPrice: parseFloat(transactionForm.unitPrice),
        totalAmount: parseInt(transactionForm.quantity) * parseFloat(transactionForm.unitPrice),
        reason: transactionForm.reason,
        department: transactionForm.department,
      };

      const result = await tryApiCall('/api/inventory-transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (result.success) {
        Alert.alert(
          'Thành công',
          `${type === 'import' ? 'Nhập' : 'Xuất'} kho thành công`,
          [{ text: 'OK', onPress: () => {
            setShowTransactionModal(false);
            setTransactionForm({ quantity: '', unitPrice: '', reason: '', department: 'Kitchen' });
            setSelectedIngredient(null);
            loadData();
          }}]
        );
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể thực hiện giao dịch');
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
      Alert.alert('Lỗi', 'Không thể thực hiện giao dịch');
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStockStatus = (ingredient: Ingredient) => {
    if (ingredient.currentStock === 0) return { status: 'out', color: '#F44336', text: 'Hết hàng' };
    if (ingredient.currentStock <= ingredient.minStockLevel) return { status: 'low', color: '#FF9800', text: 'Sắp hết' };
    return { status: 'good', color: '#4CAF50', text: 'Đủ hàng' };
  };

  const lowStockItems = ingredients.filter(ing => ing.currentStock <= ing.minStockLevel);
  const outOfStockItems = ingredients.filter(ing => ing.currentStock === 0);
  const totalValue = ingredients.reduce((sum, ing) => sum + (ing.currentStock * ing.unitPrice), 0);

  const tabs = [
    { key: 'overview', label: 'Tổng quan', icon: 'grid' },
    { key: 'ingredients', label: 'Nguyên liệu', icon: 'cube' },
    { key: 'transactions', label: 'Giao dịch', icon: 'swap-horizontal' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý kho</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              selectedTab === tab.key && styles.activeTabButton
            ]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={20} 
              color={selectedTab === tab.key ? 'white' : Colors.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              selectedTab === tab.key && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedTab === 'overview' && (
          <View>
            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{ingredients.length}</Text>
                <Text style={styles.statLabel}>Tổng nguyên liệu</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#F44336' }]}>{outOfStockItems.length}</Text>
                <Text style={styles.statLabel}>Hết hàng</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#FF9800' }]}>{lowStockItems.length}</Text>
                <Text style={styles.statLabel}>Sắp hết</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{formatCurrency(totalValue)}</Text>
                <Text style={styles.statLabel}>Tổng giá trị</Text>
              </View>
            </View>

            {/* Low Stock Alert */}
            {lowStockItems.length > 0 && (
              <View style={styles.alertContainer}>
                <Text style={styles.alertTitle}>⚠️ Cảnh báo sắp hết hàng</Text>
                {lowStockItems.slice(0, 5).map((item) => (
                  <View key={item._id} style={styles.alertItem}>
                    <Text style={styles.alertItemName}>{item.name}</Text>
                    <Text style={styles.alertItemStock}>
                      {item.currentStock} {item.unit} (tối thiểu: {item.minStockLevel})
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Recent Transactions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
              {transactions.slice(0, 5).map((transaction) => (
                <View key={transaction._id} style={styles.transactionItem}>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionName}>{transaction.ingredient.name}</Text>
                    <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={[
                      styles.transactionType,
                      { color: transaction.transactionType === 'import' ? '#4CAF50' : '#F44336' }
                    ]}>
                      {transaction.transactionType === 'import' ? 'Nhập' : 'Xuất'} {transaction.quantity} {transaction.ingredient.unit}
                    </Text>
                    <Text style={styles.transactionAmount}>{formatCurrency(transaction.totalAmount)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {selectedTab === 'ingredients' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Danh sách nguyên liệu</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  // Navigate to add ingredient screen
                  Alert.alert('Thông báo', 'Tính năng thêm nguyên liệu sẽ được phát triển');
                }}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.addButtonText}>Thêm</Text>
              </TouchableOpacity>
            </View>

            {ingredients.map((ingredient) => {
              const stockStatus = getStockStatus(ingredient);
              return (
                <TouchableOpacity
                  key={ingredient._id}
                  style={styles.ingredientCard}
                  onPress={() => {
                    setSelectedIngredient(ingredient);
                    setTransactionForm(prev => ({
                      ...prev,
                      unitPrice: ingredient.unitPrice.toString(),
                    }));
                    setShowTransactionModal(true);
                  }}
                >
                  <View style={styles.ingredientInfo}>
                    <Text style={styles.ingredientName}>{ingredient.name}</Text>
                    <Text style={styles.ingredientCategory}>{ingredient.category}</Text>
                    <Text style={styles.ingredientSupplier}>{ingredient.supplier || 'Chưa có nhà cung cấp'}</Text>
                  </View>
                  <View style={styles.ingredientStock}>
                    <View style={[styles.stockBadge, { backgroundColor: stockStatus.color }]}>
                      <Text style={styles.stockText}>{stockStatus.text}</Text>
                    </View>
                    <Text style={styles.stockAmount}>
                      {ingredient.currentStock} {ingredient.unit}
                    </Text>
                    <Text style={styles.stockMin}>
                      Tối thiểu: {ingredient.minStockLevel} {ingredient.unit}
                    </Text>
                    <Text style={styles.stockValue}>
                      {formatCurrency(ingredient.unitPrice)}/{ingredient.unit}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {selectedTab === 'transactions' && (
          <View>
            <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
            {transactions.map((transaction) => (
              <View key={transaction._id} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionName}>{transaction.ingredient.name}</Text>
                  <View style={[
                    styles.transactionTypeBadge,
                    { backgroundColor: transaction.transactionType === 'import' ? '#E8F5E8' : '#FFEBEE' }
                  ]}>
                    <Text style={[
                      styles.transactionTypeText,
                      { color: transaction.transactionType === 'import' ? '#4CAF50' : '#F44336' }
                    ]}>
                      {transaction.transactionType === 'import' ? 'NHẬP' : 'XUẤT'}
                    </Text>
                  </View>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionQuantity}>
                    {transaction.quantity} {transaction.ingredient.unit}
                  </Text>
                  <Text style={styles.transactionAmount}>{formatCurrency(transaction.totalAmount)}</Text>
                </View>
                <Text style={styles.transactionReason}>{transaction.reason}</Text>
                <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Transaction Modal */}
      <Modal
        visible={showTransactionModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedIngredient && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowTransactionModal(false)}>
                <Text style={styles.modalCancelText}>Đóng</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {selectedIngredient.name} - Giao dịch kho
              </Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.ingredientInfo}>
                <Text style={styles.ingredientName}>{selectedIngredient.name}</Text>
                <Text style={styles.ingredientStock}>
                  Tồn kho: {selectedIngredient.currentStock} {selectedIngredient.unit}
                </Text>
                <Text style={styles.ingredientPrice}>
                  Giá: {formatCurrency(selectedIngredient.unitPrice)}/{selectedIngredient.unit}
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Số lượng</Text>
                <TextInput
                  style={styles.formInput}
                  value={transactionForm.quantity}
                  onChangeText={(text) => setTransactionForm(prev => ({ ...prev, quantity: text }))}
                  keyboardType="numeric"
                  placeholder="Nhập số lượng"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Đơn giá (VNĐ)</Text>
                <TextInput
                  style={styles.formInput}
                  value={transactionForm.unitPrice}
                  onChangeText={(text) => setTransactionForm(prev => ({ ...prev, unitPrice: text }))}
                  keyboardType="numeric"
                  placeholder="Nhập đơn giá"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Lý do</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={transactionForm.reason}
                  onChangeText={(text) => setTransactionForm(prev => ({ ...prev, reason: text }))}
                  placeholder="Nhập lý do giao dịch"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Bộ phận</Text>
                <TextInput
                  style={styles.formInput}
                  value={transactionForm.department}
                  onChangeText={(text) => setTransactionForm(prev => ({ ...prev, department: text }))}
                  placeholder="Nhập bộ phận"
                />
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.importButton]}
                  onPress={() => handleTransaction('import')}
                  disabled={loading}
                >
                  <Ionicons name="add" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Nhập kho</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.exportButton]}
                  onPress={() => handleTransaction('export')}
                  disabled={loading}
                >
                  <Ionicons name="remove" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Xuất kho</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 4,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  alertContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 12,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  alertItemName: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  alertItemStock: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
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
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  transactionItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  transactionDetails: {
    alignItems: 'flex-end',
  },
  transactionType: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  ingredientCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  ingredientCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  ingredientSupplier: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  ingredientStock: {
    alignItems: 'flex-end',
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  stockText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  stockAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  stockMin: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  stockValue: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  transactionTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  transactionQuantity: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  transactionReason: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  ingredientInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  formInput: {
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  importButton: {
    backgroundColor: '#4CAF50',
  },
  exportButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});