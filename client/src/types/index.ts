// Centralized type definitions for better organization
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface FileInfo {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
}

export interface PrintProgress {
  current: number;
  total: number;
  status: 'printing' | 'completed' | 'error';
}

export interface OrderStatus {
  id: number;
  status: 'new' | 'processing' | 'ready' | 'completed';
  updatedAt: string;
}

export interface NotificationData {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

// Enums for better type safety
export enum UserRole {
  CUSTOMER = 'customer',
  SHOP_OWNER = 'shop_owner', 
  ADMIN = 'admin'
}

export enum OrderType {
  UPLOAD = 'upload',
  WALKIN = 'walkin'
}

export enum OrderStatusEnum {
  NEW = 'new',
  PROCESSING = 'processing',
  READY = 'ready',
  COMPLETED = 'completed'
}