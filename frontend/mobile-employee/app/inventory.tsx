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

interface Ingredient {
  _id: string;
  name: string;
  category: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  unit: string;
  unitPrice: number;
  isActive: boolean;
  description?: string;
}

interface StockAdjustment {
  ingredientId: string;
  quantity: number;
  operation: 'add' | 'subtract';
  reason: string;
  notes?: string;
}

export default function InventoryScreen() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [searchText, setSearchText] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState<StockAdjustment>({
    ingredientId: '',
    quantity: 0,
    operation: 'add',
    reason: '',
    notes: '',
  });

  const loadIngredients = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        return;
      }

      const result = await tryApiCall('/api/ingredients', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (result.success) {
        setIngredients(result.data.ingredients || []);
      } else {
        throw new Error(result.error || 'Không thể tải dữ liệu');
      }
    } catch (error) {
      console.error('Error loading ingredients:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách nguyên liệu');
      setIngredients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const adjustStock = async () => {
    if (!adjustmentForm.ingredientId || adjustmentForm.quantity <= 0) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const result = await tryApiCall(`/api/ingredients/${adjustmentForm.ingredientId}/update-stock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: adjustmentForm.quantity,
          operation: adjustmentForm.operation,
          reason: adjustmentForm.reason,
          notes: adjustmentForm.notes,
        }),
      });

      if (result.success) {
        Alert.alert('Thành công', 'Đã cập nhật tồn kho');
        setShowAdjustmentModal(false);
        setAdjustmentForm({
          ingredientId: '',
          quantity: 0,
          operation: 'add',
          reason: '',
          notes: '',
        });
        loadIngredients();
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể cập nhật tồn kho');
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật tồn kho');
    }
  };

  const openAdjustmentModal = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setAdjustmentForm({
      ingredientId: ingredient._id,
      quantity: 0,
      operation: 'add',
      reason: '',
      notes: '',
    });
    setShowAdjustmentModal(true);
  };

  const getStockStatus = (ingredient: Ingredient) => {
    if (ingredient.currentStock === 0) return 'out';
    if (ingredient.currentStock <= ingredient.minStockLevel) return 'low';
    return 'normal';
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out': return Colors.light.error;
      case 'low': return Colors.light.warning;
      case 'normal': return Colors.light.success;
      default: return Colors.light.icon;
    }
  };

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'out': return 'Hết hàng';
      case 'low': return 'Sắp hết';
      case 'normal': return 'Bình thường';
      default: return status;
    }
  };

  const filteredIngredients = ingredients.filter(ingredient => {
    // Filter by stock status
    const stockStatus = getStockStatus(ingredient);
    if (filter === 'low' && stockStatus !== 'low') return false;
    if (filter === 'out' && stockStatus !== 'out') return false;
    
    // Filter by search text
    if (searchText) {
      return ingredient.name.toLowerCase().includes(searchText.toLowerCase()) ||
             ingredient.category.toLowerCase().includes(searchText.toLowerCase());
    }
    
    return true;
  });

  const lowStockCount = ingredients.filter(i => getStockStatus(i) === 'low').length;
  const outOfStockCount = ingredients.filter(i => getStockStatus(i) === 'out').length;
  const totalValue = ingredients.reduce((sum, i) => sum + (i.currentStock * i.unitPrice), 0);

  const renderIngredient = ({ item }: { item: Ingredient }) => {
    const stockStatus = getStockStatus(item);
    const statusColor = getStockStatusColor(stockStatus);
    
    return (
      <TouchableOpacity
        style={styles.ingredientCard}
        onPress={() => openAdjustmentModal(item)}
      >
        <View style={styles.ingredientHeader}>
          <View style={styles.ingredientInfo}>
            <Text style={styles.ingredientName}>{item.name}</Text>
            <Text style={styles.ingredientCategory}>{item.category}</Text>
          </View>
          <View style={[styles.stockBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.stockBadgeText}>
              {getStockStatusText(stockStatus)}
            </Text>
          </View>
        </View>

        <View style={styles.stockInfo}>
          <View style={styles.stockRow}>
            <Ionicons name="cube" size={16} color={Colors.light.icon} />
            <Text style={styles.stockLabel}>Tồn kho:</Text>
            <Text style={styles.stockValue}>
              {item.currentStock} {item.unit}
            </Text>
          </View>
          
          <View style={styles.stockRow}>
            <Ionicons name="warning" size={16} color={Colors.light.warning} />
            <Text style={styles.stockLabel}>Tối thiểu:</Text>
            <Text style={styles.stockValue}>
              {item.minStockLevel} {item.unit}
            </Text>
          </View>
          
          <View style={styles.stockRow}>
            <Ionicons name="cash" size={16} color={Colors.light.success} />
            <Text style={styles.stockLabel}>Giá trị:</Text>
            <Text style={styles.stockValue}>
              {(item.currentStock * item.unitPrice).toLocaleString()}đ
            </Text>
          </View>
        </View>

        <View style={styles.actionButton}>
          <Ionicons name="add-circle" size={20} color={Colors.light.primary} />
          <Text style={styles.actionButtonText}>Điều chỉnh</Text>
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    loadIngredients();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadIngredients();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kiểm kho</Text>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{lowStockCount}</Text>
            <Text style={styles.statLabel}>Sắp hết</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{outOfStockCount}</Text>
            <Text style={styles.statLabel}>Hết hàng</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalValue.toLocaleString()}đ</Text>
            <Text style={styles.statLabel}>Tổng giá trị</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.light.icon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm nguyên liệu..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {['all', 'low', 'out'].map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterButton,
              filter === filterType && styles.activeFilterButton
            ]}
            onPress={() => setFilter(filterType as any)}
          >
            <Text style={[
              styles.filterText,
              filter === filterType && styles.activeFilterText
            ]}>
              {filterType === 'all' ? 'Tất cả' : 
               filterType === 'low' ? 'Sắp hết' : 'Hết hàng'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Ingredients List */}
      <FlatList
        data={filteredIngredients}
        renderItem={renderIngredient}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Stock Adjustment Modal */}
      <Modal
        visible={showAdjustmentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Điều chỉnh tồn kho - {selectedIngredient?.name}
            </Text>
            <TouchableOpacity
              onPress={() => setShowAdjustmentModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedIngredient && (
              <>
                {/* Current Stock Info */}
                <View style={styles.stockInfoSection}>
                  <Text style={styles.sectionTitle}>Thông tin hiện tại</Text>
                  <View style={styles.stockInfoCard}>
                    <View style={styles.stockInfoRow}>
                      <Text style={styles.stockInfoLabel}>Tồn kho hiện tại:</Text>
                      <Text style={styles.stockInfoValue}>
                        {selectedIngredient.currentStock} {selectedIngredient.unit}
                      </Text>
                    </View>
                    <View style={styles.stockInfoRow}>
                      <Text style={styles.stockInfoLabel}>Mức tối thiểu:</Text>
                      <Text style={styles.stockInfoValue}>
                        {selectedIngredient.minStockLevel} {selectedIngredient.unit}
                      </Text>
                    </View>
                    <View style={styles.stockInfoRow}>
                      <Text style={styles.stockInfoLabel}>Giá trị hiện tại:</Text>
                      <Text style={styles.stockInfoValue}>
                        {(selectedIngredient.currentStock * selectedIngredient.unitPrice).toLocaleString()}đ
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Adjustment Form */}
                <View style={styles.adjustmentSection}>
                  <Text style={styles.sectionTitle}>Điều chỉnh</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Loại điều chỉnh</Text>
                    <View style={styles.operationButtons}>
                      <TouchableOpacity
                        style={[
                          styles.operationButton,
                          adjustmentForm.operation === 'add' && styles.selectedOperationButton
                        ]}
                        onPress={() => setAdjustmentForm(prev => ({ ...prev, operation: 'add' }))}
                      >
                        <Ionicons name="add" size={20} color={adjustmentForm.operation === 'add' ? '#fff' : Colors.light.success} />
                        <Text style={[
                          styles.operationButtonText,
                          adjustmentForm.operation === 'add' && styles.selectedOperationButtonText
                        ]}>
                          Thêm
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.operationButton,
                          adjustmentForm.operation === 'subtract' && styles.selectedOperationButton
                        ]}
                        onPress={() => setAdjustmentForm(prev => ({ ...prev, operation: 'subtract' }))}
                      >
                        <Ionicons name="remove" size={20} color={adjustmentForm.operation === 'subtract' ? '#fff' : Colors.light.error} />
                        <Text style={[
                          styles.operationButtonText,
                          adjustmentForm.operation === 'subtract' && styles.selectedOperationButtonText
                        ]}>
                          Trừ
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Số lượng *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nhập số lượng"
                      value={adjustmentForm.quantity.toString()}
                      onChangeText={(text) => setAdjustmentForm(prev => ({ 
                        ...prev, 
                        quantity: parseInt(text) || 0 
                      }))}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Lý do *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nhập lý do điều chỉnh"
                      value={adjustmentForm.reason}
                      onChangeText={(text) => setAdjustmentForm(prev => ({ ...prev, reason: text }))}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Ghi chú</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Nhập ghi chú (tùy chọn)"
                      value={adjustmentForm.notes}
                      onChangeText={(text) => setAdjustmentForm(prev => ({ ...prev, notes: text }))}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  {/* Preview */}
                  {adjustmentForm.quantity > 0 && (
                    <View style={styles.previewSection}>
                      <Text style={styles.sectionTitle}>Xem trước</Text>
                      <View style={styles.previewCard}>
                        <Text style={styles.previewText}>
                          Tồn kho hiện tại: {selectedIngredient.currentStock} {selectedIngredient.unit}
                        </Text>
                        <Text style={styles.previewText}>
                          {adjustmentForm.operation === 'add' ? '+' : '-'} {adjustmentForm.quantity} {selectedIngredient.unit}
                        </Text>
                        <Text style={styles.previewText}>
                          = {adjustmentForm.operation === 'add' 
                            ? selectedIngredient.currentStock + adjustmentForm.quantity
                            : Math.max(0, selectedIngredient.currentStock - adjustmentForm.quantity)
                          } {selectedIngredient.unit}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </>
            )}
          </ScrollView>

          {/* Modal Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAdjustmentModal(false)}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={adjustStock}
            >
              <Text style={styles.confirmButtonText}>Cập nhật</Text>
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
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  searchContainer: {
    padding: 16,
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
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  activeFilterButton: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  ingredientCard: {
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
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  ingredientCategory: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  stockInfo: {
    gap: 8,
    marginBottom: 12,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    minWidth: 80,
  },
  stockValue: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  stockInfoSection: {
    marginBottom: 24,
  },
  stockInfoCard: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  stockInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  stockInfoLabel: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  stockInfoValue: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  adjustmentSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.light.background,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  operationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  operationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    gap: 8,
  },
  selectedOperationButton: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  operationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  selectedOperationButtonText: {
    color: '#fff',
  },
  previewSection: {
    marginBottom: 24,
  },
  previewCard: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  previewText: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 4,
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
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
