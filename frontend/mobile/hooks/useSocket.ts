import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FALLBACK_URLS } from '../constants/api';

const SOCKET_URL = FALLBACK_URLS[0]; // Sử dụng localhost:5000

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const initSocket = async () => {
      try {
        // Đợi một chút để backend khởi động hoàn toàn
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const userInfo = await AsyncStorage.getItem('userInfo');
        if (!userInfo) return;

        const user = JSON.parse(userInfo);
        
        // Thử kết nối với từng URL trong FALLBACK_URLS
        for (const url of FALLBACK_URLS) {
          try {
            console.log(`🔄 Thử kết nối socket đến: ${url}`);
            
            // Tạo kết nối Socket.IO với cấu hình tối ưu
            socketRef.current = io(url, {
              transports: ['polling'],
              timeout: 30000,
              reconnection: false, // Tắt auto-reconnection để thử URL khác
              forceNew: true,
              upgrade: false,
              rememberUpgrade: false
            });

            // Đợi kết nối thành công
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
              }, 10000);

              socketRef.current?.on('connect', () => {
                clearTimeout(timeout);
                console.log(`✅ Socket connected to: ${url}`);
                resolve(true);
              });

              socketRef.current?.on('connect_error', (error) => {
                clearTimeout(timeout);
                console.log(`❌ Socket connection failed to: ${url}`, error.message);
                reject(error);
              });
            });

            // Nếu kết nối thành công, break khỏi vòng lặp
            break;
          } catch (error) {
            console.log(`❌ Không thể kết nối đến ${url}:`, error.message);
            if (socketRef.current) {
              socketRef.current.disconnect();
              socketRef.current = null;
            }
            // Tiếp tục thử URL tiếp theo
          }
        }

        if (socketRef.current) {
          socketRef.current.on('connect', () => {
            console.log('🔌 Socket connected:', socketRef.current?.id);
            
            // Join room cho khách hàng
            socketRef.current?.emit('join_room', {
              userType: 'customer',
              userId: user.id || user._id
            });
          });

          socketRef.current.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
          });

          socketRef.current.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
          });
        }

      } catch (error) {
        console.error('❌ Error initializing socket:', error);
      }
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return socketRef.current;
};
