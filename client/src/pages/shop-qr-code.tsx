import React, { useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { ProfessionalLayout } from '@/components/professional-layout';
import { ProfessionalLoading } from '@/components/professional-loading';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Share2, Phone, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Shop {
  id: number;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  phone?: string;
  publicOwnerName?: string;
  publicContactNumber?: string;
  services?: string[];
  workingHours?: any;
}

export default function ShopQRCode() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string>('');

  // Fetch shop data
  const { data: shop, isLoading } = useQuery<Shop>({
    queryKey: ['/api/shops/owner', user?.id],
    enabled: !!user?.id,
  });

  React.useEffect(() => {
    if (shop?.slug) {
      // Generate QR code
      const shopUrl = `${window.location.origin}/shop/${shop.slug}`;
      QRCode.toDataURL(shopUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }).then(setQrCodeDataUrl);
    }
  }, [shop?.slug]);

  const downloadQRCode = async () => {
    if (!qrRef.current) return;

    try {
      const canvas = await html2canvas(qrRef.current, {
        backgroundColor: '#FFFFFF',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `${shop?.name.replace(/\s+/g, '_')}_QR_Code.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast({
        title: "QR Code Downloaded",
        description: "The QR code has been saved to your device.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const shareQRCode = () => {
    const shopUrl = `${window.location.origin}/shop/${shop?.slug}`;
    const shareText = `Visit ${shop?.name} at PrintEasy: ${shopUrl}`;
    
    if (navigator.share) {
      navigator.share({
        title: `${shop?.name} - PrintEasy`,
        text: shareText,
        url: shopUrl,
      }).catch(() => {
        // User cancelled share
      });
    } else {
      // Fallback to WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const formatWorkingHours = (hours: any) => {
    if (!hours) return null;
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const today = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    
    return days.map(day => {
      const dayHours = hours[day];
      if (!dayHours || dayHours.closed) {
        return { day, hours: 'Closed' };
      }
      return {
        day,
        hours: `${dayHours.open} - ${dayHours.close}`,
        isToday: day === today
      };
    });
  };

  if (isLoading) {
    return (
      <ProfessionalLayout title="Shop QR Code">
        <ProfessionalLoading message="Loading QR code..." size="lg" />
      </ProfessionalLayout>
    );
  }

  if (!shop) {
    return (
      <ProfessionalLayout title="Shop QR Code">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Shop Found</h2>
          <p className="text-gray-600">Please contact admin for shop setup.</p>
          <Button
            onClick={() => setLocation('/shop/dashboard')}
            className="mt-4"
          >
            Back to Dashboard
          </Button>
        </div>
      </ProfessionalLayout>
    );
  }

  const workingHours = formatWorkingHours(shop.workingHours);

  return (
    <ProfessionalLayout title="Shop QR Code">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation('/shop/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Card */}
          <Card>
            <CardContent className="p-8">
              <div 
                ref={qrRef}
                className="bg-white p-8 rounded-lg"
              >
                {/* PrintEasy Branding */}
                <div className="text-center mb-6">
                  <div className="flex justify-center items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-[#FFBF00] rounded-lg flex items-center justify-center">
                      <span className="text-black font-bold text-lg">P</span>
                    </div>
                    <span className="text-2xl font-bold text-black">PrintEasy</span>
                  </div>
                  <p className="text-sm text-gray-600">Scan to visit shop</p>
                </div>

                {/* QR Code */}
                {qrCodeDataUrl && (
                  <div className="flex justify-center mb-6">
                    <img src={qrCodeDataUrl} alt="Shop QR Code" className="w-64 h-64" />
                  </div>
                )}

                {/* Shop Name */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-black mb-2">{shop.name}</h3>
                  {shop.city && (
                    <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {shop.city}
                    </p>
                  )}
                </div>

                {/* Contact Info */}
                {(shop.publicContactNumber || shop.phone) && (
                  <div className="mt-4 pt-4 border-t text-center">
                    <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
                      <Phone className="h-3 w-3" />
                      {shop.publicContactNumber || shop.phone}
                    </p>
                  </div>
                )}

                {/* Working Hours Summary */}
                {workingHours && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-medium text-gray-700 text-center mb-2">Working Hours</p>
                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {workingHours.slice(0, 7).map(({ day, hours, isToday }) => (
                        <div key={day} className={`text-center ${isToday ? 'font-bold' : ''}`}>
                          <p className="text-gray-500 uppercase">{day.slice(0, 3)}</p>
                          <p className={hours === 'Closed' ? 'text-red-600' : 'text-green-600'}>
                            {hours === 'Closed' ? '✗' : '✓'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <Button
                  onClick={downloadQRCode}
                  className="bg-[#FFBF00] hover:bg-[#E6AC00] text-black"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  onClick={shareQRCode}
                  variant="outline"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Shop Details Card */}
          <Card>
            <CardContent className="p-8">
              <h3 className="text-lg font-semibold text-black mb-4">Shop Information</h3>
              
              {/* Shop Details */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Shop Name</p>
                  <p className="text-gray-900">{shop.name}</p>
                </div>

                {shop.publicOwnerName && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Owner</p>
                    <p className="text-gray-900">{shop.publicOwnerName}</p>
                  </div>
                )}

                {shop.address && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Address</p>
                    <p className="text-gray-900">{shop.address}</p>
                    {shop.city && <p className="text-gray-600">{shop.city}</p>}
                  </div>
                )}

                {(shop.publicContactNumber || shop.phone) && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Contact</p>
                    <p className="text-gray-900">{shop.publicContactNumber || shop.phone}</p>
                  </div>
                )}

                {shop.services && shop.services.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Services Offered</p>
                    <div className="flex flex-wrap gap-2">
                      {shop.services.map((service, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shop URL */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">Shop URL</p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-900 break-all">
                      {window.location.origin}/shop/{shop.slug}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Customers can scan the QR code or visit this URL to place orders
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProfessionalLayout>
  );
}