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
      {/* Mobile-First Hero Section - QR & Login Priority */}
      <section className="relative bg-white pt-16 pb-12">
        <div className="max-w-lg mx-auto px-4 sm:max-w-2xl lg:max-w-7xl lg:px-8">
          
          {/* Mobile Hero Title */}
          <div className="text-center mb-8 lg:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-rich-black leading-tight">
              <span className="block">Scan QR Code &</span>
              <span className="block text-brand-yellow mt-1">Print Instantly</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
              Find nearby print shops, scan their QR codes, and start printing in seconds
            </p>
          </div>

          {/* Primary Actions - Mobile Optimized */}
          <div className="space-y-4 lg:hidden">
            {/* Mobile QR Scanner - Giant Button */}
            <Button 
              onClick={() => setShowQRScanner(true)}
              className="w-full bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 py-6 rounded-2xl text-xl font-bold shadow-xl"
              size="lg"
            >
              <QrCode className="w-8 h-8 mr-4" />
              Scan QR Code to Print
            </Button>

            {/* Mobile Login Section */}
            <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
              <h3 className="text-lg font-semibold text-rich-black mb-4 text-center">
                Or Enter Phone Number
              </h3>
              <div className="space-y-3">
                <PhoneInput
                  value={customerPhone}
                  onChange={setCustomerPhone}
                  placeholder="10-digit phone number"
                  className="w-full text-lg py-4"
                />
                <Button 
                  onClick={handleCustomerLogin}
                  className="w-full bg-rich-black text-white hover:bg-gray-800 py-4 text-lg font-semibold"
                >
                  Start Printing Journey
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-center text-sm text-gray-500">
                  Demo: 7434052121
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Layout - Side by Side */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            {/* QR Scan Card - Primary */}
            <div className="bg-brand-yellow rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-center">
                <div className="w-20 h-20 bg-rich-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <QrCode className="w-10 h-10 text-brand-yellow" />
                </div>
                <h2 className="text-2xl font-bold text-rich-black mb-4">Scan QR Code</h2>
                <p className="text-rich-black/80 mb-6 leading-relaxed">
                  Unlock exclusive access to print shops by scanning their QR codes
                </p>
                <Button 
                  onClick={() => setShowQRScanner(true)}
                  size="lg"
                  className="bg-rich-black text-brand-yellow hover:bg-gray-800 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 w-full"
                >
                  <QrCode className="w-6 h-6 mr-3" />
                  Start Scanning
                </Button>
              </div>
            </div>

            {/* Login Card - Secondary */}
            <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-brand-yellow">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Smartphone className="w-10 h-10 text-rich-black" />
                </div>
                <h2 className="text-2xl font-bold text-rich-black mb-4">Login with Phone</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Access your orders, chat with shops, and track progress
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
                    Demo: 7434052121
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators - Mobile Optimized */}
          <div className="grid grid-cols-3 gap-3 mt-8 lg:max-w-3xl lg:mx-auto lg:gap-6">
            <div className="text-center p-3 lg:p-6 bg-gray-50 rounded-xl">
              <div className="text-xl lg:text-3xl font-bold text-brand-yellow mb-1">50+</div>
              <div className="text-xs lg:text-sm text-gray-600 font-medium">Print Shops</div>
            </div>
            <div className="text-center p-3 lg:p-6 bg-gray-50 rounded-xl">
              <div className="text-xl lg:text-3xl font-bold text-brand-yellow mb-1">24/7</div>
              <div className="text-xs lg:text-sm text-gray-600 font-medium">Support</div>
            </div>
            <div className="text-center p-3 lg:p-6 bg-gray-50 rounded-xl">
              <div className="text-xl lg:text-3xl font-bold text-brand-yellow mb-1">2k+</div>
              <div className="text-xs lg:text-sm text-gray-600 font-medium">Customers</div>
            </div>
          </div>
        </div>
      </section>
      {/* Key Features - Mobile First */}
      <section className="py-8 lg:py-16 bg-gray-50">
        <div className="max-w-lg mx-auto px-4 sm:max-w-2xl lg:max-w-7xl lg:px-8">
          
          {/* Mobile: Stack vertically, Desktop: Grid */}
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
            
            {/* QR Code Unlock Feature - Most Important */}
            <div className="bg-brand-yellow rounded-2xl p-6 lg:col-span-1 shadow-lg">
              <div className="text-center">
                <QrCode className="w-12 h-12 text-rich-black mx-auto mb-4" />
                <h3 className="text-xl font-bold text-rich-black mb-3">QR Code Unlock</h3>
                <p className="text-rich-black/80 text-sm leading-relaxed">
                  Scan shop QR codes to instantly unlock ordering capabilities. No registration needed at shops!
                </p>
              </div>
            </div>

            {/* Real-time Chat */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-brand-yellow mx-auto mb-4" />
                <h3 className="text-xl font-bold text-rich-black mb-3">Chat with Shops</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Direct messaging with shop owners. Share files, clarify requirements, get instant updates.
                </p>
              </div>
            </div>

            {/* Order Tracking */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="text-center">
                <Eye className="w-12 h-12 text-brand-yellow mx-auto mb-4" />
                <h3 className="text-xl font-bold text-rich-black mb-3">Live Tracking</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Track your order from upload to pickup. Get notified when your prints are ready.
                </p>
              </div>
            </div>
          </div>

          {/* Mobile CTA */}
          <div className="mt-8 text-center lg:hidden">
            <Button 
              onClick={() => setShowQRScanner(true)}
              className="bg-rich-black text-brand-yellow hover:bg-gray-800 px-8 py-4 rounded-xl font-bold"
            >
              <QrCode className="w-5 h-5 mr-2" />
              Try QR Scanner Now
            </Button>
          </div>
        </div>
      </section>
      {/* How It Works - Mobile Simplified */}
      <section className="py-8 lg:py-16 bg-white">
        <div className="max-w-lg mx-auto px-4 sm:max-w-2xl lg:max-w-7xl lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-4xl font-bold text-rich-black mb-3">
              How It Works
            </h2>
            <p className="text-gray-600 text-sm lg:text-lg">
              Three simple steps to print anything
            </p>
          </div>

          <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-rich-black">1</span>
              </div>
              <h3 className="text-lg font-semibold text-rich-black mb-2">Scan QR Code</h3>
              <p className="text-gray-600 text-sm">Find a print shop and scan their QR code to unlock ordering</p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-rich-black">2</span>
              </div>
              <h3 className="text-lg font-semibold text-rich-black mb-2">Upload & Order</h3>
              <p className="text-gray-600 text-sm">Upload files or book walk-in appointments with specifications</p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-rich-black">3</span>
              </div>
              <h3 className="text-lg font-semibold text-rich-black mb-2">Collect & Pay</h3>
              <p className="text-gray-600 text-sm">Get notified when ready and collect your prints</p>
            </div>
          </div>

          {/* Mobile Bottom CTA */}
          <div className="mt-8 text-center">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-rich-black mb-3">Ready to Print?</h3>
              <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-3 sm:justify-center">
                <Button 
                  onClick={() => setShowQRScanner(true)}
                  className="w-full sm:w-auto bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 px-6 py-3 font-bold"
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  Scan QR Code
                </Button>
                <Button 
                  onClick={handleCustomerLogin}
                  variant="outline"
                  className="w-full sm:w-auto border-rich-black text-rich-black hover:bg-rich-black hover:text-white px-6 py-3"
                >
                  <Smartphone className="w-5 h-5 mr-2" />
                  Login Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Shop Owner Section - Mobile Optimized */}
      <section className="py-8 lg:py-16 bg-brand-yellow">
        <div className="max-w-lg mx-auto px-4 sm:max-w-2xl lg:max-w-4xl lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-rich-black mb-4">
              For Print Shop Owners
            </h2>
            <p className="text-rich-black/80 mb-6 text-sm lg:text-base">
              Join our network and get more customers through QR code marketing
            </p>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-yellow">Free</div>
                  <div className="text-xs text-gray-600">Registration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-yellow">QR</div>
                  <div className="text-xs text-gray-600">Marketing</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-yellow">More</div>
                  <div className="text-xs text-gray-600">Customers</div>
                </div>
              </div>
              
              <Button 
                onClick={() => setShowShopApplication(true)}
                className="w-full bg-rich-black text-brand-yellow hover:bg-gray-800 py-3 font-bold"
              >
                Register Your Print Shop
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
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