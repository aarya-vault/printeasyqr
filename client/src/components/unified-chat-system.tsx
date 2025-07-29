import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  X, Send, Phone, User, Package, MessageSquare, 
  Clock, CheckCheck, Circle, Paperclip, File, Download,
  Search, ArrowLeft, Store, MessageCircle
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
  files?: string[];
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

  // Fetch orders based on user role
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: effectiveUserRole === 'shop_owner' 
      ? [`/api/orders/shop/${user?.shopId || user?.id}`]
      : [`/api/orders/customer/${user?.id}`],
    enabled: !!user?.id && isOpen,
    select: (data) => {
      // Filter and sort orders for chat relevance
      return data
        .filter(order => order.status !== 'completed' && order.status !== 'cancelled')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  });

  // Fetch messages for selected order
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/messages/order/${selectedOrderId}`],
    enabled: !!selectedOrderId,
    refetchInterval: 2000,
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
      formData.append('messageType', 'text');
      
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
      queryClient.invalidateQueries({ queryKey: [`/api/messages/order/${selectedOrderId}`] });
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
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b bg-brand-yellow">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-rich-black font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {selectedOrder ? selectedOrder.title : 'Chat Center'}
            </DialogTitle>

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
              {selectedOrder && (
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status}
                </Badge>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Order List (Hidden on mobile when order selected) */}
          {(!isMobileView || showOrderList) && (
            <div className="w-80 border-r flex flex-col">
              {/* Search */}
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search chats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Orders List */}
              <ScrollArea className="flex-1">
                {ordersLoading ? (
                  <div className="p-4 text-center text-gray-500">Loading chats...</div>
                ) : filteredOrders.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchQuery ? 'No chats found' : 'No active orders to chat about'}
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          if (isMobileView) setShowOrderList(false);
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-colors relative ${
                          selectedOrderId === order.id
                            ? 'bg-brand-yellow text-rich-black'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{order.title}</h4>
                            <p className="text-sm text-gray-500 truncate">
                              {effectiveUserRole === 'shop_owner' 
                                ? order.customerName 
                                : order.shopName || 'Shop'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400">#{order.id}</span>
                              <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                                {order.status}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                #{order.id}
                              </span>
                            </div>
                          </div>
                          
                          {/* Unread message indicator */}
                          {order.unreadMessages && order.unreadMessages > 0 && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
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
                  {!isMobileView && selectedOrder && (
                    <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-black">{selectedOrder.title}</h3>
                        <p className="text-sm text-gray-600">
                          {effectiveUserRole === 'shop_owner' 
                            ? `Customer: ${selectedOrder.customerName}` 
                            : `Shop: ${selectedOrder.shopName || 'Shop'}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(selectedOrder.status)}>
                          {selectedOrder.status}
                        </Badge>
                        {effectiveUserRole === 'shop_owner' && selectedOrder.customerPhone && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${selectedOrder.customerPhone}`)}
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Call
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
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
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
                                
                                {message.content && (
                                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                )}
                                
                                {/* File attachments */}
                                {message.files && message.files.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {message.files.map((filename, fileIndex) => {
                                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
                                      return (
                                        <div key={fileIndex} className="flex items-center space-x-2 p-2 bg-white/10 rounded">
                                          {isImage ? (
                                            <img 
                                              src={`/uploads/${filename}`} 
                                              alt="Attachment" 
                                              className="w-32 h-20 object-cover rounded cursor-pointer"
                                              onClick={() => window.open(`/uploads/${filename}`, '_blank')}
                                            />
                                          ) : (
                                            <>
                                              <File className="w-4 h-4" />
                                              <span className="text-xs flex-1 truncate">{filename}</span>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                  const link = document.createElement('a');
                                                  link.href = `/uploads/${filename}`;
                                                  link.download = filename;
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
                  <div className="border-t p-4">
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
                              <File className="w-4 h-4" />
                              <span className="truncate">{file.name}</span>
                              <span className="text-xs">({(file.size / 1024).toFixed(1)}KB)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {/* File attachment button */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleFileSelect}
                        disabled={sendMessageMutation.isPending}
                        className="px-3"
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
                        className="flex-1"
                        disabled={sendMessageMutation.isPending}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={(!messageInput.trim() && (!selectedFiles || selectedFiles.length === 0)) || sendMessageMutation.isPending}
                        className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p>Select a chat to start messaging</p>
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