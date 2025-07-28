import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Send, Paperclip, Phone, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  // Fetch customer orders with chat data
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: [`/api/orders/customer/${user?.id}`],
    enabled: !!user?.id && isOpen,
  });

  // Filter orders that have active conversations
  const chatOrders = orders.filter(order => 
    order.status !== 'completed' && order.status !== 'cancelled'
  );

  // Fetch messages for selected order
  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: [`/api/messages/order/${selectedOrderId}`],
    enabled: !!selectedOrderId && isOpen,
    refetchInterval: 3000, // Real-time updates
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { orderId: number; content: string; files?: FileList }) => {
      const formData = new FormData();
      formData.append('orderId', data.orderId.toString());
      formData.append('content', data.content);
      formData.append('senderId', user!.id.toString());
      formData.append('senderName', user!.name || user!.phone || 'Customer');
      formData.append('senderRole', 'customer');
      formData.append('messageType', data.files && data.files.length > 0 ? 'file' : 'text');

      if (data.files) {
        for (let i = 0; i < data.files.length; i++) {
          formData.append('files', data.files[i]);
        }
      }

      return fetch('/api/messages', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      setNewMessage('');
      setSelectedFiles(null);
      refetchMessages();
      toast({ title: 'Message sent successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to send message', variant: 'destructive' });
    }
  });

  const handleSendMessage = () => {
    if (!selectedOrderId || (!newMessage.trim() && !selectedFiles)) return;

    sendMessageMutation.mutate({
      orderId: selectedOrderId,
      content: newMessage.trim(),
      files: selectedFiles || undefined
    });
  };

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 md:p-4">
      <div className="w-full max-w-7xl h-full max-h-[95vh] bg-white rounded-lg shadow-2xl flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Panel - Chat List */}
        <div className="w-full lg:w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
          <div className="bg-brand-yellow text-rich-black p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <h2 className="font-semibold">Your Chats</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-rich-black hover:bg-yellow-200 lg:hidden"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            {chatOrders.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No active chats</p>
                <p className="text-xs text-gray-400 mt-1">Start by placing an order</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {chatOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedOrderId === order.id ? 'bg-blue-50 border-r-4 border-r-brand-yellow' : ''
                    }`}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm text-rich-black truncate">
                        {order.title}
                      </h3>
                      {order.unreadMessages && order.unreadMessages > 0 && (
                        <Badge className="bg-red-500 text-white text-xs">
                          {order.unreadMessages}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {order.shop?.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'ready' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right Panel - Chat Interface */}
        <div className="flex-1 flex flex-col">
          {selectedOrder ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="font-medium text-rich-black">{selectedOrder.title}</h3>
                    <p className="text-sm text-gray-500">{selectedOrder.shop?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedOrder.shop?.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`tel:${selectedOrder.shop?.phone}`)}
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="hidden lg:flex"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderRole === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderRole === 'customer'
                            ? 'bg-brand-yellow text-rich-black'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        {message.files && (
                          <div className="mt-2 space-y-1">
                            {JSON.parse(message.files).map((filename: string, index: number) => (
                              <div key={index} className="flex items-center gap-2">
                                <Paperclip className="w-3 h-3" />
                                <a
                                  href={`/uploads/${filename}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs underline hover:no-underline"
                                >
                                  {filename}
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs opacity-70 mt-1">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-3 md:p-4">
                {selectedFiles && selectedFiles.length > 0 && (
                  <div className="mb-3 p-2 bg-blue-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700">
                        {selectedFiles.length} file(s) selected
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFiles(null)}
                        className="text-blue-700 hover:bg-blue-100"
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="mt-1 space-y-1">
                      {Array.from(selectedFiles).map((file, index) => (
                        <div key={index} className="text-xs text-blue-600 flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          {file.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  />
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setSelectedFiles(e.target.files)}
                    className="hidden"
                    id="chat-file-input"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => document.getElementById('chat-file-input')?.click()}
                    title="Attach files"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={(!newMessage.trim() && !selectedFiles) || sendMessageMutation.isPending}
                    className="bg-brand-yellow hover:bg-yellow-400 text-rich-black"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Select a chat to start messaging</p>
                <p className="text-sm text-gray-400 mt-1">Choose an order from the left panel</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}