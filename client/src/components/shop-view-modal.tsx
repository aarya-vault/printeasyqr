import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Store, User, Mail, Phone, MapPin, Clock, Briefcase, 
  Settings, CheckCircle2, X, Globe, Shield
} from 'lucide-react';

interface ShopViewModalProps {
  shop: any;
  onClose: () => void;
}

export default function ShopViewModal({ shop, onClose }: ShopViewModalProps) {
  const dayNames = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-brand-yellow p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Store className="w-6 h-6 text-rich-black" />
            <h2 className="text-xl font-bold text-rich-black">Shop Details</h2>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-rich-black hover:bg-rich-black/10">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] space-y-6">
          {/* Shop Status */}
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-rich-black">{shop.name}</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${shop.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm font-medium">
                {shop.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Public Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-brand-yellow" />
                <span>Public Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-medium-gray">Shop Name</p>
                  <p className="font-medium">{shop.name}</p>
                </div>
                <div>
                  <p className="text-sm text-medium-gray">Public Owner Name</p>
                  <p className="font-medium">{shop.publicOwnerName || 'Not specified'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-medium-gray">Public Address</p>
                <p className="font-medium">{shop.address}</p>
                <p className="text-sm">{shop.city}, {shop.state} - {shop.pinCode}</p>
              </div>
              <div>
                <p className="text-sm text-medium-gray">Public Contact</p>
                <p className="font-medium">{shop.phone}</p>
              </div>
              <div>
                <p className="text-sm text-medium-gray">Shop URL</p>
                <p className="font-medium text-brand-yellow">/shop/{shop.slug}</p>
              </div>
            </CardContent>
          </Card>

          {/* Owner Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-brand-yellow" />
                <span>Owner Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-medium-gray">Owner Full Name</p>
                  <p className="font-medium">{shop.ownerFullName}</p>
                </div>
                <div>
                  <p className="text-sm text-medium-gray">Owner Phone</p>
                  <p className="font-medium">{shop.ownerPhone}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-medium-gray">Email</p>
                <p className="font-medium">{shop.email}</p>
              </div>
              <div>
                <p className="text-sm text-medium-gray">Complete Address</p>
                <p className="font-medium">{shop.completeAddress}</p>
              </div>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-brand-yellow" />
                <span>Business Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-medium-gray mb-2">Years of Experience</p>
                <p className="font-medium">{shop.yearsOfExperience}</p>
              </div>
              
              <div>
                <p className="text-sm text-medium-gray mb-2">Services Offered</p>
                <div className="flex flex-wrap gap-2">
                  {shop.services?.map((service: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-brand-yellow/20 text-rich-black">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-medium-gray mb-2">Equipment Available</p>
                <div className="flex flex-wrap gap-2">
                  {shop.equipment?.map((item: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-brand-yellow" />
                <span>Working Hours</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dayNames.map(({ key, label }) => {
                  const hours = shop.workingHours?.[key];
                  return (
                    <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="font-medium w-28">{label}</span>
                      {hours?.closed ? (
                        <span className="text-medium-gray">Closed</span>
                      ) : (
                        <span>{hours?.open || '09:00'} - {hours?.close || '18:00'}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Settings & Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-brand-yellow" />
                <span>Settings & Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-medium-gray">Walk-in Orders</p>
                  <p className="font-medium">
                    {shop.acceptsWalkinOrders ? 'Accepted' : 'Not Accepted'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-medium-gray">Auto Availability</p>
                  <p className="font-medium">
                    {shop.autoAvailability ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-medium-gray">Total Orders</p>
                  <p className="text-2xl font-bold text-brand-yellow">{shop.totalOrders || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-medium-gray">Rating</p>
                  <p className="text-2xl font-bold text-brand-yellow">⭐ {shop.rating || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm text-medium-gray">Status</p>
                  <Badge className={shop.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {shop.isApproved ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

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