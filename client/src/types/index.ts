// Re-export centralized types for backward compatibility
export type {
  User, Shop, Order, Message, ShopApplication, OrderFile, MessageFile,
  CreateOrderInput, UpdateOrderInput, CreateMessageInput,
  PlatformStats, ApiResponse, OrderFormInput, ShopApplicationFormInput,
  LoginCredentials, AuthSession, Notification, CreateNotificationInput,
  WebSocketMessage, SearchQueries, FilterOptions
} from '@shared/types';

// Frontend-specific utility types
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