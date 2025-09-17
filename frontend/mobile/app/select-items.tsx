import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, TouchableOpacity, View, ScrollView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOrder } from '@/components/order-context';
import { DEFAULT_API_URL } from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';

export default function SelectItemsScreen() {
  const router = useRouter();
  const { state, addItem, updateItemQuantity, removeItem, totalAmount } = useOrder();

  const API_URL = DEFAULT_API_URL;
  const [menu, setMenu] = useState<{ id: string; name: string; price: number; image?: string; note?: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/api/menu`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const mapped = (Array.isArray(data) ? data : []).map((m: any) => ({
          id: String(m._id ?? m.id),
          name: String(m.name ?? ''),
          price: Number(m.price ?? 0),
          image: m.image ? String(m.image) : undefined,
          note: m.note ? String(m.note) : undefined,
        }));
        if (mounted) setMenu(mapped);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Load failed');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [API_URL]);

  const qty = (id: string) => state.items.find((x) => x.id === id)?.quantity || 0;

  const addOnly = (id: string) => {
    const found = menu.find((m) => m.id === id);
    if (found) {
      addItem(found);
    }
  };

  const handleNext = () => {
    if (state.items.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một món');
      return;
    }
    router.push('/order-confirm');
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Chọn món',
          headerStyle: { backgroundColor: '#16a34a' },
          headerTintColor: '#fff',
        }} 
      />
      
      {/* Header thông tin */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Ionicons name="restaurant" size={20} color="#16a34a" />
          <ThemedText style={styles.headerText}>
            Bàn: {state.tableId} • Số khách: {state.numberOfGuests}
          </ThemedText>
        </View>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color="#16a34a" />
          <ThemedText style={styles.backButtonText}>Quay lại</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Danh sách món ăn */}
      <ScrollView 
        style={styles.menuContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.menuContent}
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <Ionicons name="refresh" size={24} color="#16a34a" />
            <ThemedText style={styles.loadingText}>Đang tải menu...</ThemedText>
          </View>
        )}
        
        {!!error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#ef4444" />
            <ThemedText style={styles.errorText}>Không tải được menu: {error}</ThemedText>
          </View>
        )}
        
        {menu.map((m) => (
          <View key={m.id} style={styles.menuItem}>
            {/* Hình ảnh món ăn */}
            <View style={styles.imageContainer}>
              {m.image ? (
                <Image
                  source={{ uri: m.image.startsWith('http') ? m.image : `${API_URL}${m.image}` }}
                  style={styles.menuImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="restaurant" size={24} color="#9ca3af" />
                </View>
              )}
            </View>
            
            {/* Thông tin món ăn */}
            <View style={styles.menuInfo}>
              <ThemedText type="defaultSemiBold" style={styles.menuName}>
                {m.name}
              </ThemedText>
              <ThemedText style={styles.menuPrice}>
                {m.price.toLocaleString('vi-VN')}đ
              </ThemedText>
              {!!m.note && (
                <ThemedText style={styles.menuNote} numberOfLines={2}>
                  {m.note}
                </ThemedText>
              )}
            </View>
            
            {/* Nút điều khiển số lượng */}
            <View style={styles.actions}>
              {qty(m.id) === 0 ? (
                <TouchableOpacity style={styles.addButton} onPress={() => addOnly(m.id)}>
                  <Ionicons name="add" size={16} color="#fff" />
                  <ThemedText style={styles.addButtonText}>Thêm</ThemedText>
                </TouchableOpacity>
              ) : (
                <View style={styles.quantityControls}>
                  <TouchableOpacity 
                    style={styles.quantityButton} 
                    onPress={() => updateItemQuantity(m.id, Math.max(0, qty(m.id) - 1))}
                  >
                    <Ionicons name="remove" size={16} color="#16a34a" />
                  </TouchableOpacity>
                  
                  <View style={styles.quantityDisplay}>
                    <ThemedText style={styles.quantityText}>{qty(m.id)}</ThemedText>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.quantityButton} 
                    onPress={() => updateItemQuantity(m.id, qty(m.id) + 1)}
                  >
                    <Ionicons name="add" size={16} color="#16a34a" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.removeButton} 
                    onPress={() => removeItem(m.id)}
                  >
                    <Ionicons name="trash" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}
        
        {/* Spacer để tránh che khuất footer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Footer cố định */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <ThemedText style={styles.totalLabel}>Tổng cộng:</ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.totalAmount}>
            {totalAmount.toLocaleString('vi-VN')}đ
          </ThemedText>
        </View>
        
        <TouchableOpacity 
          style={[styles.nextButton, state.items.length === 0 && styles.nextButtonDisabled]} 
          onPress={handleNext}
          disabled={state.items.length === 0}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <ThemedText style={styles.nextButtonText}>
            {state.items.length === 0 ? 'Chọn món để tiếp tục' : 'Xác nhận đơn hàng'}
          </ThemedText>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#374151',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  backButtonText: {
    marginLeft: 4,
    color: '#16a34a',
    fontWeight: '600',
  },
  menuContainer: {
    flex: 1,
  },
  menuContent: {
    padding: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginLeft: 8,
    color: '#16a34a',
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    marginLeft: 8,
    color: '#ef4444',
    fontSize: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    marginRight: 12,
  },
  menuImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: {
    flex: 1,
    marginRight: 12,
  },
  menuName: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  menuPrice: {
    fontSize: 18,
    color: '#16a34a',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  menuNote: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  actions: {
    alignItems: 'flex-end',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  quantityDisplay: {
    minWidth: 40,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  removeButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 100, // Khoảng cách để tránh che khuất footer
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: '#374151',
  },
  totalAmount: {
    fontSize: 20,
    color: '#16a34a',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  nextButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});