import React, { useRef, useState, useEffect } from 'react';
import { X, Copy, Share2, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';

interface QRModalProps {
  shop: {
    id: number;
    name: string;
    phone: string;
    slug: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function RedesignedQRModal({ shop, isOpen, onClose }: QRModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const { toast } = useToast();

  const shopUrl = `${window.location.origin}/shop/${shop.slug}`;

  useEffect(() => {
    if (isOpen) {
      generateQRCode();
    }
  }, [isOpen, shopUrl]);

  const generateQRCode = async () => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(shopUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrDataUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleDownload = async () => {
    if (!qrRef.current) return;

    // Add delay for fonts and SVGs to render
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(qrRef.current!, {
          backgroundColor: '#FFFFFF',
          scale: 3,
          useCORS: true,
          logging: false,
        });

        const link = document.createElement('a');
        link.download = `PrintEasy_${shop.name.replace(/\s+/g, '_')}_QR.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();

        toast({
          title: "QR Code Downloaded",
          description: "The QR code has been saved to your device",
        });
      } catch (error) {
        console.error('Error downloading QR code:', error);
        toast({
          title: "Download Failed",
          description: "Please try again",
          variant: "destructive",
        });
      }
    }, 300);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${shop.name} - PrintEasy QR`,
        text: `Order printing services from ${shop.name}`,
        url: shopUrl,
      });
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shopUrl);
    toast({
      title: "Link Copied",
      description: "Shop link has been copied to clipboard",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-8 relative">
        {/* Close Button - Outside download area */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          data-testid="button-close-qr-modal"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        {/* Modal Content for Preview and Download */}
        <div ref={qrRef} className="bg-white rounded-2xl overflow-hidden">
          {/* Header */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ backgroundColor: '#FFBF00', padding: '32px 24px', textAlign: 'center' }}>
                  {/* Logo */}
                  <table style={{ margin: '0 auto', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td>
                          <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            backgroundColor: '#FFBF00', 
                            borderRadius: '50%', 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '4px solid #000000'
                          }}>
                            <Printer style={{ width: '40px', height: '40px', color: '#000000' }} />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ paddingTop: '16px' }}>
                          <h2 style={{ 
                            fontSize: '28px', 
                            fontWeight: 'bold', 
                            color: '#000000',
                            margin: '0',
                            fontFamily: 'Arial, sans-serif'
                          }}>
                            {shop.name}
                          </h2>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ paddingTop: '8px' }}>
                          <span style={{ 
                            fontSize: '16px', 
                            color: '#000000',
                            fontFamily: 'Arial, sans-serif'
                          }}>
                            PrintEasy Partner
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* QR Code Section */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '32px 24px', textAlign: 'center' }}>
                  {/* QR Code Container */}
                  <div style={{ 
                    backgroundColor: '#F9FAFB', 
                    borderRadius: '16px', 
                    padding: '24px',
                    display: 'inline-block'
                  }}>
                    {qrDataUrl && (
                      <img 
                        src={qrDataUrl} 
                        alt="QR Code" 
                        style={{ width: '300px', height: '300px', display: 'block' }}
                      />
                    )}
                  </div>
                  
                  {/* Scan Me Text */}
                  <p style={{ 
                    marginTop: '16px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#000000',
                    fontFamily: 'Arial, sans-serif'
                  }}>
                    Scan to Order
                  </p>
                </td>
              </tr>
            </tbody>
          </table>

          {/* How to Use Section - Table Based */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '0 24px 24px 24px' }}>
                  <h3 style={{ 
                    textAlign: 'center',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    marginBottom: '20px',
                    color: '#000000',
                    fontFamily: 'Arial, sans-serif'
                  }}>
                    How to Use
                  </h3>
                  
                  {/* Steps Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {[
                        { num: '1', title: 'Open Camera', desc: 'Point your phone at the QR code' },
                        { num: '2', title: 'Tap Link', desc: 'Click the notification that appears' },
                        { num: '3', title: 'Upload Files', desc: 'Select your documents to print' },
                        { num: '4', title: 'Collect Order', desc: 'Get notified when ready' }
                      ].map((step, index) => (
                        <tr key={step.num}>
                          <td style={{ 
                            width: '40px', 
                            paddingBottom: index < 3 ? '16px' : '0',
                            verticalAlign: 'top'
                          }}>
                            <div style={{ 
                              width: '32px', 
                              height: '32px', 
                              backgroundColor: '#FFBF00', 
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '14px',
                              fontFamily: 'Arial, sans-serif'
                            }}>
                              {step.num}
                            </div>
                          </td>
                          <td style={{ 
                            paddingLeft: '12px',
                            paddingBottom: index < 3 ? '16px' : '0',
                            verticalAlign: 'top'
                          }}>
                            <strong style={{ 
                              display: 'block',
                              fontSize: '16px',
                              marginBottom: '4px',
                              fontFamily: 'Arial, sans-serif'
                            }}>
                              {step.title}
                            </strong>
                            <span style={{ 
                              color: '#6B7280',
                              fontSize: '14px',
                              fontFamily: 'Arial, sans-serif'
                            }}>
                              {step.desc}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Contact & Footer */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ 
                  backgroundColor: '#000000', 
                  padding: '24px',
                  textAlign: 'center'
                }}>
                  {/* PrintEasy Logo */}
                  <table style={{ margin: '0 auto 16px', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td>
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            backgroundColor: '#FFBF00', 
                            borderRadius: '50%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '8px'
                          }}>
                            <Printer style={{ width: '16px', height: '16px', color: '#000000' }} />
                          </div>
                        </td>
                        <td>
                          <span style={{ 
                            color: '#FFFFFF',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            fontFamily: 'Arial, sans-serif'
                          }}>
                            PrintEasy
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  {/* Contact */}
                  <p style={{ 
                    color: '#FFFFFF',
                    fontSize: '16px',
                    margin: '0 0 8px 0',
                    fontFamily: 'Arial, sans-serif'
                  }}>
                    Contact: {shop.phone}
                  </p>
                  
                  {/* USP */}
                  <p style={{ 
                    color: '#FFBF00',
                    fontSize: '14px',
                    margin: '0',
                    fontFamily: 'Arial, sans-serif'
                  }}>
                    Fast • Secure • Professional
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons - Outside download area */}
        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <Button
            onClick={handleDownload}
            className="flex-1 bg-[#FFBF00] hover:bg-[#F0B000] text-black font-semibold"
            data-testid="button-download-qr"
          >
            <Download className="w-4 h-4 mr-2" />
            Download QR
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex-1 border-gray-300"
            data-testid="button-share-qr"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="flex-1 border-gray-300"
            data-testid="button-copy-link"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>
      </div>
    </div>
  );
}