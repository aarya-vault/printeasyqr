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
import { EnhancedFileUpload } from '@/components/enhanced-file-upload';
import { apiRequest } from '@/lib/queryClient';

interface UploadProgressInfo {
  totalFiles: number;
  completedFiles: number;
  currentFileIndex: number;
  currentFileName: string;
  overallProgress: number;
  bytesUploaded: number;
  totalBytes: number;
  uploadSpeed: number;
  estimatedTimeRemaining: number;
}

interface UploadOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  shops: Shop[];
  onSubmit?: (orderData: OrderFormData, files: File[]) => void;
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
  const [uploadProgress, setUploadProgress] = useState<UploadProgressInfo | null>(null);
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
    // Validation for form
    if (!formData.orderType) {
      toast({
        title: "Please select an order type",
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

    if (files.length === 0) {
      toast({
        title: "Please upload at least one file",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setUploadProgress({
      totalFiles: files.length,
      completedFiles: 0,
      currentFileIndex: 0,
      currentFileName: files[0]?.name || '',
      overallProgress: 0,
      bytesUploaded: 0,
      totalBytes: files.reduce((sum, file) => sum + file.size, 0),
      uploadSpeed: 0,
      estimatedTimeRemaining: 0
    });

    try {
      // Create FormData for multipart upload
      const formDataUpload = new FormData();
      
      // Add all files
      files.forEach(file => {
        formDataUpload.append('files', file);
      });
      
      // Add order details
      formDataUpload.append('shopId', selectedShop!.toString());
      formDataUpload.append('type', 'digital');
      formDataUpload.append('title', formData.orderType);
      formDataUpload.append('description', formData.printingDescription);
      formDataUpload.append('isUrgent', formData.isUrgent.toString());
      
      // Track upload progress
      const startTime = Date.now();
      let lastLoaded = 0;
      
      // 🚀 ULTRA-FAST UPLOAD: Use optimized endpoint with native fetch for progress tracking
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (progressEvent: ProgressEvent) => {
          if (progressEvent.lengthComputable && uploadProgress) {
            const currentTime = Date.now();
            const elapsedTime = (currentTime - startTime) / 1000;
            const bytesLoaded = progressEvent.loaded;
            const bytesTotal = progressEvent.total;
            
            // Calculate upload speed
            const uploadSpeed = elapsedTime > 0 ? bytesLoaded / elapsedTime : 0;
            const bytesRemaining = bytesTotal - bytesLoaded;
            const estimatedTimeRemaining = uploadSpeed > 0 ? Math.round(bytesRemaining / uploadSpeed) : 0;
            
            setUploadProgress({
              totalFiles: files.length,
              completedFiles: 0,
              currentFileIndex: 0,
              currentFileName: files[0]?.name || '',
              overallProgress: Math.round((bytesLoaded / bytesTotal) * 100),
              bytesUploaded: bytesLoaded,
              totalBytes: bytesTotal,
              uploadSpeed: uploadSpeed,
              estimatedTimeRemaining: estimatedTimeRemaining
            });
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText
            }));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Upload failed'));
        
        // Add auth header if user is authenticated
        if (user) {
          const token = localStorage.getItem('token');
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
        }
        
        xhr.open('POST', '/api/orders');
        xhr.send(formDataUpload);
      });

      if (response.ok) {
        handleClose();
        toast({
          title: "Order placed successfully!",
          description: `Uploaded ${files.length} file${files.length > 1 ? 's' : ''} successfully. You will receive updates on order status.`,
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Failed to place order",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-rich-black">
            🚀 Ultra-Fast File Upload Order
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
            {/* 🚀 ULTRA-FAST FILE UPLOAD */}
            <div>
              <Label className="text-sm font-medium text-rich-black mb-2 block">
                Upload Files *
              </Label>
              <EnhancedFileUpload
                files={files}
                onFilesChange={setFiles}
                isUploading={isLoading}
                disabled={isLoading}
                maxFiles={200}
                acceptedFileTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt', '.ppt', '.pptx', '.xls', '.xlsx']}
                uploadProgress={uploadProgress || undefined}
              />
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
                disabled={isLoading}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isLoading || files.length === 0}
                className="flex-1 bg-brand-yellow text-rich-black hover:bg-yellow-400"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-rich-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  `Upload ${files.length} File${files.length !== 1 ? 's' : ''} & Create Order`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
