// Centralized TypeScript interfaces for production-ready Node.js application
// This file standardizes all data types across frontend and backend

// ======================== BASE TYPES ========================

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

// ======================== USER TYPES ========================

export interface User extends Timestamps {
  id: number;
  phone: string;
  name?: string;
  email?: string;
  role: 'customer' | 'shop_owner' | 'admin';
  isActive: boolean;
  needsNameUpdate?: boolean; // Frontend compatibility
}

export interface CreateUserInput {
  phone: string;
  name?: string;
  email?: string;
  role?: 'customer' | 'shop_owner' | 'admin';
  passwordHash?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  isActive?: boolean;
  passwordHash?: string;
}

// ======================== SHOP TYPES ========================

export interface Shop extends Timestamps {
  id: number;
  ownerId: number;
  // Public Information
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  contactNumber: string; // Frontend compatibility (same as phone)
  publicOwnerName?: string;
  ownerName: string; // Frontend compatibility (same as ownerFullName)
  // Internal Information
  internalName: string;
  ownerFullName: string;
  email: string;
  ownerPhone: string;
  completeAddress: string;
  // Business Details
  services: string[];
  equipment: string[];
  yearsOfExperience: string;
  // Working Hours and Availability
  workingHours: Record<string, { open: string; close: string; closed: boolean }>;
  acceptsWalkinOrders: boolean;
  isOnline: boolean;
  autoAvailability: boolean;
  // NEW: Unified shop status combining working hours + manual override
  unifiedStatus?: {
    isOpen: boolean;
    canAcceptOrders: boolean;
    statusText: 'OPEN' | 'CLOSED';
    reason: string;
  };
  // Admin and Status
  isApproved: boolean;
  isPublic: boolean;
  status: 'active' | 'deactivated' | 'banned';
  qrCode?: string;
  totalOrders: number;
  // Additional Properties
  google_maps_link?: string;
  // Relations
  owner?: User;
}

export interface CreateShopInput {
  ownerId: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  publicOwnerName?: string;
  internalName: string;
  ownerFullName: string;
  email: string;
  ownerPhone: string;
  completeAddress: string;
  services: string[];
  equipment: string[];
  yearsOfExperience: string;
  workingHours: Record<string, { open: string; close: string; closed: boolean }>;
  acceptsWalkinOrders?: boolean;
}

export interface UpdateShopInput {
  name?: string;
  address?: string;
  phone?: string;
  services?: string[];
  equipment?: string[];
  workingHours?: Record<string, { open: string; close: string; closed: boolean }>;
  isOnline?: boolean;
  isApproved?: boolean;
  status?: 'active' | 'deactivated' | 'banned';
}

// ======================== ORDER TYPES ========================

export interface OrderFile {
  // Unified file naming for consistency
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
  // Legacy support
  name?: string;
}

export interface Order extends Timestamps {
  id: number;
  customerId: number;
  shopId: number;
  orderNumber: number;
  publicId?: string;
  type: 'upload' | 'walkin';
  title: string;
  description?: string;
  specifications?: any;
  files?: OrderFile[];
  walkinTime?: string;
  status: 'new' | 'processing' | 'ready' | 'completed';
  isUrgent: boolean;
  estimatedPages?: number;
  estimatedBudget?: number;
  finalAmount?: number;
  notes?: string;
  deletedBy?: number;
  deletedAt?: string;
  // Relations
  shop?: {
    id: number;
    name: string;
    phone: string;
    city: string;
    address: string;
    publicOwnerName?: string;
  };
  customer?: {
    id: number;
    name: string;
    phone: string;
  };
  // Frontend compatibility fields
  customerName?: string;
  shopName?: string;
  unreadCount?: number;
  // Deletion information fields
  deletedByName?: string;
  deletedByRole?: string;
}

export interface CreateOrderInput {
  customerId: number;
  shopId: number;
  type: 'upload' | 'walkin';
  title: string;
  description?: string;
  specifications?: any;
  files?: OrderFile[];
  walkinTime?: string;
  isUrgent?: boolean;
}

export interface UpdateOrderInput {
  status?: 'new' | 'processing' | 'ready' | 'completed';
  estimatedPages?: number;
  estimatedBudget?: number;
  finalAmount?: number;
  notes?: string;
}

// ======================== MESSAGE TYPES ========================

export interface MessageFile {
  originalName: string;
  filename: string;
  path?: string;
  size: number;
  mimetype: string;
}

export interface Message {
  id: number;
  orderId: number;
  senderId: number;
  senderName: string;
  senderRole: 'customer' | 'shop_owner' | 'admin';
  content: string;
  files?: string; // JSON string of MessageFile[]
  messageType: 'text' | 'file' | 'system';
  isRead: boolean;
  createdAt: string;
  // Relations
  sender?: {
    id: number;
    name: string;
    phone: string;
    role: string;
  };
}

export interface CreateMessageInput {
  orderId: number;
  senderId: number;
  senderName: string;
  senderRole: 'customer' | 'shop_owner' | 'admin';
  content: string;
  files?: MessageFile[];
  messageType?: 'text' | 'file' | 'system';
}

// ======================== SHOP APPLICATION TYPES ========================

export interface ShopApplication extends Timestamps {
  id: number;
  applicantId: number;
  // Use consistent naming with frontend expectations
  shopName: string; // Maps to publicShopName in DB
  shopSlug: string;
  applicantName: string; // Maps to ownerFullName in DB
  ownerFullName: string;
  publicOwnerName?: string;
  email: string;
  phoneNumber: string;
  password: string;
  completeAddress?: string;
  city: string;
  state: string;
  pinCode: string;
  services: string[];
  customServices: string[];
  equipment: string[];
  customEquipment: string[];
  yearsOfExperience: string;
  workingHours: Record<string, { open: string; close: string; closed: boolean }>;
  acceptsWalkinOrders: boolean;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  // Relations
  applicant?: User;
}

export interface CreateShopApplicationInput {
  applicantId?: number;
  publicShopName: string;
  shopSlug: string;
  ownerFullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  city: string;
  state: string;
  pinCode: string;
  services: string[];
  equipment: string[];
  yearsOfExperience: string;
  workingHours: Record<string, { open: string; close: string; closed: boolean }>;
  acceptsWalkinOrders?: boolean;
}

// ======================== CUSTOMER SHOP UNLOCK TYPES ========================

export interface CustomerShopUnlock {
  id: number;
  customerId: number;
  shopId: number;
  unlockedAt: string;
  qrScanLocation?: string;
  // Relations
  shop?: Shop;
  customer?: User;
}

// ======================== NOTIFICATION TYPES ========================

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  relatedId?: number;
  isRead: boolean;
  createdAt: string;
}

export interface CreateNotificationInput {
  userId: number;
  title: string;
  message: string;
  type: string;
  relatedId?: number;
}

// ======================== API RESPONSE TYPES ========================

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ======================== ADMIN DASHBOARD TYPES ========================

export interface PlatformStats {
  totalUsers: number;
  totalShops: number;
  totalOrders: number;
  pendingApplications: number;
  customerCount: number;
  shopOwnerCount: number;
  activeShops: number;
  totalRevenue: number;
  recentOrders: Order[];
  orderStats: {
    new: number;
    processing: number;
    ready: number;
    completed: number;
  };
  monthlyGrowth: Array<{
    month: string;
    new_customers: number;
    new_shops: number;
  }>;
}

// ======================== AUTHENTICATION TYPES ========================

export interface LoginCredentials {
  phone?: string;
  email?: string;
  password?: string;
}

export interface AuthSession {
  id: number;
  email?: string;
  phone?: string;
  name: string;
  role: 'customer' | 'shop_owner' | 'admin';
}

// ======================== FORM INPUT TYPES ========================

export interface OrderFormInput {
  name: string;
  contactNumber: string;
  orderType: 'upload' | 'walkin';
  files?: File[];
  isUrgent: boolean;
  description?: string;
}

export interface OrderFormData {
  shopId: number;
  type: 'upload' | 'walkin';
  title: string;
  description?: string;
  specifications?: any;
  estimatedPages?: number;
  estimatedBudget?: number;
  isUrgent: boolean;
}

export interface ShopApplicationFormInput {
  publicShopName: string;
  shopSlug: string;
  ownerFullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  city: string;
  state: string;
  pinCode: string;
  services: string[];
  equipment: string[];
  yearsOfExperience: string;
  workingHours: Record<string, { open: string; close: string; closed: boolean }>;
  acceptsWalkinOrders: boolean;
}

// ======================== WEBSOCKET MESSAGE TYPES ========================

export interface WebSocketMessage {
  type: 'order_update' | 'new_message' | 'newNotification' | 'shop_status_change';
  userId?: number;
  orderId?: number;
  order?: Order;
  message?: Message | string;
  notification?: Notification;
  shop?: Shop;
}

// ======================== SEARCH AND FILTER TYPES ========================

export interface SearchQueries {
  applications?: string;
  users?: string;
  shops?: string;
  analytics?: string;
}

export interface FilterOptions {
  status?: string;
  role?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}