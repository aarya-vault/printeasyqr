import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, Paperclip, Search, X, ArrowLeft, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

interface Order {
  id: number;
  title: string;
  status: 'new' | 'processing' | 'ready' | 'completed' | 'cancelled';
  customerId: number;
  shopId: number;
  shop?: {
    id: number;
    name: string;
    phone?: string;
  };
  unreadMessages?: number;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  senderRole: 'customer' | 'shop_owner';
  files?: string[];
  createdAt: string;
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: number;
}

export function ChatInterface({ isOpen, onClose, initialOrderId }: ChatInterfaceProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(initialOrderId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChatView, setShowChatView] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check mobile view
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (!mobile && selectedOrderId) {
        setShowChatView(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [selectedOrderId]);

  // Fetch orders with chat data
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: [`/api/orders/customer/${user?.id}`],
    enabled: !!user?.id && isOpen,
  });

  // Filter orders for chat (exclude completed and cancelled)
  const chatOrders = orders
    .filter(order => order.status !== 'completed' && order.status !== 'cancelled')
    .filter(order => {
      if (!searchQuery) return true;
      const search = searchQuery.toLowerCase();
      return (
        order.title.toLowerCase().includes(search) ||
        order.shop?.name.toLowerCase().includes(search) ||
        order.id.toString().includes(search)
      );
    });

  // Fetch messages for selected order
  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: [`/api/messages/order/${selectedOrderId}`],
    enabled: !!selectedOrderId && isOpen,
    refetchInterval: 3000,
  });

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation with file upload support
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { orderId: number; content: string; files?: FileList }) => {
      const formData = new FormData();
      formData.append('orderId', data.orderId.toString());
      formData.append('senderId', user?.id?.toString() || '');
      formData.append('senderName', user?.name || user?.phone || 'User');
      formData.append('senderRole', user?.role || 'customer');
      formData.append('content', data.content);
      formData.append('messageType', 'text');
      
      // Add files if present
      if (data.files && data.files.length > 0) {
        Array.from(data.files).forEach(file => {
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
      setNewMessage('');
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: [`/api/orders/customer/${user?.id}`] });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error) => {
      console.error('Send message error:', error);
    }
  });

  const handleSendMessage = () => {
    if (!selectedOrderId || (!newMessage.trim() && !fileInputRef.current?.files?.length)) return;
    
    sendMessageMutation.mutate({
      orderId: selectedOrderId,
      content: newMessage.trim(),
      files: fileInputRef.current?.files || undefined,
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOrderSelect = (orderId: number) => {
    setSelectedOrderId(orderId);
    if (isMobileView) {
      setShowChatView(true);
    }
  };

  const handleBackToList = () => {
    setShowChatView(false);
    setSelectedOrderId(null);
  };

  const selectedOrder = chatOrders.find(order => order.id === selectedOrderId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#FFBF00] p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-black">PrintEasy Chat</h2>
          <Button 
            onClick={onClose}
            variant="ghost" 
            size="sm"
            className="text-black hover:bg-black hover:text-[#FFBF00] h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Mobile: Show either list or chat */}
          {isMobileView ? (
            <>
              {!showChatView ? (
                /* Mobile: Orders List */
                <div className="flex-1 flex flex-col">
                  {/* Search Bar */}
                  <div className="p-4 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search orders, shops..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-gray-300 focus:border-[#FFBF00] focus:ring-[#FFBF00]"
                      />
                    </div>
                  </div>

                  {/* Orders List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatOrders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                        <p>No active orders to chat about</p>
                      </div>
                    ) : (
                      chatOrders.map((order) => (
                        <Card 
                          key={order.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-[#FFBF00]"
                          onClick={() => handleOrderSelect(order.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-black mb-1">{order.title}</h3>
                                <p className="text-sm text-gray-600 mb-2">{order.shop?.name}</p>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={order.status === 'new' ? 'default' : 'secondary'}
                                    className={
                                      order.status === 'new' ? 'bg-[#FFBF00] text-black' :
                                      order.status === 'processing' ? 'bg-black text-white' :
                                      'bg-gray-200 text-black'
                                    }
                                  >
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                  </Badge>
                                  <span className="text-xs text-gray-500">Order #{order.id}</span>
                                </div>
                              </div>
                              {order.unreadMessages && order.unreadMessages > 0 && (
                                <div className="bg-black text-[#FFBF00] text-xs rounded-full px-2 py-1 font-bold min-w-[20px] text-center">
                                  {order.unreadMessages > 9 ? '9+' : order.unreadMessages}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* Mobile: Chat View */
                <div className="flex-1 flex flex-col">
                  {/* Chat Header */}
                  <div className="p-4 border-b bg-gray-50 flex items-center gap-3">
                    <Button 
                      onClick={handleBackToList}
                      variant="ghost" 
                      size="sm"
                      className="text-black hover:bg-[#FFBF00] h-8 w-8 p-0"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                      <h3 className="font-semibold text-black">{selectedOrder?.title}</h3>
                      <p className="text-sm text-gray-600">{selectedOrder?.shop?.name}</p>
                    </div>
                    {selectedOrder?.shop?.phone && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-black hover:bg-[#FFBF00] h-8 w-8 p-0"
                        onClick={() => window.open(`tel:${selectedOrder.shop?.phone}`)}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="mx-auto h-8 w-8 mb-2 text-gray-300" />
                        <p>Start your conversation</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderRole === 'customer' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                            message.senderRole === 'customer' 
                              ? 'bg-[#FFBF00] text-black' 
                              : 'bg-black text-white'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            {message.files && (
                              <div className="mt-2 space-y-1">
                                {(() => {
                                  try {
                                    const files = typeof message.files === 'string' ? JSON.parse(message.files) : message.files;
                                    if (Array.isArray(files)) {
                                      return files.map((file, index) => (
                                        <div key={index} className="text-xs underline">
                                          <a href={`/uploads/${file}`} target="_blank" rel="noopener noreferrer">
                                            📎 {file}
                                          </a>
                                        </div>
                                      ));
                                    }
                                  } catch (e) {
                                    console.warn('Failed to parse message files:', message.files);
                                  }
                                  return null;
                                })()}
                              </div>
                            )}
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  {selectedOrderId && (
                    <div className="p-4 border-t bg-white">
                      <div className="flex gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          size="sm"
                          className="border-[#FFBF00] text-[#FFBF00] hover:bg-[#FFBF00] hover:text-black"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Input
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="flex-1 border-gray-300 focus:border-[#FFBF00] focus:ring-[#FFBF00]"
                        />
                        <Button 
                          onClick={handleSendMessage}
                          disabled={sendMessageMutation.isPending}
                          className="bg-[#FFBF00] text-black hover:bg-black hover:text-[#FFBF00]"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Desktop: Two-Panel Layout */
            <>
              {/* Left Panel: Orders List */}
              <div className="w-1/3 border-r flex flex-col">
                {/* Search Bar */}
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search orders, shops..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-[#FFBF00] focus:ring-[#FFBF00]"
                    />
                  </div>
                </div>

                {/* Orders List */}
                <div className="flex-1 overflow-y-auto">
                  {chatOrders.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <MessageCircle className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                      <p>No active orders</p>
                    </div>
                  ) : (
                    chatOrders.map((order) => (
                      <div
                        key={order.id}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedOrderId === order.id ? 'bg-[#FFBF00] bg-opacity-20 border-l-4 border-l-[#FFBF00]' : ''
                        }`}
                        onClick={() => handleOrderSelect(order.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-black text-sm mb-1">{order.title}</h3>
                            <p className="text-xs text-gray-600 mb-2">{order.shop?.name}</p>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="secondary"
                                className={`text-xs ${
                                  order.status === 'new' ? 'bg-[#FFBF00] text-black' :
                                  order.status === 'processing' ? 'bg-black text-white' :
                                  'bg-gray-200 text-black'
                                }`}
                              >
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          {order.unreadMessages && order.unreadMessages > 0 && (
                            <div className="bg-black text-[#FFBF00] text-xs rounded-full px-2 py-1 font-bold min-w-[18px] text-center">
                              {order.unreadMessages > 9 ? '9+' : order.unreadMessages}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Panel: Chat */}
              <div className="flex-1 flex flex-col">
                {selectedOrderId ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-black">{selectedOrder?.title}</h3>
                        <p className="text-sm text-gray-600">{selectedOrder?.shop?.name}</p>
                      </div>
                      {selectedOrder?.shop?.phone && (
                        <Button 
                          variant="outline"
                          size="sm"
                          className="border-[#FFBF00] text-[#FFBF00] hover:bg-[#FFBF00] hover:text-black"
                          onClick={() => window.open(`tel:${selectedOrder.shop?.phone}`)}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call Shop
                        </Button>
                      )}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <MessageCircle className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                          <p>Start your conversation with {selectedOrder?.shop?.name}</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.senderRole === 'customer' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                              message.senderRole === 'customer' 
                                ? 'bg-[#FFBF00] text-black' 
                                : 'bg-black text-white'
                            }`}>
                              <p>{message.content}</p>
                              {message.files && message.files.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {message.files.map((file, index) => (
                                    <div key={index} className="text-sm underline">
                                      <a href={`/uploads/${file}`} target="_blank" rel="noopener noreferrer">
                                        📎 {file}
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <p className="text-xs opacity-70 mt-2">
                                {new Date(message.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t bg-white">
                      <div className="flex gap-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          className="border-[#FFBF00] text-[#FFBF00] hover:bg-[#FFBF00] hover:text-black"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Input
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="flex-1 border-gray-300 focus:border-[#FFBF00] focus:ring-[#FFBF00]"
                        />
                        <Button 
                          onClick={handleSendMessage}
                          disabled={sendMessageMutation.isPending}
                          className="bg-[#FFBF00] text-black hover:bg-black hover:text-[#FFBF00]"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* No Order Selected */
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <MessageCircle className="mx-auto h-16 w-16 mb-4 text-gray-300" />
                      <p className="text-lg mb-2">Select an order to start chatting</p>
                      <p className="text-sm">Choose an active order from the left panel</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}