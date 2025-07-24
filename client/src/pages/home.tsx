import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Store, Clock, MapPin, Users, FileText, Image, BookOpen, Layout, Printer, ShieldCheck } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-rich-black">Shop Owner Login</h2>
          <button onClick={onClose} className="text-medium-gray hover:text-rich-black">
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Shop Owner Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-brand-yellow text-rich-black hover:bg-yellow-400"
            disabled={isLoading || !email.trim() || !password.trim()}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-rich-black border-t-transparent rounded-full animate-spin" />
            ) : (
              'Login to Dashboard'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  const [showShopLogin, setShowShopLogin] = useState(false);
  const [showShopApplication, setShowShopApplication] = useState(false);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated users to their respective dashboards
  React.useEffect(() => {
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

  const handleShopLogin = () => {
    setShowShopLogin(true);
  };

  const handleShopApplication = () => {
    setShowShopApplication(true);
  };

  const stats = [
    { icon: Store, value: '50+', label: 'Partner Shops' },
    { icon: Clock, value: '15', label: 'Min Average' },
    { icon: MapPin, value: '24/7', label: 'Available' },
    { icon: Users, value: '1000+', label: 'Happy Users' },
  ];

  const services = [
    {
      icon: FileText,
      title: 'Document Printing',
      description: 'Black & white or color documents, reports, presentations, and more'
    },
    {
      icon: Image,
      title: 'Photo Printing',
      description: 'High-quality photo prints in various sizes and finishes'
    },
    {
      icon: BookOpen,
      title: 'Binding & Lamination',
      description: 'Professional binding, lamination, and finishing services'
    },
    {
      icon: Layout,
      title: 'Large Format',
      description: 'Banners, posters, engineering drawings, and signage'
    },
  ];

  const steps = [
    {
      number: 1,
      title: 'Upload & Order',
      description: 'Upload your files or describe your walk-in printing needs through our platform'
    },
    {
      number: 2,
      title: 'Shop Processing',
      description: 'Nearby print shops receive your order and begin processing immediately'
    },
    {
      number: 3,
      title: 'Ready & Collect',
      description: 'Get notified when your order is ready and collect from the shop'
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar 
        onShopLogin={handleShopLogin}
        onShopApplication={handleShopApplication}
      />
      
      {/* Hero Section */}
      <section className="bg-brand-yellow min-h-screen flex items-center relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-20 h-20 border-2 border-rich-black rounded-full floating-animation"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-rich-black opacity-20 rounded-lg floating-animation" style={{ animationDelay: '-2s' }}></div>
          <div className="absolute bottom-32 left-1/4 w-12 h-12 border-2 border-rich-black rounded-lg floating-animation" style={{ animationDelay: '-4s' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl font-bold text-rich-black mb-6 leading-tight">
                Print Anywhere,<br />Anytime
              </h1>
              <p className="text-lg md:text-xl text-rich-black mb-8 opacity-80 max-w-xl">
                Connect with nearby print shops instantly in Ahmedabad Wide. Upload files, place orders, and get your printing done effortlessly.
              </p>
              
              {/* Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-8 mb-12">
                {stats.map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <div key={index} className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-rich-black rounded-xl mb-2 mx-auto lg:mx-0">
                        <IconComponent className="w-6 h-6 text-brand-yellow" />
                      </div>
                      <div className="text-2xl md:text-3xl font-bold text-rich-black">{stat.value}</div>
                      <div className="text-sm text-rich-black opacity-70">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Registration Form */}
            <PhoneLogin 
              onShopLogin={handleShopLogin}
              onShopApplication={handleShopApplication}
            />
          </div>
        </div>
      </section>
      
      {/* Services Section */}
      <section id="services" className="py-20 bg-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-rich-black mb-4">Our Services</h2>
            <p className="text-lg text-medium-gray max-w-2xl mx-auto">
              From documents to large format prints, we connect you with the right print shop for every need
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card key={index} className="hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-brand-yellow rounded-xl flex items-center justify-center mb-4">
                      <IconComponent className="w-6 h-6 text-rich-black" />
                    </div>
                    <h3 className="text-xl font-semibold text-rich-black mb-2">{service.title}</h3>
                    <p className="text-medium-gray">{service.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-rich-black mb-4">How It Works</h2>
            <p className="text-lg text-medium-gray max-w-2xl mx-auto">
              Simple steps to get your printing done quickly and efficiently
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-6 relative">
                  <span className="text-2xl font-bold text-rich-black">{step.number}</span>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 -right-16 w-32 h-0.5 bg-gray-300"></div>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-rich-black mb-3">{step.title}</h3>
                <p className="text-medium-gray">{step.description}</p>
              </div>
            ))}
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
