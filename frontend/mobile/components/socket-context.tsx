import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_API_URL } from '@/constants/api';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (userType: 'customer' | 'employee' | 'admin', userId: string) => void;
  leaveRoom: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        // Load user info from storage
        const storedUserInfo = await AsyncStorage.getItem('userInfo');
        const storedUserType = await AsyncStorage.getItem('userType');
        
        if (storedUserInfo && storedUserType) {
          const user = JSON.parse(storedUserInfo);
          setUserInfo({ ...user, userType: storedUserType });
          
          // Initialize socket connection
          const newSocket = io(DEFAULT_API_URL, {
            transports: ['websocket', 'polling'],
            timeout: 20000,
            autoConnect: true,
          });

          newSocket.on('connect', () => {
            console.log('🔌 Socket connected:', newSocket.id);
            setIsConnected(true);
            
            // Auto-join room based on user type
            newSocket.emit('join_room', {
              userType: storedUserType,
              userId: user._id || user.id
            });
          });

          newSocket.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
            setIsConnected(false);
          });

          newSocket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
            setIsConnected(false);
          });

          setSocket(newSocket);
        }
      } catch (error) {
        console.error('❌ Error initializing socket:', error);
      }
    };

    initializeSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const joinRoom = (userType: 'customer' | 'employee' | 'admin', userId: string) => {
    if (socket) {
      socket.emit('join_room', { userType, userId });
      console.log(`👤 Joined room: ${userType}_${userId}`);
    }
  };

  const leaveRoom = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
