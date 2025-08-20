import dotenv from 'dotenv';
dotenv.config();

import { getSequelize } from '../src/config/database.js';
import { Shop, User, Order, CustomerShopUnlock, ShopApplication } from '../src/models/index.js';
import bcrypt from 'bcrypt';

console.log('🚀 MVP DATABASE RESET - PrintEasy QR');
console.log('=====================================');

const MVP_SHOPS = [
  {
    name: "Satyam Digital Print",
    slug: "satyam-digital-print",
    email: "satyam-digital-print@printeasyqr.com",
    description: "Professional digital printing services for all your business needs. Specializing in high-quality brochures, business cards, and commercial printing.",
    phone: "+91-9328966723",
    address: "Head Office - Ambica House, Nr. C.U. Shah College, Opp. United Bank of India, Income Tax, Ahmedabad",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380004",
    googleMapsUrl: "https://maps.app.goo.gl/NPXXy9cS3ZajZcRT9",
    workingHours: {
      monday: { open: "09:00", close: "20:00", closed: false, is24Hours: false },
      tuesday: { open: "09:00", close: "20:00", closed: false, is24Hours: false },
      wednesday: { open: "09:00", close: "20:00", closed: false, is24Hours: false },
      thursday: { open: "09:00", close: "20:00", closed: false, is24Hours: false },
      friday: { open: "09:00", close: "20:00", closed: false, is24Hours: false },
      saturday: { open: "09:00", close: "18:00", closed: false, is24Hours: false },
      sunday: { open: "10:00", close: "17:00", closed: false, is24Hours: false }
    },
    specializations: ["Digital Printing", "Offset Printing", "Business Cards", "Brochures"],
    isPublic: true,
    isApproved: true,
    status: "active"
  },
  {
    name: "Perfect Print Solutions",
    slug: "perfect-print-solutions", 
    email: "perfect-print-solutions@printeasyqr.com",
    description: "Your one-stop destination for perfect printing solutions. From photocopying to large format printing, we deliver quality results every time.",
    phone: "+91-9978807943",
    address: "Shop-1, 2, Shuketu Complex, Haridarshan Road, Nikol, Opposite Fenil Avenue, Ahmedabad",
    city: "Ahmedabad",
    state: "Gujarat", 
    pincode: "380024",
    googleMapsUrl: "https://maps.app.goo.gl/jY2ERgXzQaPt5agt7",
    workingHours: {
      monday: { open: "08:30", close: "21:00", closed: false, is24Hours: false },
      tuesday: { open: "08:30", close: "21:00", closed: false, is24Hours: false },
      wednesday: { open: "08:30", close: "21:00", closed: false, is24Hours: false },
      thursday: { open: "08:30", close: "21:00", closed: false, is24Hours: false },
      friday: { open: "08:30", close: "21:00", closed: false, is24Hours: false },
      saturday: { open: "08:30", close: "19:00", closed: false, is24Hours: false },
      sunday: { open: "09:00", close: "18:00", closed: false, is24Hours: false }
    },
    specializations: ["Photocopying", "Large Format", "Flex Printing", "Binding"],
    isPublic: true,
    isApproved: true,
    status: "active"
  },
  {
    name: "Express Copy Center",
    slug: "express-copy-center",
    email: "express-copy-center@printeasyqr.com", 
    description: "Fast and reliable copying services with same-day delivery. Specializing in bulk photocopying, document binding, and lamination services.",
    phone: "+91-7878966723",
    address: "7, Liberty Complex, Swastik Society, Navrangpura, Ahmedabad",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380009", 
    googleMapsUrl: "https://maps.app.goo.gl/wnybBzjMTRtWGRLw6",
    workingHours: {
      monday: { open: "08:00", close: "22:00", closed: false, is24Hours: false },
      tuesday: { open: "08:00", close: "22:00", closed: false, is24Hours: false },
      wednesday: { open: "08:00", close: "22:00", closed: false, is24Hours: false },
      thursday: { open: "08:00", close: "22:00", closed: false, is24Hours: false },
      friday: { open: "08:00", close: "22:00", closed: false, is24Hours: false },
      saturday: { open: "08:00", close: "21:00", closed: false, is24Hours: false },
      sunday: { open: "09:00", close: "20:00", closed: false, is24Hours: false }
    },
    specializations: ["Photocopying", "Binding", "Lamination", "Same-day Service"],
    isPublic: true,
    isApproved: true,
    status: "active"
  },
  {
    name: "Print Offset Pro",
    slug: "print-offset-pro",
    email: "print-offset-pro@printeasyqr.com",
    description: "Premium offset printing services for businesses. Specializing in high-volume commercial printing, brochures, catalogs, and packaging solutions.",
    phone: "+91-9925802216",
    address: "B/1, Corporate House, Opp. Torrent Power House, Nr. Dinesh Hall, Ashram Road, Ahmedabad",
    city: "Ahmedabad", 
    state: "Gujarat",
    pincode: "380014",
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
    specializations: ["Offset Printing", "Commercial Printing", "Catalogs", "Packaging"],
    isPublic: true,
    isApproved: true,
    status: "active"
  },
  {
    name: "Elite Xerox Services",
    slug: "elite-xerox-services",
    email: "elite-xerox-services@printeasyqr.com",
    description: "Professional xerox and digital printing services. Offering color photocopying, document printing, and custom stationery printing solutions.",
    phone: "+91-7600018329",
    address: "12 Ankur Shopping Center, Vastral Road, Rita Nagar, Ahmedabad",
    city: "Ahmedabad",
    state: "Gujarat", 
    pincode: "380026",
    googleMapsUrl: "https://maps.app.goo.gl/ouTRmzKLmBxMsWeB8",
    workingHours: {
      monday: { open: "08:00", close: "20:30", closed: false, is24Hours: false },
      tuesday: { open: "08:00", close: "20:30", closed: false, is24Hours: false },
      wednesday: { open: "08:00", close: "20:30", closed: false, is24Hours: false },
      thursday: { open: "08:00", close: "20:30", closed: false, is24Hours: false },
      friday: { open: "08:00", close: "20:30", closed: false, is24Hours: false },
      saturday: { open: "08:00", close: "19:30", closed: false, is24Hours: false },
      sunday: { open: "09:30", close: "18:30", closed: false, is24Hours: false }
    },
    specializations: ["Xerox Services", "Color Printing", "Stationery", "Custom Printing"],
    isPublic: true,
    isApproved: true,
    status: "active"
  }
];

async function resetDatabaseForMVP() {
  try {
    console.log('🔍 Connecting to database...');
    const sequelize = getSequelize();
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('\n🗑️  CLEARING ALL EXISTING DATA...');
    
    // Delete in reverse dependency order
    await Order.destroy({ where: {}, force: true });
    console.log('   ✅ Deleted all orders');
    
    await CustomerShopUnlock.destroy({ where: {}, force: true });
    console.log('   ✅ Deleted all customer shop unlocks');
    
    await ShopApplication.destroy({ where: {}, force: true });
    console.log('   ✅ Deleted all shop applications');
    
    await Shop.destroy({ where: {}, force: true });
    console.log('   ✅ Deleted all shops');
    
    await User.destroy({ where: {}, force: true });
    console.log('   ✅ Deleted all users');

    console.log('\n👤 CREATING MVP ADMIN USER...');
    
    const hashedPassword = await bcrypt.hash('PrintEasyQR@2025', 10);
    
    const adminUser = await User.create({
      name: 'MVP Admin',
      email: 'admin@printeasyqr.com', 
      passwordHash: hashedPassword,
      phone: '9999999999',
      role: 'admin',
      isActive: true
    });
    console.log('   ✅ Admin user created: admin@printeasyqr.com / PrintEasyQR@2025');

    console.log('\n🏪 CREATING MVP SHOPS WITH AUTHENTIC DATA...');
    
    for (let i = 0; i < MVP_SHOPS.length; i++) {
      const shopData = MVP_SHOPS[i];
      
      console.log(`\n   📍 Creating Shop ${i + 1}: ${shopData.name}`);
      
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
    }

    console.log('\n📊 MVP DATABASE SETUP COMPLETE!');
    console.log('=====================================');
    console.log('');
    console.log('🎯 READY FOR MVP LAUNCH:');
    console.log(`   👤 Admin Account: admin@printeasyqr.com / PrintEasyQR@2025`);
    console.log(`   🏪 Shops Created: ${MVP_SHOPS.length} authentic Ahmedabad businesses`);
    console.log(`   🔐 Shop Login Format: {shop-slug}@printeasyqr.com / PrintEasyQR@2025`);
    console.log('');
    console.log('🚀 MVP Shop Logins:');
    MVP_SHOPS.forEach((shop, index) => {
      console.log(`   ${index + 1}. ${shop.email} / PrintEasyQR@2025`);
    });
    console.log('');
    console.log('✅ All data is authentic from real Ahmedabad businesses');
    console.log('✅ No images included as requested');
    console.log('✅ Fresh start completed - ready for production deployment');
    
  } catch (error) {
    console.error('❌ MVP Database Reset Error:', error);
    throw error;
  } finally {
    const sequelize = getSequelize();
    await sequelize.close();
  }
}

// Run the MVP reset
resetDatabaseForMVP()
  .then(() => {
    console.log('\n🎉 MVP DATABASE RESET SUCCESSFUL!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 MVP DATABASE RESET FAILED:', error);
    process.exit(1);
  });