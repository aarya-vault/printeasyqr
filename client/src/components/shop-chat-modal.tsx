import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Clock, User, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: number;
  orderId: number;
  senderId: number;
  content: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
}

interface Order {
  id: number;
  customerId: number;
  customerName: string;
  title: string;
  type: string;
  status: string;
}

interface ShopChatModalProps {
  orderId: number;
  onClose: () => void;
}

export default function ShopChatModal({ orderId, onClose }: ShopChatModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch order details
  const { data: order, isLoading: orderLoading } = useQuery<Order>({
    queryKey: [`/api/orders/${orderId}`],
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/messages/order/${orderId}`],
    refetchInterval: 2000, // Poll every 2 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest(`/api/messages/order/${orderId}`, {
        method: 'POST',
        body: {
          senderId: user?.id,
          content,
          messageType: 'text'
        }
      });
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: [`/api/messages/order/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/shop/${user?.shop?.id}`] });
      toast({ title: 'Message sent' });
    },
    onError: () => {
      toast({ title: 'Failed to send message', variant: 'destructive' });
    }
  });

  // Mark messages as read when opening
  useEffect(() => {
    if (messages.length > 0 && user?.id) {
      apiRequest(`/api/messages/order/${orderId}/read`, {
        method: 'PATCH',
        body: { userId: user.id }
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: [`/api/orders/shop/${user?.shop?.id}`] });
      });
    }
  }, [messages.length, orderId, user?.id, queryClient]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-brand-yellow/20 text-rich-black';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (orderLoading || messagesLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl h-[600px] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center text-lg font-semibold text-rich-black">
                Chat with {order?.customerName || 'Customer'}
                <User className="w-4 h-4 ml-2 text-gray-500" />
              </DialogTitle>
              <div className="flex items-center space-x-3 mt-2">
                <span className="text-sm text-gray-600">Order #{orderId}</span>
                <Badge className={`${getStatusColor(order?.status || '')} border text-xs`}>
                  {order?.status && order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {order?.type === 'upload' ? 'Upload Order' : 'Walk-in Order'}
                </Badge>
              </div>
            </div>
          </div>
          {order?.title && (
            <p className="text-sm text-gray-600 mt-2" title={order.title}>
              {order.title.length > 50 ? `${order.title.substring(0, 50)}...` : order.title}
            </p>
          )}
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Wrench className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-600 mb-1">No messages yet</h3>
                  <p className="text-sm text-gray-500">Start the conversation with your customer</p>
                </CardContent>
              </Card>
            ) : (
              messages.map((message) => {
                const isFromShop = message.senderId === user?.id;
                const isFromCustomer = message.senderId === order?.customerId;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isFromShop ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isFromShop
                          ? 'bg-brand-yellow text-rich-black'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="text-sm break-words">{message.content}</div>
                      <div className={`text-xs mt-1 flex items-center ${
                        isFromShop ? 'text-rich-black/70' : 'text-gray-500'
                      }`}>
                        <Clock className="w-3 h-3 mr-1" />
                        {format(new Date(message.createdAt), 'MMM dd, HH:mm')}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-6 border-t bg-gray-50">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={sendMessageMutation.isPending}
              className="flex-1"
              maxLength={500}
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 px-6"
            >
              {sendMessageMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-rich-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            {newMessage.length}/500 characters
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}