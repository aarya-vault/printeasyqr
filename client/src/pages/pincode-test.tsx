import React, { useState } from 'react';
import { usePincodeAutoComplete } from '@/hooks/usePincodeAutoComplete';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2 } from 'lucide-react';

/**
 * Test page for pincode auto-complete functionality
 * Tests the comprehensive Indian pincode database integration
 */
export function PincodeTestPage() {
  const [pincode, setPincode] = useState('');
  const [locationData, setLocationData] = useState<any>(null);
  const { fetchLocationFromPincode, isLoading, error } = usePincodeAutoComplete();

  const handlePincodeTest = async () => {
    const result = await fetchLocationFromPincode(pincode);
    setLocationData(result);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-rich-black" />
            </div>
            <CardTitle className="text-2xl text-rich-black">Pincode Auto-Complete Test</CardTitle>
            <p className="text-medium-gray">Test the comprehensive Indian pincode database</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pincode Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-rich-black">Enter Pincode</label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="e.g., 400001, 110001, 560001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="pr-10"
                  />
                  {isLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-yellow" />
                    </div>
                  )}
                </div>
                <Button
                  onClick={handlePincodeTest}
                  disabled={pincode.length !== 6 || isLoading}
                  className="bg-brand-yellow text-rich-black hover:bg-yellow-500"
                >
                  Test
                </Button>
              </div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>

            {/* Test Results */}
            {locationData && (
              <div className="border rounded-lg p-4 bg-green-50">
                <h3 className="font-semibold text-green-800 mb-3">Location Data Found:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-green-700">City</label>
                    <p className="text-green-800">{locationData.city}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-green-700">State</label>
                    <p className="text-green-800">{locationData.state}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-green-700">District</label>
                    <p className="text-green-800">{locationData.district || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-green-700">Pincode</label>
                    <p className="text-green-800">{locationData.pincode}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sample Pincodes */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-rich-black mb-3">Sample Pincodes to Test:</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { pincode: '400001', city: 'Mumbai' },
                  { pincode: '110001', city: 'New Delhi' },
                  { pincode: '560001', city: 'Bangalore' },
                  { pincode: '700001', city: 'Kolkata' },
                  { pincode: '600001', city: 'Chennai' },
                  { pincode: '500001', city: 'Hyderabad' },
                ].map((sample) => (
                  <Button
                    key={sample.pincode}
                    variant="outline"
                    size="sm"
                    onClick={() => setPincode(sample.pincode)}
                    className="text-xs"
                  >
                    {sample.pincode}<br />
                    <span className="text-gray-500">{sample.city}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PincodeTestPage;