import dotenv from 'dotenv';
dotenv.config();

import { getSequelize } from '../src/config/database.js';
import { Shop } from '../src/models/index.js';

console.log('🔧 UPDATING SHOPS WITH EXACT GOOGLE MAPS DATA');
console.log('=============================================');

// EXACT DATA FROM GOOGLE MAPS PROVIDED BY USER
const EXACT_SHOP_UPDATES = {
  'arihant-xerox': {
    phone: '091050 71050',
    rating: 4.3,
    reviewCount: 12,
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
    rating: 4.8,
    reviewCount: 169,
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
    rating: 4.4,
    reviewCount: 177,
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
    rating: 3.7,
    reviewCount: 3,
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
    rating: 4.1,
    reviewCount: 34,
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
        workingHours: updates.workingHours,
        rating: updates.rating,
        reviewCount: updates.reviewCount
      };
      
      // Update address if provided
      if (updates.address) {
        updateData.address = updates.address;
      }
      
      await shop.update(updateData);
      
      console.log(`✅ Updated ${shop.name}:`);
      console.log(`   📱 Phone: ${updates.phone}`);
      console.log(`   ⭐ Rating: ${updates.rating}/5 (${updates.reviewCount} reviews)`);
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
      attributes: ['name', 'slug', 'phone', 'workingHours', 'address', 'rating', 'reviewCount'],
      order: [['id', 'ASC']]
    });
    
    allShops.forEach((shop, index) => {
      const hours = shop.workingHours;
      console.log(`${index + 1}. ${shop.name}`);
      console.log(`   ⭐ ${shop.rating}/5 (${shop.reviewCount || 0} reviews)`);
      console.log(`   📱 ${shop.phone}`);
      console.log(`   📍 ${shop.address}`);
      console.log(`   🕐 Weekdays: ${hours.monday.open} - ${hours.monday.close}`);
      console.log(`   🕐 Sunday: ${hours.sunday.open} - ${hours.sunday.close}`);
      console.log('');
    });
    
    console.log('✅ ALL SHOPS UPDATED WITH EXACT GOOGLE MAPS DATA!');
    console.log('📞 All phone numbers are exactly from Google Maps');
    console.log('⭐ All ratings and review counts are exact');
    console.log('🕐 All working hours match Google Maps exactly');
    
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