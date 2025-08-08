import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Printer, ArrowRight, CheckCircle, Clock, Shield, 
  Users, MapPin, Smartphone, FileText, Star,
  Building2, Award, Zap, HeadphonesIcon, Upload,
  MessageCircle, Search, Camera, Download, Eye,
  ChevronRight, Phone, Mail, Globe, CheckCircle2,
  Timer, Headphones, QrCode, User, Store, ExternalLink,
  ArrowDown
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
import QRScanner from '@/components/qr-scanner';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

import PrintEasyLogo from '@/components/common/printeasy-logo';
import PrintEasyLogoNav from '@/components/common/printeasy-logo-nav';
import printEasyQRLogo from '@assets/PrintEasy QR Logo (1)_1754542428551.png';

export default function NewHomepage() {
  const [customerPhone, setCustomerPhone] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [tempUser, setTempUser] = useState<any>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const { user, login, updateUser, getPersistentUserData } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();


  // Auto-fill customer phone from persistent data
  useEffect(() => {
    const persistentData = getPersistentUserData();
    if (persistentData?.phone && !user) {
      setCustomerPhone(persistentData.phone);
    }
  }, [getPersistentUserData, user]);

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

    setLoginLoading(true);

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
    } finally {
      setLoginLoading(false);
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
        onShopLogin={() => navigate('/shop-login')}
        additionalActions={
          <Button
            onClick={() => setShowQRScanner(true)}
            className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 font-medium"
            size="sm"
          >
            <QrCode className="w-4 h-4 mr-2" />
            Scan QR
          </Button>
        }
      />
      {showNameModal && (
        <NameCollectionModal
          isOpen={showNameModal}
          onComplete={(name: string) => {
            handleNameUpdate(name);
            setShowNameModal(false);
          }}
        />
      )}
      {/* Hero Section - World-Class Design */}
      <section className="relative bg-white overflow-hidden">
        
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-yellow/5 rounded-full blur-3xl transform translate-x-48 -translate-y-48"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-yellow/3 rounded-full blur-3xl transform -translate-x-40 translate-y-40"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          
          {/* Hero Content - Premium Typography */}
          <div className="text-center max-w-5xl mx-auto mb-20">
            
            {/* Main Message Block */}
            <div className="space-y-8 mb-16">
              
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-tight tracking-tight">
                  Rushing for a print?
                </h1>
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-brand-yellow leading-tight tracking-tight">
                  We made it calm.
                </h2>
              </div>
              
              {/* Elegant Separator */}
              <div className="flex items-center justify-center my-12">
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-32"></div>
                <div className="mx-8 w-3 h-3 bg-brand-yellow rounded-full"></div>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-32"></div>
              </div>
              
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 leading-tight">
                The hassles of printing, <span className="text-brand-yellow relative">gone</span>.
              </p>
              
              <p className="text-xl md:text-2xl text-gray-600 font-medium leading-relaxed mt-8">
                No more WhatsApp or Emails.
              </p>
              
            </div>
            
          </div>

          {/* Action Section - Premium Cards */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Primary QR Scanner - Hero Card */}
              <div className="lg:col-span-8">
                <div 
                  className="relative group cursor-pointer transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
                  onClick={() => setShowQRScanner(true)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-yellow to-yellow-400 rounded-3xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-brand-yellow rounded-3xl p-12 shadow-xl">
                    
                    {/* QR Icon - Premium Design */}
                    <div className="flex justify-center mb-8">
                      <div className="relative">
                        <div className="w-24 h-24 bg-black rounded-2xl flex items-center justify-center shadow-2xl transform -rotate-3 group-hover:rotate-0 transition-transform duration-300">
                          <QrCode className="w-12 h-12 text-brand-yellow" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                          <Zap className="w-3 h-3 text-brand-yellow" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="text-center">
                      <h2 className="text-4xl md:text-5xl font-black text-black mb-6 tracking-tight">
                        Just Scan QR
                      </h2>
                      <p className="text-lg md:text-xl text-black/80 mb-8 leading-relaxed font-medium max-w-2xl mx-auto">
                        No queues, no last-minute panic, and complete privacy for your files.
                      </p>
                      <Button 
                        size="lg" 
                        className="bg-black text-brand-yellow hover:bg-gray-900 px-10 py-4 text-lg font-bold rounded-2xl shadow-xl transform transition-all hover:scale-105"
                      >
                        <Camera className="w-6 h-6 mr-3" />
                        Start Scanning
                      </Button>
                    </div>
                    
                  </div>
                </div>
              </div>

              {/* Secondary Actions - Premium Design */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Browse Shops */}
                <div 
                  className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
                  onClick={() => navigate('/browse-shops')}
                >
                  <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:border-brand-yellow/30 hover:shadow-xl transition-all">
                    <div className="flex items-start space-x-4 mb-6">
                      <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-brand-yellow/10 transition-colors">
                        <Store className="w-7 h-7 text-gray-700 group-hover:text-brand-yellow transition-colors" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-black mb-2">Browse Shops</h3>
                        <p className="text-gray-600 leading-relaxed">Discover verified print shops near you</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full border-2 hover:bg-brand-yellow hover:text-black hover:border-brand-yellow font-semibold"
                    >
                      Explore Shops
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                {/* Customer Access */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="w-14 h-14 bg-brand-yellow rounded-xl flex items-center justify-center shadow-md">
                      <User className="w-7 h-7 text-black" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-black mb-2">Customer Access</h3>
                      <p className="text-gray-600 leading-relaxed">Login to manage your orders</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <PhoneInput
                      value={customerPhone}
                      onChange={setCustomerPhone}
                      placeholder="Mobile number"
                      className="w-full p-4 border-2 border-gray-200 rounded-xl text-black focus:border-brand-yellow"
                    />
                    <Button 
                      onClick={handleCustomerLogin}
                      disabled={loginLoading}
                      className="w-full bg-brand-yellow text-black hover:bg-yellow-400 font-bold py-4 rounded-xl shadow-md transform transition-all hover:scale-[1.02]"
                    >
                      {loginLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </div>
                </div>
                
              </div>
              
            </div>
          </div>
          
        </div>
      </section>
      
      {/* How It Works - Clean Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Three simple steps to get your printing done
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-yellow rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-black">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Scan QR Code</h3>
              <p className="text-gray-600">Find a print shop and scan their QR code to unlock instant ordering</p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-yellow rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-black">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Upload & Order</h3>
              <p className="text-gray-600">Upload your files or book walk-in appointments with custom specifications</p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-yellow rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-black">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Collect & Pay</h3>
              <p className="text-gray-600">Get notified when ready and collect your prints in person</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Key Features - Simple Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose PrintEasy?
            </h2>
            <p className="text-lg text-gray-600">
              Modern printing made simple with QR technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* QR Revolution */}
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-yellow rounded-2xl flex items-center justify-center mx-auto mb-6">
                <QrCode className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">QR Revolution</h3>
              <p className="text-gray-600">Instant ordering without any registration - just scan and print</p>
            </div>

            {/* Real-time Chat */}
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-yellow rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Live Chat</h3>
              <p className="text-gray-600">Chat directly with shop owners for custom requirements</p>
            </div>

            {/* File Support */}
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-yellow rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Upload className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Any File Type</h3>
              <p className="text-gray-600">Upload documents, images, PDFs - up to 500MB per file</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Professional Footer - Brand Colors Only */}
      <footer className="bg-black py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            
            {/* Brand Section */}
            <div className="md:col-span-1">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-brand-yellow rounded-lg flex items-center justify-center mr-4">
                  <Printer className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-brand-yellow">PrintEasy</h3>
                  <p className="text-white text-sm">QR Print Platform</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Revolutionary QR-powered printing platform connecting customers with local print shops across India.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="md:col-span-1">
              <h4 className="text-lg font-semibold text-brand-yellow mb-6">Quick Actions</h4>
              <div className="space-y-4">
                <Button 
                  onClick={() => setShowQRScanner(true)}
                  className="w-full bg-brand-yellow text-black hover:bg-brand-yellow/90 font-semibold justify-start"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan QR Code
                </Button>
                <Button 
                  onClick={() => navigate('/browse-shops')}
                  variant="outline"
                  className="w-full border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-black justify-start"
                >
                  <Store className="w-4 h-4 mr-2" />
                  Browse Shops
                </Button>
              </div>
            </div>

            {/* Contact & Links */}
            <div className="md:col-span-1">
              <h4 className="text-lg font-semibold text-brand-yellow mb-6">Platform</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/shop-login" className="text-gray-300 hover:text-brand-yellow transition-colors flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Shop Owner Login
                  </Link>
                </li>
                <li>
                  <Link href="/apply-shop" className="text-gray-300 hover:text-brand-yellow transition-colors flex items-center">
                    <Building2 className="w-4 h-4 mr-2" />
                    Register Your Shop
                  </Link>
                </li>
                <li className="text-gray-300 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Secure & Private
                </li>
                <li className="text-gray-300 flex items-center">
                  <Headphones className="w-4 h-4 mr-2" />
                  24/7 Support
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2025 PrintEasy QR Platform. All rights reserved.
              </p>
              <div className="flex items-center space-x-4">
                <span className="text-gray-400 text-sm">Made in India</span>
                <div className="w-2 h-2 bg-brand-yellow rounded-full"></div>
                <span className="text-gray-400 text-sm">For India</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          autoRedirect={true}
          onShopUnlocked={(shopId, shopName) => {
            toast({
              title: "Shop Unlocked! 🎉",
              description: `Redirecting to ${shopName} order page...`
            });
          }}
        />
      )}
    </div>
  );
}