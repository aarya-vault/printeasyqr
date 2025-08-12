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
  ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import PhoneInput from '@/components/phone-input';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/hooks/use-auth';
import { useState as useOTPState } from 'react';
import { OTPVerificationModal } from '@/components/auth/otp-verification-modal';
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
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const { user, sendWhatsAppOTP, verifyWhatsAppOTP, updateUser, getPersistentUserData } = useAuth();
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
      
      // 🚀 SMART OTP-FIRST FLOW - Check JWT token, then OTP if needed
      const result = await sendWhatsAppOTP(customerPhone);
      
      if (result.skipOTP) {
        // User already has valid authentication token
        console.log('✅ Homepage Login: Valid token found, skipping OTP');
        
        if (result.user && result.user.needsNameUpdate) {
          setTempUser(result.user);
          setShowNameModal(true);
        } else {
          toast({
            title: "Welcome Back!",
            description: "You were automatically logged in with your previous session",
          });
          navigate('/customer-dashboard');
        }
      } else {
        // Request OTP verification for new/unverified users
        console.log('🔍 Homepage Login: Requesting OTP verification for new user');
        setShowOTPModal(true);
        toast({
          title: "OTP Sent",
          description: "Please check your WhatsApp for the verification code",
        });
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

  const handleOTPVerification = async (otp: string) => {
    try {
      console.log('🔍 OTP Verification: Verifying code for', customerPhone);
      const user = await verifyWhatsAppOTP(customerPhone, otp);
      
      setShowOTPModal(false);
      
      if (user.needsNameUpdate) {
        setTempUser(user);
        setShowNameModal(true);
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome to PrintEasy!",
        });
        navigate('/customer-dashboard');
      }
    } catch (error) {
      console.error('OTP Verification Error:', error);
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Invalid OTP. Please try again.",
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

      {/* Hero Section - Clean Professional */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          
          {/* Hero Content - Mobile First */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 leading-tight mb-4">
              Rushing for a print?
            </h1>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-brand-yellow leading-tight mb-8">
              We made it calm.
            </h2>
            <p className="text-xl md:text-2xl text-gray-800 font-medium leading-tight mb-6">
              The hassles of printing, <span className="text-brand-yellow">gone</span>.
            </p>
            <p className="text-lg text-gray-600 font-normal">
              No more WhatsApp or Emails.
            </p>
          </div>

          {/* Action Cards - Clean Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
            {/* Primary QR Scanner */}
            <div className="md:col-span-2">
              <div 
                className="bg-brand-yellow rounded-xl p-8 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setShowQRScanner(true)}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center mx-auto mb-6">
                    <QrCode className="w-8 h-8 text-brand-yellow" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-semibold text-black mb-4">
                    Just Scan QR
                  </h2>
                  <p className="text-black/70 mb-6 leading-relaxed">
                    No queues, no last-minute panic, and complete privacy for your files.
                  </p>
                  <Button 
                    className="bg-black text-brand-yellow hover:bg-gray-800 px-6 py-2 font-medium rounded-lg"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Scanning
                  </Button>
                </div>
              </div>
            </div>

            {/* Secondary Actions */}
            <div className="space-y-6">
              
              {/* Browse Shops */}
              <div 
                className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:border-brand-yellow hover:shadow-md transition-all"
                onClick={() => navigate('/browse-shops')}
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                    <Store className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-black">Browse Shops</h3>
                    <p className="text-sm text-gray-600">Find nearby print shops</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Explore
                </Button>
              </div>

              {/* Customer Login */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-brand-yellow rounded-lg flex items-center justify-center mr-3">
                    <User className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-black">Customer Login</h3>
                    <p className="text-sm text-gray-600">Manage your orders</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <PhoneInput
                    value={customerPhone}
                    onChange={setCustomerPhone}
                    placeholder="Mobile number"
                    className="w-full p-3 border border-gray-200 rounded-lg text-black focus:border-brand-yellow"
                  />
                  <Button 
                    onClick={handleCustomerLogin}
                    disabled={loginLoading}
                    size="sm"
                    className="w-full bg-brand-yellow text-black hover:bg-yellow-400 font-medium"
                  >
                    {loginLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                    ) : (
                      "Login"
                    )}
                  </Button>
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

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <OTPVerificationModal
          phone={customerPhone}
          isOpen={showOTPModal}
          onClose={() => setShowOTPModal(false)}
          onVerify={handleOTPVerification}
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