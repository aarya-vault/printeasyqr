import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/contexts/websocket-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, Paperclip, X, Download, FileText, Image, 
  AlertCircle, CheckCircle, Clock, User, Store
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';


interface Message {
  id: number;
  orderId: number;
  senderId: number;
  senderName: string;
  senderRole: 'customer' | 'shop_owner';
  content: string;
  files?: string;
  createdAt: string;
}

interface Order {
  id: number;
  status: 'new' | 'processing' | 'ready' | 'completed';
  title: string;
  shop?: {
    name: string;
    publicName: string;
  };
  customer?: {
    name: string;
  };
}

interface EnhancedOrderChatProps {
  orderId: number;
  userRole: 'customer' | 'shop_owner';
  onClose: () => void;
}

export default function EnhancedOrderChat({ orderId, userRole, onClose }: EnhancedOrderChatProps) {
  const { user } = useAuth();
  const { socket } = useWebSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch order details
  const { data: order } = useQuery<Order>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId,
  });

  // Fetch messages for this order
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: [`/api/messages/order/${orderId}`],
    enabled: !!orderId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; files?: File[] }) => {
      const formData = new FormData();
      formData.append('orderId', orderId.toString());
      formData.append('content', data.content);
      
      if (data.files && data.files.length > 0) {
        data.files.forEach((file) => {
          formData.append('files', file);
        });
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/order/${orderId}`] });
      setNewMessage('');
      setSelectedFiles([]);
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket real-time message updates
  useEffect(() => {
    if (socket) {
      const handleNewMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'newMessage' && data.data.orderId === orderId) {
            queryClient.invalidateQueries({ queryKey: [`/api/messages/order/${orderId}`] });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.addEventListener('message', handleNewMessage);
      return () => socket.removeEventListener('message', handleNewMessage);
    }
  }, [socket, orderId, queryClient]);

  const handleSendMessage = () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;

    // Check if order is completed
    if (order?.status === 'completed') {
      toast({
        title: "Chat Closed",
        description: "This order is completed. Chat session has ended.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    sendMessageMutation.mutate(
      { content: newMessage.trim(), files: selectedFiles },
      {
        onSettled: () => setIsUploading(false),
      }
    );
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'text/plain'
      ];

      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} is larger than 50MB`,
          variant: "destructive",
        });
        return false;
      }

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const downloadFile = (filename: string) => {
    window.open(`/uploads/${filename}`, '_blank');
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle className="w-3 h-3" />;
      case 'processing': return <Clock className="w-3 h-3" />;
      case 'ready': return <CheckCircle className="w-3 h-3" />;
      case 'completed': return <CheckCircle className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  if (!user || !order) return null;

  const isOrderCompleted = order.status === 'completed';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-rich-black">
                Order Chat: {order.title}
              </DialogTitle>
              <div className="flex items-center gap-4 mt-2">
                <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                  {getStatusIcon(order.status)}
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
                <div className="flex items-center text-sm text-gray-500">
                  {userRole === 'customer' ? (
                    <>
                      <Store className="w-4 h-4 mr-1" />
                      {order.shop?.name}
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-1" />
                      {order.customer?.name}
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 px-6 py-4 max-h-96">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">💬</div>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === user.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === user.id
                        ? 'bg-brand-yellow text-rich-black'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {message.senderId === user.id ? 'You' : message.senderName}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {message.senderRole === 'customer' ? 'Customer' : 'Shop'}
                      </Badge>
                    </div>
                    
                    {message.content && (
                      <p className="text-sm mb-2">{message.content}</p>
                    )}
                    
                    {message.files && (() => {
                      try {
                        const fileList = JSON.parse(message.files);
                        return Array.isArray(fileList) && fileList.length > 0;
                      } catch {
                        return false;
                      }
                    })() && (
                      <div className="space-y-1">
                        {(() => {
                          try {
                            const fileList = JSON.parse(message.files);
                            return Array.isArray(fileList) ? fileList : [];
                          } catch {
                            return [];
                          }
                        })().map((filename: string, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-white/20 rounded"
                          >
                            {getFileIcon(filename)}
                            <span className="text-xs flex-1 truncate">{filename}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => downloadFile(filename)}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="text-xs opacity-75 mt-1">
                      {format(new Date(message.createdAt), 'MMM d, HH:mm')}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* File Upload Preview */}
        {selectedFiles.length > 0 && (
          <div className="px-6 py-2 border-t">
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected Files:</p>
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  {getFileIcon(file.name)}
                  <span className="text-sm flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(1)}MB
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="p-6 pt-0 border-t">
          {isOrderCompleted ? (
            <Card className="bg-gray-50">
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  This order is completed. Chat session has ended.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isUploading}
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={(!newMessage.trim() && selectedFiles.length === 0) || isUploading}
                className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}