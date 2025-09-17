import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { tryApiCall } from '@/constants/api';

export default function LoginScreen() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<'customer' | 'employee'>('customer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
  });

  const handleLogin = async () => {
    if (!form.username || !form.password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const endpoint = accountType === 'customer' 
        ? '/api/customers/login' 
        : '/api/employees/login';
      
      const result = await tryApiCall(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
        }),
      });

      if (result.success) {
        const data = result.data;
        // Lưu thông tin đăng nhập
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userType', accountType);
        await AsyncStorage.setItem('userInfo', JSON.stringify(data.customer || data.employee));
        
        Alert.alert('Thành công', 'Đăng nhập thành công!', [
          { text: 'OK', onPress: () => router.replace('/') }
        ]);
      } else {
        Alert.alert('Lỗi', result.error || 'Đăng nhập thất bại');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Lỗi', 'Không thể kết nối đến server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = () => {
    router.push('/register');
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Đăng nhập' }} />
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons 
                  name="cafe" 
                  size={40} 
                  color="#8B4513" 
                />
              </View>
            </View>
            <ThemedText type="title" style={styles.welcomeTitle}>
              Chào mừng trở lại
            </ThemedText>
            <ThemedText style={styles.welcomeSubtitle}>
              Đăng nhập để tiếp tục sử dụng dịch vụ
            </ThemedText>
          </View>

          {/* Account Type Selector */}
          <View style={styles.accountTypeSection}>
            <View style={styles.accountTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.accountTypeButton,
                  accountType === 'customer' && styles.accountTypeButtonActive
                ]}
                onPress={() => setAccountType('customer')}
              >
                <Ionicons 
                  name="person" 
                  size={20} 
                  color={accountType === 'customer' ? '#fff' : '#16a34a'} 
                />
                <ThemedText style={[
                  styles.accountTypeText,
                  accountType === 'customer' && styles.accountTypeTextActive
                ]}>
                  Khách hàng
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.accountTypeButton,
                  accountType === 'employee' && styles.accountTypeButtonActive
                ]}
                onPress={() => setAccountType('employee')}
              >
                <Ionicons 
                  name="person-circle" 
                  size={20} 
                  color={accountType === 'employee' ? '#fff' : '#dc2626'} 
                />
                <ThemedText style={[
                  styles.accountTypeText,
                  accountType === 'employee' && styles.accountTypeTextActive
                ]}>
                  Nhân viên
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Form */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color="#6b7280" 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Tên đăng nhập"
                  placeholderTextColor="#9ca3af"
                  value={form.username}
                  onChangeText={(text) => setForm({ ...form, username: text })}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color="#6b7280" 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu"
                  placeholderTextColor="#9ca3af"
                  value={form.password}
                  onChangeText={(text) => setForm({ ...form, password: text })}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                { backgroundColor: accountType === 'customer' ? '#16a34a' : '#dc2626' },
                isSubmitting && styles.loginButtonDisabled
              ]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              <ThemedText style={styles.loginButtonText}>
                {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </ThemedText>
              <Ionicons 
                name="arrow-forward" 
                size={20} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>

          {/* Footer */}
          {accountType === 'customer' && (
            <View style={styles.footerSection}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <ThemedText style={styles.dividerText}>hoặc</ThemedText>
                <View style={styles.dividerLine} />
              </View>
              
              <TouchableOpacity 
                style={styles.registerButton}
                onPress={handleRegister}
              >
                <Ionicons name="person-add" size={20} color="#16a34a" />
                <ThemedText style={styles.registerButtonText}>
                  Tạo tài khoản mới
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Account Type Section
  accountTypeSection: {
    marginBottom: 32,
  },
  accountTypeButtons: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  accountTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  accountTypeButtonActive: {
    backgroundColor: '#16a34a',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  accountTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
  },
  accountTypeTextActive: {
    color: '#fff',
  },
  // Form Section
  formSection: {
    marginBottom: 32,
  },
  inputGroup: {
    gap: 16,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 16,
    color: '#1f2937',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Footer Section
  footerSection: {
    alignItems: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9ca3af',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#16a34a',
    backgroundColor: '#fff',
    gap: 12,
    width: '100%',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
  },
});

