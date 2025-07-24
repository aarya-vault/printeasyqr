import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Store, Clock, MapPin, Users, FileText, Image, BookOpen, Layout, Printer, ShieldCheck, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Navbar } from '@/components/layout/navbar';
import { PhoneLogin } from '@/components/auth/phone-login';
import { EnhancedShopApplicationModal } from '@/components/shop/enhanced-shop-application-modal';
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
  const { shopLogin } = useAuth();
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
      await shopLogin(email);
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
  const { user } = useAuth();
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
      
      {/* Hero Section */}
      <section className="relative bg-yellow-50 pt-8 pb-16 lg:pt-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-6xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-rich-black mb-6 leading-tight px-4">
              Your One-Stop
              <span className="block text-brand-yellow">Printing Solution</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-medium-gray max-w-4xl mx-auto mb-8 leading-relaxed px-4">
              Connect with trusted local print shops for all your printing needs. 
              From documents to large format prints, we've got you covered.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 px-4">
              <PhoneLogin />
              <div className="text-medium-gray hidden sm:block">or</div>
              <Button 
                variant="outline"
                onClick={() => setShowShopApplication(true)}
                className="border-2 border-rich-black text-rich-black hover:bg-rich-black hover:text-white px-6 sm:px-8 py-3 rounded-xl font-semibold transition-colors w-full sm:w-auto"
              >
                Join as Print Shop
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto text-medium-gray px-4">
              <div className="flex items-center justify-center gap-2">
                <Store className="w-5 h-5" />
                <span className="font-medium text-sm sm:text-base">500+ Partner Shops</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                <span className="font-medium text-sm sm:text-base">10,000+ Happy Customers</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium text-sm sm:text-base">Quality Guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Services Section */}
      <section id="services" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-rich-black mb-4 lg:mb-6">
              Everything You Need to Print
            </h2>
            <p className="text-lg sm:text-xl text-medium-gray max-w-3xl mx-auto">
              From documents to large format prints, we connect you with the right print shop for every need
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card key={index} className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-brand-yellow">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-brand-yellow rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <IconComponent className="w-8 h-8 text-rich-black" />
                    </div>
                    <h3 className="text-xl font-bold text-rich-black mb-4">{service.title}</h3>
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
    </div>
  );
}