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
                notification.className = 'fixed top-4 right-4 bg-[#FFBF00] text-black p-4 rounded-xl shadow-lg z-50';
                notification.innerHTML = `
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                    <div>
                      <div class="font-semibold">New Message</div>
                      <div class="text-sm opacity-80">From ${data.message.senderName}</div>
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
              
            case 'unread_count_update':
            case 'new_message':
              // PERFORMANCE FIX: Always invalidate unread count when new message arrives
              queryClient.invalidateQueries({ 
                queryKey: [`/api/messages/unread-count`] 
              });
              console.log('🔔 Unread count invalidated due to message update');
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
              // ✅ FIXED: Also invalidate customer dashboard's specific query
              queryClient.invalidateQueries({ 
                queryKey: [`/api/orders/customer`] 
              });
              queryClient.invalidateQueries({ 
                queryKey: [`/api/orders`] 
              });
              
              // 🔔 ENHANCED: Visual notification with context-aware messaging
              const statusNotification = document.createElement('div');
              statusNotification.className = 'fixed top-4 right-4 bg-[#FFBF00] text-black p-4 rounded-xl shadow-lg z-50';
              
              // Different message for file addition vs status update
              const notificationContent = data.filesAdded ? 
                `<div class="font-semibold">Files Uploaded!</div>
                 <div class="text-sm opacity-80">${data.fileCount} file${data.fileCount > 1 ? 's' : ''} added to Queue #${data.order.orderNumber || data.order.id}</div>` :
                `<div class="font-semibold">Order Status Updated</div>
                 <div class="text-sm opacity-80">Queue #${data.order.orderNumber || data.order.id} is now ${data.order.status}</div>`;
              
              statusNotification.innerHTML = `
                <div class="flex items-center gap-3">
                  <div class="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                  <div>
                    ${notificationContent}
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
              
            case 'order:created':
              // Handle initial order creation (files being uploaded)
              console.log('📦 New order created, files uploading...');
              // Invalidate queries to show the new order with loading state
              queryClient.invalidateQueries({ 
                queryKey: [`/api/orders/shop/${data.shopId}`] 
              });
              queryClient.invalidateQueries({ 
                queryKey: [`/api/orders`] 
              });
              
              // Show notification for shop owners about incoming order
              if (user?.role === 'shop_owner') {
                const pendingNotification = document.createElement('div');
                pendingNotification.className = 'fixed top-4 right-4 bg-[#FFBF00] text-black p-4 rounded-xl shadow-lg z-50';
                pendingNotification.innerHTML = `
                  <div class="flex items-center gap-3">
                    <span class="inline-block w-2 h-2 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    <div>
                      <div class="font-semibold">New Order Incoming!</div>
                      <div class="text-sm opacity-80">Files are being uploaded by ${data.customerName}...</div>
                    </div>
                  </div>
                `;
                document.body.appendChild(pendingNotification);
                
                // Auto-remove after 5 seconds
                setTimeout(() => {
                  if (pendingNotification.parentNode) {
                    pendingNotification.parentNode.removeChild(pendingNotification);
                  }
                }, 5000);
              }
              break;
              
            // 🚀 INSTANT ORDER DELETION SYNC: Handle order deletions for real-time updates
            case 'order:deleted':
              console.log('⚡ Real-time order deletion received:', data.orderId);
              
              // INSTANT query invalidation for immediate UI updates
              if (data.shopId) {
                queryClient.invalidateQueries({ 
                  queryKey: [`/api/orders/shop/${data.shopId}`] 
                });
              }
              
              if (data.customerId) {
                queryClient.invalidateQueries({ 
                  queryKey: [`/api/orders/customer/${data.customerId}`] 
                });
                queryClient.invalidateQueries({ 
                  queryKey: [`/api/orders/customer`] 
                });
              }
              
              // Invalidate general order queries
              queryClient.invalidateQueries({ 
                queryKey: [`/api/orders`] 
              });
              
              // Also refresh unread message count and analytics
              queryClient.invalidateQueries({ 
                queryKey: ['/api/messages/unread-count'] 
              });
              
              // Refresh shop analytics if it's a shop-related update
              if (data.shopId) {
                queryClient.invalidateQueries({ 
                  queryKey: [`/api/analytics/business/${data.shopId}`] 
                });
              }
              
              // Show toast notification for order deletion (only to other users)
              if (data.customerId !== user?.id) {
                const deleteNotification = document.createElement('div');
                deleteNotification.className = 'fixed top-4 right-4 bg-orange-500 text-white p-4 rounded-xl shadow-lg z-50';
                deleteNotification.innerHTML = `
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 bg-white rounded-full"></div>
                    <div>
                      <div class="font-semibold">Order Deleted</div>
                      <div class="text-sm opacity-90">Order #${data.orderId} has been removed</div>
                    </div>
                  </div>
                `;
                document.body.appendChild(deleteNotification);
                
                // Auto-remove after 4 seconds
                setTimeout(() => {
                  if (deleteNotification.parentNode) {
                    deleteNotification.parentNode.removeChild(deleteNotification);
                  }
                }, 4000);
              }
              break;
              
            case 'new_order':
              // Invalidate shop order queries for new orders
              queryClient.invalidateQueries({ 
                queryKey: [`/api/orders/shop/${data.order.shopId}`] 
              });
              
              // 🔔 ENHANCED: Visual notification with improved yellow design
              if (user?.role === 'shop_owner') {
                const orderNotification = document.createElement('div');
                orderNotification.className = 'fixed top-4 right-4 bg-[#FFBF00] text-black p-4 rounded-xl shadow-lg z-50';
                orderNotification.innerHTML = `
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                    <div>
                      <div class="font-semibold">New Order Received!</div>
                      <div class="text-sm opacity-80">Queue #${data.order.orderNumber || data.order.id} from ${data.order.customerName}</div>
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
              
            case 'order_deleted':
              // ✅ FIXED: Handle order deletion events for real-time updates
              console.log(`🗑️ Order ${data.orderId} deleted - updating UI`);
              
              // Invalidate all order queries to remove deleted order from lists
              queryClient.invalidateQueries({ 
                queryKey: [`/api/orders`] 
              });
              queryClient.invalidateQueries({ 
                queryKey: [`/api/orders/customer`] 
              });
              queryClient.invalidateQueries({ 
                queryKey: [`/api/orders/shop`] 
              });
              if (data.customerId) {
                queryClient.invalidateQueries({ 
                  queryKey: [`/api/orders/customer/${data.customerId}`] 
                });
              }
              if (data.shopId) {
                queryClient.invalidateQueries({ 
                  queryKey: [`/api/orders/shop/${data.shopId}`] 
                });
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