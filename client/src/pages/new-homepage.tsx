import React, { useState } from 'react';
import { Link } from 'wouter';
import { 
  Printer, ArrowRight, CheckCircle, Clock, Shield, 
  Users, MapPin, Smartphone, FileText, Star,
  Building2, Award, Zap, HeadphonesIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/hooks/use-auth';
import { ShopOwnerLogin } from '@/components/auth/shop-owner-login';
import { NameCollectionModal } from '@/components/auth/name-collection-modal';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';



interface ShopLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ShopLoginModal({ isOpen, onClose }: ShopLoginModalProps) {
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleLogin = () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    // TODO: Implement shop owner login
    toast({
      title: "Login Successful",
      description: "Redirecting to shop dashboard...",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-rich-black mb-4">Shop Owner Login</h3>
        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="text-sm text-medium-gray">
            Use: owner@digitalprint.com
          </p>
        </div>
        <div className="flex gap-3 mt-6">
          <Button 
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleLogin}
            className="flex-1 bg-brand-yellow text-rich-black hover:bg-yellow-500"
          >
            Login
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function NewHomepage() {
  const [customerPhone, setCustomerPhone] = useState('');

  const [showShopLogin, setShowShopLogin] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempUser, setTempUser] = useState<any>(null);
  const { login, updateUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen bg-white">
      <Navbar 
        onShopLogin={() => setShowShopLogin(true)}
      />
      
      {showShopLogin && (
        <ShopOwnerLogin onBack={() => setShowShopLogin(false)} />
      )}
      
      {/* Hero Section */}
      <section className="relative bg-white pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-rich-black mb-6 leading-tight">
                Your Printing
                <span className="block text-brand-yellow">Made Simple</span>
              </h1>
              <p className="text-lg md:text-xl text-medium-gray mb-8 max-w-2xl">
                Connect with trusted local print shops. Upload files, book walk-in appointments, 
                and track your orders in real-time. Professional printing has never been easier.
              </p>
              
              {/* Customer Login Section */}
              <div className="bg-gray-50 p-6 rounded-2xl mb-8 max-w-md mx-auto lg:mx-0">
                <h3 className="text-lg font-semibold text-rich-black mb-4">Get Started Now</h3>
                <div className="flex gap-3">
                  <Input
                    type="tel"
                    placeholder="Enter phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleCustomerLogin}
                    className="bg-brand-yellow text-rich-black hover:bg-yellow-500 px-6"
                  >
                    Start
                  </Button>
                </div>
                <p className="text-sm text-medium-gray mt-2">
                  Try: 9876543211
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-rich-black">500+</div>
                  <div className="text-sm text-medium-gray">Print Shops</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-rich-black">10k+</div>
                  <div className="text-sm text-medium-gray">Happy Customers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-rich-black">24/7</div>
                  <div className="text-sm text-medium-gray">Support</div>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative">
              <div className="bg-brand-yellow rounded-3xl p-8 transform rotate-3 shadow-2xl">
                <div className="bg-white rounded-2xl p-6 transform -rotate-3">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-brand-yellow rounded-full flex items-center justify-center mr-3">
                      <Printer className="w-5 h-5 text-rich-black" />
                    </div>
                    <div>
                      <div className="font-semibold text-rich-black">Digital Print Hub</div>
                      <div className="text-sm text-medium-gray">2.5 km away</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Document Printing</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Photo Printing</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Binding & Lamination</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-brand-yellow text-rich-black hover:bg-yellow-500">
                    Order Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-rich-black mb-4">
              Why Choose PrintEasy?
            </h2>
            <p className="text-lg text-medium-gray max-w-2xl mx-auto">
              Experience the future of printing with our comprehensive platform designed for your convenience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-rich-black" />
                </div>
                <h3 className="font-semibold text-rich-black mb-2">Real-Time Tracking</h3>
                <p className="text-medium-gray text-sm">Track your orders from submission to completion with live updates.</p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-rich-black" />
                </div>
                <h3 className="font-semibold text-rich-black mb-2">Local Shops</h3>
                <p className="text-medium-gray text-sm">Find trusted print shops near you with verified reviews and ratings.</p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-rich-black" />
                </div>
                <h3 className="font-semibold text-rich-black mb-2">File Upload</h3>
                <p className="text-medium-gray text-sm">Upload documents securely and specify exact printing requirements.</p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                  <HeadphonesIcon className="w-6 h-6 text-rich-black" />
                </div>
                <h3 className="font-semibold text-rich-black mb-2">24/7 Support</h3>
                <p className="text-medium-gray text-sm">Get help whenever you need it with our dedicated support team.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-rich-black mb-4">
              How It Works
            </h2>
            <p className="text-lg text-medium-gray max-w-2xl mx-auto">
              Three simple steps to get your printing done professionally and efficiently.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-rich-black">
                1
              </div>
              <h3 className="text-xl font-semibold text-rich-black mb-3">Choose a Shop</h3>
              <p className="text-medium-gray">Browse local print shops, compare services, and select the best option for your needs.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-rich-black">
                2
              </div>
              <h3 className="text-xl font-semibold text-rich-black mb-3">Place Order</h3>
              <p className="text-medium-gray">Upload files or book walk-in appointments with detailed specifications for your printing requirements.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-rich-black">
                3
              </div>
              <h3 className="text-xl font-semibold text-rich-black mb-3">Collect & Enjoy</h3>
              <p className="text-medium-gray">Track progress in real-time and collect your professionally printed materials when ready.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Shop Owner CTA */}
      <section className="py-20 bg-brand-yellow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-rich-black mb-4">
            Own a Print Shop?
          </h2>
          <p className="text-lg text-rich-black mb-8 max-w-2xl mx-auto">
            Join our network of trusted printing partners and grow your business with digital orders and enhanced visibility.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply-shop">
              <Button 
                variant="outline"
                className="border-rich-black text-rich-black hover:bg-rich-black hover:text-white"
              >
                Apply for Partnership
              </Button>
            </Link>
            <Button 
              onClick={() => setShowShopLogin(true)}
              className="bg-rich-black text-white hover:bg-gray-800"
            >
              Shop Owner Login
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-rich-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center">
                  <Printer className="w-5 h-5 text-rich-black" />
                </div>
                <span className="text-xl font-bold">PrintEasy</span>
              </div>
              <p className="text-gray-300 mb-4">
                Connecting customers with professional printing services across India. 
                Fast, reliable, and convenient printing solutions at your fingertips.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Businesses</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/apply-shop" className="hover:text-white">Become a Partner</Link></li>
                <li><a href="#" className="hover:text-white" onClick={() => setShowShopLogin(true)}>Shop Owner Login</a></li>
                <li><Link href="/admin-login" className="hover:text-white">Admin Portal</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2025 PrintEasy. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}

      
      <NameCollectionModal 
        isOpen={showNameModal}
        onComplete={async (name: string) => {
          if (tempUser) {
            await updateUser({ name, needsNameUpdate: false });
            setShowNameModal(false);
            setTempUser(null);
            navigate('/customer-dashboard');
          }
        }}
      />
    </div>
  );
}