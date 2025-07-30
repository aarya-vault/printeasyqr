import React, { useState } from 'react';
import { X, MapPin, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shop, OrderFormData } from '@/types';

interface WalkinOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  shops: Shop[];
  onSubmit: (orderData: OrderFormData) => void;
}

export function WalkinOrderModal({ isOpen, onClose, shops, onSubmit }: WalkinOrderModalProps) {
  const [selectedShop, setSelectedShop] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: 'Walk-in Order',
    description: '',
    estimatedPages: '',
    estimatedBudget: '',
    visitTime: 'within-1-hour',
    isUrgent: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleReset = () => {
    setSelectedShop(null);
    setFormData({
      title: 'Walk-in Order',
      description: '',
      estimatedPages: '',
      estimatedBudget: '',
      visitTime: 'within-1-hour',
      isUrgent: false,
    });
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedShop) {
      toast({
        title: "Please select a shop",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Please describe your printing needs",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const orderData: OrderFormData = {
        shopId: selectedShop,
        type: 'walkin',
        title: formData.title,
        description: formData.description,
        estimatedPages: formData.estimatedPages ? parseInt(formData.estimatedPages) : undefined,
        estimatedBudget: formData.estimatedBudget ? parseFloat(formData.estimatedBudget) : undefined,
        isUrgent: formData.isUrgent,
      };

      await onSubmit(orderData);
      handleClose();
      toast({
        title: "Walk-in order booked successfully!",
        description: "The shop has been notified about your visit.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to book walk-in order",
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
            Walk-in Order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Shop Selection */}
          <div>
            <h3 className="text-lg font-medium text-rich-black mb-4">Select Shop</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {shops.map((shop) => (
                <label key={shop.id} className="block">
                  <input
                    type="radio"
                    name="walkinShop"
                    value={shop.id}
                    checked={selectedShop === shop.id}
                    onChange={() => setSelectedShop(shop.id)}
                    className="sr-only peer"
                  />
                  <div className="border border-gray-200 rounded-lg p-4 cursor-pointer peer-checked:border-brand-yellow peer-checked:bg-brand-yellow peer-checked:bg-opacity-10 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-rich-black">{shop.name}</h4>
                        <p className="text-sm text-medium-gray">{shop.address}</p>
                        <p className="text-xs text-medium-gray mt-1">
                          Open: {shop.workingHours?.open} - {shop.workingHours?.close}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center mb-1">
                          <span className="w-2 h-2 bg-success-green rounded-full mr-1"></span>
                          <span className="text-xs text-success-green">Open</span>
                        </div>
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
          
          {/* Order Description */}
          <div>
            <Label className="text-sm font-medium text-rich-black mb-2 block">
              Describe Your Printing Needs
            </Label>
            <Textarea
              rows={4}
              placeholder="Please describe what you need printed (e.g., 10 copies of a 20-page document, black & white, spiral binding...)"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input-field"
            />
            <p className="text-xs text-medium-gray mt-1">
              Be as specific as possible to help the shop prepare
            </p>
          </div>
          
          {/* Estimated Quantity & Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-rich-black mb-2 block">
                Estimated Pages
              </Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g., 50"
                value={formData.estimatedPages}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedPages: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-rich-black mb-2 block">
                Estimated Budget (₹)
              </Label>
              <Input
                type="number"
                min="1"
                placeholder="Optional"
                value={formData.estimatedBudget}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedBudget: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>
          
          {/* Visit Time */}
          <div>
            <Label className="text-sm font-medium text-rich-black mb-2 block">
              When do you plan to visit?
            </Label>
            <Select 
              value={formData.visitTime} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, visitTime: value }))}
            >
              <SelectTrigger className="input-field">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="within-1-hour">Within 1 hour</SelectItem>
                <SelectItem value="within-2-3-hours">Within 2-3 hours</SelectItem>
                <SelectItem value="later-today">Later today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Urgency */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="urgentWalkin"
              checked={formData.isUrgent}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isUrgent: !!checked }))}
            />
            <Label htmlFor="urgentWalkin" className="text-sm text-rich-black">
              This is urgent
            </Label>
          </div>
          
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-brand-yellow text-rich-black hover:bg-yellow-400"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-rich-black border-t-transparent rounded-full animate-spin" />
            ) : (
              'Book Walk-in Order'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
