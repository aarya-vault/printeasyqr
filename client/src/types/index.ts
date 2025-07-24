export interface User {
  id: number;
  phone: string;
  name?: string;
  email?: string;
  role: 'customer' | 'shop_owner' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Shop {
  id: number;
  ownerId: number;
  name: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  email?: string;
  services: string[];
  workingHours: {
    open: string;
    close: string;
  };
  yearsOfExperience?: string;
  isOnline: boolean;
  isApproved: boolean;
  rating: string;
  totalOrders: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  customerId: number;
  shopId: number;
  type: 'upload' | 'walkin';
  title: string;
  description?: string;
  specifications?: {
    copies?: number;
    colorType?: 'bw' | 'color';
    paperSize?: string;
    binding?: string;
    specialInstructions?: string;
  };
  files?: Array<{
    originalName: string;
    filename: string;
    mimetype: string;
    size: number;
    path: string;
  }>;
  status: 'new' | 'processing' | 'ready' | 'completed';
  isUrgent: boolean;
  estimatedPages?: number;
  estimatedBudget?: string;
  finalAmount?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  orderId: number;
  senderId: number;
  content: string;
  messageType: 'text' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ShopApplication {
  id: number;
  applicantId: number;
  shopName: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  email?: string;
  services: string[];
  workingHours: {
    open: string;
    close: string;
  };
  yearsOfExperience?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'order_update' | 'system' | 'chat';
  relatedId?: number;
  isRead: boolean;
  createdAt: string;
}

export interface PlatformStats {
  totalUsers: number;
  activeShops: number;
  totalOrders: number;
  monthlyRevenue: number;
}

export interface OrderFormData {
  shopId: number;
  type: 'upload' | 'walkin';
  title: string;
  description?: string;
  specifications?: {
    copies?: number;
    colorType?: 'bw' | 'color';
    paperSize?: string;
    binding?: string;
    specialInstructions?: string;
  };
  isUrgent?: boolean;
  estimatedPages?: number;
  estimatedBudget?: number;
  files?: File[];
}

export interface ShopApplicationFormData {
  shopName: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  email?: string;
  services: string[];
  workingHours: {
    open: string;
    close: string;
  };
  yearsOfExperience?: string;
}
