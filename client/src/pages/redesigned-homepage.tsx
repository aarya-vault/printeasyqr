import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Printer, ArrowRight, CheckCircle, Shield, 
  Users, MapPin, Smartphone, FileText, Star,
  Building2, Award, Zap, HeadphonesIcon, Upload,
  MessageCircle, Search, Camera, Download, Eye,
  QrCode, User, Store, ExternalLink, Clock,
  CheckCircle2, Timer, Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import PhoneInput from '@/components/phone-input';
import { useAuth } from '@/hooks/use-auth';
import { ShopOwnerLogin } from '@/components/auth/shop-owner-login';
import { NameCollectionModal } from '@/components/auth/name-collection-modal';
import { useToast } from '@/hooks/use-toast';
import QRScanner from '@/components/qr-scanner';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

export default function RedesignedHomepage() {
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

  // Redirect authenticated users
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

  // Fetch featured shops
  const { data: shops = [], isLoading: shopsLoading } = useQuery({
    queryKey: ['/api/shops'],
    enabled: !user
  });

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
      const response = await fetch('/api/auth/phone-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: customerPhone })
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.requiresName) {
        setTempUser(data.user);
        setShowNameModal(true);
      } else {
        login(data.user);
        navigate('/customer-dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleNameSubmit = async (name: string) => {
    if (!tempUser || !name.trim()) return;
    
    try {
      // Use the auth context updateUser function correctly
      await updateUser({ name: name.trim() });
      setShowNameModal(false);
      navigate('/customer-dashboard');
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleQRScan = (data: string) => {
    console.log('QR Scanned:', data);
    setShowQRScanner(false);
    if (data.includes('/shop/')) {
      navigate(data.replace(window.location.origin, ''));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100">
      {/* Header */}
      <header className="bg-black shadow-lg border-b-4 border-yellow-400">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
                <Printer className="h-7 w-7 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-yellow-400">PrintEasy</h1>
                <p className="text-sm text-yellow-200">QR Print Platform</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="#features" className="text-white hover:text-yellow-400 transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-white hover:text-yellow-400 transition-colors">
                How It Works
              </Link>
              <Link href="#contact" className="text-white hover:text-yellow-400 transition-colors">
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-yellow-600/5"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <Badge className="bg-yellow-400 text-black hover:bg-yellow-500 mb-4">
                🚀 India's Premier QR Print Network
              </Badge>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-black mb-6 leading-tight">
              Print Anywhere,
              <span className="text-yellow-600 block">Scan & Order</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-700 mb-12 leading-relaxed">
              Connect with local print shops instantly. Upload files, place orders, 
              and get professional printing done through our revolutionary QR system.
            </p>

            {/* Action Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
              {/* Customer Login */}
              <Card className="border-2 border-yellow-400 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-8 w-8 text-black" />
                    </div>
                    <h3 className="text-2xl font-bold text-black mb-2">Customer Access</h3>
                    <p className="text-gray-600">Order prints from local shops</p>
                  </div>
                  
                  <div className="space-y-4">
                    <PhoneInput
                      value={customerPhone}
                      onChange={setCustomerPhone}
                      placeholder="Enter your phone number"
                      className="border-2 border-gray-200 focus:border-yellow-400"
                    />
                    
                    <Button 
                      onClick={handleCustomerLogin}
                      disabled={loginLoading}
                      className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 text-lg border-2 border-yellow-400 hover:border-yellow-500 transition-all duration-300"
                    >
                      {loginLoading ? 'Connecting...' : 'Access Dashboard'}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* QR Scanner */}
              <Card className="border-2 border-black bg-black shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <QrCode className="h-8 w-8 text-black" />
                    </div>
                    <h3 className="text-2xl font-bold text-yellow-400 mb-2">Scan QR Code</h3>
                    <p className="text-yellow-200">Instant shop access via QR</p>
                  </div>
                  
                  <Button 
                    onClick={() => setShowQRScanner(true)}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 text-lg border-2 border-yellow-400 hover:border-yellow-500 transition-all duration-300"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Scan Shop QR Code
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Shop Owner Login */}
            <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200">
              <div className="text-center mb-6">
                <Store className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-black">Print Shop Owner?</h3>
                <p className="text-gray-600">Manage your shop and orders</p>
              </div>
              <ShopOwnerLogin />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-4">Why Choose PrintEasy?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Revolutionary features that make printing simple, fast, and reliable
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: QrCode,
                title: 'QR-Powered Access',
                description: 'Scan any shop QR code for instant access to their services and pricing'
              },
              {
                icon: Upload,
                title: 'Easy File Upload',
                description: 'Upload documents, images, and designs directly from your device'
              },
              {
                icon: MessageCircle,
                title: 'Real-time Chat',
                description: 'Communicate directly with shop owners for custom requirements'
              },
              {
                icon: Clock,
                title: 'Fast Processing',
                description: 'Quick order processing with real-time status updates'
              },
              {
                icon: Shield,
                title: 'Secure Platform',
                description: 'Enterprise-grade security for your files and personal data'
              },
              {
                icon: Award,
                title: 'Quality Assurance',
                description: 'Verified print shops with quality guarantees and ratings'
              }
            ].map((feature, index) => (
              <Card key={index} className="border-2 border-gray-100 hover:border-yellow-400 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-8 text-center">
                  <feature.icon className="h-16 w-16 text-yellow-600 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-black mb-4">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
                  <Printer className="h-7 w-7 text-black" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-yellow-400">PrintEasy</h3>
                  <p className="text-yellow-200">QR Print Platform</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                Connecting customers with local print shops across India through innovative QR technology. 
                Fast, reliable, and convenient printing solutions.
              </p>
              <div className="flex space-x-4">
                <Button variant="outline" size="sm" className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Support
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-yellow-400 mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-gray-300 hover:text-yellow-400 transition-colors">Features</Link></li>
                <li><Link href="#how-it-works" className="text-gray-300 hover:text-yellow-400 transition-colors">How It Works</Link></li>
                <li><Link href="/browse-shops" className="text-gray-300 hover:text-yellow-400 transition-colors">Browse Shops</Link></li>
                <li><Link href="/shop-login" className="text-gray-300 hover:text-yellow-400 transition-colors">Shop Owner Login</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-yellow-400 mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center">
                  <Headphones className="h-4 w-4 mr-2" />
                  24/7 Support
                </li>
                <li className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  All India Coverage
                </li>
                <li className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Secure & Reliable
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 PrintEasy QR. All rights reserved. | Revolutionizing print services across India.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <NameCollectionModal
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        onSubmit={handleNameSubmit}
        user={tempUser}
      />

      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Scan Shop QR Code</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowQRScanner(false)}
              >
                Close
              </Button>
            </div>
            <QRScanner onResult={handleQRScan} />
          </div>
        </div>
      )}
    </div>
  );
}