import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { 
  Printer, ArrowRight, CheckCircle, Clock, Shield, 
  Users, MapPin, Smartphone, FileText, Star,
  Building2, Award, Zap, HeadphonesIcon, Upload,
  MessageCircle, Search, Camera, Download, Eye,
  ChevronRight, Phone, Mail, Globe, CheckCircle2,
  Timer, Headphones, QrCode, User
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

import PrintEasyLogo from '@/components/common/printeasy-logo';
import PrintEasyLogoNav from '@/components/common/printeasy-logo-nav';

export default function NewHomepage() {
  const [customerPhone, setCustomerPhone] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [tempUser, setTempUser] = useState<any>(null);
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
      {/* Customer Quick Guide - Simplified */}
      <section id="how-it-works" className="py-8 lg:py-16 bg-gray-50">
        <div className="max-w-lg mx-auto px-4 sm:max-w-2xl lg:max-w-4xl lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-rich-black mb-4">
              Customer Quick Guide
            </h2>
            <p className="text-gray-600 mb-6 text-sm lg:text-base">
              Simple steps to get started with PrintEasy
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Guide 1: Upload & Print */}
            <div id="upload-print" className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-brand-yellow/20 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-brand-yellow" />
              </div>
              <h3 className="text-lg font-semibold text-rich-black mb-3">Upload & Print</h3>
              <p className="text-sm text-gray-600 mb-3">
                Upload any file type and get it printed at nearby shops
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Scan shop QR code to unlock ordering</li>
                <li>• Upload any file - no restrictions!</li>
                <li>• Add printing specifications</li>
                <li>• Chat directly with shop owners</li>
              </ul>
            </div>

            {/* Guide 2: Walk-in Booking */}
            <div id="walk-in-booking" className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-brand-yellow/20 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-brand-yellow" />
              </div>
              <h3 className="text-lg font-semibold text-rich-black mb-3">Walk-in Booking</h3>
              <p className="text-sm text-gray-600 mb-3">
                Book your visit to avoid waiting in long queues
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Pre-book your printing session</li>
                <li>• Skip the waiting lines</li>
                <li>• Real-time status updates</li>
              </ul>
            </div>
          </div>

          {/* Order Tracking */}
          <div id="order-tracking" className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-6 h-6 text-brand-yellow" />
              </div>
              <h3 className="text-lg font-semibold text-rich-black mb-3">Order Tracking</h3>
              <p className="text-sm text-gray-600">
                Track your orders in real-time from placement to completion with live chat support
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-8 text-center">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-rich-black mb-3">Ready to Start Printing?</h3>
              <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-3 sm:justify-center">
                <Button 
                  onClick={() => setShowQRScanner(true)}
                  className="w-full sm:w-auto bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 px-6 py-3 font-bold"
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  Scan QR Code Now
                </Button>
                <Button 
                  onClick={handleCustomerLogin}
                  variant="outline"
                  className="w-full sm:w-auto border-rich-black text-rich-black hover:bg-rich-black hover:text-white px-6 py-3"
                >
                  <User className="w-5 h-5 mr-2" />
                  Customer Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      {/* Beautiful Redesigned Footer */}
      <footer className="bg-rich-black text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-yellow rounded-full -translate-y-48 translate-x-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-yellow rounded-full translate-y-32 -translate-x-32"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-5">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center mr-4">
                  <Printer className="w-6 h-6 text-rich-black" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">PrintEasy</h2>
                  <p className="text-brand-yellow text-sm font-medium">Your Print Partner</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6 text-sm leading-relaxed max-w-md">
                Connecting customers with trusted local print shops for seamless, hassle-free printing experiences. 
                Quick, reliable, and always professional.
              </p>
              
              {/* Partner Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Button 
                  variant="outline" 
                  className="bg-transparent border-2 border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-rich-black font-semibold transition-all duration-300"
                  onClick={() => navigate('/apply-shop')}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Register Your Shop
                </Button>
                <Button 
                  variant="outline" 
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-rich-black font-semibold transition-all duration-300"
                  onClick={() => navigate('/shop-login')}
                >
                  <User className="w-4 h-4 mr-2" />
                  Shop Owner Login
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 lg:max-w-md">
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-yellow">50+</div>
                  <div className="text-xs text-gray-400">Verified Shops</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-yellow">2k+</div>
                  <div className="text-xs text-gray-400">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-yellow">24/7</div>
                  <div className="text-xs text-gray-400">Support</div>
                </div>
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="lg:col-span-3">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <div className="w-1 h-6 bg-brand-yellow mr-3 rounded-full"></div>
                For Customers
              </h3>
              <ul className="space-y-3">
                <li><a href="#how-it-works" className="text-gray-300 hover:text-brand-yellow transition-colors text-sm">How It Works</a></li>
                <li><a href="#upload-print" className="text-gray-300 hover:text-brand-yellow transition-colors text-sm">Upload & Print</a></li>
                <li><a href="#walk-in-booking" className="text-gray-300 hover:text-brand-yellow transition-colors text-sm">Walk-in Booking</a></li>
                <li><a href="#order-tracking" className="text-gray-300 hover:text-brand-yellow transition-colors text-sm">Order Tracking</a></li>
                <li><a href="#customer-support" className="text-gray-300 hover:text-brand-yellow transition-colors text-sm">Customer Support</a></li>
              </ul>
            </div>
            
            {/* Contact Support */}
            <div className="lg:col-span-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <div className="w-1 h-6 bg-brand-yellow mr-3 rounded-full"></div>
                Get in Touch
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg backdrop-blur-sm">
                  <div className="w-8 h-8 bg-brand-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Headphones className="w-4 h-4 text-brand-yellow" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">24/7 Customer Care</div>
                    <div className="text-xs text-gray-400">Always here to help</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg backdrop-blur-sm">
                  <div className="w-8 h-8 bg-brand-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-brand-yellow" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">help@printeasy.com</div>
                    <div className="text-xs text-gray-400">Email support</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg backdrop-blur-sm">
                  <div className="w-8 h-8 bg-brand-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-brand-yellow" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">1800-PRINT-NOW</div>
                    <div className="text-xs text-gray-400">Call anytime</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-brand-yellow rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-rich-black">P</span>
                </div>
                <p className="text-sm text-gray-400">
                  © 2025 PrintEasy. All rights reserved.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>Connect</span>
                <div className="w-1 h-1 bg-brand-yellow rounded-full"></div>
                <span>Print</span>
                <div className="w-1 h-1 bg-brand-yellow rounded-full"></div>
                <span>Collect</span>
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