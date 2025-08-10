import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, User, Phone, Shield, Bell, Package, 
  Tag, Info, Save, Lock
} from 'lucide-react';

export default function CustomerAccountSettings() {
  const { user, updateUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    notifications: {
      orderUpdates: true,
      promotions: true,
      systemAnnouncements: true
    },
    preferences: {
      smsAlerts: false,
      emailDigest: false
    }
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await updateUser({ name: formData.name });
      
      // Save notification preferences (in real app, would be an API call)
      localStorage.setItem('notificationPrefs', JSON.stringify(formData.notifications));
      localStorage.setItem('userPrefs', JSON.stringify(formData.preferences));
      
      toast({
        title: "Success",
        description: "Settings saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/customer-dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold text-rich-black">Account Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Profile Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Manage your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="phone"
                  value={user?.phone || ''}
                  disabled
                  className="bg-gray-50"
                />
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                Phone number cannot be changed as it's your login ID
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose what notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">Order Updates</p>
                  <p className="text-sm text-gray-500">
                    Get notified about order status changes
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.notifications.orderUpdates}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, orderUpdates: checked }
                  }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Tag className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">Promotions & Offers</p>
                  <p className="text-sm text-gray-500">
                    Receive special offers from print shops
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.notifications.promotions}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, promotions: checked }
                  }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Info className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium">System Announcements</p>
                  <p className="text-sm text-gray-500">
                    Important platform updates and news
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.notifications.systemAnnouncements}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, systemAnnouncements: checked }
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </CardTitle>
            <CardDescription>
              Your account security information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-rich-black mb-2">
                Phone-Based Authentication
              </h4>
              <p className="text-sm text-gray-600">
                Your account is secured with phone number authentication. 
                Each time you log in, you'll receive an OTP to verify your identity.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Account Created</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Login</span>
                <span className="font-medium">Today</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Orders</span>
                <span className="font-medium">0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-brand-yellow text-rich-black hover:bg-yellow-500"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}