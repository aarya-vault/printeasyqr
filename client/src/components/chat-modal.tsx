import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  X, Send, Phone, User, Package, MessageSquare, 
  Clock, CheckCheck, Circle
} from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: number;
  orderId: number;
  senderId: number;
  senderName: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface Order {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  shopId: number;
  type: string;
  title: string;
  status: string;
  createdAt: string;
}

interface ChatModalProps {
  orderId: number;
  onClose: () => void;
  userRole: 'customer' | 'shop_owner';
}

export default function ChatModal({ orderId, onClose, userRole }: ChatModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get order details
  const { data: orderData } = useQuery<{ order: Order }>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId,
  });

  // Get messages for this order
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: [`/api/messages/order/${orderId}`],
    enabled: !!orderId,
    refetchInterval: 3000, // Refetch every 3 seconds for real-time feel
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: parseInt(orderId.toString()),
          senderId: user?.id,
          content,
          messageType: 'text'
        })
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: [`/api/messages/order/${orderId}`] });
      toast({ title: 'Message sent successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to send message', variant: 'destructive' });
    }
  });

  // Mark messages as read when opening chat
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/messages/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/shop/${orderData?.order?.shopId}`] });
    }
  });

  // Mark messages as read when component mounts
  useEffect(() => {
    if (user?.id && orderId) {
      markAsReadMutation.mutate();
    }
  }, [user?.id, orderId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    sendMessageMutation.mutate(messageInput.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCallCustomer = () => {
    if (orderData?.order?.customerPhone) {
      window.location.href = `tel:${orderData.order.customerPhone}`;
    }
  };

  const order = orderData?.order;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-yellow rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-rich-black" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {userRole === 'customer' ? 'Chat with Shop' : `Chat with ${order?.customerName}`}
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Order #{order?.id} - {order?.title}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {userRole === 'shop_owner' && order?.customerPhone && (
                <Button variant="outline" size="sm" onClick={handleCallCustomer}>
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const isMyMessage = message.senderId === user?.id;
                  const showTimestamp = index === 0 || 
                    new Date(message.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 300000; // 5 minutes

                  return (
                    <div key={message.id}>
                      {showTimestamp && (
                        <div className="text-center text-xs text-gray-400 my-2">
                          {format(new Date(message.createdAt), 'MMM dd, HH:mm')}
                        </div>
                      )}
                      <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-lg px-3 py-2 ${
                          isMyMessage 
                            ? 'bg-brand-yellow text-rich-black' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium opacity-70">
                              {message.senderName}
                            </span>
                            {isMyMessage && (
                              <CheckCheck className={`w-3 h-3 ml-2 ${
                                message.isRead ? 'text-blue-600' : 'text-gray-400'
                              }`} />
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
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
            <div className="flex space-x-2">
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
                disabled={!messageInput.trim() || sendMessageMutation.isPending}
                className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}