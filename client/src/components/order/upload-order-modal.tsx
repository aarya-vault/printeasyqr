import React, { useState } from 'react';
import { X, Upload, UploadCloud, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { fileValidation } from '@/lib/validation';
import { Shop, OrderFormData } from '@/types';
import { useAuth } from '@/contexts/auth-context';

interface UploadOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  shops: Shop[];
  onSubmit: (orderData: OrderFormData, files: File[]) => void;
}

export function UploadOrderModal({ isOpen, onClose, shops, onSubmit }: UploadOrderModalProps) {
  const [step, setStep] = useState(1);
  const [selectedShop, setSelectedShop] = useState<number | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    orderType: '',
    uploadOrWalkin: 'upload',
    printingDescription: '',
    isUrgent: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleReset = () => {
    setStep(1);
    setSelectedShop(null);
    setFiles([]);
    setFormData({
      name: '',
      phoneNumber: '',
      orderType: '',
      uploadOrWalkin: 'upload',
      printingDescription: '',
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
    // Validation for simple form
    if (!formData.name.trim()) {
      toast({
        title: "Name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phoneNumber || !/^[6-9][0-9]{9}$/.test(formData.phoneNumber)) {
      toast({
        title: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    if (!formData.orderType) {
      toast({
        title: "Please select an order type",
        variant: "destructive",
      });
      return;
    }

    if (!formData.uploadOrWalkin) {
      toast({
        title: "Please select upload or walk-in",
        variant: "destructive",
      });
      return;
    }

    if (!formData.printingDescription.trim()) {
      toast({
        title: "Please enter printing description",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const orderData: OrderFormData = {
        shopId: selectedShop!,
        type: formData.uploadOrWalkin as 'upload' | 'walkin',
        title: formData.orderType,
        description: formData.printingDescription,
        specifications: {
          customerName: formData.name,
          orderType: formData.orderType,
          uploadOrWalkin: formData.uploadOrWalkin,
          printingDescription: formData.printingDescription,
        },
        isUrgent: formData.isUrgent,
      };

      await onSubmit(orderData, files);
      handleClose();
      toast({
        title: "Order placed successfully!",
        description: "You will receive updates on order status.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to place order",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-rich-black">
            Simple Order Form
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-rich-black mb-4">Select Shop</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {shops.map((shop) => (
                  <label key={shop.id} className="block">
                    <input
                      type="radio"
                      name="selectedShop"
                      value={shop.id}
                      checked={selectedShop === shop.id}
                      onChange={() => handleShopSelect(shop.id)}
                      className="sr-only peer"
                    />
                    <div className="border border-gray-200 rounded-lg p-4 cursor-pointer peer-checked:border-brand-yellow peer-checked:bg-brand-yellow peer-checked:bg-opacity-10 hover:border-gray-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-rich-black">{shop.name}</h4>
                          <p className="text-sm text-medium-gray">{shop.address}</p>
                          <div className="flex items-center mt-2">
                            <span className="w-2 h-2 bg-success-green rounded-full mr-2"></span>
                            <span className="text-xs text-success-green">Online</span>
                            <span className="text-xs text-medium-gray ml-4">Quick service</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center">
                            <span className="text-sm text-success-green">Available</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={handleContinueToUpload}
              className="w-full bg-brand-yellow text-rich-black hover:bg-yellow-400"
            >
              Continue to Upload
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-rich-black mb-2 block">
                Name *
              </Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input-field"
              />
            </div>

            {/* Phone Number */}
            <div>
              <Label htmlFor="phoneNumber" className="text-sm font-medium text-rich-black mb-2 block">
                Phone Number *
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="9876543210"
                value={formData.phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 10) {
                    setFormData(prev => ({ ...prev, phoneNumber: value }));
                  }
                }}
                maxLength={10}
                className="input-field"
              />
              <p className="text-xs text-medium-gray mt-1">
                WhatsApp OTP will be sent for verification
              </p>
            </div>

            {/* Order Type */}
            <div>
              <Label htmlFor="orderType" className="text-sm font-medium text-rich-black mb-2 block">
                Order Type *
              </Label>
              <Select 
                value={formData.orderType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, orderType: value }))}
              >
                <SelectTrigger className="input-field">
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Document Printing">Document Printing</SelectItem>
                  <SelectItem value="Photo Printing">Photo Printing</SelectItem>
                  <SelectItem value="Business Cards">Business Cards</SelectItem>
                  <SelectItem value="Flyers/Brochures">Flyers/Brochures</SelectItem>
                  <SelectItem value="Binding Service">Binding Service</SelectItem>
                  <SelectItem value="Lamination">Lamination</SelectItem>
                  <SelectItem value="Scanning">Scanning</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Upload or Walk-in */}
            <div>
              <Label htmlFor="uploadOrWalkin" className="text-sm font-medium text-rich-black mb-2 block">
                Upload or Walk-in *
              </Label>
              <Select 
                value={formData.uploadOrWalkin} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, uploadOrWalkin: value }))}
              >
                <SelectTrigger className="input-field">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upload">Upload Files (Digital)</SelectItem>
                  <SelectItem value="walkin">Walk-in Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Printing Description */}
            <div>
              <Label htmlFor="printingDescription" className="text-sm font-medium text-rich-black mb-2 block">
                Printing Description *
              </Label>
              <Textarea
                id="printingDescription"
                rows={3}
                placeholder="Describe your printing requirements..."
                value={formData.printingDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, printingDescription: e.target.value }))}
                className="input-field"
              />
            </div>
            
            {/* Urgency */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="urgentOrder"
                checked={formData.isUrgent}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isUrgent: !!checked }))}
              />
              <Label htmlFor="urgentOrder" className="text-sm text-rich-black">
                Is it really urgent?
              </Label>
            </div>
            
            <div className="flex space-x-4">
              <Button 
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 bg-brand-yellow text-rich-black hover:bg-yellow-400"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-rich-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Submit Order with OTP'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
