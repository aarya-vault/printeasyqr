import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User, Package, QrCode, Upload, MapPin, MessageCircle,
  Phone, Eye, Plus, CheckCircle2, Clock, ArrowRight,
  Smartphone, Camera, FileText, Bell, Settings,
  X, ChevronRight, Star, Zap, Shield, HelpCircle
} from 'lucide-react';

interface UserGuidesProps {
  isOpen: boolean;
  onClose: () => void;
  guideType?: 'firstLogin' | 'afterOrder' | 'qrScanning' | 'chatHelp' | 'general';
}

export default function UserGuides({ isOpen, onClose, guideType = 'general' }: UserGuidesProps) {
  const [currentGuide, setCurrentGuide] = useState<string>(guideType);

  const guides = {
    firstLogin: {
      title: "Welcome to PrintEasy! 👋",
      subtitle: "Your digital printing journey starts here",
      sections: [
        {
          icon: <User className="w-6 h-6 text-brand-yellow" />,
          title: "Getting Started",
          content: [
            "You're now logged in with your phone number",
            "No passwords needed - we keep it simple!",
            "Your account is ready for printing orders"
          ]
        },
        {
          icon: <QrCode className="w-6 h-6 text-brand-yellow" />,
          title: "Unlock Print Shops",
          content: [
            "Scan QR codes at local print shops to unlock ordering",
            "Visit shops physically or scan promotional QR codes",
            "Each QR scan unlocks that specific shop for orders"
          ]
        },
        {
          icon: <Upload className="w-6 h-6 text-brand-yellow" />,
          title: "Place Your First Order",
          content: [
            "Upload files: PDF, Word docs, images for printing",
            "Walk-in orders: For users waiting in long queues or tracking shop-placed orders",
            "Track orders real-time from placement to pickup"
          ]
        },
        {
          icon: <MessageCircle className="w-6 h-6 text-brand-yellow" />,
          title: "Chat with Shop Owners",
          content: [
            "Direct messaging with print shop owners",
            "Send additional files through chat",
            "Get updates and clarifications instantly"
          ]
        }
      ]
    },

    afterOrder: {
      title: "Order Placed Successfully! 📦",
      subtitle: "Here's what happens next",
      sections: [
        {
          icon: <Clock className="w-6 h-6 text-brand-yellow" />,
          title: "Order Processing Timeline",
          content: [
            "NEW: Shop owner reviews your order",
            "PROCESSING: Your files are being printed",
            "READY: Order completed, ready for pickup",
            "COMPLETED: Order picked up and finalized"
          ]
        },
        {
          icon: <Bell className="w-6 h-6 text-brand-yellow" />,
          title: "Stay Updated",
          content: [
            "Real-time notifications for status changes",
            "Chat messages from shop owners",
            "Pickup reminders when order is ready"
          ]
        },
        {
          icon: <MessageCircle className="w-6 h-6 text-brand-yellow" />,
          title: "Communicate with Shop",
          content: [
            "Use chat for questions or clarifications",
            "Send additional files if needed",
            "Coordinate pickup times"
          ]
        },
        {
          icon: <Plus className="w-6 h-6 text-brand-yellow" />,
          title: "Add More Files",
          content: [
            "Click 'Add More Files' for processing orders",
            "Upload additional documents anytime",
            "Update specifications if needed"
          ]
        }
      ]
    },

    qrScanning: {
      title: "QR Code Scanning Guide 📱",
      subtitle: "Unlock print shops near you",
      sections: [
        {
          icon: <Camera className="w-6 h-6 text-brand-yellow" />,
          title: "How to Scan QR Codes",
          content: [
            "Tap the golden QR scanner button anywhere",
            "Point camera at shop's QR code",
            "Wait for automatic detection and scan",
            "Shop will be unlocked for ordering"
          ]
        },
        {
          icon: <MapPin className="w-6 h-6 text-brand-yellow" />,
          title: "Where to Find QR Codes",
          content: [
            "Physical shop counters and displays",
            "Shop promotional materials and flyers",
            "Business cards and advertisements",
            "Shop websites and social media"
          ]
        },
        {
          icon: <Shield className="w-6 h-6 text-brand-yellow" />,
          title: "Why QR Scanning?",
          content: [
            "Ensures you visit genuine partner shops",
            "Verifies shop location and authenticity",
            "Unlocks exclusive local pricing",
            "Enables direct shop communication"
          ]
        },
        {
          icon: <Zap className="w-6 h-6 text-brand-yellow" />,
          title: "After Scanning",
          content: [
            "Shop appears in your available shops list",
            "Upload files or book walk-in appointments",
            "View shop details, hours, and services",
            "Start ordering immediately"
          ]
        }
      ]
    },

    chatHelp: {
      title: "Chat System Guide 💬",
      subtitle: "Communicate effectively with shop owners",
      sections: [
        {
          icon: <MessageCircle className="w-6 h-6 text-brand-yellow" />,
          title: "Starting Conversations",
          content: [
            "Chat button appears on every order card",
            "Click to open direct line with shop owner",
            "Order context automatically shared",
            "Chat history saved for reference"
          ]
        },
        {
          icon: <FileText className="w-6 h-6 text-brand-yellow" />,
          title: "Sending Files",
          content: [
            "Use paperclip icon to attach files",
            "Send additional documents anytime",
            "Images, PDFs, Word docs supported",
            "Files automatically linked to order"
          ]
        },
        {
          icon: <Phone className="w-6 h-6 text-brand-yellow" />,
          title: "Getting Responses",
          content: [
            "Shop owners typically respond within hours",
            "Notification badges show unread messages",
            "Real-time message delivery",
            "Professional communication expected"
          ]
        },
        {
          icon: <CheckCircle2 className="w-6 h-6 text-brand-yellow" />,
          title: "Chat Best Practices",
          content: [
            "Be clear about your printing requirements",
            "Share high-quality file images",
            "Ask about pickup times and procedures",
            "Confirm final specifications before printing"
          ]
        }
      ]
    },

    general: {
      title: "PrintEasy Help Center 🎯",
      subtitle: "Everything you need to know",
      sections: [
        {
          icon: <Package className="w-6 h-6 text-brand-yellow" />,
          title: "Order Management",
          content: [
            "Track all orders from dashboard",
            "View detailed order information",
            "Monitor printing progress real-time",
            "Access chat for each order"
          ]
        },
        {
          icon: <Settings className="w-6 h-6 text-brand-yellow" />,
          title: "Account Features",
          content: [
            "Phone-based simple authentication",
            "Order history and tracking",
            "Unlocked shops management",
            "Direct shop communication"
          ]
        },
        {
          icon: <Star className="w-6 h-6 text-brand-yellow" />,
          title: "Platform Benefits",
          content: [
            "Connect with verified local print shops",
            "Real-time order tracking and updates",
            "Secure file handling and processing",
            "24/7 platform availability"
          ]
        },
        {
          icon: <HelpCircle className="w-6 h-6 text-brand-yellow" />,
          title: "Need More Help?",
          content: [
            "Use chat system for shop-specific questions",
            "Contact support through app settings",
            "Visit our help documentation",
            "Call customer service: +91-9876543210"
          ]
        }
      ]
    }
  };

  const currentGuideData = guides[currentGuide as keyof typeof guides];

  const guideOptions = [
    { key: 'firstLogin', label: 'First Time User', icon: <User className="w-4 h-4" /> },
    { key: 'afterOrder', label: 'After Placing Order', icon: <Package className="w-4 h-4" /> },
    { key: 'qrScanning', label: 'QR Code Scanning', icon: <QrCode className="w-4 h-4" /> },
    { key: 'chatHelp', label: 'Chat & Communication', icon: <MessageCircle className="w-4 h-4" /> },
    { key: 'general', label: 'General Help', icon: <HelpCircle className="w-4 h-4" /> }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-rich-black">
            <div className="bg-brand-yellow p-2 rounded-lg">
              <Package className="w-5 h-5 text-rich-black" />
            </div>
            PrintEasy User Guide
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4">
          {/* Guide Navigation */}
          <div className="w-64 border-r pr-4 flex-shrink-0">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">Choose Guide Topic</h3>
            <div className="space-y-2">
              {guideOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setCurrentGuide(option.key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                    currentGuide === option.key
                      ? 'bg-brand-yellow text-rich-black font-medium'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {option.icon}
                  <span className="text-sm">{option.label}</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* Guide Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-rich-black mb-2">
                {currentGuideData.title}
              </h2>
              <p className="text-gray-600 text-lg">{currentGuideData.subtitle}</p>
            </div>

            <div className="space-y-6">
              {currentGuideData.sections.map((section, index) => (
                <Card key={index} className="border-l-4 border-l-brand-yellow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="bg-brand-yellow/10 p-2 rounded-lg">
                        {section.icon}
                      </div>
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {section.content.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-start gap-3">
                          <ArrowRight className="w-4 h-4 text-brand-yellow mt-0.5 flex-shrink-0" />
                          <p className="text-gray-700 text-sm leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Action Buttons */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="font-semibold text-gray-700 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-rich-black"
                  onClick={() => setCurrentGuide('qrScanning')}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  QR Scanner Help
                </Button>
                <Button
                  variant="outline"
                  className="border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-rich-black"
                  onClick={() => setCurrentGuide('chatHelp')}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat Guide
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600">
              Need more help? Contact support: <span className="font-medium">support@printeasy.com</span>
            </p>
            <Button onClick={onClose} className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90">
              Got it!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for showing specific guides
export const useUserGuides = () => {
  const [showGuides, setShowGuides] = useState(false);
  const [guideType, setGuideType] = useState<'firstLogin' | 'afterOrder' | 'qrScanning' | 'chatHelp' | 'general'>('general');

  const showGuide = (type: typeof guideType) => {
    setGuideType(type);
    setShowGuides(true);
  };

  const closeGuides = () => {
    setShowGuides(false);
  };

  return {
    showGuides,
    guideType,
    showGuide,
    closeGuides,
    UserGuidesComponent: () => (
      <UserGuides 
        isOpen={showGuides} 
        onClose={closeGuides} 
        guideType={guideType} 
      />
    )
  };
};