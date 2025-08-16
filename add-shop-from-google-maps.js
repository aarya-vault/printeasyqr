/**
 * Helper script to add shops from Google Maps links
 * 
 * Usage: Just provide Google Maps data and this will create the shop
 * with the correct settings:
 * - Walk-in orders: DISABLED
 * - Equipment: EMPTY 
 * - Password: PrintEasyQR@2025
 */

import bcrypt from 'bcrypt';

// Standard configuration for all Google Maps imports
const SHOP_CONFIG = {
  password: 'PrintEasyQR@2025',
  acceptsWalkinOrders: false,  // DISABLED per requirement
  equipment: [],               // EMPTY per requirement  
  customEquipment: [],         // EMPTY per requirement
  isOnline: true,
  isApproved: true,
  isPublic: true,
  status: 'active'
};

/**
 * Create shop from Google Maps data
 * Call this function with extracted Google Maps data
 */
export async function createShopFromGoogleMaps(googleMapsData) {
  const {
    name,
    address, 
    phone,
    workingHours,
    googleMapsLink,
    city = 'Unknown',
    state = 'Unknown'
  } = googleMapsData;

  // Generate password hash
  const passwordHash = await bcrypt.hash(SHOP_CONFIG.password, 10);
  
  // Create shop slug
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();

  // Extract pin code
  const pinCode = address.match(/\b(\d{6})\b/)?.[1] || '000000';
  
  // Clean phone number  
  const cleanPhone = phone.replace(/[^\d]/g, '').slice(-10);

  console.log('Creating shop with settings:');
  console.log('- Walk-in orders: DISABLED');
  console.log('- Equipment: EMPTY');  
  console.log('- Password: PrintEasyQR@2025');
  console.log('- Name:', name);
  console.log('- Phone:', cleanPhone);
  
  return {
    userData: {
      phone: cleanPhone,
      name: `${name} Owner`,
      email: `${slug}@printeasyqr.com`,
      passwordHash,
      role: 'shop_owner',
      isActive: true
    },
    shopData: {
      name,
      slug,
      address,
      city,
      state,
      pinCode,
      phone: cleanPhone,
      publicOwnerName: name,
      internalName: name,
      ownerFullName: `${name} Owner`,
      email: `${slug}@printeasyqr.com`,
      ownerPhone: cleanPhone,
      completeAddress: address,
      services: JSON.stringify(['document_printing', 'photocopying']),
      equipment: JSON.stringify([]), // EMPTY per requirement
      customServices: JSON.stringify([]),
      customEquipment: JSON.stringify([]), // EMPTY per requirement
      workingHours: JSON.stringify(workingHours || {}),
      acceptsWalkinOrders: false, // DISABLED per requirement
      isOnline: SHOP_CONFIG.isOnline,
      isApproved: SHOP_CONFIG.isApproved,
      isPublic: SHOP_CONFIG.isPublic,
      status: SHOP_CONFIG.status,
      qrCode: `GM${Date.now().toString().slice(-6)}`,
      totalOrders: 0,
      googleMapsLink
    }
  };
}

// Example of how to use:
// const shopData = await createShopFromGoogleMaps({
//   name: 'Example Print Shop',
//   address: '123 Main St, City 123456',
//   phone: '+91 9876543210',
//   workingHours: {...},
//   googleMapsLink: 'https://maps.app.goo.gl/...'
// });