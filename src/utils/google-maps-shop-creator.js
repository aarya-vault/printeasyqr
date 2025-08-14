/**
 * Google Maps Shop Creation Utility
 * 
 * Standardized shop creation from Google Maps data
 * - Walk-in orders: DISABLED by default
 * - Equipment: EMPTY by default  
 * - Password: PrintEasyQR@2025 (standardized)
 */

import bcrypt from 'bcrypt';

export const STANDARD_SHOP_CONFIG = {
  // Security
  standardPassword: 'PrintEasyQR@2025',
  
  // Shop defaults
  acceptsWalkinOrders: false,  // DISABLED by user requirement
  equipment: [],               // NO EQUIPMENT by user requirement
  customEquipment: [],         // NO CUSTOM EQUIPMENT
  
  // Business settings
  isOnline: true,
  autoAvailability: true,
  isApproved: true,
  isPublic: true,
  status: 'active',
  totalOrders: 0
};

/**
 * Generate standardized password hash
 */
export const generateStandardPasswordHash = async () => {
  return await bcrypt.hash(STANDARD_SHOP_CONFIG.standardPassword, 10);
};

/**
 * Parse Google Maps working hours to our format
 */
export const parseWorkingHours = (googleHours) => {
  // Default working hours if parsing fails
  const defaultHours = {
    monday: { open: "09:00", close: "18:00", closed: false },
    tuesday: { open: "09:00", close: "18:00", closed: false },
    wednesday: { open: "09:00", close: "18:00", closed: false },
    thursday: { open: "09:00", close: "18:00", closed: false },
    friday: { open: "09:00", close: "18:00", closed: false },
    saturday: { open: "09:00", close: "18:00", closed: false },
    sunday: { open: "09:00", close: "14:00", closed: false }
  };

  try {
    // Parse Google Maps hours format if available
    if (googleHours && typeof googleHours === 'object') {
      return googleHours;
    }
    return defaultHours;
  } catch (error) {
    console.warn('Failed to parse working hours, using defaults');
    return defaultHours;
  }
};

/**
 * Generate services array from shop type/description
 */
export const generateServices = (shopName, description = '') => {
  const name = (shopName + ' ' + description).toLowerCase();
  
  const services = [];
  
  // Standard printing services
  if (name.includes('xerox') || name.includes('photocopy') || name.includes('copy')) {
    services.push('photocopying');
  }
  if (name.includes('print')) {
    services.push('document_printing');
  }
  if (name.includes('color') || name.includes('colour')) {
    services.push('color_printing');
  }
  if (name.includes('scan')) {
    services.push('scanning');
  }
  if (name.includes('bind')) {
    services.push('binding');
  }
  
  // Default services if none detected
  if (services.length === 0) {
    services.push('document_printing', 'photocopying');
  }
  
  return services;
};

/**
 * Create shop slug from name
 */
export const createShopSlug = (shopName) => {
  return shopName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single
    .trim();
};

/**
 * Extract pin code from address
 */
export const extractPinCode = (address) => {
  const pinMatch = address.match(/\b(\d{6})\b/);
  return pinMatch ? pinMatch[1] : '000000';
};

/**
 * Clean phone number to 10 digits
 */
export const cleanPhoneNumber = (phone) => {
  const cleaned = phone.replace(/[^\d]/g, '');
  return cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
};