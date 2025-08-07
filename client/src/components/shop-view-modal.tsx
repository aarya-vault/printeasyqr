import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Store, User, Mail, Phone, MapPin, Clock, Briefcase, 
  Settings2, CheckCircle2, X, Star, Printer, Award, Building2
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

  // Combine all services from different fields
  const allServices = [
    ...(shop.services || []),
    ...(shop.servicesOffered || [])
  ].filter((service: string, index: number, array: string[]) => array.indexOf(service) === index);

  // Combine all equipment from different fields
  const allEquipment = [
    ...(shop.equipment || []),
    ...(shop.equipmentAvailable || [])
  ].filter((equipment: string, index: number, array: string[]) => array.indexOf(equipment) === index);

  const calculateYearsOfExperience = (formationYear: number | string): number => {
    const currentYear = new Date().getFullYear();
    const year = typeof formationYear === 'string' ? parseInt(formationYear) : formationYear;
    return Math.max(0, currentYear - year);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-[95vw] sm:w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200">
        {/* Header - No Gradients, Pure Brand Colors */}
        <div className="bg-brand-yellow p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center shadow-lg">
                <Store className="w-6 h-6 text-brand-yellow" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">{shop.name}</h2>
                <p className="text-black/80 text-sm">
                  {shop.city && shop.state && shop.city !== 'Unknown' && shop.state !== 'Unknown' 
                    ? `${shop.city}, ${shop.state}${shop.pinCode ? ` - ${shop.pinCode}` : ''}`
                    : shop.pinCode ? `PIN: ${shop.pinCode}` : 'Location not available'
                  }
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={onClose} 
              className="text-black hover:bg-black/10 rounded-full w-10 h-10 p-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Status Section */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {shop.isOnline ? (
              <Badge className="bg-green-100 text-green-800 border-green-200 px-4 py-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Online & Available
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-600 border-gray-200 px-4 py-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                Currently Offline
              </Badge>
            )}
            {shop.acceptsWalkinOrders && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-4 py-2">
                <User className="w-3 h-3 mr-1" />
                Walk-in Orders
              </Badge>
            )}
            {shop.rating && (
              <Badge className="bg-brand-yellow/20 text-black border-brand-yellow/30 px-4 py-2">
                <Star className="w-3 h-3 mr-1 fill-current" />
                {shop.rating}/5
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Contact & Location */}
              <Card className="border-l-4 border-l-brand-yellow shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl text-gray-800">
                    <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-black" />
                    </div>
                    Contact & Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Owner</p>
                    <p className="text-gray-600">{shop.publicOwnerName || shop.ownerFullName || 'Not specified'}</p>
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

                  {shop.email && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Email</p>
                      <p className="text-gray-600">{shop.email}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Services & Equipment */}
              <Card className="border-l-4 border-l-brand-yellow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Briefcase className="w-5 h-5 text-brand-yellow" />
                    Services & Equipment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Services */}
                    {allServices.length > 0 ? (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <Printer className="w-4 h-4 text-brand-yellow" />
                          Services Offered
                        </h4>
                        <div className="grid gap-2">
                          {allServices.map((service: string, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-brand-yellow/5 rounded-lg border border-brand-yellow/20">
                              <div className="w-6 h-6 bg-brand-yellow rounded-full flex items-center justify-center">
                                <Printer className="w-3 h-3 text-black" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">{service}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Services information not available</p>
                      </div>
                    )}
                    
                    {/* Equipment */}
                    {allEquipment.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <Settings2 className="w-4 h-4 text-brand-yellow" />
                          Equipment Available
                        </h4>
                        <div className="grid gap-2">
                          {allEquipment.map((item: string, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                <Settings2 className="w-3 h-3 text-gray-600" />
                              </div>
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
              {/* Experience & Performance */}
              <Card className="border-l-4 border-l-brand-yellow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="w-5 h-5 text-brand-yellow" />
                    Shop Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-brand-yellow/10 rounded-lg">
                      <div className="text-2xl font-bold text-brand-yellow mb-1">
                        {shop.formationYear ? calculateYearsOfExperience(shop.formationYear) : shop.yearsOfExperience || '0'}
                      </div>
                      <p className="text-sm text-gray-600">Years Experience</p>
                    </div>
                    <div className="text-center p-4 bg-brand-yellow/10 rounded-lg">
                      <div className="text-2xl font-bold text-brand-yellow mb-1">
                        {shop.totalOrders || 0}
                      </div>
                      <p className="text-sm text-gray-600">Completed Orders</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Working Hours */}
              <Card className="border-l-4 border-l-brand-yellow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5 text-brand-yellow" />
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
                                  24/7 Open
                                </Badge>
                              ) : hours?.closed ? (
                                <Badge variant="secondary">
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
                      <p>Working hours information not available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Features */}
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
              className="flex-1 bg-brand-yellow text-black hover:bg-brand-yellow/90 font-medium py-3"
            >
              <Printer className="w-4 h-4 mr-2" />
              Login to Print
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-gray-300 hover:bg-gray-50 py-3"
            >
              Close Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}