import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { useAuth } from './auth-context';
import { useQueryClient } from '@tanstack/react-query';

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: any) => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    if (!user?.id) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setSocket(ws);
        
        // Send authentication message
        ws.send(JSON.stringify({
          type: 'auth',
          userId: user.id
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          // Handle different message types and invalidate relevant queries for real-time updates
          switch (data.type) {
            case 'new_message':
              // Invalidate message queries for real-time chat updates
              queryClient.invalidateQueries({ 
                queryKey: [`/api/messages/order/${data.message.orderId}`] 
              });
              break;
              
            case 'order_update':
              // Invalidate order queries for real-time status updates
              queryClient.invalidateQueries({ 
                queryKey: [`/api/orders/shop/${data.order.shopId}`] 
              });
              queryClient.invalidateQueries({ 
                queryKey: [`/api/orders/customer/${data.order.customerId}`] 
              });
              queryClient.invalidateQueries({ 
                queryKey: [`/api/orders/${data.order.id}`] 
              });
              break;
              
            case 'new_order':
              // Invalidate shop order queries for new orders
              queryClient.invalidateQueries({ 
                queryKey: [`/api/orders/shop/${data.order.shopId}`] 
              });
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setSocket(null);
        
        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  };

  const reconnect = () => {
    if (socket) {
      socket.close();
    }
    connect();
  };

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [user?.id]);

  const sendMessage = (message: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    }
  };

  return (
    <WebSocketContext.Provider 
      value={{ 
        socket, 
        isConnected, 
        sendMessage,
        reconnect
      }}
    >
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