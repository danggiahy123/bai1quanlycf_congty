import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { DEFAULT_API_URL } from '@/constants/api';

const API_URL = DEFAULT_API_URL;

export default function RegisterScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    phone: '',
    address: ''
  });

  const handleSubmit = async () => {
    // Kiểm tra thông tin bắt buộc
    if (!form.username || !form.password || !form.fullName || !form.email) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Kiểm tra mật khẩu
    if (form.password !== form.confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    if (form.password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch(`${API_URL}/api/customers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password.trim(),
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Thành công', 'Đăng ký thành công! Vui lòng đăng nhập.');
        router.replace('/');
      } else {
        Alert.alert('Lỗi đăng ký', data.message || 'Có lỗi xảy ra');
      }
    } catch (e) {
      console.error('Register error:', e);
      Alert.alert('Lỗi kết nối', 'Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Đăng ký' }} />
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
                <Ionicons name="person-add" size={40} color="#16a34a" />
              </View>
            </View>
            <ThemedText type="title" style={styles.welcomeTitle}>
              Tạo tài khoản
            </ThemedText>
            <ThemedText style={styles.welcomeSubtitle}>
              Đăng ký để sử dụng dịch vụ quán cà phê
            </ThemedText>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Username */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Tên đăng nhập *</ThemedText>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  value={form.username}
                  onChangeText={(value) => handleInputChange('username', value)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Nhập tên đăng nhập"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Mật khẩu *</ThemedText>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  value={form.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry
                  placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Xác nhận mật khẩu *</ThemedText>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  value={form.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Họ và tên *</ThemedText>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  value={form.fullName}
                  onChangeText={(value) => handleInputChange('fullName', value)}
                  placeholder="Nhập họ và tên"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Email *</ThemedText>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  value={form.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Nhập email"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Số điện thoại</ThemedText>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  value={form.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  inputMode="tel"
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Địa chỉ</ThemedText>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  value={form.address}
                  onChangeText={(value) => handleInputChange('address', value)}
                  placeholder="Nhập địa chỉ"
                  placeholderTextColor="#9ca3af"
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              onPress={handleSubmit} 
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
              disabled={isSubmitting}
            >
              <ThemedText style={styles.submitButtonText}>
                {isSubmitting ? 'Đang đăng ký...' : 'Tạo tài khoản'}
              </ThemedText>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footerSection}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <ThemedText style={styles.dividerText}>hoặc</ThemedText>
                <View style={styles.dividerLine} />
              </View>
              
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={() => router.replace('/')}
              >
                <Ionicons name="log-in" size={20} color="#16a34a" />
                <ThemedText style={styles.loginButtonText}>
                  Đăng nhập
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
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
    marginBottom: 32,
    marginTop: 20,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
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
  // Form Section
  formSection: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
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
  textArea: {
    paddingTop: 18,
    paddingBottom: 18,
    minHeight: 60,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    marginTop: 8,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
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
  loginButton: {
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
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
  },
});