import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  MapPin, Phone, Clock, CheckCircle2, X, 
  Printer, FileText, Package, Scissors, 
  Palette, Scan, Star, Store, Calendar,
  Mail, User, Building, Settings
} from 'lucide-react';
import { format } from 'date-fns';

interface Shop {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  publicOwnerName?: string;
  publicContactNumber?: string;
  services?: string[];
  equipment?: string[];
  yearsOfExperience?: string;
  workingHours?: any;
  acceptsWalkinOrders: boolean;
  isOnline: boolean;
  totalOrders?: number;
  rating?: number;
  createdAt?: string;
}

interface DetailedShopModalProps {
  shop: Shop | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderClick?: (shopSlug: string) => void;
}

export default function DetailedShopModal({ shop, isOpen, onClose, onOrderClick }: DetailedShopModalProps) {
  if (!shop) return null;

  // Format working hours for display
  const formatWorkingHours = (): string[] => {
    if (!shop.workingHours) return ["24/7 Open"];
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return days.map((day, index) => {
      const hours = shop.workingHours[day];
      if (!hours || hours.closed) {
        return `${dayNames[index]}: Closed`;
      }
      if (hours.open === hours.close) {
        return `${dayNames[index]}: 24/7`;
      }
      return `${dayNames[index]}: ${hours.open} - ${hours.close}`;
    });
  };

  // Check if shop is currently open
  const isShopOpen = () => {
    if (!shop.isOnline) return false;
    if (!shop.workingHours) return true;
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);
    const todayHours = shop.workingHours[currentDay];

    if (!todayHours || todayHours.closed) return false;
    if (todayHours.open === todayHours.close) return true;
    
    if (todayHours.open > todayHours.close) {
      return currentTime >= todayHours.open || currentTime <= todayHours.close;
    }
    
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  };

  const handleOrderNow = () => {
    onOrderClick?.(shop.slug);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Store className="w-6 h-6 text-brand-yellow" />
            {shop.name}
            {isShopOpen() ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Open Now
              </Badge>
            ) : (
              <Badge variant="secondary">
                <X className="w-3 h-3 mr-1" />
                Closed
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Information */}
          <div className="space-y-4">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="w-5 h-5 text-brand-yellow" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm text-gray-600">{shop.address}</p>
                    <p className="text-sm text-gray-600">{shop.city}, {shop.state}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-gray-600">{shop.publicContactNumber || shop.phone}</p>
                  </div>
                </div>

                {shop.publicOwnerName && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Owner</p>
                      <p className="text-sm text-gray-600">{shop.publicOwnerName}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shop Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-brand-yellow" />
                  Shop Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-brand-yellow">{shop.totalOrders || 0}</p>
                    <p className="text-sm text-gray-600">Total Orders</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-brand-yellow">{shop.yearsOfExperience || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Years Experience</p>
                  </div>
                </div>
                
                {shop.acceptsWalkinOrders && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Accepts Walk-in Orders
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Services and Hours */}
          <div className="space-y-4">
            {/* Working Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-yellow" />
                  Working Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {formatWorkingHours().map((schedule: string, index: number) => (
                    <div key={index} className="flex justify-between items-center py-1">
                      <span className="text-sm font-medium">{schedule.split(':')[0]}:</span>
                      <span className="text-sm text-gray-600">{schedule.split(':').slice(1).join(':').trim()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Services Offered */}
            {shop.services && shop.services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-brand-yellow" />
                    Services Offered
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {shop.services.map((service, index) => (
                      <Badge key={index} variant="outline" className="justify-start">
                        <Printer className="w-3 h-3 mr-1" />
                        {service}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Equipment Available */}
            {shop.equipment && shop.equipment.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5 text-brand-yellow" />
                    Equipment Available
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {shop.equipment.map((item, index) => (
                      <Badge key={index} variant="outline" className="justify-start">
                        <Package className="w-3 h-3 mr-1" />
                        {item}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {isShopOpen() && (
            <Button 
              onClick={handleOrderNow}
              className="bg-brand-yellow hover:bg-brand-yellow/90 text-rich-black"
            >
              Place Order
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}