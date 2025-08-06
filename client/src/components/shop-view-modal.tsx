import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Store, User, Mail, Phone, MapPin, Clock, Briefcase, 
  Settings, CheckCircle2, X, Globe, Shield, Star, Printer
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
      <div className="bg-white rounded-lg max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="bg-[#FFBF00] p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Store className="w-6 h-6 text-black" />
            <h2 className="text-xl font-bold text-black">{shop.name}</h2>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-black hover:bg-black/10">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Shop Status Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              {shop.isOnline ? (
                <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-800 text-sm font-medium">Online & Available</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-600 text-sm font-medium">Offline</span>
                </div>
              )}
              {shop.acceptsWalkinOrders && (
                <div className="bg-blue-100 px-3 py-1 rounded-full">
                  <span className="text-blue-800 text-sm font-medium">Walk-in Orders</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Contact & Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="w-5 h-5 text-[#FFBF00]" />
                    Contact & Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Owner</p>
                    <p className="text-gray-600">{shop.publicOwnerName || shop.ownerFullName}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Address</p>
                    <p className="text-gray-600">{shop.address}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {shop.city && shop.state && shop.city !== 'Unknown' && shop.state !== 'Unknown' 
                        ? `${shop.city}, ${shop.state}${shop.pinCode ? ` - ${shop.pinCode}` : ''}`
                        : shop.pinCode ? `PIN: ${shop.pinCode}` : 'Location not available'
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Phone</p>
                    <p className="text-gray-600">{shop.phone}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Email</p>
                    <p className="text-gray-600">{shop.email}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Services & Equipment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Briefcase className="w-5 h-5 text-[#FFBF00]" />
                    Services Offered
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {shop.services && shop.services.length > 0 ? (
                      shop.services.map((service: string, index: number) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-[#FFBF00] rounded-full flex items-center justify-center">
                            <Printer className="w-4 h-4 text-black" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{service}</p>
                            <p className="text-sm text-gray-600">Professional service</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Services information not available</p>
                      </div>
                    )}
                    
                    {shop.equipment && shop.equipment.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-gray-900 mb-3">Equipment Available</p>
                        <div className="space-y-2">
                          {shop.equipment.map((item: string, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                              <Settings className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-700">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Experience */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="w-5 h-5 text-[#FFBF00]" />
                    Experience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#FFBF00] mb-2">
                      {shop.yearsOfExperience || '0'} years
                    </div>
                    <p className="text-gray-600">in printing business</p>
                  </div>
                  
                  <div className="text-center pt-4 border-t">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {shop.totalOrders || 0}
                    </div>
                    <p className="text-gray-600 text-sm">Successfully completed orders</p>
                  </div>
                </CardContent>
              </Card>
              {/* Working Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5 text-[#FFBF00]" />
                    Working Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {shop.workingHours ? (
                    <div className="space-y-2">
                      {dayNames.map(({ key, label }) => {
                        const hours = shop.workingHours?.[key];
                        return (
                          <div key={key} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">{label}</span>
                            <div className="flex items-center gap-2">
                              {hours?.is24Hours ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  <Clock className="w-3 h-3 mr-1" />
                                  24/7 Open
                                </Badge>
                              ) : hours?.closed ? (
                                <Badge variant="secondary">
                                  <X className="w-3 h-3 mr-1" />
                                  Closed
                                </Badge>
                              ) : (
                                <span className="text-sm text-gray-600 font-medium">
                                  {hours?.open || '09:00'} - {hours?.close || '18:00'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Custom working hours</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Walk-in Orders Badge */}
              {shop.acceptsWalkinOrders && (
                <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">Accepts walk-in orders</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 pt-6 border-t">
            <Button 
              className="flex-1 bg-[#FFBF00] text-black hover:bg-[#FFBF00]/90 font-medium"
            >
              Login to Print
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-gray-300 hover:bg-gray-50"
            >
              Close Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}