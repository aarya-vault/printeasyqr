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
  Search, ArrowLeft, Store, MessageCircle, CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: number;
  orderId: number;
  senderId: number;
  senderName: string;
  content: string;
  files?: string | string[];
  createdAt: string;
  isRead: boolean;
}

interface Order {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  shopId: number;
  shopName?: string;
  type: string;
  title: string;
  status: string;
  createdAt: string;
  unreadMessages?: number;
}

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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(initialOrderId || null);
  const [messageInput, setMessageInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showOrderList, setShowOrderList] = useState(!initialOrderId);
  
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

  // Get shop data for shop owners
  const { data: shopData } = useQuery<{ shop: { id: number } }>({
    queryKey: [`/api/shops/owner/${user?.id}`],
    enabled: !!user?.id && effectiveUserRole === 'shop_owner' && isOpen,
  });

  // Fetch orders based on user role
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: effectiveUserRole === 'shop_owner' 
      ? [`/api/orders/shop/${shopData?.shop?.id}`]
      : [`/api/orders/customer/${user?.id}`],
    enabled: !!user?.id && isOpen && (effectiveUserRole !== 'shop_owner' || !!shopData?.shop?.id),
    select: (data) => {
      // For chat system, show all orders with messages or active orders
      return data
        .filter(order => {
          // Show completed orders if they have messages, or any non-cancelled active orders
          return order.status !== 'cancelled' && (order.unreadMessages || order.status !== 'completed');
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  });

  // Fetch messages for selected order with better error handling
  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery<Message[]>({
    queryKey: [`/api/messages/order/${selectedOrderId}`],
    enabled: !!selectedOrderId && !!user?.id,
    refetchInterval: 2000, // Slightly slower refresh for stability
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

      const response = await fetch('/api/messages', {
        method: 'POST',
        body: formData,
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
          ? [`/api/orders/shop/${user?.shopId || user?.id}`]
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

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter orders for search
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      order.title.toLowerCase().includes(search) ||
      order.customerName?.toLowerCase().includes(search) ||
      order.shopName?.toLowerCase().includes(search) ||
      order.id.toString().includes(search)
    );
  });

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-brand-yellow/20 text-rich-black';
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
              {filteredOrders.length > 0 && (
                <span className="text-sm font-normal">
                  ({filteredOrders.length} active)
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
                ) : filteredOrders.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-700 mb-1">
                      {searchQuery ? 'No matches found' : 'Loading conversations...'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {searchQuery ? 'Try a different search term' : 'Orders with messages will appear here'}
                    </p>
                    {messagesError && (
                      <div className="mt-4 p-3 bg-brand-yellow/20 rounded border text-sm">
                        <p className="text-rich-black">
                          Authentication issue detected. Please refresh the page if conversations don't load.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 p-3">
                    {filteredOrders.map((order) => (
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
                                {order.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 truncate mb-2">
                              {effectiveUserRole === 'shop_owner' 
                                ? `Customer: ${order.customerName}` 
                                : `Shop: ${order.shopName || 'Shop'}`}
                            </p>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                Order #{order.id}
                              </span>
                              <span className="text-xs text-gray-400">
                                {format(new Date(order.createdAt), 'MMM dd, HH:mm')}
                              </span>
                            </div>
                          </div>
                          
                          {/* Unread message indicator */}
                          {order.unreadMessages && order.unreadMessages > 0 && (
                            <div className="bg-brand-yellow text-rich-black text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-medium shadow-sm border border-rich-black">
                              {order.unreadMessages > 99 ? '99+' : order.unreadMessages}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
                            ? `Customer: ${selectedOrder.customerName}` 
                            : `Shop: ${selectedOrder.shopName || 'Shop'}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 ml-2">
                        <Badge className={`text-xs ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status}
                        </Badge>
                        {effectiveUserRole === 'shop_owner' && selectedOrder.customerPhone && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${selectedOrder.customerPhone}`)}
                            className="hidden sm:flex"
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Call
                          </Button>
                        )}
                        {effectiveUserRole === 'shop_owner' && selectedOrder.customerPhone && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${selectedOrder.customerPhone}`)}
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
                          
                          // Parse files to check if we have valid files
                          let hasValidFiles = false;
                          let parsedFiles: any[] = [];
                          if (message.files) {
                            try {
                              // Debug logging
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
                          
                          // Force show files even if content is empty
                          const hasContent = message.content && message.content.trim() !== '';
                          
                          console.log(`🔍 Message ${message.id}: hasContent=${hasContent}, hasValidFiles=${hasValidFiles}, content="${message.content}", files:`, message.files);
                          
                          // Don't skip rendering if we have files
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
                                      {format(new Date(message.createdAt), 'HH:mm')}
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
                                
                                {/* File attachments */}
                                {hasValidFiles && (
                                  <div className="mt-2 space-y-1">
                                    {parsedFiles.map((file, fileIndex) => {
                                      const displayName = file.originalName || file.filename;
                                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(displayName);
                                      return (
                                        <div key={fileIndex} className="flex items-center space-x-2 p-2 bg-white/10 rounded">
                                          {isImage ? (
                                            <img 
                                              src={`/uploads/${file.filename}`} 
                                              alt={displayName} 
                                              className="w-32 h-20 object-cover rounded cursor-pointer"
                                              onClick={() => window.open(`/uploads/${file.filename}`, '_blank')}
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
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                  const link = document.createElement('a');
                                                  link.href = `/uploads/${file.filename}`;
                                                  link.download = displayName;
                                                  link.click();
                                                }}
                                              >
                                                <Download className="w-3 h-3" />
                                              </Button>
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
                      // Show completion message for completed orders
                      <div className="bg-gray-100 p-4 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <h4 className="font-semibold text-gray-800">Order Completed</h4>
                        </div>
                        <p className="text-sm text-gray-600">
                          Your order has been completed. You can view the message history above, but no new messages can be sent.
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