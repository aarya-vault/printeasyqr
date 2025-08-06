import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Phone, Mail, User, MapPin, X, MessageSquare
} from 'lucide-react';

interface ShopContactModalProps {
  shop: any;
  onClose: () => void;
}

export default function ShopContactModal({ shop, onClose }: ShopContactModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="bg-brand-yellow p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-6 h-6 text-rich-black" />
            <h2 className="text-xl font-bold text-rich-black">Contact Shop Owner</h2>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-rich-black hover:bg-rich-black/10">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{shop.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-brand-yellow mt-1" />
                <div>
                  <p className="text-sm text-medium-gray">Owner Name</p>
                  <p className="font-medium text-rich-black">{shop.ownerFullName}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-brand-yellow mt-1" />
                <div>
                  <p className="text-sm text-medium-gray">Owner Phone</p>
                  <p className="font-medium text-rich-black">{shop.ownerPhone}</p>
                  <p className="text-xs text-medium-gray mt-1">Primary contact number</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-brand-yellow mt-1" />
                <div>
                  <p className="text-sm text-medium-gray">Public Phone</p>
                  <p className="font-medium text-rich-black">{shop.phone}</p>
                  <p className="text-xs text-medium-gray mt-1">Customer service number</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-brand-yellow mt-1" />
                <div>
                  <p className="text-sm text-medium-gray">Email</p>
                  <p className="font-medium text-rich-black">{shop.email}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-brand-yellow mt-1" />
                <div>
                  <p className="text-sm text-medium-gray">Location</p>
                  <p className="font-medium text-rich-black">{shop.completeAddress}</p>
                  <p className="text-sm text-rich-black">
                    {shop.city && shop.state && shop.city !== 'Unknown' && shop.state !== 'Unknown' 
                      ? `${shop.city}, ${shop.state}${shop.pinCode ? ` - ${shop.pinCode}` : ''}`
                      : shop.pinCode ? `PIN: ${shop.pinCode}` : 'Location not available'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-light-gray p-4 rounded-lg">
            <p className="text-sm text-medium-gray">
              <strong>Note:</strong> Please contact the shop owner directly for any urgent matters or specific inquiries about their services.
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose} className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}