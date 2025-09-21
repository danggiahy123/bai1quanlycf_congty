import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const API = import.meta.env.VITE_API_URL || 'http://192.168.1.161:5000';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (userType: 'customer' | 'employee' | 'admin', userId: string) => void;
  leaveRoom: () => void;
}

export const useSocket = (): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      const userData = JSON.parse(user);
      
      // Initialize socket connection
      const newSocket = io(API, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        autoConnect: true,
      });

      newSocket.on('connect', () => {
        console.log('🔌 Web Admin Socket connected:', newSocket.id);
        setIsConnected(true);
        
        // Auto-join room based on user type
        const userType = userData.role === 'admin' ? 'admin' : 'employee';
        newSocket.emit('join_room', {
          userType,
          userId: userData.id
        });
        console.log(`👤 Web Admin joined room: ${userType}_${userData.id}`);
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 Web Admin Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Web Admin Socket connection error:', error);
        setIsConnected(false);
      });

      setSocket(newSocket);
    } else {
      // Mock connection for demo
      console.log('🔌 Socket.IO mock connection - no user logged in');
      setIsConnected(true);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const joinRoom = useCallback((userType: 'customer' | 'employee' | 'admin', userId: string) => {
    if (socket) {
      socket.emit('join_room', { userType, userId });
      console.log(`👤 Web Admin joined room: ${userType}_${userId}`);
    }
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
  };
};
