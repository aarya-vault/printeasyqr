import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2, X
} from 'lucide-react';
import { LocationDisplay } from '@/hooks/use-location-from-pincode';

// Helper function to calculate years of experience
const calculateYearsOfExperience = (formationYear: number | string): number => {
  const currentYear = new Date().getFullYear();
  const year = typeof formationYear === 'string' ? parseInt(formationYear) : formationYear;
  return Math.max(0, currentYear - year);
};

interface Shop {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  pinCode?: string;
  // Public information
  publicOwnerName?: string;
  publicContactNumber?: string;
  publicAddress?: string;
  completeAddress?: string;
  // Business details with aliases
  services?: string[];
  equipment?: string[];
  servicesOffered?: string[];
  equipmentAvailable?: string[];
  customServices?: string[];
  customEquipment?: string[];
  // Experience
  yearsOfExperience?: string;
  formationYear?: number;
  ownerFullName?: string;
  email?: string;
  ownerPhone?: string;
  // Working hours
  workingHours?: Record<string, {
    open?: string;
    close?: string;
    closed?: boolean;
    is24Hours?: boolean;
  }>;
  // Status
  acceptsWalkinOrders: boolean;
  isOnline: boolean;
  isOpen?: boolean;
  // Statistics
  totalOrders?: number;
  rating?: number;
}

interface DetailedShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop;
  onOrderClick?: (shopSlug: string) => void;
}

export default function DetailedShopModal({ isOpen, onClose, shop, onOrderClick }: DetailedShopModalProps) {
  // Early return if shop is null or undefined
  if (!shop) {
    return null;
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const formatDetailedWorkingHours = () => {
    if (!shop.workingHours) {
      return dayNames.map(day => ({
        day,
        schedule: "Custom hours",
        is24Hours: false,
        status: "unknown"
      }));
    }

    return dayNames.map((day, index) => {
      const dayKey = day.toLowerCase();
      const hours = shop.workingHours?.[dayKey];
      
      if (!hours || hours.closed) {
        return {
          day: dayNames[index],
          schedule: "Closed",
          is24Hours: false,
          status: "closed"
        };
      }
      
      if (hours.is24Hours || (hours.open === "00:00" && hours.close === "23:59")) {
        return {
          day: dayNames[index],
          schedule: "24/7 Open",
          is24Hours: true,
          status: "24hours"
        };
      }
      
      return {
        day: dayNames[index],
        schedule: `${hours.open || '09:00'} - ${hours.close || '18:00'}`,
        is24Hours: false,
        status: "open"
      };
    });
  };

  // Check if shop is currently open
  const isShopOpen = () => {
    if (!shop || !shop.isOnline) return false;
    if (!shop.workingHours) return true;
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);
    const todayHours = shop.workingHours[currentDay];

    if (!todayHours || todayHours.closed) return false;
    if (todayHours.is24Hours || (todayHours.open === "00:00" && todayHours.close === "23:59")) return true;
    
    const open = todayHours.open || '09:00';
    const close = todayHours.close || '18:00';
    
    if (open > close) {
      return currentTime >= open || currentTime <= close;
    }
    
    return currentTime >= open && currentTime <= close;
  };

  const handleOrderNow = () => {
    if (shop?.slug) {
      onOrderClick?.(shop.slug);
    }
    onClose();
  };

  // Combine services: standard + custom, removing duplicates
  const allServices = [
    ...(shop?.services || []),
    ...(shop?.servicesOffered || []),
    ...(shop?.customServices || [])
  ].filter((service, index, array) => array.indexOf(service) === index && service); // Remove duplicates and empty values

  // Combine equipment: standard + custom, removing duplicates
  const allEquipment = [
    ...(shop?.equipment || []),
    ...(shop?.equipmentAvailable || []),
    ...(shop?.customEquipment || [])
  ].filter((equipment, index, array) => array.indexOf(equipment) === index && equipment); // Remove duplicates and empty values

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full mx-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold">{shop.name}</span>
                {isShopOpen() ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Open Now
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    Closed
                  </Badge>
                )}
              </div>
              <LocationDisplay 
                city={shop.city} 
                state={shop.state} 
                pincode={shop.pinCode}
                className="text-sm text-gray-600 mt-1"
                showPincode={false}
              />
            </div>
          </DialogTitle>
          <DialogDescription>
            Detailed information about {shop.name} printing services and availability
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Contact & Statistics */}
          <div className="space-y-6">
            {/* Contact Information Card */}
            <Card className="border-l-4 border-l-brand-yellow">
              <CardHeader>
                <CardTitle className="text-lg">
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-gray-900">Address</p>
                  <p className="text-sm text-gray-600">{shop.address}</p>
                  <LocationDisplay 
                    city={shop.city} 
                    state={shop.state} 
                    pincode={shop.pinCode}
                    className="text-sm text-gray-500 mt-1"
                  />
                </div>
                
                <div>
                  <p className="font-medium text-gray-900">Phone</p>
                  <p className="text-sm text-gray-600">{shop.publicContactNumber || shop.phone}</p>
                </div>

                {shop.publicOwnerName && (
                  <div>
                    <p className="font-medium text-gray-900">Owner</p>
                    <p className="text-sm text-gray-600">{shop.publicOwnerName}</p>
                  </div>
                )}

                {shop.email && (
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{shop.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shop Statistics */}
            <Card className="border-l-4 border-l-brand-yellow">
              <CardHeader>
                <CardTitle className="text-lg">
                  Shop Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {shop.totalOrders > 0 && (
                    <div className="text-center p-4 bg-brand-yellow/10 rounded-lg">
                      <div className="text-2xl font-bold text-brand-yellow">{shop.totalOrders}</div>
                      <p className="text-sm text-gray-600 mt-1">Successfully completed {shop.totalOrders === 1 ? 'order' : 'orders'}</p>
                    </div>
                  )}
                  <div className="text-center p-4 bg-brand-yellow/10 rounded-lg">
                    <div className="text-2xl font-bold text-brand-yellow">
                      {shop.formationYear ? calculateYearsOfExperience(shop.formationYear) : shop.yearsOfExperience || '0'}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Years Experience</p>
                  </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {shop.acceptsWalkinOrders && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Walk-in Orders
                    </Badge>
                  )}
                  {shop.isOnline && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      Online Available
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Services & Hours */}
          <div className="space-y-6">
            {/* Working Hours */}
            <Card className="border-l-4 border-l-brand-yellow">
              <CardHeader>
                <CardTitle className="text-lg">
                  Working Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {formatDetailedWorkingHours().map((dayInfo, index) => (
                    <div key={index} className="flex justify-between items-center py-2 px-3 rounded-lg bg-gray-50">
                      <span className="text-sm font-medium text-gray-700">{dayInfo.day}</span>
                      <div className="flex items-center gap-2">
                        {dayInfo.status === "24hours" ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            24/7 Open
                          </Badge>
                        ) : dayInfo.status === "closed" ? (
                          <Badge variant="secondary">
                            Closed
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-600 font-medium">{dayInfo.schedule}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Services & Equipment Combined */}
            {(allServices.length > 0 || allEquipment.length > 0) && (
              <Card className="border-l-4 border-l-brand-yellow">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Services & Equipment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Services Section */}
                  {allServices.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        Services Offered
                      </h4>
                      <div className="grid gap-2">
                        {allServices.map((service, index) => (
                          <div key={index} className="p-3 bg-brand-yellow/5 rounded-lg border border-brand-yellow/20">
                            <span className="text-sm font-medium text-gray-900">{service}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Equipment Section */}
                  {allEquipment.length > 0 && (
                    <div>
                      {allServices.length > 0 && <Separator className="my-4" />}
                      <h4 className="font-medium text-gray-900 mb-3">
                        Equipment Available
                      </h4>
                      <div className="grid gap-2">
                        {allEquipment.map((equipment, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-sm font-medium text-gray-900">{equipment}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {allServices.length === 0 && allEquipment.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>Services and equipment information will be available soon</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 pt-6 border-t">
          <Button 
            onClick={() => window.open(`tel:${shop.phone}`, '_self')}
            className="flex-1 bg-brand-yellow text-black hover:bg-brand-yellow/90 font-medium py-3"
          >
            Call the Shop
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 border-gray-300 hover:bg-gray-50 py-3"
          >
            Close Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}