import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  User, Shield, Ban, Trash2, Save, X, AlertTriangle
} from 'lucide-react';

const editUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit phone number'),
  email: z.string().email('Enter valid email').optional().or(z.literal('')),
  role: z.enum(['customer', 'shop_owner', 'admin']),
});

type EditUserForm = z.infer<typeof editUserSchema>;

interface AdminUserEditModalProps {
  user: any;
  onClose: () => void;
  onSave: () => void;
}

export default function AdminUserEditModal({ user, onClose, onSave }: AdminUserEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user.name || '',
      phone: user.phone || '',
      email: user.email || '',
      role: user.role || 'customer',
    },
  });

  const updateUser = useMutation({
    mutationFn: async (data: EditUserForm) => {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'User Updated Successfully!',
        description: 'User details have been updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      onSave();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Please try again later.',
      });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'User Deleted',
        description: 'User has been permanently deleted from the system.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      onSave();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.message || 'Please try again later.',
      });
    },
  });

  const toggleUserStatus = useMutation({
    mutationFn: async (isActive: boolean) => {
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user status');
      }

      return response.json();
    },
    onSuccess: (data, isActive) => {
      toast({
        title: isActive ? 'User Activated' : 'User Deactivated',
        description: isActive ? 'User can now access the platform.' : 'User has been temporarily deactivated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      onSave();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Status Update Failed',
        description: error.message || 'Please try again later.',
      });
    },
  });

  const onSubmit = (data: EditUserForm) => {
    updateUser.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-brand-yellow p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-rich-black" />
            <h2 className="text-xl font-bold text-rich-black">Edit User Details</h2>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-rich-black hover:bg-rich-black/10">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-brand-yellow" />
                    <span>User Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter user's full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="10-digit phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="user@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select user role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="shop_owner">Shop Owner</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 space-y-2">
                    <p className="text-sm text-medium-gray">
                      <strong>User ID:</strong> {user.id}
                    </p>
                    <p className="text-sm text-medium-gray">
                      <strong>Registered On:</strong> {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-medium-gray">
                      <strong>Status:</strong> {user.isActive ? 'Active' : 'Deactivated'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              <Card className="border-brand-yellow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-brand-yellow">
                    <AlertTriangle className="w-5 h-5" />
                    <span>User Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      type="button"
                      variant={user.isActive ? "outline" : "default"}
                      onClick={() => toggleUserStatus.mutate(!user.isActive)}
                      disabled={toggleUserStatus.isPending}
                      className={user.isActive 
                        ? "border-red-500 text-red-500 hover:bg-red-50" 
                        : "bg-green-600 hover:bg-green-700 text-white"
                      }
                    >
                      {user.isActive ? (
                        <>
                          <Ban className="w-4 h-4 mr-2" />
                          Deactivate User
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Activate User
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={deleteUser.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Permanently
                    </Button>
                  </div>

                  {showDeleteConfirm && (
                    <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-800 mb-3">
                        Are you sure you want to permanently delete this user? This action cannot be undone.
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteUser.mutate()}
                          disabled={deleteUser.isPending}
                        >
                          Yes, Delete
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateUser.isPending}
                  className="bg-brand-yellow text-rich-black hover:bg-brand-yellow/90"
                >
                  {updateUser.isPending ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}