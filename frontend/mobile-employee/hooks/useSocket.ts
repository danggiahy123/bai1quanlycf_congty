import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = 'http://192.168.5.162:5000';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const initSocket = async () => {
      try {
        const userInfo = await AsyncStorage.getItem('userInfo');
        if (!userInfo) return;

        const user = JSON.parse(userInfo);
        
        // Tạo kết nối Socket.IO
        socketRef.current = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
        });

        socketRef.current.on('connect', () => {
          console.log('🔌 Socket connected:', socketRef.current?.id);
          
          // Join room cho nhân viên
          socketRef.current?.emit('join_room', {
            userType: 'employee',
            userId: user.id || user._id
          });
        });

        socketRef.current.on('disconnect', () => {
          console.log('🔌 Socket disconnected');
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error);
        });

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
