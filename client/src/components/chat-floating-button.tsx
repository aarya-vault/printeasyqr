import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  X,
  Search,
  Send,
  User,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface ChatMessage {
  id: number;
  orderId: number;
  senderId: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  messageType: string;
  senderName?: string;
  senderRole?: string;
}

interface ChatOrder {
  id: number;
  customerId: number;
  customerName: string;
  title: string;
  status: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export default function ChatFloatingButton() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');

  // Get shop data
  const { data: shopData } = useQuery<{ shop: { id: number } }>({
    queryKey: [`/api/shops/owner/${user?.id}`],
    enabled: !!user?.id && user?.role === 'shop_owner',
  });

  // Get orders with chat activity
  const { data: chatOrders = [] } = useQuery<ChatOrder[]>({
    queryKey: [`/api/shop/${shopData?.shop?.id}/chat-orders`],
    enabled: !!shopData?.shop?.id && isOpen,
  });

  // Get messages for selected order
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: [`/api/messages/order/${selectedOrder}`],
    enabled: !!selectedOrder,
    refetchInterval: 3000, // Poll every 3 seconds
  });

  // Total unread messages
  const totalUnread = chatOrders.reduce((sum, order) => sum + order.unreadCount, 0);

  const filteredOrders = chatOrders.filter(order => {
    const search = searchQuery.toLowerCase();
    return (
      order.customerName?.toLowerCase().includes(search) ||
      order.title?.toLowerCase().includes(search) ||
      order.id.toString().includes(search)
    );
  });

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedOrder) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder,
          senderId: user?.id,
          content: messageInput.trim(),
          messageType: 'text',
        }),
      });

      if (response.ok) {
        setMessageInput('');
        // Refetch messages
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const selectedOrderData = chatOrders.find(o => o.id === selectedOrder);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-blue-600';
      case 'processing': return 'text-brand-yellow';
      case 'ready': return 'text-green-600';
      case 'completed': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  if (user?.role !== 'shop_owner') return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 shadow-lg relative"
          >
            <MessageSquare className="w-6 h-6" />
            {totalUnread > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 w-full md:w-[800px] h-[600px] bg-white rounded-tl-xl shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold text-rich-black flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Customer Messages
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Left Panel - Order List */}
            <div className="w-1/3 border-r flex flex-col">
              {/* Search */}
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Order List */}
              <div className="flex-1 overflow-y-auto">
                {filteredOrders.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order.id)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedOrder === order.id ? 'bg-brand-yellow/10 border-l-4 border-brand-yellow' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-rich-black">
                          {order.customerName}
                        </h4>
                        {order.unreadCount > 0 && (
                          <Badge className="bg-red-500 text-white text-xs px-2 py-0">
                            {order.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Order #{order.id} - {order.title}
                      </p>
                      {order.lastMessage && (
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {order.lastMessage}
                        </p>
                      )}
                      {order.lastMessageTime && (
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(order.lastMessageTime), 'MMM dd, HH:mm')}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Panel - Chat */}
            <div className="flex-1 flex flex-col">
              {selectedOrder ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-rich-black">
                          {selectedOrderData?.customerName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Order #{selectedOrder} • 
                          <span className={`ml-2 font-medium ${getStatusColor(selectedOrderData?.status || '')}`}>
                            {selectedOrderData?.status}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === user?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            message.senderId === user?.id
                              ? 'bg-brand-yellow text-rich-black'
                              : 'bg-gray-100 text-rich-black'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {format(new Date(message.createdAt), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <Input
                        type="text"
                        placeholder="Type a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
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
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}