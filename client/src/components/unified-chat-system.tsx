import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  X, Send, Phone, User, Package, MessageSquare, 
  Clock, CheckCheck, Circle, Paperclip, File, Download,
  Search, ArrowLeft, Store, MessageCircle, CheckCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { formatToIndiaTime, formatToIndiaDateTime, isToday } from '@/lib/time-utils';
import { apiRequest } from '@/lib/queryClient';
import { Message, Order } from '@shared/types';

interface UnifiedChatSystemProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: number;
  userRole?: 'customer' | 'shop_owner' | 'admin';
}

export default function UnifiedChatSystem({ 
  isOpen, 
  onClose, 
  initialOrderId, 
  userRole 
}: UnifiedChatSystemProps) {
  const { user, isLoading: authLoading, isSessionVerified } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(initialOrderId || null);
  const [messageInput, setMessageInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showOrderList, setShowOrderList] = useState(!initialOrderId);
  const [showCompletedOrders, setShowCompletedOrders] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine user role if not provided
  const effectiveUserRole = userRole || user?.role || 'customer';

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (mobile && selectedOrderId) {
        setShowOrderList(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [selectedOrderId]);

  // Set initial order if provided
  useEffect(() => {
    if (initialOrderId && isOpen) {
      setSelectedOrderId(initialOrderId);
      setShowOrderList(false);
    }
  }, [initialOrderId, isOpen]);

  // 🔥 FIXED: Proper authentication guard
  const { data: shopData } = useQuery<{ shop: { id: number } }>({
    queryKey: [`/api/shops/owner/${user?.id}`],
    enabled: Boolean(user?.id && user?.role === 'shop_owner' && isSessionVerified),
  });

  // Fetch orders based on user role
  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useQuery<Order[]>({
    queryKey: effectiveUserRole === 'shop_owner' 
      ? [`/api/orders/shop/${shopData?.shop?.id}`]
      : [`/api/orders/customer/${user?.id}`],
    enabled: Boolean(
      user?.id && 
      isSessionVerified && 
      (effectiveUserRole === 'customer' || 
       (effectiveUserRole === 'shop_owner' && shopData?.shop?.id))
    ),
    refetchInterval: 30000, // Reduced to 30 seconds - WebSocket handles real-time updates
    select: (data) => {
      console.log('🔍 CHAT - Raw orders data received:', data?.length, 'orders');
      console.log('🔍 CHAT - First few orders:', data?.slice(0, 3));
      
      // For chat system, show ALL orders regardless of status (except cancelled)
      // This ensures completed orders with chat history are visible
      const filteredOrders = data
        .filter(order => {
          // Show all orders - completed orders MUST be visible for chat history
          const shouldShow = true;
          console.log(`Order ${order.id} (${order.status}): ${shouldShow ? 'SHOWING' : 'HIDING'}`);
          return shouldShow;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
      console.log('🔍 CHAT - Final filtered orders:', filteredOrders?.length, 'orders visible');
      return filteredOrders;
    }
  });

  // Fetch messages for selected order with better error handling
  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery<Message[]>({
    queryKey: [`/api/messages/order/${selectedOrderId}`],
    enabled: !!selectedOrderId && !!user?.id,
    refetchInterval: 15000, // Reduced to 15 seconds - WebSocket handles real-time updates
    staleTime: 1000, // 1 second stale time for better performance
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors, but retry on other errors
      if (error?.message?.includes('401') || error?.message?.includes('Authentication')) {
        return false;
      }
      return failureCount < 2;
    },
    select: (data) => {
      return data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
  });

  // Get selected order details
  const selectedOrder = orders.find(order => order.id === selectedOrderId);

  // Send message mutation with file support
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, files }: { content: string; files?: FileList }) => {
      if (!selectedOrderId) throw new Error('No order selected');
      
      // Validate content or files presence
      const trimmedContent = content.trim();
      if (!trimmedContent && (!files || files.length === 0)) {
        throw new Error('Please enter a message or select files');
      }
      
      const formData = new FormData();
      formData.append('orderId', selectedOrderId.toString());
      formData.append('senderId', user?.id?.toString() || '');
      formData.append('senderName', user?.name || user?.phone || 'User');
      formData.append('senderRole', effectiveUserRole);
      formData.append('content', trimmedContent);
      formData.append('messageType', files && files.length > 0 ? 'file' : 'text');
      
      if (files && files.length > 0) {
        Array.from(files).forEach(file => {
          formData.append('files', file);
        });
      }

      // Get JWT token for authentication
      const authToken = localStorage.getItem('authToken');
      const headers: any = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        body: formData,
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setMessageInput('');
      setSelectedFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Force immediate refetch of messages
      queryClient.invalidateQueries({ queryKey: [`/api/messages/order/${selectedOrderId}`] });
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: [`/api/messages/order/${selectedOrderId}`] });
      }, 100);
      // Also invalidate orders to update unread counts
      queryClient.invalidateQueries({ 
        queryKey: effectiveUserRole === 'shop_owner' 
          ? [`/api/orders/shop/${shopData?.shop?.id}`]
          : [`/api/orders/customer/${user?.id}`]
      });
      toast({ title: 'Message sent successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to send message', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // File input handlers
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
      toast({ title: `${files.length} file(s) selected` });
    }
  };

  // Send message handler
  const handleSendMessage = () => {
    const trimmedContent = messageInput.trim();
    
    // Don't send if both content and files are empty
    if (!trimmedContent && (!selectedFiles || selectedFiles.length === 0)) {
      toast({ title: 'Please enter a message or select files', variant: 'destructive' });
      return;
    }
    
    sendMessageMutation.mutate({ 
      content: trimmedContent, 
      files: selectedFiles || undefined 
    });
  };

  // Keyboard handler
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Mark messages as read when viewing them
  const markMessagesAsRead = useMutation({
    mutationFn: async (orderId: number) => {
      console.log('📬 Sending mark-as-read request for order:', orderId, 'User ID:', user?.id, 'Role:', effectiveUserRole);
      
      const response = await apiRequest('/api/messages/mark-read', 'PATCH', { orderId });
      
      console.log('✅ Mark as read success:', response);
      return response;
    },
    onSuccess: () => {
      // Invalidate both orders and messages to update unread counts
      const ordersQueryKey = effectiveUserRole === 'shop_owner' 
        ? [`/api/orders/shop/${shopData?.shop?.id}`]
        : [`/api/orders/customer/${user?.id}`];
      
      console.log('🔄 Mark as read success - invalidating queries:', ordersQueryKey);
      
      queryClient.invalidateQueries({ queryKey: ordersQueryKey });
      queryClient.invalidateQueries({ queryKey: [`/api/messages/order/${selectedOrderId}`] });
      
      // Force refetch after a short delay
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ordersQueryKey });
      }, 100);
    }
  });

  // Auto scroll to bottom and mark messages as read
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Mark messages as read when viewing them (with debounce)
    if (selectedOrderId && messages.length > 0 && user?.id && !markMessagesAsRead.isPending) {
      console.log('📬 Setting timer to mark messages as read for order:', selectedOrderId);
      const timer = setTimeout(() => {
        console.log('📬 Marking messages as read for order:', selectedOrderId, 'User ID:', user?.id);
        markMessagesAsRead.mutate(selectedOrderId);
      }, 1000); // Wait 1 second before marking as read
      
      return () => clearTimeout(timer);
    }
  }, [messages, selectedOrderId, user?.id]);

  // Filter and separate orders
  const allFilteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      order.title.toLowerCase().includes(search) ||
      order.customerName?.toLowerCase().includes(search) ||
      order.shopName?.toLowerCase().includes(search) ||
      order.id.toString().includes(search)
    );
  });

  // Separate active and completed orders
  const activeOrders = allFilteredOrders.filter(order => order.status !== 'completed');
  const completedOrders = allFilteredOrders.filter(order => order.status === 'completed');

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-brand-yellow/20 text-rich-black';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-brand-yellow/40 text-rich-black';
      case 'ready': return 'bg-brand-yellow/60 text-rich-black';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Don't auto-close completed order chats - let users view history
  // React.useEffect(() => {
  //   if (selectedOrder?.status === 'completed') {
  //     setTimeout(() => {
  //       onClose();
  //     }, 3000);
  //   }
  // }, [selectedOrder?.status, onClose]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl h-[90vh] sm:h-[80vh] flex flex-col p-0 mx-2 sm:mx-auto max-h-screen">
        <DialogHeader className="p-4 border-b bg-brand-yellow">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-rich-black font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <span>Chat Center</span>
              {allFilteredOrders.length > 0 && (
                <span className="text-sm font-normal">
                  ({allFilteredOrders.length} active)
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Chat interface for communicating about orders
            </DialogDescription>
          </div>
          
          {/* Mobile back button and order info */}
          {isMobileView && selectedOrderId && (
            <div className="flex items-center justify-between mt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedOrderId(null);
                  setShowOrderList(true);
                }}
                className="text-rich-black hover:bg-black/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Chats
              </Button>
              
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Order List (Hidden on mobile when order selected) */}
          {(!isMobileView || showOrderList) && (
            <div className="w-full sm:w-80 border-r flex flex-col">
              {/* Search */}
              <div className="p-4 border-b bg-gray-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search orders and chats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-gray-200 focus:border-brand-yellow focus:ring-brand-yellow/20"
                  />
                </div>
              </div>

              {/* Orders List */}
              <ScrollArea className="flex-1 bg-gray-50">
                {ordersLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    </div>
                  </div>
                ) : allFilteredOrders.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-700 mb-1">
                      {searchQuery ? 'No matches found' : (ordersLoading ? 'Loading conversations...' : 'No orders found')}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {searchQuery ? 'Try a different search term' : (ordersLoading ? 'Orders will appear here once loaded' : 'Start by placing an order to begin chatting')}
                    </p>
                    {(messagesError || ordersError) && (
                      <div className="mt-4 p-3 bg-brand-yellow/20 rounded border text-sm">
                        <p className="text-rich-black">
                          {ordersError ? 'Failed to load orders. Please refresh the page.' : 'Authentication issue detected. Please refresh the page if conversations don\'t load.'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 p-3">
                    {/* Active Orders Section */}
                    {activeOrders.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2">Active Orders</h3>
                        {activeOrders.map((order) => (
                          <div
                            key={order.id}
                            onClick={() => {
                              setSelectedOrderId(order.id);
                              if (isMobileView) setShowOrderList(false);
                            }}
                            className={`p-4 rounded-xl cursor-pointer transition-all duration-200 relative border ${
                              selectedOrderId === order.id
                                ? 'bg-brand-yellow border-brand-yellow text-rich-black shadow-md'
                                : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0 pr-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-sm truncate">{order.title}</h4>
                                  <Badge className={`text-xs px-2 py-1 ${getStatusColor(order.status)}`}>
                                    {order.status === 'processing' ? 'processing' :
                                     order.status === 'ready' ? 'ready' : 
                                     order.status === 'new' ? 'pending' : order.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600 truncate mb-2">
                                  {effectiveUserRole === 'shop_owner' 
                                    ? `Customer: ${order.customerName || 'Customer'}` 
                                    : `Shop: ${order.shop?.name || order.shopName || 'Print Shop'}`}
                                </p>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    {order.publicId || `ORD-${order.id}`}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {formatToIndiaDateTime(order.createdAt)}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Unread message indicator - only show if > 0 */}
                              {(order.unreadCount || 0) > 0 && (
                                <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-medium shadow-sm">
                                  {(order.unreadCount || 0) > 99 ? '99+' : (order.unreadCount || 0)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Completed Orders Section - Collapsible */}
                    {completedOrders.length > 0 && (
                      <div className="space-y-2">
                        <button
                          onClick={() => setShowCompletedOrders(!showCompletedOrders)}
                          className="flex items-center justify-between w-full px-2 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Completed Orders ({completedOrders.length})
                          </h3>
                          {showCompletedOrders ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        
                        {showCompletedOrders && (
                          <div className="space-y-2 border-l-2 border-gray-200 pl-3 ml-2">
                            {completedOrders.map((order) => (
                              <div
                                key={order.id}
                                onClick={() => {
                                  setSelectedOrderId(order.id);
                                  if (isMobileView) setShowOrderList(false);
                                }}
                                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 relative border ${
                                  selectedOrderId === order.id
                                    ? 'bg-brand-yellow border-brand-yellow text-rich-black shadow-md'
                                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0 pr-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium text-sm truncate">{order.title}</h4>
                                      <Badge className="text-xs px-2 py-1 bg-green-100 text-green-800">
                                        completed ✓
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-600 truncate mb-2">
                                      {effectiveUserRole === 'shop_owner' 
                                        ? `Customer: ${order.customerName || 'Customer'}` 
                                        : `Shop: ${order.shop?.name || order.shopName || 'Print Shop'}`}
                                    </p>
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                                        {order.publicId || `ORD-${order.id}`}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        {formatToIndiaDateTime(order.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Unread message indicator for completed orders */}
                                  {(order.unreadCount || 0) > 0 && (
                                    <div className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-medium shadow-sm">
                                      {(order.unreadCount || 0) > 99 ? '99+' : (order.unreadCount || 0)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Empty state */}
                    {activeOrders.length === 0 && completedOrders.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p>No orders found. Start by placing an order!</p>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Right Panel: Chat (Full width on mobile when order selected) */}
          {(!isMobileView || selectedOrderId) && (
            <div className="flex-1 flex flex-col">
              {selectedOrderId ? (
                <>
                  {/* Chat Header */}
                  {selectedOrder && (
                    <div className="p-3 sm:p-4 border-b bg-gray-50 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-black text-sm sm:text-base truncate">{selectedOrder.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {effectiveUserRole === 'shop_owner' 
                            ? `Customer: ${selectedOrder.customerName || 'Customer'}` 
                            : `Shop: ${selectedOrder.shop?.name || selectedOrder.shopName || 'Print Shop'}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 ml-2">
                        <Badge className={`text-xs ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status}
                        </Badge>
                        {effectiveUserRole === 'shop_owner' && selectedOrder.customer?.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${selectedOrder.customer?.phone}`)}
                            className="hidden sm:flex"
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Call
                          </Button>
                        )}
                        {effectiveUserRole === 'shop_owner' && selectedOrder.customer?.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${selectedOrder.customer?.phone}`)}
                            className="sm:hidden px-2"
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {messagesLoading ? (
                      <div className="text-center text-gray-500">Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => {
                          const isOwnMessage = message.senderId === user?.id;
                          
                          // Parse files - ALWAYS preserve file data for completed orders
                          let hasValidFiles = false;
                          let parsedFiles: any[] = [];
                          if (message.files) {
                            try {
                              console.log('🔍 FIXED - Raw message.files:', message.files, 'Type:', typeof message.files);
                              
                              const fileList = typeof message.files === 'string' 
                                ? JSON.parse(message.files) 
                                : message.files;
                              
                              console.log('Parsed fileList:', fileList, 'IsArray:', Array.isArray(fileList));
                              
                              if (Array.isArray(fileList) && fileList.length > 0) {
                                // Handle both old format (string array) and new format (object array)
                                parsedFiles = fileList.map((file: any) => {
                                  if (typeof file === 'string') {
                                    // Old format - just filename
                                    return { filename: file, originalName: file };
                                  }
                                  // New format - full file object
                                  return file;
                                });
                                
                                hasValidFiles = parsedFiles.length > 0;
                                console.log('Final parsedFiles:', parsedFiles, 'hasValidFiles:', hasValidFiles);
                              }
                            } catch (e) {
                              console.error('Error parsing files:', e, 'Raw files data:', message.files);
                            }
                          }
                          
                          // CRITICAL: Always show messages with files, even for completed orders
                          const hasContent = message.content && message.content.trim() !== '';
                          
                          console.log(`🔍 Message ${message.id}: hasContent=${hasContent}, hasValidFiles=${hasValidFiles}, content="${message.content}", files:`, message.files);
                          
                          // Show message if it has content OR files (preserve all data for completed orders)
                          if (!hasContent && !hasValidFiles) {
                            return null;
                          }
                          
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[280px] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-lg ${
                                isOwnMessage
                                  ? 'bg-brand-yellow text-rich-black'
                                  : 'bg-gray-100 text-gray-900'
                              }`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium">
                                    {isOwnMessage ? 'You' : message.senderName}
                                  </span>
                                  <div className="flex items-center space-x-1">
                                    <span className="text-xs opacity-75">
                                      {formatToIndiaTime(message.createdAt)}
                                    </span>
                                    {isOwnMessage && (
                                      <CheckCheck className={`w-3 h-3 ${
                                        message.isRead ? 'text-blue-600' : 'text-gray-400'
                                      }`} />
                                    )}
                                  </div>
                                </div>
                                
                                {message.content && message.content.trim() !== '' && (
                                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                )}
                                
                                {/* File attachments - ALWAYS show for completed orders */}
                                {hasValidFiles && (
                                  <div className="mt-2 space-y-1">
                                    {parsedFiles.map((file, fileIndex) => {
                                      const displayName = file.originalName || file.filename;
                                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(displayName);
                                      return (
                                        <div key={fileIndex} className="flex items-center space-x-2 p-2 bg-white/10 rounded">
                                          {isImage ? (
                                            <img 
                                              src={file.path ? `/api/download/${file.path.startsWith('.private/') ? file.path : '.private/' + file.path}?originalName=${encodeURIComponent(displayName)}` : `/api/download/.private/uploads/${file.filename}?originalName=${encodeURIComponent(displayName)}`} 
                                              alt={displayName} 
                                              className="w-32 h-20 object-cover rounded cursor-pointer"
                                              onClick={() => window.open(file.path ? `/api/download/${file.path.startsWith('.private/') ? file.path : '.private/' + file.path}?originalName=${encodeURIComponent(displayName)}` : `/api/download/.private/uploads/${file.filename}?originalName=${encodeURIComponent(displayName)}`, '_blank')}
                                              onError={(e) => {
                                                console.error('🖼️ Image load failed:', displayName);
                                                e.currentTarget.style.display = 'none';
                                              }}
                                            />
                                          ) : (
                                            <>
                                              <File className="w-4 h-4" />
                                              <div className="flex-1 truncate">
                                                <span className="text-xs truncate" title={displayName}>
                                                  {displayName}
                                                </span>
                                                {file.size && (
                                                  <span className="text-xs text-gray-500 ml-1">
                                                    ({(file.size / 1024).toFixed(1)}KB)
                                                  </span>
                                                )}
                                              </div>
                                              <div className="flex gap-1">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => {
                                                    console.log('📥 Chat file download:', displayName);
                                                    const link = document.createElement('a');
                                                    link.href = file.path ? `/api/download/${file.path.startsWith('.private/') ? file.path : '.private/' + file.path}?originalName=${encodeURIComponent(displayName)}` : `/api/download/.private/uploads/${file.filename}?originalName=${encodeURIComponent(displayName)}`;
                                                    link.download = displayName;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                  }}
                                                >
                                                  <Download className="w-3 h-3" />
                                                </Button>
                                                {/* Delete button - only show for own messages and non-completed orders */}
                                                {isOwnMessage && selectedOrder?.status !== 'completed' && (
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={async () => {
                                                      if (confirm(`Delete ${displayName}?`)) {
                                                        try {
                                                          const response = await fetch(`/api/messages/${message.id}/files/${fileIndex}`, {
                                                            method: 'DELETE',
                                                            headers: {
                                                              'Authorization': `Bearer ${localStorage.getItem('token')}`
                                                            }
                                                          });
                                                          
                                                          if (response.ok) {
                                                            console.log('✅ File deleted successfully');
                                                            // Refresh messages to show updated file list
                                                            queryClient.invalidateQueries({ queryKey: [`/api/messages/order/${selectedOrderId}`] });
                                                          } else {
                                                            const error = await response.json();
                                                            console.error('❌ Delete failed:', error);
                                                            alert('Failed to delete file: ' + error.message);
                                                          }
                                                        } catch (error) {
                                                          console.error('❌ Delete error:', error);
                                                          alert('Failed to delete file');
                                                        }
                                                      }
                                                    }}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                  >
                                                    <X className="w-3 h-3" />
                                                  </Button>
                                                )}
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t p-3 sm:p-4">
                    {/* Selected Files Preview */}
                    {selectedFiles && selectedFiles.length > 0 && (
                      <div className="mb-3 p-2 bg-gray-50 rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {selectedFiles.length} file(s) selected
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedFiles(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          {Array.from(selectedFiles).map((file, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                              <File className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate flex-1">{file.name}</span>
                              <span className="text-xs flex-shrink-0">({(file.size / 1024).toFixed(1)}KB)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedOrder?.status === 'completed' ? (
                      // Show completion message for completed orders - but preserve all message data above
                      <div className="bg-gray-100 p-4 rounded-lg text-center border border-gray-200">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-brand-yellow" />
                          <h4 className="font-semibold text-gray-800">Order Completed</h4>
                        </div>
                        <p className="text-sm text-gray-600">
                          This order has been completed successfully. For your reference, only the chat history will remain accessible. All shared files and images have been deleted, and no new messages can be sent.
                        </p>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        {/* File attachment button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleFileSelect}
                          disabled={sendMessageMutation.isPending}
                          className="px-2 sm:px-3 flex-shrink-0"
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>

                        {/* Hidden file input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                          onChange={handleFileChange}
                          className="hidden"
                        />

                        <Input
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type your message..."
                          className="flex-1 min-w-0"
                          disabled={sendMessageMutation.isPending}
                        />
                        <Button 
                          onClick={handleSendMessage}
                          disabled={(!messageInput.trim() && (!selectedFiles || selectedFiles.length === 0)) || sendMessageMutation.isPending}
                          className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 flex-shrink-0 px-2 sm:px-3"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50/50">
                  <div className="text-center max-w-md px-6">
                    <MessageCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Choose an order from the list to start chatting with {effectiveUserRole === 'shop_owner' ? 'customers' : 'shop owners'} about your printing needs.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}