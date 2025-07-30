import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Store, Clock, MapPin, Users, FileText, Image, BookOpen, Layout, Printer, ShieldCheck, ArrowRight, CheckCircle, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Navbar } from '@/components/layout/navbar';
import { PhoneLogin } from '@/components/auth/phone-login';
import { EnhancedShopApplicationModal } from '@/components/shop/enhanced-shop-application-modal';
import QRScanner from '@/components/qr-scanner';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface ShopLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ShopLoginModal({ isOpen, onClose }: ShopLoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      onClose();
      setLocation('/shop-dashboard');
      toast({
        title: "Welcome to your shop dashboard!",
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials or shop not approved.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-rich-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-rich-black">Shop Owner Login</h2>
          <button onClick={onClose} className="text-medium-gray hover:text-rich-black text-2xl">
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-rich-black mb-2">Shop Email</label>
            <input
              type="email"
              placeholder="Enter your shop email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow transition-colors"
              disabled={isLoading}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-rich-black text-white hover:bg-gray-800 py-3 rounded-xl font-semibold transition-colors"
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Login to Dashboard'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResponsiveHome() {
  const [showShopLogin, setShowShopLogin] = useState(false);
  const [showShopApplication, setShowShopApplication] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect authenticated users to their respective dashboards
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'customer':
          setLocation('/customer-dashboard');
          break;
        case 'shop_owner':
          setLocation('/shop-dashboard');
          break;
        case 'admin':
          setLocation('/admin-dashboard');
          break;
      }
    }
  }, [user, setLocation]);

  const services = [
    {
      icon: FileText,
      title: "Document Printing",
      description: "High-quality document printing with fast turnaround times"
    },
    {
      icon: Image,
      title: "Photo Printing",
      description: "Professional photo prints in various sizes and finishes"
    },
    {
      icon: BookOpen,
      title: "Binding & Lamination", 
      description: "Complete binding services and protective lamination"
    },
    {
      icon: Layout,
      title: "Business Materials",
      description: "Business cards, letterheads, and marketing materials"
    },
    {
      icon: Printer,
      title: "Large Format",
      description: "Banners, posters, and oversized printing solutions"
    },
    {
      icon: ShieldCheck,
      title: "Quality Guaranteed",
      description: "100% satisfaction guarantee on all printing services"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Choose Your Shop",
      description: "Browse local print shops and compare services, prices, and reviews"
    },
    {
      number: "2", 
      title: "Place Your Order",
      description: "Upload files or book walk-in appointments with detailed specifications"
    },
    {
      number: "3",
      title: "Get It Done",
      description: "Track progress in real-time and collect your prints when ready"
    }
  ];

  const features = [
    {
      icon: Clock,
      title: "Real-time Tracking",
      description: "Monitor your order status from submission to completion"
    },
    {
      icon: MapPin,
      title: "Local Network",
      description: "Find the nearest print shops in your area"
    },
    {
      icon: Users,
      title: "Trusted Partners",
      description: "Verified shops with quality ratings and reviews"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar 
        onShopLogin={() => setShowShopLogin(true)}
        onShopApplication={() => setShowShopApplication(true)}
      />
      
      {/* Hero Section - Redesigned with QR Focus */}
      <section className="relative bg-gradient-to-br from-white via-gray-50 to-white pt-16 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-rich-black mb-8 leading-tight">
              Scan QR & 
              <span className="block text-brand-yellow mt-2">Print Instantly</span>
            </h1>
            <p className="text-xl sm:text-2xl text-medium-gray max-w-3xl mx-auto mb-12 leading-relaxed">
              The fastest way to connect with local print shops. Scan QR codes to unlock exclusive ordering access.
            </p>
            
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
                    <Users className="w-10 h-10 text-rich-black" />
                  </div>
                  <h2 className="text-2xl font-bold text-rich-black mb-4">Customer Login</h2>
                  <p className="text-medium-gray mb-6 leading-relaxed">
                    Already have an account? Login to access your orders, chat with shops, and track progress.
                  </p>
                  <div className="space-y-3">
                    <PhoneLogin />
                    <div className="text-sm text-medium-gray">
                      No registration required - just enter your phone number
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
              <div className="text-center p-6 bg-white/80 rounded-2xl backdrop-blur-sm border border-gray-100">
                <div className="text-3xl font-bold text-brand-yellow mb-2">50+</div>
                <div className="text-medium-gray font-medium">Verified Print Shops</div>
              </div>
              <div className="text-center p-6 bg-white/80 rounded-2xl backdrop-blur-sm border border-gray-100">
                <div className="text-3xl font-bold text-brand-yellow mb-2">24/7</div>
                <div className="text-medium-gray font-medium">Customer Support</div>
              </div>
              <div className="text-center p-6 bg-white/80 rounded-2xl backdrop-blur-sm border border-gray-100">
                <div className="text-3xl font-bold text-brand-yellow mb-2">2k+</div>
                <div className="text-medium-gray font-medium">Happy Customers</div>
              </div>
            </div>

            {/* For Shop Owners */}
            <div className="bg-gray-50 rounded-2xl p-6 max-w-2xl mx-auto border border-gray-200">
              <h3 className="text-lg font-semibold text-rich-black mb-3">Are you a Print Shop Owner?</h3>
              <p className="text-medium-gray mb-4">Join our network and get more customers through QR code marketing</p>
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
      
      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-rich-black mb-4">
              Print Anything You Need
            </h2>
            <p className="text-lg text-medium-gray max-w-2xl mx-auto">
              Professional printing services for all your business and personal needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-brand-yellow bg-white">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-brand-yellow rounded-lg flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-7 h-7 text-rich-black" />
                    </div>
                    <h3 className="text-xl font-semibold text-rich-black mb-3">{service.title}</h3>
                    <p className="text-medium-gray leading-relaxed">{service.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-rich-black mb-4 lg:mb-6">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-medium-gray max-w-3xl mx-auto">
              Simple steps to get your printing done quickly and efficiently
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-20 h-20 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                  <span className="text-3xl font-bold text-rich-black">{step.number}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-1/2 w-full h-0.5 bg-gray-300 transform translate-x-10"></div>
                )}
                <h3 className="text-2xl font-bold text-rich-black mb-4">{step.title}</h3>
                <p className="text-medium-gray text-lg leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-rich-black mb-4 lg:mb-6">
              Why Choose PrintEasy
            </h2>
            <p className="text-lg sm:text-xl text-medium-gray max-w-3xl mx-auto">
              We make printing simple, reliable, and convenient for everyone
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="text-center p-8 rounded-2xl bg-gray-50 hover:bg-brand-yellow hover:text-rich-black transition-all duration-300 group">
                  <div className="w-16 h-16 bg-brand-yellow group-hover:bg-rich-black rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <IconComponent className="w-8 h-8 text-rich-black group-hover:text-brand-yellow" />
                  </div>
                  <h3 className="text-xl font-bold text-rich-black mb-4">{feature.title}</h3>
                  <p className="text-medium-gray group-hover:text-rich-black leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-rich-black">
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 lg:mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-6 lg:mb-8">
            Join thousands of satisfied customers and experience hassle-free printing today
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
            <PhoneLogin />
            <Button 
              variant="outline"
              onClick={() => setShowShopApplication(true)}
              className="border-2 border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-rich-black px-6 sm:px-8 py-3 rounded-xl font-semibold transition-colors w-full sm:w-auto"
            >
              Become a Partner Shop
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Modals */}
      <ShopLoginModal 
        isOpen={showShopLogin} 
        onClose={() => setShowShopLogin(false)} 
      />
      <EnhancedShopApplicationModal 
        isOpen={showShopApplication} 
        onClose={() => setShowShopApplication(false)} 
      />
      
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
    </div>
  );
}