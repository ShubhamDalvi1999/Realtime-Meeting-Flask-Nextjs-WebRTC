import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, message: string) => void;
  sendSignal: (userId: string, signal: any) => void;
  sendWhiteboardUpdate: (roomId: string, data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  joinRoom: () => {},
  leaveRoom: () => {},
  sendMessage: () => {},
  sendSignal: () => {},
  sendWhiteboardUpdate: () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000', {
      auth: { token },
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('error', (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  const joinRoom = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit('join-room', { roomId });
    }
  };

  const leaveRoom = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit('leave-room', { roomId });
    }
  };

  const sendMessage = (roomId: string, message: string) => {
    if (socket && isConnected) {
      socket.emit('send-message', { roomId, message });
    }
  };

  const sendSignal = (userId: string, signal: any) => {
    if (socket && isConnected) {
      socket.emit('signal', { userId, signal });
    }
  };

  const sendWhiteboardUpdate = (roomId: string, data: any) => {
    if (socket && isConnected) {
      socket.emit('whiteboard-update', { roomId, data });
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        isConnected,
        joinRoom,
        leaveRoom,
        sendMessage,
        sendSignal,
        sendWhiteboardUpdate,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}; 