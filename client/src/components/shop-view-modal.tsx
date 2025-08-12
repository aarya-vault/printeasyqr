import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
// No icons imported - clean design per user request

interface ShopViewModalProps {
  shop: any;
  onClose: () => void;
}

export default function ShopViewModal({ shop, onClose }: ShopViewModalProps) {
  const dayNames = [
    { key: 'sunday', label: 'Sunday' },
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
  ];

  // AGGRESSIVE DEBUG - Log the entire shop object first
  console.log('🚨 FULL SHOP OBJECT DEBUG:', shop);
  console.log('🔍 CUSTOM SERVICES RAW:', shop.customServices);
  console.log('🔍 CUSTOM EQUIPMENT RAW:', shop.customEquipment);

  // More robust array handling with extensive logging
  const baseServices = Array.isArray(shop.services) ? shop.services : [];
  const offeredServices = Array.isArray(shop.servicesOffered) ? shop.servicesOffered : [];
  const customServices = Array.isArray(shop.customServices) ? shop.customServices : [];
  
  const baseEquipment = Array.isArray(shop.equipment) ? shop.equipment : [];
  const availableEquipment = Array.isArray(shop.equipmentAvailable) ? shop.equipmentAvailable : [];
  const customEquipment = Array.isArray(shop.customEquipment) ? shop.customEquipment : [];

  console.log('🔍 PROCESSED ARRAYS:', {
    baseServices, offeredServices, customServices,
    baseEquipment, availableEquipment, customEquipment
  });

  // Combine services with explicit logging for each step
  const allServices = [
    ...baseServices,
    ...offeredServices,
    ...customServices
  ].filter((service: string, index: number, array: string[]) => {
    const isValid = service && typeof service === 'string' && service.trim();
    const isUnique = array.indexOf(service) === index;
    console.log(`🔍 SERVICE FILTER: "${service}" -> valid: ${isValid}, unique: ${isUnique}`);
    return isValid && isUnique;
  });

  // Combine equipment with explicit logging for each step  
  const allEquipment = [
    ...baseEquipment,
    ...availableEquipment, 
    ...customEquipment
  ].filter((equipment: string, index: number, array: string[]) => {
    const isValid = equipment && typeof equipment === 'string' && equipment.trim();
    const isUnique = array.indexOf(equipment) === index;
    console.log(`🔍 EQUIPMENT FILTER: "${equipment}" -> valid: ${isValid}, unique: ${isUnique}`);
    return isValid && isUnique;
  });

  console.log('🎯 FINAL RESULTS:', {
    allServices: allServices,
    allEquipment: allEquipment,
    servicesCount: allServices.length,
    equipmentCount: allEquipment.length
  });

  const getExperienceDisplay = (shop: any): string => {
    const years = shop.yearsOfExperience ? parseInt(shop.yearsOfExperience.toString()) : 0;
    return years > 0 ? years.toString() : "Details Not Available";
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-[95vw] sm:w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200">
        {/* Header - No Gradients, Pure Brand Colors */}
        <div className="bg-brand-yellow p-6 relative">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-black">{shop.name}</h2>
              <p className="text-black/80 text-sm">
                {shop.city && shop.state && shop.city !== 'Unknown' && shop.state !== 'Unknown' 
                  ? `${shop.city}, ${shop.state}${shop.pinCode ? ` - ${shop.pinCode}` : ''}`
                  : shop.pinCode ? `PIN: ${shop.pinCode}` : 'Location not available'
                }
              </p>
            </div>
            <Button 
              variant="ghost" 
              onClick={onClose} 
              className="text-black hover:bg-black/10 rounded-full w-10 h-10 p-0"
            >
              ×
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
                Walk-in Orders
              </Badge>
            )}
            {shop.rating && (
              <Badge className="bg-brand-yellow/20 text-black border-brand-yellow/30 px-4 py-2">
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
                  <CardTitle className="text-xl text-gray-800">
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
                  <CardTitle className="text-lg">
                    Services & Equipment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Services */}
                    {allServices.length > 0 ? (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">
                          Services Offered
                        </h4>
                        <div className="grid gap-2">
                          {allServices.map((service: string, index: number) => (
                            <div key={index} className="p-3 bg-brand-yellow/5 rounded-lg border border-brand-yellow/20">
                              <span className="text-sm font-medium text-gray-900">{service}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <p>Services information not available</p>
                      </div>
                    )}
                    
                    {/* Equipment */}
                    {allEquipment.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium text-gray-900 mb-3">
                          Equipment Available
                        </h4>
                        <div className="grid gap-2">
                          {allEquipment.map((item: string, index: number) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
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
                  <CardTitle className="text-lg">
                    Shop Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-brand-yellow/10 rounded-lg">
                      <div className="text-2xl font-bold text-brand-yellow mb-1">
                        {getExperienceDisplay(shop)}
                      </div>
                      <p className="text-sm text-gray-600">Years Experience</p>
                    </div>
                    {(shop.totalOrders || 0) > 0 && (
                      <div className="text-center p-4 bg-brand-yellow/10 rounded-lg">
                        <div className="text-2xl font-bold text-brand-yellow mb-1">
                          {shop.totalOrders}
                        </div>
                        <p className="text-sm text-gray-600">
                          Successfully completed {(shop.totalOrders || 0) === 1 ? 'order' : 'orders'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Working Hours */}
              <Card className="border-l-4 border-l-brand-yellow">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Working Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {shop.workingHours ? (
                    <div className="space-y-2">
                      {dayNames.map(({ key, label }) => {
                        const hours = shop.workingHours?.[label]; // Use label like "Monday"
                        return (
                          <div key={key} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">{label}</span>
                            <div className="flex items-center gap-2">
                              {/* Handle string format first (our primary format) */}
                              {typeof hours === 'string' ? (
                                <span className="text-sm text-gray-600 font-medium">
                                  {hours}
                                </span>
                              ) : hours?.is24Hours ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  24/7 Open
                                </Badge>
                              ) : hours?.closed ? (
                                <Badge variant="secondary">
                                  Closed
                                </Badge>
                              ) : hours?.open && hours?.close ? (
                                <span className="text-sm text-gray-600 font-medium">
                                  {hours.open} - {hours.close}
                                </span>
                              ) : (
                                <Badge variant="secondary">
                                  Closed
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <p>Working hours information not available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Features */}
              {shop.acceptsWalkinOrders && (
                <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-green-800 font-medium">Accepts walk-in orders</span>
                </div>
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
        </div>
      </div>
    </div>
  );
}