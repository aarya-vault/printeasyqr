import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Send, Phone, User, Package, Search, 
  MessageSquare, Clock, CheckCheck, Circle
} from 'lucide-react';

interface Message {
  id: number;
  senderId: number;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  id: number;
  orderId: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  orderNumber: string;
  orderStatus: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

export default function ShopChatSystem() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['/api/shop/conversations', user?.shopId],
    queryFn: async () => {
      if (!user?.shopId) return [];
      const response = await fetch(`/api/shops/${user.shopId}/conversations`);
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    },
    enabled: !!user?.shopId
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: user?.id, content })
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: (_, variables) => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['/api/shop/conversations'] });
      // Refresh selected conversation
      if (selectedConversation?.id === variables.conversationId) {
        const updated = conversations.find((c: Conversation) => c.id === variables.conversationId);
        if (updated) setSelectedConversation(updated);
      }
    }
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/conversations'] });
    }
  });

  // Filter conversations
  const filteredConversations = conversations.filter((conv: Conversation) =>
    conv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.orderNumber.includes(searchTerm) ||
    conv.customerPhone.includes(searchTerm)
  );

  // Handle conversation selection
  const handleSelectConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    if (conv.unreadCount > 0) {
      await markAsReadMutation.mutate(conv.id);
    }
  };

  // Send message
  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      content: messageInput.trim()
    });
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/shop-dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold text-rich-black">Customer Chat</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 md:grid-cols-3 h-full">
          {/* Conversations List */}
          <div className="border-r border-gray-200 bg-white">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>

            <ScrollArea className="h-[calc(100%-5rem)]">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-yellow"></div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredConversations.map((conv: Conversation) => (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-rich-black truncate">
                          {conv.customerName}
                        </h4>
                        {conv.unreadCount > 0 && (
                          <Badge className="bg-brand-yellow text-rich-black">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-2">
                        Order #{conv.orderNumber} • {conv.orderStatus}
                      </p>
                      
                      <p className="text-sm text-gray-600 truncate">
                        {conv.lastMessage}
                      </p>
                      
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(conv.lastMessageTime).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="col-span-2 flex flex-col bg-white">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-rich-black">
                        {selectedConversation.customerName}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {selectedConversation.customerPhone}
                        </span>
                        <span className="flex items-center">
                          <Package className="w-3 h-3 mr-1" />
                          Order #{selectedConversation.orderNumber}
                        </span>
                        <Badge variant="outline">
                          {selectedConversation.orderStatus}
                        </Badge>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `tel:${selectedConversation.customerPhone}`}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {selectedConversation.messages.map((message) => {
                      const isShopMessage = message.senderId === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isShopMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isShopMessage
                                ? 'bg-brand-yellow text-rich-black'
                                : 'bg-gray-100 text-rich-black'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs opacity-70">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </span>
                              {isShopMessage && (
                                message.isRead ? 
                                  <CheckCheck className="w-3 h-3 ml-1" /> : 
                                  <Circle className="w-3 h-3 ml-1" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      type="submit"
                      disabled={!messageInput.trim() || sendMessageMutation.isPending}
                      className="bg-brand-yellow text-rich-black hover:bg-yellow-500"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-500">
                    Choose a customer from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}