import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  X,
  MessageCircle,
  ArrowLeft,
  Phone,
  Clock,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: number;
  content: string;
  senderType: 'customer' | 'shop';
  createdAt: string;
  senderName: string;
}

interface Order {
  id: number;
  description: string;
  status: 'new' | 'processing' | 'ready' | 'completed';
  customer: {
    name: string;
    phone: string;
  };
  shop: {
    id: number;
    name: string;
    phone?: string;
  };
  createdAt: string;
}

interface MobileChatPanelProps {
  orderId: number;
  onClose: () => void;
  className?: string;
}

export default function MobileChatPanel({ 
  orderId, 
  onClose, 
  className = '' 
}: MobileChatPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch order details
  const { data: order, isLoading: orderLoading } = useQuery<Order>({
    queryKey: ['/api/orders', orderId],
    enabled: !!orderId,
  });

  // Fetch messages with real-time updates
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages', orderId],
    enabled: !!orderId,
    refetchInterval: 2000, // Real-time updates every 2 seconds for mobile
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', orderId] });
      setNewMessage('');
      scrollToBottom();
      toast({
        title: "Message Sent",
        description: "Your message has been delivered.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Send",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
      ready: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.new;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="h-3 w-3" />;
      case 'processing':
        return <MessageCircle className="h-3 w-3" />;
      case 'ready':
        return <CheckCircle className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  if (orderLoading) {
    return (
      <div className={`bg-white ${className} flex items-center justify-center`}>
        <div className="text-center">
          <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-500">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={`bg-white ${className} flex items-center justify-center`}>
        <div className="text-center">
          <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Order not found</p>
          <Button variant="outline" onClick={onClose} className="mt-2">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white flex flex-col ${className}`}>
      {/* Mobile Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h3 className="font-semibold text-black">Order #{order.id}</h3>
            <p className="text-sm text-gray-600">{order.shop.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
            {getStatusIcon(order.status)}
            {order.status}
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(`tel:${order.shop.phone || ''}`)}
          >
            <Phone className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Order Quick Info */}
      <div className="p-4 bg-gray-50 border-b">
        <p className="text-sm text-gray-700 line-clamp-2">{order.description}</p>
        <p className="text-xs text-gray-500 mt-1">
          Ordered on {format(new Date(order.createdAt), 'MMM dd, yyyy • HH:mm')}
        </p>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messagesLoading && messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2 animate-pulse" />
              <p className="text-gray-500">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1">Start a conversation with the shop</p>
            </div>
          ) : (
            messages.map((message) => {
              const isCustomerMessage = message.senderType === 'customer';
              const isCurrentUser = 
                (user?.role === 'customer' && isCustomerMessage) ||
                (user?.role === 'shop_owner' && !isCustomerMessage);

              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      isCurrentUser
                        ? 'bg-[#FFBF00] text-black'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className={`flex items-center justify-between mt-1 text-xs ${
                      isCurrentUser ? 'text-black/70' : 'text-gray-500'
                    }`}>
                      <span>{message.senderName}</span>
                      <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input - Mobile Optimized */}
      <div className="p-4 border-t bg-white sticky bottom-0">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 py-3 text-base border-2 rounded-full"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            type="submit"
            size="lg"
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            className="bg-[#FFBF00] hover:bg-[#E6AC00] text-black rounded-full px-6"
          >
            {sendMessageMutation.isPending ? (
              <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
        
        {/* Quick Reply Suggestions */}
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {[
            "What's the status?",
            "When will it be ready?",
            "Thank you!",
            "Any updates?"
          ].map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              onClick={() => setNewMessage(suggestion)}
              className="whitespace-nowrap text-xs border rounded-full"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}