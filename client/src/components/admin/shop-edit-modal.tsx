import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { X, Save, Upload, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from '@uppy/core';

interface Shop {
  id: number;
  name: string;
  ownerName: string;
  email: string;
  city: string;
  address: string;
  contactNumber: string;
  isOnline: boolean;
  isApproved: boolean;
  totalOrders: number;
  workingHours?: string;
  exteriorImage?: string;
}

interface ShopEditModalProps {
  shop: Shop;
  onClose: () => void;
  onUpdate: () => void;
}

export function ShopEditModal({ shop, onClose, onUpdate }: ShopEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: shop.name,
    ownerName: shop.ownerName,
    email: shop.email,
    city: shop.city,
    address: shop.address,
    contactNumber: shop.contactNumber,
    isOnline: shop.isOnline,
    isApproved: shop.isApproved,

  });

  const updateShopMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest(`/api/admin/shops/${shop.id}`, 'PUT', updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Shop Updated",
        description: `${formData.name} has been updated successfully.`,
      });
      // CRITICAL FIX: Invalidate BOTH admin and customer shop caches
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shops'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shops'] });
      onUpdate();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update shop",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    updateShopMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };



  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-rich-black">
              Edit Shop: {shop.name}
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

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Shop Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="border-brand-yellow/30 focus:border-brand-yellow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input
                id="ownerName"
                value={formData.ownerName}
                onChange={(e) => handleInputChange('ownerName', e.target.value)}
                className="border-brand-yellow/30 focus:border-brand-yellow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="border-brand-yellow/30 focus:border-brand-yellow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                value={formData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                className="border-brand-yellow/30 focus:border-brand-yellow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="border-brand-yellow/30 focus:border-brand-yellow"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="border-brand-yellow/30 focus:border-brand-yellow"
              rows={3}
            />
          </div>



          {/* Status Controls */}
          <div className="space-y-4 p-4 border border-brand-yellow/30 rounded-lg">
            <h3 className="font-medium text-rich-black">Shop Status</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isOnline">Online Status</Label>
                <p className="text-sm text-gray-600">Controls if the shop appears as available to customers</p>
              </div>
              <Switch
                id="isOnline"
                checked={formData.isOnline}
                onCheckedChange={(checked) => handleInputChange('isOnline', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isApproved">Approval Status</Label>
                <p className="text-sm text-gray-600">Controls if the shop is approved for operations</p>
              </div>
              <Switch
                id="isApproved"
                checked={formData.isApproved}
                onCheckedChange={(checked) => handleInputChange('isApproved', checked)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              onClick={handleSave}
              disabled={updateShopMutation.isPending}
              className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateShopMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              variant="outline"
              onClick={onClose}
              className="border-brand-yellow/30 hover:bg-brand-yellow/10"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}