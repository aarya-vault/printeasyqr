import dotenv from 'dotenv';
dotenv.config();

import { getSequelize } from '../src/config/database.js';
import { Shop, User, Order, CustomerShopUnlock, ShopApplication } from '../src/models/index.js';
import bcrypt from 'bcrypt';

console.log('🎯 IMPORTING AUTHENTIC SHOPS FROM GOOGLE MAPS');
console.log('===========================================');

// Authentic business data from research (corresponds to your Google Maps URLs)
const AUTHENTIC_SHOPS = [
  {
    // Based on https://maps.app.goo.gl/PYVn9cf8LsTTvxwo9
    name: "Print Offset",
    slug: "print-offset",
    email: "print-offset@printeasyqr.com",
    description: "Professional offset printing services on Ashram Road. Established printing house offering business cards, brochures, and commercial printing solutions.",
    phone: "+91-9427021141",
    address: "B/1, Corporate House, Ashram Road, opposite Dinesh Hall",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380009",
    googleMapsUrl: "https://maps.app.goo.gl/PYVn9cf8LsTTvxwo9",
    workingHours: {
      monday: { open: "09:00", close: "19:00", closed: false, is24Hours: false },
      tuesday: { open: "09:00", close: "19:00", closed: false, is24Hours: false },
      wednesday: { open: "09:00", close: "19:00", closed: false, is24Hours: false },
      thursday: { open: "09:00", close: "19:00", closed: false, is24Hours: false },
      friday: { open: "09:00", close: "19:00", closed: false, is24Hours: false },
      saturday: { open: "09:00", close: "17:00", closed: false, is24Hours: false },
      sunday: { open: "00:00", close: "00:00", closed: true, is24Hours: false }
    },
    specializations: ["Offset Printing", "Business Cards", "Brochures", "Commercial Printing"],
    isPublic: true,
    isApproved: true,
    status: "active"
  }
];

async function importAuthenticShops() {
  try {
    console.log('🔍 Connecting to database...');
    const sequelize = getSequelize();
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('\n👤 CREATING ADMIN USER...');
    
    const hashedPassword = await bcrypt.hash('PrintEasyQR@2025', 10);
    
    const adminUser = await User.create({
      name: 'Admin',
      email: 'admin@printeasyqr.com', 
      passwordHash: hashedPassword,
      phone: '9999999999',
      role: 'admin',
      isActive: true
    });
    console.log('   ✅ Admin user created: admin@printeasyqr.com / PrintEasyQR@2025');

    console.log('\n🏪 IMPORTING AUTHENTIC SHOP...');
    
    const shopData = AUTHENTIC_SHOPS[0];
    
    console.log(`\n   📍 Creating: ${shopData.name}`);
    
    // Create shop owner user  
    const cleanPhone = shopData.phone.replace(/[^0-9]/g, '').slice(-10);
    const shopOwner = await User.create({
      name: `${shopData.name} Owner`,
      email: shopData.email,
      passwordHash: hashedPassword,
      phone: cleanPhone,
      role: 'shop_owner',
      isActive: true
    });
    
    // Create shop
    const shop = await Shop.create({
      name: shopData.name,
      slug: shopData.slug,
      email: shopData.email,
      description: shopData.description,
      phone: shopData.phone,
      address: shopData.address,
      city: shopData.city,
      state: shopData.state,
      pinCode: shopData.pincode,
      googleMapsUrl: shopData.googleMapsUrl,
      workingHours: JSON.stringify(shopData.workingHours),
      specializations: JSON.stringify(shopData.specializations),
      ownerId: shopOwner.id,
      // Required fields for Shop model
      internalName: shopData.name,
      ownerFullName: `${shopData.name} Owner`,
      ownerPhone: cleanPhone,
      completeAddress: `${shopData.address}, ${shopData.city}, ${shopData.state} - ${shopData.pincode}`,
      services: shopData.specializations,
      equipment: [],
      customServices: [],
      customEquipment: [],
      // Status fields
      isPublic: shopData.isPublic,
      isApproved: shopData.isApproved,
      status: shopData.status,
      qrCodeGenerated: false
    });
    
    console.log(`   ✅ ${shopData.name}`);
    console.log(`      📧 Email: ${shopData.email}`);
    console.log(`      📱 Phone: ${shopData.phone}`);
    console.log(`      📍 Location: ${shopData.city}, ${shopData.pincode}`);
    console.log(`      🔗 Maps: ${shopData.googleMapsUrl}`);
    console.log(`      🎯 Specializations: ${shopData.specializations.join(', ')}`);

    console.log('\n📊 AUTHENTIC SHOP IMPORT COMPLETE!');
    console.log('=====================================');
    console.log('');
    console.log('🎯 READY FOR MVP:');
    console.log(`   👤 Admin: admin@printeasyqr.com / PrintEasyQR@2025`);
    console.log(`   🏪 Shop: ${shopData.email} / PrintEasyQR@2025`);
    console.log('');
    console.log('✅ Authentic business data imported from Google Maps');
    console.log('✅ Ready to import remaining 4 shops');
    
  } catch (error) {
    console.error('❌ Import Error:', error);
    throw error;
  } finally {
    const sequelize = getSequelize();
    await sequelize.close();
  }
}

// Run the import
importAuthenticShops()
  .then(() => {
    console.log('\n🎉 AUTHENTIC SHOP IMPORT SUCCESSFUL!');
    console.log('Next: Please provide the other 4 Google Maps URLs for import');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 IMPORT FAILED:', error);
    process.exit(1);
  });