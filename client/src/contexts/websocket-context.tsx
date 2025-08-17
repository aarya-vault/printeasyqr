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
    if (!user?.id) {
      console.log('⚠️ WebSocket: Skipping connection - no authenticated user');
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setSocket(ws);
        
        // Send authentication message
        ws.send(JSON.stringify({
          type: 'authenticate',
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
              
              // 🔔 ENHANCED: Visual and audio notification for new messages
              if (data.message.senderId !== user?.id) {
                // Only show notification if message is from someone else
                const notification = document.createElement('div');
                notification.className = 'fixed top-4 right-4 bg-[#FFBF00] text-black p-4 rounded-lg shadow-lg z-50 border border-black';
                notification.innerHTML = `
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                    <div>
                      <div class="font-semibold">New Message</div>
                      <div class="text-sm">From ${data.message.senderName}</div>
                    </div>
                  </div>
                `;
                document.body.appendChild(notification);
                
                // Auto-remove notification after 5 seconds
                setTimeout(() => {
                  if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                  }
                }, 5000);
                
                // Play notification sound (simple beep)
                try {
                  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const oscillator = audioContext.createOscillator();
                  const gainNode = audioContext.createGain();
                  oscillator.connect(gainNode);
                  gainNode.connect(audioContext.destination);
                  oscillator.frequency.value = 800;
                  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                  oscillator.start();
                  oscillator.stop(audioContext.currentTime + 0.2);
                } catch (e) {
                  console.log('Audio notification not available');
                }
              }
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
              
              // 🔔 ENHANCED: Visual notification for order status updates
              const statusNotification = document.createElement('div');
              statusNotification.className = 'fixed top-4 right-4 bg-black text-[#FFBF00] p-4 rounded-lg shadow-lg z-50 border border-[#FFBF00]';
              statusNotification.innerHTML = `
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-[#FFBF00] rounded-full animate-pulse"></div>
                  <div>
                    <div class="font-semibold">Order Status Updated</div>
                    <div class="text-sm">Queue #${data.order.orderNumber || data.order.id} is now ${data.order.status}</div>
                  </div>
                </div>
              `;
              document.body.appendChild(statusNotification);
              
              // Auto-remove notification after 4 seconds
              setTimeout(() => {
                if (statusNotification.parentNode) {
                  statusNotification.parentNode.removeChild(statusNotification);
                }
              }, 4000);
              break;
              
            case 'new_order':
              // Invalidate shop order queries for new orders
              queryClient.invalidateQueries({ 
                queryKey: [`/api/orders/shop/${data.order.shopId}`] 
              });
              
              // 🔔 ENHANCED: Visual notification for new orders (for shop owners)
              if (user?.role === 'shop_owner') {
                const orderNotification = document.createElement('div');
                orderNotification.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 border border-green-600';
                orderNotification.innerHTML = `
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <div>
                      <div class="font-semibold">New Order Received!</div>
                      <div class="text-sm">Queue #${data.order.orderNumber || data.order.id} from ${data.order.customerName}</div>
                    </div>
                  </div>
                `;
                document.body.appendChild(orderNotification);
                
                // Auto-remove notification after 6 seconds
                setTimeout(() => {
                  if (orderNotification.parentNode) {
                    orderNotification.parentNode.removeChild(orderNotification);
                  }
                }, 6000);
              }
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
        
        // Only reconnect if user is still authenticated
        if (user?.id) {
          // Auto-reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            connect();
          }, 3000);
        } else {
          console.log('⚠️ WebSocket: Not reconnecting - user not authenticated');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket connection error:', error);
        // Prevent excessive reconnection attempts for unauthenticated users
        if (!user?.id) {
          console.log('⚠️ WebSocket: Connection failed - user not authenticated');
          return;
        }
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