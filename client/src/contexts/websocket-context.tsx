import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { Message, Order } from '@/types';

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: any) => void;
  onNewMessage: (callback: (message: Message) => void) => void;
  onOrderUpdate: (callback: (order: Order) => void) => void;
  onNewOrder: (callback: (order: Order) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  const messageCallbacks = useState<((message: Message) => void)[]>([]);
  const orderUpdateCallbacks = useState<((order: Order) => void)[]>([]);
  const newOrderCallbacks = useState<((order: Order) => void)[]>([]);

  useEffect(() => {
    if (user) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Authenticate with user ID
        ws.send(JSON.stringify({
          type: 'authenticate',
          userId: user.id
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'new_message':
              messageCallbacks[0].forEach(callback => callback(data.message));
              break;
            case 'order_update':
              orderUpdateCallbacks[0].forEach(callback => callback(data.order));
              break;
            case 'new_order':
              newOrderCallbacks[0].forEach(callback => callback(data.order));
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      setSocket(ws);

      return () => {
        ws.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [user]);

  const sendMessage = (message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  };

  const onNewMessage = (callback: (message: Message) => void) => {
    messageCallbacks[0].push(callback);
  };

  const onOrderUpdate = (callback: (order: Order) => void) => {
    orderUpdateCallbacks[0].push(callback);
  };

  const onNewOrder = (callback: (order: Order) => void) => {
    newOrderCallbacks[0].push(callback);
  };

  return (
    <WebSocketContext.Provider value={{
      socket,
      isConnected,
      sendMessage,
      onNewMessage,
      onOrderUpdate,
      onNewOrder,
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
