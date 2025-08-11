import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DemoBanner } from '@/components/demo-banner';
import { OTPUploadOrderModal } from '@/components/order/otp-upload-order-modal';
import { useQuery } from '@tanstack/react-query';
import { Shop } from '@/types';
import { Upload, Smartphone, ShoppingCart } from 'lucide-react';

export default function OTPDemo() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Fetch shops for demo
  const { data: shops = [], isLoading } = useQuery<Shop[]>({
    queryKey: ['/api/shops'],
  });

  // Demo shops if no real data
  const demoShops: Shop[] = shops.length > 0 ? shops : [
    {
      id: 1,
      name: "Quick Print Center",
      address: "123 Main Street, City Center",
      phone: "9876543210",
      email: "info@quickprint.com",
      rating: 4.5,
      totalOrders: 150,
      isOnline: true,
      workingHours: {
        monday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
        tuesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
        wednesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
        thursday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
        friday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
        saturday: { isOpen: true, openTime: "10:00", closeTime: "16:00" },
        sunday: { isOpen: false, openTime: "", closeTime: "" }
      },
      services: ["Printing", "Scanning", "Binding"],
      equipment: ["Laser Printer", "Color Printer"],
      acceptsWalkinOrders: true,
      slug: "quick-print-center"
    },
    {
      id: 2,
      name: "Digital Print Hub",
      address: "456 Business Avenue, Tech Park",
      phone: "9876543211",
      email: "hello@digitalhub.com",
      rating: 4.8,
      totalOrders: 89,
      isOnline: true,
      workingHours: {
        monday: { isOpen: true, openTime: "08:00", closeTime: "20:00" },
        tuesday: { isOpen: true, openTime: "08:00", closeTime: "20:00" },
        wednesday: { isOpen: true, openTime: "08:00", closeTime: "20:00" },
        thursday: { isOpen: true, openTime: "08:00", closeTime: "20:00" },
        friday: { isOpen: true, openTime: "08:00", closeTime: "20:00" },
        saturday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
        sunday: { isOpen: true, openTime: "10:00", closeTime: "16:00" }
      },
      services: ["High-Quality Printing", "Design Services"],
      equipment: ["Professional Printer", "Large Format Printer"],
      acceptsWalkinOrders: true,
      slug: "digital-print-hub"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WhatsApp OTP Demo
          </h1>
          <p className="text-gray-600">
            Test the complete WhatsApp OTP verification system with order placement
          </p>
        </div>

        <DemoBanner />

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-green-600" />
                WhatsApp OTP Flow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">1</div>
                  <div>
                    <strong>Phone Entry:</strong> Enter any 10-digit Indian phone number
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">2</div>
                  <div>
                    <strong>Smart Check:</strong> System checks for existing valid JWT (90-day token)
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">3</div>
                  <div>
                    <strong>OTP Modal:</strong> If no valid session, WhatsApp OTP modal appears
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">4</div>
                  <div>
                    <strong>Verification:</strong> Enter any 6-digit code (e.g., 123456)
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">5</div>
                  <div>
                    <strong>Order Placed:</strong> After verification, order is automatically submitted
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#FFBF00]" />
                Order Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Multiple file upload (PDF, DOC, images)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Real-time shop selection
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Print specifications (color, size, binding)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Background file processing during OTP
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  90-day JWT token persistence
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Auto-fill from persistent data
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-[#FFBF00] hover:bg-[#E6AC00] text-black px-8 py-3 text-lg"
            disabled={isLoading}
          >
            <Upload className="w-5 h-5 mr-2" />
            {isLoading ? "Loading..." : "Test WhatsApp OTP Order"}
          </Button>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Testing Instructions:</h3>
          <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>Click the button above to open the order modal</li>
            <li>Select a shop from the available options</li>
            <li>Upload any test files (optional - you can use dummy files)</li>
            <li>Enter phone number: <code className="bg-white px-1 rounded">9876543210</code></li>
            <li>Fill in order details and click "Place Order with OTP"</li>
            <li>In the OTP modal, enter any 6-digit code: <code className="bg-white px-1 rounded">123456</code></li>
            <li>Order will be successfully placed after verification</li>
          </ol>
        </div>

        {/* OTP Upload Order Modal */}
        <OTPUploadOrderModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          shops={demoShops}
        />
      </div>
    </div>
  );
}