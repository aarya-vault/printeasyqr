import React, { useState } from 'react';
import { X, Upload, UploadCloud, FileText, Star, Phone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { fileValidation } from '@/lib/validation';
import { Shop } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { useOTPOrder } from '@/hooks/use-otp-order';
import { OTPVerificationModal } from '@/components/otp-verification-modal';

interface OTPUploadOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  shops: Shop[];
}

export function OTPUploadOrderModal({ isOpen, onClose, shops }: OTPUploadOrderModalProps) {
  const [step, setStep] = useState(1);
  const [selectedShop, setSelectedShop] = useState<number | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    copies: 1,
    colorType: 'bw' as 'bw' | 'color',
    paperSize: 'A4',
    binding: 'None',
    specialInstructions: '',
    isUrgent: false,
  });
  
  const { toast } = useToast();
  const { user, getPersistentUserData } = useAuth();
  
  // OTP order integration
  const {
    isLoading,
    phoneNumber,
    setPhoneNumber,
    showOTPModal,
    setShowOTPModal,
    initiateOrderWithOTP,
    handleOTPSuccess,
  } = useOTPOrder();

  // Auto-fill phone number from persistent data or user
  const persistentData = getPersistentUserData();
  React.useEffect(() => {
    if (!phoneNumber) {
      if (user?.phone) {
        setPhoneNumber(user.phone);
      } else if (persistentData?.phone) {
        setPhoneNumber(persistentData.phone);
      }
    }
  }, [user, persistentData, phoneNumber, setPhoneNumber]);

  const handleReset = () => {
    setStep(1);
    setSelectedShop(null);
    setFiles([]);
    setFormData({
      title: '',
      copies: 1,
      colorType: 'bw',
      paperSize: 'A4',
      binding: 'None',
      specialInstructions: '',
      isUrgent: false,
    });
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleShopSelect = (shopId: number) => {
    setSelectedShop(shopId);
  };

  const handleContinueToUpload = () => {
    if (!selectedShop) {
      toast({
        title: "Please select a shop",
        variant: "destructive",
      });
      return;
    }
    setStep(2);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    processFiles(selectedFiles);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const processFiles = (newFiles: File[]) => {
    const validFiles: File[] = [];
    
    newFiles.forEach(file => {
      const validation = fileValidation.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        toast({
          title: "Invalid File",
          description: `${file.name}: ${validation.error}`,
          variant: "destructive",
        });
      }
    });

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast({
        title: "Please upload at least one file",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Please enter a title for your order",
        variant: "destructive",
      });
      return;
    }

    if (!phoneNumber || !/^[6-9][0-9]{9}$/.test(phoneNumber)) {
      toast({
        title: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    try {
      const orderData = {
        shopId: selectedShop!,
        type: 'upload' as const,
        title: formData.title,
        specifications: {
          copies: formData.copies,
          colorType: formData.colorType,
          paperSize: formData.paperSize,
          binding: formData.binding,
          specialInstructions: formData.specialInstructions,
        },
        isUrgent: formData.isUrgent,
      };

      await initiateOrderWithOTP(orderData, files);
      
      // Only close if order was placed successfully (no OTP needed)
      if (!showOTPModal) {
        handleClose();
      }
    } catch (error: any) {
      toast({
        title: "Failed to place order",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOTPSuccessWrapper = async (userData: any) => {
    await handleOTPSuccess(userData);
    handleClose();
  };

  const selectedShopData = shops.find(s => s.id === selectedShop);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => !isLoading && handleClose()}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Order with WhatsApp OTP
            </DialogTitle>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Select a Print Shop</Label>
                <div className="grid gap-3 mt-2 max-h-60 overflow-y-auto">
                  {shops.map((shop) => (
                    <div
                      key={shop.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedShop === shop.id
                          ? 'border-[#FFBF00] bg-[#FFBF00]/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleShopSelect(shop.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{shop.name}</h4>
                          <p className="text-sm text-gray-600">{shop.address}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{shop.rating?.toFixed(1) || '0.0'}</span>
                            </div>
                            {shop.totalOrders > 0 && (
                              <span className="text-xs text-gray-500">
                                Successfully completed {shop.totalOrders} orders
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedShop === shop.id
                            ? 'border-[#FFBF00] bg-[#FFBF00]'
                            : 'border-gray-300'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleContinueToUpload}
                className="w-full bg-[#FFBF00] hover:bg-[#E6AC00] text-black"
              >
                Continue to Upload Files
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium">Selected Shop: {selectedShopData?.name}</h4>
                <p className="text-sm text-gray-600">{selectedShopData?.address}</p>
              </div>

              {/* Phone Number Input */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number for WhatsApp OTP
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="9876543210"
                  value={phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 10) {
                      setPhoneNumber(value);
                    }
                  }}
                  className="text-lg"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500">
                  You'll receive a WhatsApp OTP for verification before placing the order
                </p>
              </div>

              {/* File Upload */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Upload Files</Label>
                
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
                  onDrop={handleFileDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <UploadCloud className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 mb-2">Drag and drop files here, or click to select</p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                  />
                  <Button variant="outline" onClick={() => document.getElementById('file-input')?.click()}>
                    Select Files
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Supports: PDF, DOC, DOCX, JPG, PNG (Max: 500MB per file)
                  </p>
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Uploaded Files ({files.length})</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / (1024 * 1024)).toFixed(1)}MB)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Order Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Business Cards, Resume Printing"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="copies">Number of Copies</Label>
                    <Input
                      id="copies"
                      type="number"
                      min="1"
                      value={formData.copies}
                      onChange={(e) => setFormData(prev => ({ ...prev, copies: parseInt(e.target.value) || 1 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="colorType">Print Type</Label>
                    <Select
                      value={formData.colorType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, colorType: value as 'bw' | 'color' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bw">Black & White</SelectItem>
                        <SelectItem value="color">Color</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paperSize">Paper Size</Label>
                    <Select
                      value={formData.paperSize}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, paperSize: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="A3">A3</SelectItem>
                        <SelectItem value="Letter">Letter</SelectItem>
                        <SelectItem value="Legal">Legal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="binding">Binding</Label>
                    <Select
                      value={formData.binding}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, binding: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="Stapled">Stapled</SelectItem>
                        <SelectItem value="Spiral">Spiral</SelectItem>
                        <SelectItem value="Comb">Comb</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">Special Instructions</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Any special requirements or instructions..."
                    value={formData.specialInstructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="urgent"
                    checked={formData.isUrgent}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isUrgent: !!checked }))}
                  />
                  <Label htmlFor="urgent" className="text-sm">
                    This is an urgent order
                  </Label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back to Shop Selection
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 bg-[#FFBF00] hover:bg-[#E6AC00] text-black"
                >
                  {isLoading ? "Processing..." : "Place Order with OTP"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerificationSuccess={handleOTPSuccessWrapper}
        phoneNumber={phoneNumber}
        isLoading={isLoading}
      />
    </>
  );
}