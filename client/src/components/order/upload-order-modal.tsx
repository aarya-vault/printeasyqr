import React, { useState } from 'react';
import { X, Upload, UploadCloud, FileText, Star } from 'lucide-react';
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
import { useAuth } from '@/hooks/use-auth';

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
    title: '',
    copies: 1,
    colorType: 'bw' as 'bw' | 'color',
    paperSize: 'A4',
    binding: 'None',
    specialInstructions: '',
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

    setIsLoading(true);
    try {
      const orderData: OrderFormData = {
        shopId: selectedShop!,
        type: 'upload',
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
            Upload Files Order
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
                            <Star className="w-4 h-4 text-brand-yellow fill-current" />
                            <span className="text-sm text-medium-gray ml-1">{shop.rating}</span>
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
            <div>
              <Label htmlFor="orderTitle" className="text-sm font-medium text-rich-black mb-2 block">
                Order Title
              </Label>
              <Input
                id="orderTitle"
                placeholder="e.g., Assignment Documents"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <h3 className="text-lg font-medium text-rich-black mb-4">Upload Files</h3>
              
              {/* File Drop Zone */}
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-brand-yellow transition-colors"
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => e.preventDefault()}
              >
                <UploadCloud className="w-12 h-12 text-medium-gray mx-auto mb-4" />
                <p className="text-medium-gray mb-2">Drag & drop files here, or</p>
                <Button 
                  type="button" 
                  variant="link"
                  onClick={() => document.getElementById('fileInput')?.click()}
                  className="text-brand-yellow hover:underline font-medium"
                >
                  Browse Files
                </Button>
                <input
                  type="file"
                  id="fileInput"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <p className="text-xs text-medium-gray mt-2">
                  Supported: PDF, DOC, JPG, PNG, TXT (Max 50MB each)
                </p>
              </div>
              
              {/* Uploaded Files List */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-light-gray rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-medium-gray" />
                        <div>
                          <p className="font-medium text-rich-black text-sm">{file.name}</p>
                          <p className="text-xs text-medium-gray">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-error-red hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Print Specifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-rich-black mb-2 block">
                  Number of Copies
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.copies}
                  onChange={(e) => setFormData(prev => ({ ...prev, copies: parseInt(e.target.value) || 1 }))}
                  className="input-field"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-rich-black mb-2 block">
                  Print Type
                </Label>
                <Select 
                  value={formData.colorType} 
                  onValueChange={(value: 'bw' | 'color') => setFormData(prev => ({ ...prev, colorType: value }))}
                >
                  <SelectTrigger className="input-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bw">Black & White</SelectItem>
                    <SelectItem value="color">Color</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-rich-black mb-2 block">
                  Paper Size
                </Label>
                <Select 
                  value={formData.paperSize} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paperSize: value }))}
                >
                  <SelectTrigger className="input-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="A3">A3</SelectItem>
                    <SelectItem value="Letter">Letter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-rich-black mb-2 block">
                  Binding
                </Label>
                <Select 
                  value={formData.binding} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, binding: value }))}
                >
                  <SelectTrigger className="input-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Staple">Staple</SelectItem>
                    <SelectItem value="Spiral">Spiral</SelectItem>
                    <SelectItem value="Perfect Binding">Perfect Binding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Special Instructions */}
            <div>
              <Label className="text-sm font-medium text-rich-black mb-2 block">
                Special Instructions
              </Label>
              <Textarea
                rows={3}
                placeholder="Any special requirements or instructions..."
                value={formData.specialInstructions}
                onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
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
                Mark as urgent (additional charges may apply)
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
                  'Place Order'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
