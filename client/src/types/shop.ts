// Unified shop interface for consistent type checking across browse pages

export interface Shop {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  email?: string;
  publicOwnerName?: string;
  completeAddress: string;
  
  // Services and Equipment
  services: string[];
  equipment: string[];
  customServices?: string[];
  customEquipment?: string[];
  servicesOffered?: string[];
  equipmentAvailable?: string[];
  
  // Experience and Business Details
  yearsOfExperience: number | string;
  formationYear?: number;
  ownerFullName?: string;
  ownerPhone?: string;
  
  // Working Hours and Availability
  workingHours: Record<string, {
    open?: string;
    close?: string;
    closed?: boolean;
    is24Hours?: boolean;
  }> | string;
  
  // Status and Availability
  isOnline: boolean;
  acceptsWalkinOrders: boolean;
  isApproved: boolean;
  isPublic: boolean;
  status: string;
  
  // Statistics
  totalOrders: number;
  
  // Images
  exteriorImage?: string;
  
  // QR and Metadata
  qrCode?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Owner information
  owner?: {
    id: number;
    name: string;
    phone: string;
    email: string;
    role: string;
  };
  
  // Public information aliases
  publicName?: string;
  publicAddress?: string;
  publicContactNumber?: string;
  
  // Computed properties
  isOpen?: boolean;
}