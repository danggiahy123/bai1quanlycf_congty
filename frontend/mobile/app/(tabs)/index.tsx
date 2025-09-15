import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function LoginHomeScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu');
      return;
    }
    try {
      setIsSubmitting(true);
      await new Promise((res) => setTimeout(res, 800));
      Alert.alert('Đăng nhập thành công', `Xin chào, ${email}`);
    } catch (e) {
      Alert.alert('Đăng nhập thất bại', 'Vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Đăng nhập' }} />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={{ width: '100%' }}
      >
        <View style={styles.header}>
          <ThemedText type="title">Chào mừng trở lại</ThemedText>
          <ThemedText>Đăng nhập để tiếp tục</ThemedText>
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold">Email</ThemedText>
          <TextInput
            value={email}
            onChangeText={setEmail}
            inputMode="email"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="you@example.com"
            placeholderTextColor="#999"
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold">Mật khẩu</ThemedText>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#999"
            style={styles.input}
          />
        </View>

        <TouchableOpacity onPress={handleSubmit} style={[styles.button, isSubmitting && { opacity: 0.7 }]} disabled={isSubmitting}>
          <ThemedText type="defaultSemiBold" style={styles.buttonText}>{isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</ThemedText>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
    justifyContent: 'center',
  },
  header: {
    gap: 4,
    marginBottom: 8,
    alignItems: 'center',
  },
  fieldGroup: {
    gap: 6,
    marginBottom: 10,
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
});
