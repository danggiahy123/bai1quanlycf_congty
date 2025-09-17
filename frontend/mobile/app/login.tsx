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
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.content}>
          <Stack.Screen options={{ title: 'Đăng nhập' }} />
          
          <View style={styles.header}>
            <Ionicons 
              name="restaurant" 
              size={60} 
              color={accountType === 'customer' ? '#16a34a' : '#dc2626'} 
            />
            <ThemedText type="title" style={styles.welcomeText}>
              Chào mừng trở lại
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Đăng nhập để tiếp tục
            </ThemedText>
          </View>

          {/* Account Type Selector */}
          <View style={styles.accountTypeContainer}>
            <ThemedText style={styles.accountTypeLabel}>Loại tài khoản</ThemedText>
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
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons 
                name="person" 
                size={20} 
                color={accountType === 'customer' ? '#16a34a' : '#dc2626'} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={styles.input}
                placeholder="Tên đăng nhập"
                value={form.username}
                onChangeText={(text) => setForm({ ...form, username: text })}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons 
                name="lock-closed" 
                size={20} 
                color={accountType === 'customer' ? '#16a34a' : '#dc2626'} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                value={form.password}
                onChangeText={(text) => setForm({ ...form, password: text })}
                secureTextEntry
              />
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
            </TouchableOpacity>
          </View>

          {/* Footer - Show different options based on account type */}
          {accountType === 'customer' && (
            <View style={styles.footer}>
              <TouchableOpacity onPress={handleRegister}>
                <ThemedText style={styles.registerText}>
                  Đăng ký
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  accountTypeContainer: {
    marginBottom: 24,
  },
  accountTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  accountTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  accountTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    gap: 8,
  },
  accountTypeButtonActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  accountTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  accountTypeTextActive: {
    color: '#fff',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#3b82f6',
    textDecorationLine: 'underline',
  },
});
