import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.5.17:5000';

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
      <ScrollView showsVerticalScrollIndicator={false}>
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          style={{ width: '100%' }}
        >
          <View style={styles.header}>
            <ThemedText type="title">Tạo tài khoản</ThemedText>
            <ThemedText>Đăng ký để sử dụng dịch vụ</ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <ThemedText type="defaultSemiBold">Tên đăng nhập *</ThemedText>
              <TextInput
                value={form.username}
                onChangeText={(value) => handleInputChange('username', value)}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Nhập tên đăng nhập"
                placeholderTextColor="#999"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText type="defaultSemiBold">Mật khẩu *</ThemedText>
              <TextInput
                value={form.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry
                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                placeholderTextColor="#999"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText type="defaultSemiBold">Xác nhận mật khẩu *</ThemedText>
              <TextInput
                value={form.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor="#999"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText type="defaultSemiBold">Họ và tên *</ThemedText>
              <TextInput
                value={form.fullName}
                onChangeText={(value) => handleInputChange('fullName', value)}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#999"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText type="defaultSemiBold">Email *</ThemedText>
              <TextInput
                value={form.email}
                onChangeText={(value) => handleInputChange('email', value)}
                inputMode="email"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Nhập email"
                placeholderTextColor="#999"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText type="defaultSemiBold">Số điện thoại</ThemedText>
              <TextInput
                value={form.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                inputMode="tel"
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#999"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText type="defaultSemiBold">Địa chỉ</ThemedText>
              <TextInput
                value={form.address}
                onChangeText={(value) => handleInputChange('address', value)}
                placeholder="Nhập địa chỉ"
                placeholderTextColor="#999"
                style={styles.input}
                multiline
                numberOfLines={2}
              />
            </View>

            <TouchableOpacity 
              onPress={handleSubmit} 
              style={[styles.button, isSubmitting && { opacity: 0.7 }]} 
              disabled={isSubmitting}
            >
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
              </ThemedText>
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <ThemedText>Đã có tài khoản?</ThemedText>
              <TouchableOpacity onPress={() => router.replace('/')}>
                <ThemedText type="link"> Đăng nhập</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    gap: 4,
    marginBottom: 20,
    alignItems: 'center',
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#aaa',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
  },
  footerRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
});