import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Clock, X } from "lucide-react";

interface Shop {
  id: number;
  name: string;
  ownerName: string;
  email: string;
  city: string;
  address: string;
  contactNumber: string;
  isOnline: boolean;
  isApproved: boolean;
  totalOrders: number;
  workingHours?: string;
}

interface ShopViewModalProps {
  shop: Shop;
  onClose: () => void;
}

export function ShopViewModal({ shop, onClose }: ShopViewModalProps) {
  const parseWorkingHours = (hoursStr?: string) => {
    if (!hoursStr) return null;
    try {
      return JSON.parse(hoursStr);
    } catch {
      return null;
    }
  };

  const workingHours = parseWorkingHours(shop.workingHours);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-rich-black">
            {shop.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-yellow" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-gray-600">
                    {shop.city && shop.state && shop.city !== 'Unknown' && shop.state !== 'Unknown' 
                      ? `${shop.city}, ${shop.state}`
                      : shop.pinCode ? `PIN: ${shop.pinCode}` : 'Location not available'
                    }
                  </p>
                  <p className="text-xs text-gray-500">{shop.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-yellow" />
                <div>
                  <p className="text-sm font-medium">Contact</p>
                  <p className="text-sm text-gray-600">{shop.contactNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-yellow" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-gray-600">{shop.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Status</p>
                <div className="flex gap-2">
                  <Badge className={shop.isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {shop.isOnline ? 'Online' : 'Offline'}
                  </Badge>
                  <Badge className={shop.isApproved ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>
                    {shop.isApproved ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Total Orders</p>
                <p className="text-2xl font-bold text-brand-yellow">{shop.totalOrders}</p>
              </div>

              <div>
                <p className="text-sm font-medium">Owner</p>
                <p className="text-sm text-gray-600">{shop.ownerName}</p>
              </div>
            </div>
          </div>

          {/* Working Hours */}
          {workingHours && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-brand-yellow" />
                <p className="text-sm font-medium">Working Hours</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {Object.entries(workingHours).map(([day, hours]: [string, any]) => (
                  <div key={day} className="flex justify-between py-1 px-2 rounded bg-gray-50">
                    <span className="capitalize font-medium">{day}:</span>
                    <span className="text-gray-600">
                      {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
              onClick={() => window.open(`tel:${shop.contactNumber}`, '_blank')}
            >
              <Phone className="w-4 h-4 mr-2" />
              Call Shop
            </Button>
            <Button 
              variant="outline"
              className="border-brand-yellow/30 hover:bg-brand-yellow/10"
              onClick={() => window.open(`mailto:${shop.email}`, '_blank')}
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}