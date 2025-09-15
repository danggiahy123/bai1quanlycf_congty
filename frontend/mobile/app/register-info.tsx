import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function RegisterInfoScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    if (!fullName || !phone) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ tên và số điện thoại');
      return;
    }
    try {
      setIsSubmitting(true);
      await new Promise((res) => setTimeout(res, 800));
      Alert.alert('Hoàn tất', 'Đã lưu thông tin đăng ký');
      router.replace('/home');
    } catch (e) {
      Alert.alert('Thất bại', 'Vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Thông tin đăng ký' }} />
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ width: '100%' }}>
        <View style={styles.header}>
          <ThemedText type="title">Thông tin đăng ký</ThemedText>
          <ThemedText>Vui lòng điền các thông tin bên dưới</ThemedText>
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold">Họ và tên</ThemedText>
          <TextInput value={fullName} onChangeText={setFullName} placeholder="Nguyễn Văn A" placeholderTextColor="#999" style={styles.input} />
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold">Số điện thoại</ThemedText>
          <TextInput value={phone} onChangeText={setPhone} inputMode="tel" placeholder="0901234567" placeholderTextColor="#999" style={styles.input} />
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold">Địa chỉ</ThemedText>
          <TextInput value={address} onChangeText={setAddress} placeholder="Địa chỉ" placeholderTextColor="#999" style={styles.input} />
        </View>

        <TouchableOpacity onPress={handleComplete} style={[styles.button, isSubmitting && { opacity: 0.7 }]} disabled={isSubmitting}>
          <ThemedText type="defaultSemiBold" style={styles.buttonText}>{isSubmitting ? 'Đang lưu...' : 'Hoàn tất'}</ThemedText>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16, justifyContent: 'center' },
  header: { gap: 4, marginBottom: 8, alignItems: 'center' },
  fieldGroup: { gap: 6, marginBottom: 10 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#aaa', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' },
  button: { marginTop: 8, backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff' },
});


