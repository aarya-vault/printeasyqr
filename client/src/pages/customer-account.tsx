import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocation, Link } from 'wouter';
import { 
  ArrowLeft, User, Phone, Edit, Save, X, Package, Home, ShoppingCart,
  LogOut, Shield, Settings, Bell
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import FloatingChatButton from '@/components/floating-chat-button';
import BottomNavigation from '@/components/common/bottom-navigation';

export default function CustomerAccount() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; phone: string }) => {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required.",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate(formData);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/customer-dashboard')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-rich-black">Account Settings</h1>
                <p className="text-sm text-gray-500">Manage your profile and preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Profile Information */}
        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-rich-black">
                <User className="w-5 h-5 mr-2" />
                Profile Information
              </CardTitle>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user?.name || '',
                        phone: user?.phone || '',
                      });
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                />
              ) : (
                <div className="mt-1 p-2 bg-gray-50 rounded-md">
                  {user.name || 'Not set'}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md flex items-center">
                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                {user.phone}
                <span className="ml-2 text-xs text-gray-500">(Cannot be changed)</span>
              </div>
            </div>
            <div>
              <Label>Account Type</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md flex items-center">
                <Shield className="w-4 h-4 mr-2 text-green-600" />
                Customer Account
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center text-rich-black">
              <Settings className="w-5 h-5 mr-2" />
              Account Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/customer-orders')}
            >
              <Package className="w-4 h-4 mr-3" />
              View Order History
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/browse-shops')}
            >
              <ShoppingCart className="w-4 h-4 mr-3" />
              Browse Print Shops
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-rich-black">About PrintEasy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              PrintEasy connects customers with local print shops for convenient printing services.
            </p>
            <div className="space-y-2 text-xs text-gray-500">
              <div>Version 1.0.0</div>
              <div>© 2025 PrintEasy Platform</div>
            </div>
          </CardContent>
        </Card>
      </div>

           {/* Centralized Bottom Navigation */}
      <BottomNavigation />

      {/* Floating Chat Button */}
      <FloatingChatButton />
    </div>
  );
}