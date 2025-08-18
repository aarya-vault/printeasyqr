import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import SEOHead from '../components/SEOHead';
import { 
  Printer, ArrowRight, CheckCircle, Clock, Shield, 
  Users, MapPin, Smartphone, FileText, Star,
  Building2, Award, Zap, HeadphonesIcon, Upload,
  MessageCircle, Search, Camera, Download, Eye,
  ChevronRight, Phone, Mail, Globe, CheckCircle2,
  Timer, Headphones, QrCode, User, Store, ExternalLink,
  ArrowDown, Bell, Heart, LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import PhoneInput from '@/components/phone-input';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/hooks/use-auth';
import { useState as useOTPState } from 'react';

import { NameCollectionModal } from '@/components/auth/name-collection-modal';
import { ShopOwnerLogin } from '@/components/auth/shop-owner-login';

import { useToast } from '@/hooks/use-toast';
import QRScanner from '@/components/qr-scanner';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

import PrintEasyLogo from '@/components/common/printeasy-logo';
import PrintEasyLogoNav from '@/components/common/printeasy-logo-nav';
import printEasyQRLogo from '@assets/PrintEasy QR Logo (1)_1754542428551.png';

export default function NewHomepage() {
  const [customerPhone, setCustomerPhone] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const [showNameModal, setShowNameModal] = useState(false);
  const [tempUser, setTempUser] = useState(null);
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
    try {
      console.log('🔍 Homepage Login: Requesting OTP for', customerPhone);
      
      // 🚀 SIMPLIFIED LOGIN FLOW - Direct phone-based login
      const result = await login({ phone: customerPhone });
      
      if (result && result.needsNameUpdate) {
        setTempUser(result);
        setShowNameModal(true);
      } else {
        toast({
          title: "Welcome Back!",
          description: "You have been logged in successfully",
        });
        navigate('/customer-dashboard');
      }
    } catch (error) {
      console.error('Homepage Login Error:', error);
      toast({
        title: "Authentication Error",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleNameSubmit = async (name: string) => {
    if (!tempUser || !name.trim()) return;
    
    try {
      await updateUser({ name: name.trim() });
      setShowNameModal(false);
      setTempUser(null);
      toast({
        title: "Welcome to PrintEasy!",
        description: "Your account has been set up successfully",
      });
      navigate('/customer-dashboard');
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };



  // Name collection is handled in customer dashboard, not homepage

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
      
      {/* SEO Meta Tags */}
      <SEOHead
        title="PrintEasy QR - Instant Print Shop Discovery & Ordering Platform"
        description="Discover local print shops instantly with QR codes. Upload files, place orders, and get real-time updates. No more WhatsApp or email hassles - just scan and print across India."
        keywords="print shop, QR code printing, online printing India, document printing, local print services, instant printing, file upload printing, print near me, digital printing"
        canonicalUrl="https://printeasyqr.com/"
      />
      
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

      {/* Hero Section - Bold Creative Design */}
      <section className="relative bg-gradient-to-br from-gray-900 via-black to-gray-800 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-yellow/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-yellow/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-brand-yellow/5 to-transparent rounded-full"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          
          {/* Hero Content - Dynamic Layout */}
          <div className="text-center mb-20">
            <div className="relative">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
                Print without the
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow via-yellow-300 to-brand-yellow animate-pulse">
                  chaos
                </span>
              </h1>
              <div className="absolute -top-8 -right-8 w-16 h-16 hidden lg:block">
                <div className="w-full h-full bg-brand-yellow/20 rounded-full animate-ping"></div>
                <QrCode className="absolute inset-4 text-brand-yellow" />
              </div>
            </div>
            
            <p className="text-xl md:text-2xl text-gray-300 font-light leading-relaxed mb-8 max-w-3xl mx-auto">
              Skip queues, eliminate WhatsApp confusion, and get your documents printed with revolutionary QR technology
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                onClick={() => setShowQRScanner(true)}
                className="group relative px-8 py-4 bg-gradient-to-r from-brand-yellow to-yellow-400 text-black text-lg font-bold rounded-2xl shadow-2xl hover:shadow-brand-yellow/50 transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-brand-yellow/30"
              >
                <div className="flex items-center">
                  <QrCode className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                  Scan & Start Printing
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-brand-yellow opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-300"></div>
              </Button>
              
              <Button 
                onClick={() => navigate('/browse-shops')}
                variant="outline"
                className="px-8 py-4 text-brand-yellow border-2 border-brand-yellow/50 text-lg font-semibold rounded-2xl hover:bg-brand-yellow/10 hover:border-brand-yellow transition-all duration-300 backdrop-blur-sm"
              >
                <Store className="w-5 h-5 mr-2" />
                Explore Shops
              </Button>
            </div>
            
            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-brand-yellow mb-1">106+</div>
                <div className="text-sm text-gray-400">Partner Shops</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-brand-yellow mb-1">0sec</div>
                <div className="text-sm text-gray-400">Setup Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-brand-yellow mb-1">100%</div>
                <div className="text-sm text-gray-400">Secure</div>
              </div>
            </div>
          </div>

          {/* Floating Action Cards - Innovative Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
            
            {/* Primary Interactive QR Zone */}
            <div className="lg:col-span-8">
              <div 
                className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 md:p-12 cursor-pointer border border-gray-700 hover:border-brand-yellow/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
                onClick={() => setShowQRScanner(true)}
              >
                {/* Background Animation */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-yellow/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        Instant QR Printing
                      </h2>
                      <p className="text-gray-300 text-lg leading-relaxed">
                        No apps, no registration, no confusion. Just scan and print.
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-br from-brand-yellow to-yellow-400 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform duration-500">
                          <QrCode className="w-12 h-12 text-black" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Features Strip */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-brand-yellow/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Zap className="w-6 h-6 text-brand-yellow" />
                      </div>
                      <p className="text-sm text-gray-400">Instant</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-brand-yellow/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Shield className="w-6 h-6 text-brand-yellow" />
                      </div>
                      <p className="text-sm text-gray-400">Secure</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-brand-yellow/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <MessageCircle className="w-6 h-6 text-brand-yellow" />
                      </div>
                      <p className="text-sm text-gray-400">Live Chat</p>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-brand-yellow to-yellow-400 text-black text-lg font-bold py-4 rounded-2xl hover:shadow-lg hover:shadow-brand-yellow/30 transition-all duration-300"
                  >
                    <Camera className="w-5 h-5 mr-3" />
                    Start QR Scanning Now
                  </Button>
                </div>
              </div>
            </div>

            {/* Vertical Action Panel */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Browse Shops - Redesigned */}
              <div 
                className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 cursor-pointer border-2 border-transparent hover:border-brand-yellow/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                onClick={() => navigate('/browse-shops')}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-brand-yellow/20 to-brand-yellow/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Store className="w-7 h-7 text-brand-yellow" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">Discover Shops</h3>
                    <p className="text-sm text-gray-600 mb-4">Find verified print shops near you</p>
                    <div className="flex items-center text-brand-yellow text-sm font-semibold">
                      Explore <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Login - Sleek Design */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-brand-yellow rounded-xl flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Quick Access</h3>
                    <p className="text-sm text-gray-400">Track your orders</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <PhoneInput
                    value={customerPhone}
                    onChange={setCustomerPhone}
                    placeholder="Mobile number"
                    className="w-full p-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-brand-yellow focus:bg-gray-600 transition-all duration-200"
                  />
                  <Button 
                    onClick={handleCustomerLogin}
                    disabled={loginLoading}
                    className="w-full bg-brand-yellow text-black hover:bg-yellow-400 font-bold py-3 rounded-xl transition-all duration-200"
                  >
                    {loginLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent mr-2"></div>
                        Connecting...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <LogIn className="w-5 h-5 mr-2" />
                        Access Dashboard
                      </div>
                    )}
                  </Button>
                </div>
              </div>
              
            </div>
            
          </div>
          
        </div>
      </section>
      
      {/* How It Works - Revolutionary Visual Design */}
      <section className="relative py-24 bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden">
        {/* Background Art */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-64 h-64 bg-brand-yellow/5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-brand-yellow/3 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Dynamic Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center bg-brand-yellow/10 px-6 py-3 rounded-full mb-8">
              <Zap className="w-5 h-5 text-brand-yellow mr-2" />
              <span className="text-sm font-semibold text-gray-800">Revolutionary Process</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Three steps to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow to-yellow-600">
                printing freedom
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Transform your printing experience from chaos to calm in under 60 seconds
            </p>
          </div>

          {/* Interactive Timeline */}
          <div className="relative">
            {/* Desktop Timeline Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-brand-yellow via-yellow-400 to-brand-yellow transform -translate-y-1/2 z-0"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
              
              {/* Step 1 - Scan Revolution */}
              <div className="group relative">
                <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-xl border-2 border-transparent hover:border-brand-yellow/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-brand-yellow/10">
                  
                  {/* Step Number Floating */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-yellow to-yellow-400 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
                      <span className="text-xl font-black text-black">1</span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="text-center pt-8">
                    <div className="relative mb-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                        <QrCode className="w-12 h-12 text-gray-700 group-hover:text-brand-yellow transition-colors duration-300" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-brand-yellow transition-colors duration-300">
                      Point & Scan
                    </h3>
                    
                    <p className="text-gray-600 leading-relaxed mb-6">
                      Walk into any partner shop, point your camera at their QR code. Zero downloads, zero accounts, zero hassle.
                    </p>
                    
                    <div className="flex items-center justify-center space-x-2 text-sm text-green-600 font-semibold">
                      <CheckCircle className="w-4 h-4" />
                      <span>Instant Access</span>
                    </div>
                  </div>
                </div>
                
                {/* Mobile Connector */}
                <div className="lg:hidden flex justify-center my-8">
                  <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center">
                    <ArrowDown className="w-4 h-4 text-black" />
                  </div>
                </div>
              </div>

              {/* Step 2 - Upload Magic */}
              <div className="group relative">
                <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 lg:p-10 shadow-xl border-2 border-gray-800 hover:border-brand-yellow/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-brand-yellow/20">
                  
                  {/* Step Number Floating */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-yellow to-yellow-400 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
                      <span className="text-xl font-black text-black">2</span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="text-center pt-8">
                    <div className="relative mb-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-brand-yellow/20 to-yellow-400/20 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                        <Upload className="w-12 h-12 text-brand-yellow" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-brand-yellow transition-colors duration-300">
                      Upload & Chat
                    </h3>
                    
                    <p className="text-gray-300 leading-relaxed mb-6">
                      Drop your files, specify requirements, chat live with shop owners. Up to 50MB per file, any format.
                    </p>
                    
                    <div className="flex items-center justify-center space-x-2 text-sm text-brand-yellow font-semibold">
                      <Zap className="w-4 h-4" />
                      <span>Real-time Communication</span>
                    </div>
                  </div>
                </div>
                
                {/* Mobile Connector */}
                <div className="lg:hidden flex justify-center my-8">
                  <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center">
                    <ArrowDown className="w-4 h-4 text-black" />
                  </div>
                </div>
              </div>

              {/* Step 3 - Success Moment */}
              <div className="group relative">
                <div className="bg-gradient-to-br from-brand-yellow to-yellow-400 rounded-3xl p-8 lg:p-10 shadow-xl border-2 border-transparent hover:border-yellow-500 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-400/30">
                  
                  {/* Step Number Floating */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
                      <span className="text-xl font-black text-brand-yellow">3</span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="text-center pt-8">
                    <div className="relative mb-8">
                      <div className="w-24 h-24 bg-black/10 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                        <CheckCircle2 className="w-12 h-12 text-black" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Bell className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-black mb-4">
                      Collect & Done
                    </h3>
                    
                    <p className="text-black/80 leading-relaxed mb-6">
                      Get instant notifications when ready. Walk in, collect your perfect prints, pay and leave. No queues.
                    </p>
                    
                    <div className="flex items-center justify-center space-x-2 text-sm text-black font-semibold">
                      <Timer className="w-4 h-4" />
                      <span>Notification Alerts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Powerful CTA Section */}
          <div className="text-center mt-20">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-yellow to-yellow-400 rounded-3xl blur-lg opacity-30"></div>
              <div className="relative bg-black rounded-3xl p-8 border border-gray-800">
                <h4 className="text-2xl font-bold text-white mb-4">Experience the revolution</h4>
                <p className="text-gray-300 mb-8 max-w-lg mx-auto">Join thousands who've already escaped printing chaos</p>
                
                <Button 
                  onClick={() => setShowQRScanner(true)}
                  className="group relative px-10 py-5 bg-gradient-to-r from-brand-yellow to-yellow-400 text-black text-xl font-bold rounded-2xl shadow-2xl hover:shadow-brand-yellow/50 transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center">
                    <QrCode className="w-7 h-7 mr-4 group-hover:rotate-12 transition-transform duration-300" />
                    Start Your First Scan
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-brand-yellow opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-300"></div>
                </Button>
                
                <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-gray-400">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    No registration
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Works instantly
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    100% secure
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Benefits Section - Artistic Layout */}
      <section className="relative py-24 bg-gradient-to-br from-gray-900 via-black to-gray-800 overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-brand-yellow/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-yellow/3 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-brand-yellow/3 to-transparent rounded-full"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Dynamic Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center bg-brand-yellow/10 px-6 py-3 rounded-full mb-8 backdrop-blur-sm border border-brand-yellow/20">
              <Star className="w-5 h-5 text-brand-yellow mr-2" />
              <span className="text-sm font-semibold text-white">Why We're Different</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Beyond traditional
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow to-yellow-300">
                printing experience
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              We eliminated every frustration you've ever had with print shops
            </p>
          </div>

          {/* Feature Grid - Floating Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            
            {/* Feature 1 - QR Magic */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-yellow/20 to-yellow-400/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700 hover:border-brand-yellow/50 transition-all duration-500 hover:scale-105">
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-brand-yellow to-yellow-400 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <QrCode className="w-10 h-10 text-black" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-brand-yellow transition-colors duration-300">
                    Zero Setup Friction
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    No app downloads, no account creation, no phone verification. Scan QR and you're immediately ordering.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 - Communication */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700 hover:border-blue-400/50 transition-all duration-500 hover:scale-105">
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <MessageCircle className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors duration-300">
                    Live Shop Connection
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Direct chat with shop owners. Share exact requirements, ask questions, get instant responses.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 - File Power */}
            <div className="group relative md:col-span-2 lg:col-span-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700 hover:border-purple-400/50 transition-all duration-500 hover:scale-105">
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-purple-400 transition-colors duration-300">
                    Unlimited File Freedom
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Any format, up to 50MB per file. PDFs, images, documents - all encrypted and auto-deleted after completion.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators - Horizontal Strip */}
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-3xl p-8 backdrop-blur-sm border border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-white mb-2">Bank-Level Security</h4>
                <p className="text-sm text-gray-400">End-to-end encryption</p>
              </div>
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Timer className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-white mb-2">Lightning Fast</h4>
                <p className="text-sm text-gray-400">Real-time everything</p>
              </div>
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-yellow to-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Eye className="w-8 h-8 text-black" />
                </div>
                <h4 className="font-bold text-white mb-2">Full Transparency</h4>
                <p className="text-sm text-gray-400">No hidden charges</p>
              </div>
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-white mb-2">Local Impact</h4>
                <p className="text-sm text-gray-400">Supporting communities</p>
              </div>
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

            {/* Quick Guide */}
            <div className="md:col-span-1">
              <h4 className="text-lg font-semibold text-brand-yellow mb-6">Quick Guide</h4>
              <div className="space-y-4">
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <h5 className="text-brand-yellow font-medium mb-3 flex items-center">
                    <QrCode className="w-4 h-4 mr-2" />
                    For Customers
                  </h5>
                  <ul className="space-y-2 text-sm">
                    <li className="text-gray-300 flex items-start">
                      <span className="text-brand-yellow mr-2 mt-0.5">1.</span>
                      Scan QR at any print shop
                    </li>
                    <li className="text-gray-300 flex items-start">
                      <span className="text-brand-yellow mr-2 mt-0.5">2.</span>
                      Upload files & specify needs
                    </li>
                    <li className="text-gray-300 flex items-start">
                      <span className="text-brand-yellow mr-2 mt-0.5">3.</span>
                      Chat with shop owner
                    </li>
                    <li className="text-gray-300 flex items-start">
                      <span className="text-brand-yellow mr-2 mt-0.5">4.</span>
                      Get notified & collect
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <Link href="/shop-login" className="text-gray-300 hover:text-brand-yellow transition-colors flex items-center text-sm">
                    <User className="w-4 h-4 mr-2" />
                    Shop Owner Login
                  </Link>
                  <Link href="/apply-shop" className="text-gray-300 hover:text-brand-yellow transition-colors flex items-center text-sm">
                    <Building2 className="w-4 h-4 mr-2" />
                    Register Your Shop
                  </Link>
                  <div className="text-gray-300 flex items-center text-sm">
                    <Shield className="w-4 h-4 mr-2" />
                    Secure & Private
                  </div>
                </div>
              </div>
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



      {/* Name Collection Modal */}
      {showNameModal && tempUser && (
        <NameCollectionModal
          isOpen={showNameModal}
          onClose={() => setShowNameModal(false)}
          onSubmit={handleNameSubmit}
          userPhone={tempUser.phone}
        />
      )}

    </div>
  );
}