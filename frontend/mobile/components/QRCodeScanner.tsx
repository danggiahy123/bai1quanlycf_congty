import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

const { width, height } = Dimensions.get('window');

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  title?: string;
  description?: string;
}

export default function QRCodeScanner({
  onScan,
  onClose,
  title = 'Quét QR Code',
  description = 'Đưa camera vào QR code để quét'
}: QRCodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  const hasPermission = permission?.granted;

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    console.log('📱 QR Code scanned:', { type, data });
    
    // Haptic feedback
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      '✅ Quét QR Code thành công!',
      `Dữ liệu: ${data}`,
      [
        {
          text: 'Quét lại',
          onPress: () => setScanned(false),
        },
        {
          text: 'Xác nhận',
          onPress: () => {
            onScan(data);
            onClose();
          },
        },
      ]
    );
  };

  if (hasPermission === null) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.permissionContainer}>
          <ThemedText style={styles.permissionText}>
            Đang yêu cầu quyền truy cập camera...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (hasPermission === false) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off" size={64} color="#ef4444" />
          <ThemedText style={styles.permissionTitle}>
            Không có quyền truy cập camera
          </ThemedText>
          <ThemedText style={styles.permissionText}>
            Vui lòng cấp quyền truy cập camera để quét QR code
          </ThemedText>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <ThemedText style={styles.permissionButtonText}>
              Cấp quyền camera
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <ThemedText style={styles.closeButtonText}>
              Đóng
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitle}>{title}</ThemedText>
          <ThemedText style={styles.headerSubtitle}>{description}</ThemedText>
        </View>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => setFlashOn(!flashOn)}
        >
          <Ionicons 
            name={flashOn ? "flash" : "flash-off"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={styles.camera}
          enableTorch={flashOn}
          facing="back"
        />
        
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top overlay */}
          <View style={styles.overlayTop} />
          
          {/* Middle section with scanning area */}
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanningArea}>
              <View style={styles.corner} style={[styles.corner, styles.topLeft]} />
              <View style={styles.corner} style={[styles.corner, styles.topRight]} />
              <View style={styles.corner} style={[styles.corner, styles.bottomLeft]} />
              <View style={styles.corner} style={[styles.corner, styles.bottomRight]} />
            </View>
            <View style={styles.overlaySide} />
          </View>
          
          {/* Bottom overlay */}
          <View style={styles.overlayBottom}>
            <ThemedText style={styles.scanningText}>
              {scanned ? 'Đã quét thành công!' : 'Đưa QR code vào khung quét'}
            </ThemedText>
            {!scanned && (
              <ThemedText style={styles.scanningSubText}>
                Camera sẽ tự động nhận diện QR code
              </ThemedText>
            )}
          </View>
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => setScanned(false)}
          disabled={!scanned}
        >
          <Ionicons name="refresh" size={24} color={scanned ? "#fff" : "#666"} />
          <ThemedText style={[styles.actionButtonText, { color: scanned ? "#fff" : "#666" }]}>
            Quét lại
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => setFlashOn(!flashOn)}
        >
          <Ionicons name={flashOn ? "flash" : "flash-off"} size={24} color="#fff" />
          <ThemedText style={styles.actionButtonText}>
            {flashOn ? "Tắt đèn" : "Bật đèn"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 15,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  headerButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 2,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: 250,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanningArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#3b82f6',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scanningText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  scanningSubText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});
