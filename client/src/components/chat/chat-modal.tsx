import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, Store } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/contexts/websocket-context';
import { useAuth } from '@/hooks/use-auth';
import { Message, Order } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  shopName?: string;
}

export function ChatModal({ isOpen, onClose, order, shopName }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { sendMessage, onNewMessage } = useWebSocket();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (order && isOpen) {
      loadMessages();
    }
  }, [order, isOpen]);

  useEffect(() => {
    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      if (message.orderId === order?.id) {
        setMessages(prev => [message, ...prev]);
        scrollToBottom();
      }
    };

    onNewMessage(handleNewMessage);
  }, [order?.id, onNewMessage]);

  const loadMessages = async () => {
    if (!order) return;

    try {
      const response = await fetch(`/api/messages/order/${order.id}`);
      if (response.ok) {
        const messagesData = await response.json();
        setMessages(messagesData.reverse()); // Reverse to show newest at bottom
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !order || !user) return;

    const messageData = {
      type: 'chat_message',
      orderId: order.id,
      senderId: user.id,
      content: newMessage.trim(),
    };

    try {
      // Send via WebSocket
      sendMessage(messageData);
      
      // Add to local state immediately for better UX
      const tempMessage: Message = {
        id: Date.now(), // Temporary ID
        orderId: order.id,
        senderId: user.id,
        content: newMessage.trim(),
        messageType: 'text',
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const isOwnMessage = (message: Message) => {
    return message.senderId === user?.id;
  };

  const getMessageSenderName = (message: Message) => {
    if (isOwnMessage(message)) {
      return 'You';
    }
    return user?.role === 'customer' ? shopName || 'Shop' : 'Customer';
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[500px] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-gray-200 bg-brand-yellow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                {user?.role === 'customer' ? (
                  <Store className="w-4 h-4 text-rich-black" />
                ) : (
                  <User className="w-4 h-4 text-rich-black" />
                )}
              </div>
              <div>
                <DialogTitle className="text-rich-black text-sm font-medium">
                  {user?.role === 'customer' ? shopName || 'Shop' : 'Customer'}
                </DialogTitle>
                <p className="text-xs text-rich-black opacity-70">
                  Order #{order.id}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="text-rich-black hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>
        
        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-medium-gray text-sm py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[80%]">
                    <div
                      className={`rounded-lg p-2 ${
                        isOwnMessage(message)
                          ? 'bg-brand-yellow text-rich-black'
                          : 'bg-light-gray text-rich-black'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className="text-xs text-medium-gray">
                        {getMessageSenderName(message)}
                      </span>
                      <span className="text-xs text-medium-gray">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 text-sm"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newMessage.trim() || isLoading}
              className="bg-brand-yellow text-rich-black hover:bg-yellow-400"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
