import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Search, MessageCircle, Phone, User, ArrowLeft, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Order {
  id: number;
  title: string;
  status: string;
  shopId: number;
  shop?: {
    name: string;
    phone: string;
  };
  customerName?: string;
  customerPhone?: string;
  unreadMessages?: number;
  createdAt: string;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  senderRole: string;
  messageType: string;
  files?: string;
  isRead: boolean;
  createdAt: string;
}

interface ComprehensiveChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: number;
}

export default function ComprehensiveChatInterface({ isOpen, onClose, initialOrderId }: ComprehensiveChatInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(initialOrderId || null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch customer orders with chat data
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: [`/api/orders/customer/${user?.id}`],
    enabled: !!user?.id && isOpen,
  });

  // Filter and search orders
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

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { orderId: number; content: string; files?: FileList }) => {
      const formData = new FormData();
      formData.append('content', data.content);
      formData.append('messageType', 'text');
      
      if (data.files) {
        Array.from(data.files).forEach(file => {
          formData.append('files', file);
        });
      }

      const response = await fetch(`/api/messages/order/${data.orderId}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setNewMessage('');
      setSelectedFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: [`/api/orders/customer/${user?.id}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = () => {
    if (!selectedOrderId || (!newMessage.trim() && !selectedFiles)) return;
    
    sendMessageMutation.mutate({
      orderId: selectedOrderId,
      content: newMessage,
      files: selectedFiles || undefined
    });
  };

  const handleOrderSelect = (orderId: number) => {
    setSelectedOrderId(orderId);
    if (isMobileView) {
      setShowChatList(false);
    }
  };

  const handleBackToList = () => {
    if (isMobileView) {
      setShowChatList(true);
      setSelectedOrderId(null);
    }
  };

  const selectedOrder = orders.find(order => order.id === selectedOrderId);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] p-0 bg-white" aria-describedby="chat-description">
        <DialogHeader className="px-6 py-4 border-b border-gray-200">
          <DialogTitle className="text-xl font-bold text-rich-black flex items-center">
            <MessageCircle className="w-6 h-6 mr-2 text-brand-yellow" />
            Chat with Print Shops
          </DialogTitle>
          <div id="chat-description" className="sr-only">
            Comprehensive chat interface to communicate with print shops about your orders
          </div>
        </DialogHeader>

        <div className="flex h-full">
          {/* Desktop: Always show both panels, Mobile: Show based on state */}
          {(!isMobileView || showChatList) && (
            <div className={`${isMobileView ? 'w-full' : 'w-1/3'} border-r border-gray-200 flex flex-col`}>
              {/* Search Bar */}
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search orders or shops..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-brand-yellow"
                  />
                </div>
              </div>

              {/* Chat List */}
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {chatOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">
                        {searchQuery ? 'No chats found' : 'No active orders to chat about'}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Place an order to start chatting with shops
                      </p>
                    </div>
                  ) : (
                    chatOrders.map((order) => (
                      <Card
                        key={order.id}
                        className={`mb-2 cursor-pointer transition-all hover:shadow-sm ${
                          selectedOrderId === order.id
                            ? 'border-brand-yellow bg-yellow-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleOrderSelect(order.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm text-rich-black truncate">
                                  {order.shop?.name}
                                </h4>
                                {order.unreadMessages && order.unreadMessages > 0 && (
                                  <Badge className="bg-rich-black text-brand-yellow text-xs px-1.5 py-0.5">
                                    {order.unreadMessages}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 truncate mb-1">
                                ORD{order.id.toString().padStart(3, '0')} - {order.title}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={`text-xs ${
                                    order.status === 'new'
                                      ? 'bg-blue-100 text-blue-800'
                                      : order.status === 'processing'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : order.status === 'ready'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </Badge>
                                <span className="text-xs text-gray-400">
                                  {format(new Date(order.createdAt), 'dd MMM')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Chat Window */}
          {(!isMobileView || !showChatList) && (
            <div className={`${isMobileView ? 'w-full' : 'w-2/3'} flex flex-col`}>
              {selectedOrder ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isMobileView && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleBackToList}
                            className="mr-2"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </Button>
                        )}
                        <div>
                          <h3 className="font-semibold text-rich-black">
                            {selectedOrder.shop?.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            ORD{selectedOrder.id.toString().padStart(3, '0')} - {selectedOrder.title}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `tel:${selectedOrder.shop?.phone}`}
                        className="text-brand-yellow border-brand-yellow hover:bg-brand-yellow hover:text-rich-black"
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        Call
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {messages.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">No messages yet</p>
                          <p className="text-gray-400 text-xs mt-1">Start the conversation!</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.senderId === user?.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-3 py-2 ${
                                message.senderId === user?.id
                                  ? 'bg-brand-yellow text-rich-black'
                                  : 'bg-gray-100 text-rich-black'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              {message.files && (
                                <div className="mt-2 text-xs">
                                  <span className="text-gray-600">📎 Files attached</span>
                                </div>
                              )}
                              <p className={`text-xs mt-1 ${
                                message.senderId === user?.id ? 'text-rich-black/70' : 'text-gray-500'
                              }`}>
                                {format(new Date(message.createdAt), 'HH:mm')}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-100">
                    <div className="flex items-end gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => setSelectedFiles(e.target.files)}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-gray-300 hover:border-brand-yellow"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <div className="flex-1">
                        <Input
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="border-gray-200 focus:border-brand-yellow"
                        />
                        {selectedFiles && selectedFiles.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedFiles.length} file(s) selected
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() && !selectedFiles}
                        className="bg-brand-yellow text-rich-black hover:bg-yellow-400"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Choose an order from the list to start chatting
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