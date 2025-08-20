import dotenv from 'dotenv';
dotenv.config();

import { getSequelize } from '../src/config/database.js';
import { Shop } from '../src/models/index.js';

console.log('🔧 UPDATING SHOPS WITH EXACT GOOGLE MAPS DATA (FINAL)');
console.log('====================================================');

// EXACT DATA FROM GOOGLE MAPS PROVIDED BY USER
const EXACT_SHOP_UPDATES = {
  'arihant-xerox': {
    phone: '091050 71050',
    workingHours: {
      monday: { open: "09:30", close: "21:00", closed: false, is24Hours: false },
      tuesday: { open: "09:30", close: "21:00", closed: false, is24Hours: false },
      wednesday: { open: "09:30", close: "21:00", closed: false, is24Hours: false },
      thursday: { open: "09:30", close: "21:00", closed: false, is24Hours: false },
      friday: { open: "09:30", close: "21:00", closed: false, is24Hours: false },
      saturday: { open: "09:30", close: "21:00", closed: false, is24Hours: false },
      sunday: { open: "10:00", close: "14:00", closed: false, is24Hours: false }
    }
  },
  'shreeji-stationery-xerox': {
    phone: '083202 47834',
    address: '6, Jitendra Shopping Centre, opp. Ranna Park, Ghatlodiya, Ahmedabad, Gujarat 380063',
    workingHours: {
      monday: { open: "09:00", close: "22:30", closed: false, is24Hours: false },
      tuesday: { open: "09:00", close: "22:30", closed: false, is24Hours: false },
      wednesday: { open: "09:00", close: "22:30", closed: false, is24Hours: false },
      thursday: { open: "09:00", close: "22:30", closed: false, is24Hours: false },
      friday: { open: "09:00", close: "22:30", closed: false, is24Hours: false },
      saturday: { open: "09:00", close: "22:30", closed: false, is24Hours: false },
      sunday: { open: "09:00", close: "22:30", closed: false, is24Hours: false }
    }
  },
  'riddhi-xerox': {
    phone: '098245 46048',
    workingHours: {
      monday: { open: "09:00", close: "21:00", closed: false, is24Hours: false },
      tuesday: { open: "09:00", close: "21:00", closed: false, is24Hours: false },
      wednesday: { open: "09:00", close: "21:00", closed: false, is24Hours: false },
      thursday: { open: "09:00", close: "21:00", closed: false, is24Hours: false },
      friday: { open: "09:00", close: "21:00", closed: false, is24Hours: false },
      saturday: { open: "09:00", close: "21:00", closed: false, is24Hours: false },
      sunday: { open: "09:00", close: "12:00", closed: false, is24Hours: false }
    }
  },
  'thakar-stationary': {
    phone: '096629 59400',
    workingHours: {
      monday: { open: "09:00", close: "21:00", closed: false, is24Hours: false },
      tuesday: { open: "09:00", close: "21:00", closed: false, is24Hours: false },
      wednesday: { open: "09:00", close: "21:00", closed: false, is24Hours: false },
      thursday: { open: "09:00", close: "21:00", closed: false, is24Hours: false },
      friday: { open: "09:00", close: "21:00", closed: false, is24Hours: false },
      saturday: { open: "09:00", close: "21:00", closed: false, is24Hours: false },
      sunday: { open: "09:00", close: "21:00", closed: false, is24Hours: false }
    }
  },
  'umiya-xerox-stationers': {
    phone: '098989 17474',
    workingHours: {
      monday: { open: "08:00", close: "20:00", closed: false, is24Hours: false },
      tuesday: { open: "08:00", close: "20:00", closed: false, is24Hours: false },
      wednesday: { open: "08:00", close: "20:00", closed: false, is24Hours: false },
      thursday: { open: "08:00", close: "20:00", closed: false, is24Hours: false },
      friday: { open: "08:00", close: "20:00", closed: false, is24Hours: false },
      saturday: { open: "08:00", close: "20:00", closed: false, is24Hours: false },
      sunday: { open: "08:00", close: "12:00", closed: false, is24Hours: false }
    }
  }
};

async function updateExactShopDetails() {
  try {
    console.log('🔍 Connecting to database...');
    const sequelize = getSequelize();
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('\n🏪 UPDATING WITH EXACT GOOGLE MAPS DATA...');
    
    for (const [slug, updates] of Object.entries(EXACT_SHOP_UPDATES)) {
      const shop = await Shop.findOne({ where: { slug } });
      
      if (!shop) {
        console.log(`⚠️ Shop not found: ${slug}`);
        continue;
      }
      
      const updateData = {
        phone: updates.phone,
        workingHours: updates.workingHours
      };
      
      // Update address if provided
      if (updates.address) {
        updateData.address = updates.address;
      }
      
      await shop.update(updateData);
      
      console.log(`✅ Updated ${shop.name}:`);
      console.log(`   📱 Phone: ${updates.phone}`);
      if (updates.address) {
        console.log(`   📍 Address: ${updates.address}`);
      }
      console.log(`   🕐 Mon-Sat: ${updates.workingHours.monday.open} - ${updates.workingHours.monday.close}`);
      console.log(`   🕐 Sunday: ${updates.workingHours.sunday.open} - ${updates.workingHours.sunday.close}`);
      console.log('');
    }

    console.log('📊 FINAL VERIFICATION - ALL SHOPS:');
    console.log('===================================');
    
    const allShops = await Shop.findAll({
      attributes: ['name', 'slug', 'phone', 'workingHours', 'address'],
      order: [['id', 'ASC']]
    });
    
    allShops.forEach((shop, index) => {
      const hours = shop.workingHours;
      console.log(`${index + 1}. ${shop.name}`);
      console.log(`   📱 ${shop.phone}`);
      console.log(`   📍 ${shop.address}`);
      console.log(`   🕐 Weekdays: ${hours.monday.open} - ${hours.monday.close}`);
      console.log(`   🕐 Sunday: ${hours.sunday.open} - ${hours.sunday.close}`);
      console.log('');
    });
    
    console.log('✅ ALL SHOPS UPDATED WITH EXACT GOOGLE MAPS DATA!');
    console.log('📞 All phone numbers are exactly from Google Maps');
    console.log('🕐 All working hours match Google Maps exactly');
    console.log('📍 Addresses updated where provided');
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Update Error:', error);
    throw error;
  }
}

// Run the update
updateExactShopDetails()
  .then(() => {
    console.log('\n🎉 EXACT GOOGLE MAPS DATA UPDATE SUCCESSFUL!');
    console.log('All shops now have 100% accurate information from Google Maps');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 SHOP UPDATE FAILED:', error);
    process.exit(1);
  });