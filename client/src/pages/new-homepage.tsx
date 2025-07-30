import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { 
  Printer, ArrowRight, CheckCircle, Clock, Shield, 
  Users, MapPin, Smartphone, FileText, Star,
  Building2, Award, Zap, HeadphonesIcon, Upload,
  MessageCircle, Search, Camera, Download, Eye,
  ChevronRight, Phone, Mail, Globe, CheckCircle2,
  Timer, Headphones, QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import PhoneInput from '@/components/phone-input';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/hooks/use-auth';
import { ShopOwnerLogin } from '@/components/auth/shop-owner-login';
import { NameCollectionModal } from '@/components/auth/name-collection-modal';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import QRScanner from '@/components/qr-scanner';
import { EnhancedShopApplicationModal } from '@/components/shop/enhanced-shop-application-modal';

export default function NewHomepage() {
  const [customerPhone, setCustomerPhone] = useState('');
  const [showShopLogin, setShowShopLogin] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showShopApplication, setShowShopApplication] = useState(false);
  const [tempUser, setTempUser] = useState<any>(null);
  const { user, login, updateUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Redirect authenticated users to their respective dashboards
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'customer':
          navigate('/customer-dashboard');
          break;
        case 'shop_owner':
          navigate('/shop-dashboard');
          break;
        case 'admin':
          navigate('/admin-dashboard');
          break;
      }
    }
  }, [user, navigate]);

  const handleCustomerLogin = async () => {
    if (!customerPhone.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    if (!/^[6-9]\d{9}$/.test(customerPhone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    try {
      const user = await login({ phone: customerPhone });
      if (user.needsNameUpdate) {
        setShowNameModal(true);
        setTempUser(user);
      } else {
        navigate('/customer-dashboard');
      }
      toast({
        title: "Login Successful",
        description: "Welcome to PrintEasy!",
      });
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleNameUpdate = async (name: string) => {
    if (tempUser && updateUser) {
      await updateUser({ name });
      setShowNameModal(false);
      navigate('/customer-dashboard');
    }
  };

  // Critical USPs from the platform
  const usps = [
    {
      icon: <Upload className="w-6 h-6" />,
      title: "Upload & Print",
      description: "Upload documents directly and get them printed at nearby shops",
      color: "bg-brand-yellow/10 text-rich-black"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Walk-in Booking",
      description: "Pre-book your visit to skip queues and save time",
      color: "bg-brand-yellow/20 text-rich-black"
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Real-time Chat",
      description: "Chat directly with shop owners, share files and requirements",
      color: "bg-brand-yellow/30 text-rich-black"
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: "Order Tracking",
      description: "Track your order status in real-time from placement to pickup",
      color: "bg-brand-yellow/40 text-rich-black"
    },
    {
      icon: <Timer className="w-6 h-6" />,
      title: "Quick Turnaround",
      description: "Get urgent orders processed with priority marking",
      color: "bg-brand-yellow/50 text-rich-black"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Platform",
      description: "Your files and data are encrypted and automatically cleaned",
      color: "bg-gray-50 text-gray-600"
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Find Print Shop",
      description: "Browse nearby verified print shops with ratings and services",
      icon: <Search className="w-5 h-5" />
    },
    {
      step: "2", 
      title: "Place Order",
      description: "Upload files or book walk-in appointments with specifications",
      icon: <Upload className="w-5 h-5" />
    },
    {
      step: "3",
      title: "Track & Chat",
      description: "Monitor order progress and chat with shop owners in real-time",
      icon: <MessageCircle className="w-5 h-5" />
    },
    {
      step: "4",
      title: "Collect & Pay",
      description: "Get notified when ready, collect your prints and pay directly",
      icon: <CheckCircle2 className="w-5 h-5" />
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar 
        onShopLogin={() => setShowShopLogin(true)}
      />
      {showShopLogin && (
        <ShopOwnerLogin onBack={() => setShowShopLogin(false)} />
      )}
      {showNameModal && (
        <NameCollectionModal
          isOpen={showNameModal}
          onSubmit={handleNameUpdate}
        />
      )}
      {/* Hero Section - QR Scan & Login Focus */}
      <section className="relative bg-gradient-to-br from-white via-gray-50 to-white pt-16 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-rich-black mb-8 leading-tight">
              Scan QR & 
              <span className="block text-brand-yellow mt-2">Print Instantly</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              The fastest way to connect with local print shops. Scan QR codes to unlock exclusive ordering access.
            </p>
          </div>
          
          {/* Main Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            {/* QR Scan Card - Primary */}
            <div className="bg-brand-yellow rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 border-4 border-white">
              <div className="text-center">
                <div className="w-20 h-20 bg-rich-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <QrCode className="w-10 h-10 text-brand-yellow" />
                </div>
                <h2 className="text-2xl font-bold text-rich-black mb-4">Scan QR Code</h2>
                <p className="text-rich-black/80 mb-6 leading-relaxed">
                  Unlock exclusive access to print shops by scanning their QR codes. Get instant ordering capabilities!
                </p>
                <Button 
                  onClick={() => setShowQRScanner(true)}
                  size="lg"
                  className="bg-rich-black text-brand-yellow hover:bg-gray-800 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 w-full"
                >
                  <QrCode className="w-6 h-6 mr-3" />
                  Start Scanning Now
                </Button>
              </div>
            </div>

            {/* Login Card - Secondary */}
            <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-brand-yellow">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Smartphone className="w-10 h-10 text-rich-black" />
                </div>
                <h2 className="text-2xl font-bold text-rich-black mb-4">Customer Login</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Already have an account? Login to access your orders, chat with shops, and track progress.
                </p>
                <div className="space-y-3">
                  <PhoneInput
                    value={customerPhone}
                    onChange={setCustomerPhone}
                    placeholder="10-digit phone number"
                    className="w-full text-lg py-3"
                  />
                  <Button 
                    onClick={handleCustomerLogin}
                    className="w-full bg-rich-black text-white hover:bg-gray-800 text-lg py-3 font-semibold"
                    size="lg"
                  >
                    Start Printing Journey
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <div className="text-sm text-gray-500">
                    Try demo: 7434052121
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
            <div className="text-center p-6 bg-white/80 rounded-2xl backdrop-blur-sm border border-gray-100">
              <div className="text-3xl font-bold text-brand-yellow mb-2">50+</div>
              <div className="text-gray-600 font-medium">Verified Print Shops</div>
            </div>
            <div className="text-center p-6 bg-white/80 rounded-2xl backdrop-blur-sm border border-gray-100">
              <div className="text-3xl font-bold text-brand-yellow mb-2">24/7</div>
              <div className="text-gray-600 font-medium">Customer Support</div>
            </div>
            <div className="text-center p-6 bg-white/80 rounded-2xl backdrop-blur-sm border border-gray-100">
              <div className="text-3xl font-bold text-brand-yellow mb-2">2k+</div>
              <div className="text-gray-600 font-medium">Happy Customers</div>
            </div>
          </div>

          {/* For Shop Owners */}
          <div className="bg-gray-50 rounded-2xl p-6 max-w-2xl mx-auto border border-gray-200">
            <h3 className="text-lg font-semibold text-rich-black mb-3 text-center">Are you a Print Shop Owner?</h3>
            <p className="text-gray-600 mb-4 text-center">Join our network and get more customers through QR code marketing</p>
            <div className="flex justify-center">
              <Button 
                variant="outline"
                onClick={() => setShowShopApplication(true)}
                className="border-2 border-rich-black text-rich-black hover:bg-rich-black hover:text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Register Your Print Shop
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* Key Features USPs */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-rich-black mb-4">
              Why Choose PrintEasy?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the future of printing with features designed for your convenience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {usps.map((usp, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 bg-white">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${usp.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    {usp.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-rich-black mb-3">{usp.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{usp.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-rich-black mb-4">
              How PrintEasy Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Four simple steps to get your documents printed professionally
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative text-center">
                {/* Connector Line */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-brand-yellow/30 transform translate-x-4 -translate-y-1/2 z-0"></div>
                )}
                
                <div className="relative z-10">
                  {/* Step Number */}
                  <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4 relative">
                    <span className="text-2xl font-bold text-rich-black">{step.step}</span>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                      {step.icon}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-rich-black mb-3">{step.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Real-time Features Highlight */}
      <section className="py-16 bg-brand-yellow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-rich-black mb-6">
                Stay Connected, Stay Informed
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-brand-yellow" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-rich-black mb-2">Real-time Chat with Shop Owners</h3>
                    <p className="text-rich-black">Communicate directly, share files, and clarify requirements instantly</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                    <Eye className="w-5 h-5 text-brand-yellow" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-rich-black mb-2">Live Order Tracking</h3>
                    <p className="text-rich-black">Know exactly when your order is being processed and ready for pickup</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-brand-yellow" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-rich-black mb-2">Automatic File Cleanup</h3>
                    <p className="text-rich-black">Your files are automatically deleted after order completion for privacy</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-2xl transform rotate-2">
                <div className="transform -rotate-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-brand-yellow rounded-full"></div>
                    <span className="text-sm font-medium text-rich-black">Order Processing</span>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-brand-yellow" />
                        <span className="text-rich-black">Files uploaded - 10:30 AM</span>
                      </div>
                    </div>
                    <div className="bg-brand-yellow/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Printer className="w-4 h-4 text-brand-yellow" />
                        <span className="text-rich-black">Printing started - 10:45 AM</span>
                      </div>
                    </div>
                    <div className="bg-brand-yellow/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-brand-yellow" />
                        <span className="text-rich-black">Ready for pickup - 11:00 AM</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-rich-black text-white hover:bg-gray-800 flex-1">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Call to Action */}
      <section className="py-16 bg-rich-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-[#ffffff]">
            Ready to Experience Hassle-Free Printing?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust PrintEasy for all their printing needs
          </p>
          
          <div className="max-w-sm mx-auto">
            <div className="flex gap-3 mb-4">
              <PhoneInput
                value={customerPhone}
                onChange={setCustomerPhone}
                placeholder="Enter phone number"
                className="flex-1"
              />
              <Button 
                onClick={handleCustomerLogin}
                className="bg-brand-yellow text-rich-black hover:bg-yellow-500 px-6"
              >
                Start Now
              </Button>
            </div>
            <p className="text-sm text-gray-400">
              No registration fees • No hidden charges • Instant access
            </p>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-yellow rounded-full flex items-center justify-center">
                  <Printer className="w-5 h-5 text-rich-black" />
                </div>
                <span className="text-2xl font-bold text-rich-black">PrintEasy</span>
              </div>
              <p className="text-gray-600 mb-4 max-w-md">
                Connecting customers with trusted local print shops for seamless, hassle-free printing experiences.
              </p>
              <div className="flex gap-4">
                <Link href="/apply-shop">
                  <Button variant="outline" size="sm">
                    <Building2 className="w-4 h-4 mr-2" />
                    Partner with Us
                  </Button>
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-rich-black mb-4">For Customers</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>How It Works</li>
                <li>Upload & Print</li>
                <li>Walk-in Booking</li>
                <li>Order Tracking</li>
                <li>Customer Support</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-rich-black mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Headphones className="w-4 h-4" />
                  24/7 Customer Care
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  help@printeasy.com
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  1800-PRINT-NOW
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-600">
              © 2025 PrintEasy. All rights reserved. Made with ♥ for seamless printing experiences.
            </p>
          </div>
        </div>
      </footer>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onShopUnlocked={(shopId, shopName) => {
            toast({
              title: "Shop Unlocked! 🎉",
              description: `You can now place orders at ${shopName}. Login to start ordering.`
            });
          }}
        />
      )}

      {/* Shop Application Modal */}
      {showShopApplication && (
        <EnhancedShopApplicationModal 
          isOpen={showShopApplication} 
          onClose={() => setShowShopApplication(false)} 
        />
      )}
    </div>
  );
}