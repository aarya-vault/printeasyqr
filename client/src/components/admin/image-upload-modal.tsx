import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { ObjectUploader } from '@/components/ObjectUploader';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { UploadResult } from '@uppy/core';

interface ImageUploadModalProps {
  shop: {
    id: number;
    name: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImageUploadModal({ shop, isOpen, onClose, onSuccess }: ImageUploadModalProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleGetUploadParameters = async () => {
    const data = await apiRequest('/api/admin/objects/upload', 'POST');
    console.log('Upload URL response:', data); // Debug log
    return {
      method: 'PUT' as const,
      url: data.uploadURL,
    };
  };

  const handleImageUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      setIsUploading(true);
      const uploadedFile = result.successful[0];
      const imageURL = uploadedFile.uploadURL;
      
      try {
        await apiRequest('/api/admin/shop-exterior-image', 'PUT', {
          shopId: shop.id,
          exteriorImageURL: imageURL,
        });
        
        toast({
          title: "Success",
          description: `Shop exterior image uploaded for ${shop.name}`,
        });
        
        onSuccess();
        onClose();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to save image",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-rich-black">
              Add Shop Image
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center py-6">
            <p className="text-sm text-gray-600 mb-4">
              Upload an exterior image for <strong>{shop.name}</strong>
            </p>
            
            <div className="mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={10485760}
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleImageUploadComplete}
              buttonClassName="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90 disabled:opacity-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Select Image'}
            </ObjectUploader>
            
            <p className="text-xs text-gray-500 mt-2">
              Maximum file size: 10MB
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}