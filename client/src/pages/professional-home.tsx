import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { ProfessionalLayout } from '@/components/professional-layout';
import { ProfessionalLoading } from '@/components/professional-loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Users, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  Phone, 
  MapPin, 
  Star,
  Printer,
  FileText,
  Smartphone,
  User,
  Settings
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Shop {
  id: number;
  name: string;
  publicName: string;
  publicContactNumber: string;
  area: string;
  city: string;
  state: string;
  services: string[];
  isOpen: boolean;
  workingHours: any;
}

export default function ProfessionalHome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch available shops
  const { data: shops = [], isLoading } = useQuery<Shop[]>({
    queryKey: ['/api/shops/available'],
    enabled: !user || user.role === 'customer'
  });

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Hero Section
  const HeroSection = () => (
    <div className="text-center py-16 lg:py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl lg:text-7xl font-bold text-black mb-6 tracking-tight">
          Professional Printing
          <span className="block text-yellow-400">Made Simple</span>
        </h1>
        <p className="text-xl lg:text-2xl text-gray-600 mb-8 leading-relaxed">
          Connect with local print shops, upload your files, and get professional printing done with ease.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            className="btn-primary text-lg px-8 py-4 w-full sm:w-auto"
            onClick={() => setLocation(user ? '/customer/dashboard' : '/auth/phone')}
          >
            <Upload className="mr-2 h-5 w-5" />
            Start Printing Now
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="btn-outline text-lg px-8 py-4 w-full sm:w-auto"
            onClick={() => setLocation('/apply-shop')}
          >
            <Users className="mr-2 h-5 w-5" />
            Register Your Shop
          </Button>
        </div>
      </div>
    </div>
  );

  // Features Section
  const FeaturesSection = () => (
    <div className="py-16 lg:py-24 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-black mb-4">
            Why Choose PrintEasy?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The most efficient way to get professional printing done in your area.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <Upload className="h-8 w-8 text-yellow-600" />,
              title: "Easy File Upload",
              description: "Upload PDF, images, and documents directly. We support all major file formats."
            },
            {
              icon: <MapPin className="h-8 w-8 text-yellow-600" />,
              title: "Local Print Shops",
              description: "Find verified print shops in your area with competitive pricing and quality service."
            },
            {
              icon: <Clock className="h-8 w-8 text-yellow-600" />,
              title: "Real-Time Updates",
              description: "Track your order status and communicate directly with shop owners in real-time."
            },
            {
              icon: <CheckCircle className="h-8 w-8 text-yellow-600" />,
              title: "Quality Assured",
              description: "All registered shops are verified for quality and reliability."
            },
            {
              icon: <Smartphone className="h-8 w-8 text-yellow-600" />,
              title: "Mobile Friendly",
              description: "Use PrintEasy on any device with our responsive, mobile-first design."
            },
            {
              icon: <Star className="h-8 w-8 text-yellow-600" />,
              title: "Professional Service",
              description: "Get professional printing services without the premium pricing."
            }
          ].map((feature, index) => (
            <Card key={index} className="card-professional text-center hover:scale-105 transition-transform duration-300">
              <CardHeader>
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-yellow-50 flex items-center justify-center">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-bold text-black">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  // Available Shops Section (for customers)
  const ShopsSection = () => {
    if (user && user.role !== 'customer') return null;

    return (
      <div className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-black mb-4">
              Available Print Shops
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Choose from verified print shops in your area.
            </p>
            
            {/* Search */}
            <div className="max-w-md mx-auto">
              <input
                type="text"
                placeholder="Search by shop name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-professional"
              />
            </div>
          </div>

          {isLoading ? (
            <ProfessionalLoading message="Finding available shops..." />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredShops.slice(0, 6).map((shop) => (
                <Card key={shop.id} className="card-professional hover:scale-105 transition-transform duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold text-black">
                        {shop.name}
                      </CardTitle>
                      <Badge variant={shop.isOpen ? "default" : "secondary"} className={shop.isOpen ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {shop.isOpen ? "Open" : "Closed"}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {shop.area}, {shop.city}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Services */}
                      <div>
                        <h4 className="font-medium text-black mb-2">Services:</h4>
                        <div className="flex flex-wrap gap-1">
                          {shop.services.slice(0, 3).map((service) => (
                            <Badge key={service} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                          {shop.services.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{shop.services.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Contact */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        {shop.publicContactNumber}
                      </div>

                      {/* Action Button */}
                      <Button 
                        className="btn-primary w-full mt-4"
                        onClick={() => setLocation(`/shop/${shop.id}`)}
                      >
                        Place Order
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredShops.length > 6 && (
            <div className="text-center mt-8">
              <Button 
                variant="outline" 
                className="btn-outline"
                onClick={() => setLocation('/shops')}
              >
                View All Shops
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Quick Actions for logged-in users
  const QuickActionsSection = () => {
    if (!user) return null;

    const actions = {
      customer: [
        { href: '/customer/dashboard', label: 'My Dashboard', icon: <Users className="h-6 w-6" /> },
        { href: '/customer/orders', label: 'My Orders', icon: <FileText className="h-6 w-6" /> },
        { href: '/shops', label: 'Browse Shops', icon: <MapPin className="h-6 w-6" /> }
      ],
      shop_owner: [
        { href: '/shop/dashboard', label: 'Shop Dashboard', icon: <Printer className="h-6 w-6" /> },
        { href: '/shop/orders', label: 'Manage Orders', icon: <FileText className="h-6 w-6" /> },
        { href: '/shop/settings', label: 'Shop Settings', icon: <Star className="h-6 w-6" /> }
      ],
      admin: [
        { href: '/admin/dashboard', label: 'Admin Dashboard', icon: <Users className="h-6 w-6" /> },
        { href: '/admin/applications', label: 'Shop Applications', icon: <FileText className="h-6 w-6" /> },
        { href: '/admin/shops', label: 'Manage Shops', icon: <Printer className="h-6 w-6" /> }
      ]
    };

    const userActions = actions[user.role as keyof typeof actions] || [];

    return (
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-black mb-8">
            Welcome back, {user.name || user.phone || user.email}!
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {userActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="card-professional hover:scale-105 transition-transform duration-300 cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                      {action.icon}
                    </div>
                    <h3 className="font-semibold text-black">{action.label}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProfessionalLayout showHeader className="space-y-0 p-0">
      <HeroSection />
      <FeaturesSection />
      <QuickActionsSection />
      <ShopsSection />
    </ProfessionalLayout>
  );
}