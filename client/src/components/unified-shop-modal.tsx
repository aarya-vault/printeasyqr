// Unified Shop Modal - Single Source of Truth for Shop Details Display

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Store, MapPin, Phone, Mail, User, Building2, Clock, CheckCircle, 
  AlertCircle, Star, Wrench, Package, Calendar, ExternalLink, ShoppingCart
} from 'lucide-react';
import { formatWorkingHoursForDisplay, getWorkingHoursDisplay } from '@/utils/working-hours';
import { calculateUnifiedShopStatus } from '@/utils/shop-timing';
import { useLocation } from 'wouter';

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
  yearsOfExperience?: string | number;
  formationYear?: number;
  ownerFullName?: string;
  email?: string;
  ownerPhone?: string;
  // Working hours (handles both string and object formats)
  workingHours?: any;
  // Status
  acceptsWalkinOrders: boolean;
  isOnline: boolean;
  isOpen?: boolean;
  // Statistics
  totalOrders?: number;
  rating?: number;
  // Google Maps Integration
  googleMapsLink?: string;
}

interface UnifiedShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop | null;
  onOrderClick?: (shopSlug: string) => void;
  isUnlocked?: boolean;
}

export default function UnifiedShopModal({ isOpen, onClose, shop, onOrderClick, isUnlocked = false }: UnifiedShopModalProps) {
  const [, navigate] = useLocation();
  
  if (!shop) return null;

  const handleGoogleMapsClick = () => {
    if (shop.googleMapsLink) {
      window.open(shop.googleMapsLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePlaceOrder = () => {
    if (onOrderClick) {
      onOrderClick(shop.slug);
    } else if (shop.slug) {
      navigate(`/shop/${shop.slug}`);
    }
    onClose();
  };

  // Combine all services from different sources
  const getAllServices = (): string[] => {
    const services = [
      ...(Array.isArray(shop.services) ? shop.services : []),
      ...(Array.isArray(shop.servicesOffered) ? shop.servicesOffered : []),
      ...(Array.isArray(shop.customServices) ? shop.customServices : [])
    ];
    
    // Services are now properly parsed from JSON strings by backend
    
    return Array.from(new Set(services.filter(s => s && typeof s === 'string' && s.trim())));
  };

  // Combine all equipment from different sources
  const getAllEquipment = (): string[] => {
    const equipment = [
      ...(Array.isArray(shop.equipment) ? shop.equipment : []),
      ...(Array.isArray(shop.equipmentAvailable) ? shop.equipmentAvailable : []),
      ...(Array.isArray(shop.customEquipment) ? shop.customEquipment : [])
    ];
    
    // Equipment is now properly parsed from JSON strings by backend
    
    return Array.from(new Set(equipment.filter(e => e && typeof e === 'string' && e.trim())));
  };

  // Get proper experience display
  const getExperienceDisplay = (): string => {
    const years = shop.yearsOfExperience;
    
    if (!years) return 'Details Not Available';
    
    const numYears = typeof years === 'string' ? parseInt(years) : years;
    
    if (isNaN(numYears) || numYears === 0) {
      return 'Details Not Available';
    }
    
    return `${numYears} ${numYears === 1 ? 'Year' : 'Years'} Experience`;
  };

  // Get proper address display
  const getAddressDisplay = (): string => {
    // Prioritize short address first, then complete address
    return shop.address || shop.completeAddress || shop.publicAddress || 'Address not available';
  };

  // Get proper location display
  const getLocationDisplay = (): string => {
    if (shop.city && shop.state && shop.city !== 'Unknown' && shop.state !== 'Unknown') {
      return `${shop.city}, ${shop.state}`;
    }
    if (shop.pinCode) return `PIN: ${shop.pinCode}`;
    return 'Location not available';
  };

  // Get working hours formatted for display
  const formattedWorkingHours = formatWorkingHoursForDisplay(shop.workingHours);
  
  // Get shop status using unified logic
  const getShopStatus = () => {
    const unifiedStatus = calculateUnifiedShopStatus({
      isOnline: shop.isOnline,
      workingHours: shop.workingHours,
      acceptsWalkinOrders: shop.acceptsWalkinOrders
    });
    return {
      isOpen: unifiedStatus.isOpen,
      text: unifiedStatus.statusText === 'OPEN' ? 'Open Now' : 'Closed',
      className: unifiedStatus.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    };
  };
  
  const shopStatus = getShopStatus();

  const allServices = getAllServices();
  const allEquipment = getAllEquipment();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold text-rich-black">
            <Store className="w-6 h-6 mr-3 text-brand-yellow" />
            {shop.name}
          </DialogTitle>
          <DialogDescription>
            Complete shop information and services
          </DialogDescription>
        </DialogHeader>

        {/* Shop Status Badge */}
        <div className="flex justify-start -mt-2 mb-4">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${shopStatus.className}`}>
            {shopStatus.isOpen ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <AlertCircle className="w-4 h-4 mr-2" />
            )}
            {shopStatus.text}
          </span>
        </div>

        <div className="space-y-6">
          {/* Status and Overview */}
          <div className="flex flex-wrap items-center gap-3">

            {shop.acceptsWalkinOrders && (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800">
                Walk-in Orders
              </span>
            )}
            {(shop.totalOrders || 0) > 0 && (
              <div className="flex items-center text-sm text-gray-600">
                <Star className="w-4 h-4 mr-1 text-brand-yellow" />
                Successfully completed {shop.totalOrders} orders
              </div>
            )}
          </div>

          <Separator />

          {/* Contact Information */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center text-black">
              <MapPin className="w-5 h-5 mr-2 text-brand-yellow" />
              Contact Information
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Building2 className="w-4 h-4 mr-3 mt-1 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Address</p>
                      <p className="text-sm text-gray-600">{getAddressDisplay()}</p>
                      <p className="text-xs text-gray-500 mt-1">{getLocationDisplay()}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Phone className="w-4 h-4 mr-3 mt-1 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <p className="text-sm text-gray-600">{shop.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <User className="w-4 h-4 mr-3 mt-1 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Owner</p>
                      <p className="text-sm text-gray-600">
                        {shop.ownerFullName || shop.publicOwnerName || 'Shop Owner'}
                      </p>
                    </div>
                  </div>

                  {shop.email && (
                    <div className="flex items-start">
                      <Mail className="w-4 h-4 mr-3 mt-1 text-gray-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <p className="text-sm text-gray-600">{shop.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {shop.googleMapsLink && (
                <div className="mt-4">
                  <Button
                    onClick={handleGoogleMapsClick}
                    variant="outline"
                    size="sm"
                    className="w-full bg-brand-yellow/10 border-brand-yellow/30 text-black hover:bg-brand-yellow hover:text-black font-medium"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    View on Google Maps
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Shop Performance */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center text-black">
              <Calendar className="w-5 h-5 mr-2 text-brand-yellow" />
              Shop Performance
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{getExperienceDisplay()}</p>
                <p className="text-xs text-gray-500">Years Experience</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">
                  {shop.acceptsWalkinOrders ? 'Available' : 'Online Only'}
                </p>
                <p className="text-xs text-gray-500">Walk-in Orders</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Working Hours */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center text-black">
              <Clock className="w-5 h-5 mr-2 text-brand-yellow" />
              Working Hours
            </h4>
            <div className="space-y-2">
              {formattedWorkingHours.map((item: { day: string; hours: string }) => (
                <div key={item.day} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm font-medium text-gray-900">{item.day}</span>
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    item.hours.toLowerCase().includes('closed') ? 'bg-red-100 text-red-800' :
                    item.hours.toLowerCase().includes('24') ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {item.hours}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Services & Equipment */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center text-black">
              <Package className="w-5 h-5 mr-2 text-brand-yellow" />
              Services & Equipment
            </h4>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Services Offered</p>
                {allServices.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allServices.map((service, index) => (
                      <span key={index} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-800">
                        {service}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No services listed</p>
                )}
              </div>
              
              {allEquipment.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Equipment Available</p>
                  <div className="flex flex-wrap gap-2">
                    {allEquipment.map((equipment, index) => (
                      <span key={index} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-gray-300">
                        <Wrench className="w-3 h-3 mr-1" />
                        {equipment}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          {/* Place Order Button - Only show for unlocked shops */}
          {isUnlocked && (
            <Button
              onClick={handlePlaceOrder}
              className="flex-1 bg-[#FFBF00] text-black hover:bg-[#FFBF00]/90 font-semibold"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Place Order
            </Button>
          )}
          
          <Button
            onClick={() => window.open(`tel:${shop.phone}`, "_self")}
            className={`${isUnlocked ? '' : 'flex-1'} bg-green-600 text-white hover:bg-green-700 font-semibold`}
          >
            <Phone className="w-4 h-4 mr-2" />
            Call Shop
          </Button>
          
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}