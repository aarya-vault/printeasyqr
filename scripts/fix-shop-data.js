/**
 * Fix Shop Data - Correct Phone Numbers, Google Maps URLs, and Working Hours
 * Addresses the incorrectly imported data from CSV
 */

import fs from 'fs';
import csv from 'csv-parser';
import { Op } from 'sequelize';
import { sequelize } from '../src/config/database.js';
import { User, Shop } from '../src/models/index.js';

// Configuration
const CSV_FILE_PATH = './attached_assets/shops_export_2025-08-18T19-09-04_1755589014937.csv';

// Utility functions
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Phone number standardization
function standardizePhoneNumber(phone) {
  if (!phone || phone === 'null' || phone === 'undefined') return null;
  
  // Remove all non-digit characters
  const cleaned = phone.toString().replace(/\D/g, '');
  
  // Handle different phone number formats
  if (cleaned.length === 10) {
    return cleaned; // Already 10 digits
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return cleaned.substring(1); // Remove leading 0
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned.substring(2); // Remove +91 country code
  } else if (cleaned.length === 13 && cleaned.startsWith('091')) {
    return cleaned.substring(3); // Remove 091
  }
  
  // Return last 10 digits if longer
  if (cleaned.length > 10) {
    return cleaned.slice(-10);
  }
  
  return cleaned.length === 10 ? cleaned : null;
}

// Parse working hours from CSV data
function parseWorkingHoursFromCSV(workingHoursStr) {
  // Default working hours for print shops
  const defaultHours = {
    monday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
    tuesday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
    wednesday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
    thursday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
    friday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
    saturday: { open: '09:00', close: '18:00', closed: false, is24Hours: false },
    sunday: { open: '10:00', close: '17:00', closed: false, is24Hours: false } // Shorter hours on Sunday
  };

  if (!workingHoursStr || workingHoursStr === '[object Object]' || workingHoursStr === 'null') {
    return defaultHours;
  }

  try {
    // Try to parse as JSON if it looks like JSON
    if (workingHoursStr.startsWith('{')) {
      const parsed = JSON.parse(workingHoursStr);
      
      // Ensure all days are present and properly formatted
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const normalizedHours = {};
      
      days.forEach(day => {
        if (parsed[day] && typeof parsed[day] === 'object') {
          normalizedHours[day] = {
            open: parsed[day].open || '09:00',
            close: parsed[day].close || '18:00',
            closed: parsed[day].closed || false,
            is24Hours: parsed[day].is24Hours || false
          };
        } else {
          normalizedHours[day] = defaultHours[day];
        }
      });
      
      return normalizedHours;
    }
  } catch (e) {
    log(`⚠️ Failed to parse working hours: ${workingHoursStr}`, 'yellow');
  }

  return defaultHours;
}

// Fix Google Maps URL
function fixGoogleMapsURL(url, shopName) {
  if (!url || url === 'null' || url === 'undefined' || url === 'true' || url === 'false' || url === '0' || url === '') {
    // Generate a basic Google Maps search URL
    const encodedName = encodeURIComponent(shopName);
    return `https://www.google.com/maps/search/?api=1&query=${encodedName}`;
  }
  
  // If it's already a valid URL, return as is
  if (url.startsWith('http')) {
    return url;
  }
  
  // Generate fallback URL
  const encodedName = encodeURIComponent(shopName);
  return `https://www.google.com/maps/search/?api=1&query=${encodedName}`;
}

// Create mapping of original CSV data
async function createCSVMapping() {
  log('📄 Reading original CSV data...', 'cyan');
  
  const csvData = {};
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', (row) => {
        if (row.name && row.slug) {
          const key = row.slug || row.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
          csvData[key] = {
            originalPhone: row.phone,
            originalOwnerPhone: row.owner_phone,
            originalGoogleMapsLink: row.google_maps_link,
            originalWorkingHours: row.working_hours,
            name: row.name,
            slug: row.slug
          };
        }
      })
      .on('end', () => {
        log(`📊 Loaded ${Object.keys(csvData).length} CSV records`, 'blue');
        resolve(csvData);
      })
      .on('error', reject);
  });
}

// Main fix function
async function fixShopData() {
  log('🔧 Starting Shop Data Fix Process', 'cyan');
  
  // Check database connection
  try {
    await sequelize.authenticate();
    log('✅ Database connection established', 'green');
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'red');
    process.exit(1);
  }

  // Load CSV data for reference
  const csvData = await createCSVMapping();
  
  // Get all shops that need fixing
  const shopsToFix = await Shop.findAll({
    where: {
      [Op.or]: [
        { phone: { [Op.like]: '0000%' } },
        { phone: { [Op.like]: '1234%' } },
        { googleMapsLink: { [Op.in]: ['true', 'false', '0', '', null] } }
      ]
    },
    include: [{
      model: User,
      as: 'owner'
    }]
  });

  log(`🔍 Found ${shopsToFix.length} shops that need fixing`, 'yellow');

  const fixes = {
    phoneFixed: 0,
    googleMapsFixed: 0,
    workingHoursFixed: 0,
    userPhoneFixed: 0,
    errors: []
  };

  // Process each shop
  for (const shop of shopsToFix) {
    try {
      const updates = {};
      const userUpdates = {};
      let shouldUpdateShop = false;
      let shouldUpdateUser = false;

      // Find corresponding CSV data
      const csvRecord = csvData[shop.slug] || 
                       Object.values(csvData).find(record => 
                         record.name.toLowerCase().includes(shop.name.toLowerCase()) ||
                         shop.name.toLowerCase().includes(record.name.toLowerCase())
                       );

      if (csvRecord) {
        // Fix phone number
        if (shop.phone && (shop.phone.startsWith('0000') || shop.phone.startsWith('1234'))) {
          const originalPhone = standardizePhoneNumber(csvRecord.originalPhone);
          const originalOwnerPhone = standardizePhoneNumber(csvRecord.originalOwnerPhone);
          
          const correctPhone = originalPhone || originalOwnerPhone;
          if (correctPhone && correctPhone !== shop.phone) {
            updates.phone = correctPhone;
            updates.ownerPhone = correctPhone;
            userUpdates.phone = correctPhone;
            shouldUpdateShop = true;
            shouldUpdateUser = true;
            fixes.phoneFixed++;
            
            log(`📱 Fixed phone for ${shop.name}: ${shop.phone} → ${correctPhone}`, 'green');
          }
        }

        // Fix Google Maps URL
        if (!shop.googleMapsLink || ['true', 'false', '0', ''].includes(shop.googleMapsLink)) {
          const fixedUrl = fixGoogleMapsURL(csvRecord.originalGoogleMapsLink, shop.name);
          updates.googleMapsLink = fixedUrl;
          shouldUpdateShop = true;
          fixes.googleMapsFixed++;
          
          log(`🗺️ Fixed Google Maps for ${shop.name}`, 'green');
        }

        // Fix working hours if they're default or corrupted
        if (csvRecord.originalWorkingHours && csvRecord.originalWorkingHours !== '[object Object]') {
          const fixedWorkingHours = parseWorkingHoursFromCSV(csvRecord.originalWorkingHours);
          updates.workingHours = fixedWorkingHours;
          shouldUpdateShop = true;
          fixes.workingHoursFixed++;
          
          log(`🕐 Fixed working hours for ${shop.name}`, 'green');
        }
      } else {
        // Fallback fixes for shops without CSV match
        if (shop.phone && (shop.phone.startsWith('0000') || shop.phone.startsWith('1234'))) {
          // Generate a reasonable phone number (this should be replaced with actual data)
          log(`⚠️ No CSV match for ${shop.name} - phone ${shop.phone} needs manual review`, 'yellow');
          fixes.errors.push(`No CSV match for ${shop.name} - phone needs manual review`);
        }

        if (!shop.googleMapsLink || ['true', 'false', '0', ''].includes(shop.googleMapsLink)) {
          const fixedUrl = fixGoogleMapsURL(null, shop.name);
          updates.googleMapsLink = fixedUrl;
          shouldUpdateShop = true;
          fixes.googleMapsFixed++;
        }
      }

      // Apply updates
      if (shouldUpdateShop) {
        await shop.update(updates);
      }

      if (shouldUpdateUser && shop.owner && Object.keys(userUpdates).length > 0) {
        await shop.owner.update(userUpdates);
        fixes.userPhoneFixed++;
      }

    } catch (error) {
      const errorMsg = `Failed to fix ${shop.name}: ${error.message}`;
      log(`❌ ${errorMsg}`, 'red');
      fixes.errors.push(errorMsg);
    }
  }

  return fixes;
}

// Get all shops for verification
async function verifyFixes() {
  log('🔍 Verifying fixes...', 'cyan');
  
  const invalidPhones = await Shop.count({
    where: {
      [Op.or]: [
        { phone: { [Op.like]: '0000%' } },
        { phone: { [Op.like]: '1234%' } }
      ]
    }
  });

  const invalidGoogleMaps = await Shop.count({
    where: {
      [Op.or]: [
        { googleMapsLink: { [Op.in]: ['true', 'false', '0', '', null] } },
        { googleMapsLink: { [Op.is]: null } }
      ]
    }
  });

  const validPhones = await Shop.count({
    where: {
      phone: {
        [Op.notLike]: '0000%',
        [Op.notLike]: '1234%',
        [Op.ne]: null
      }
    }
  });

  return {
    invalidPhones,
    invalidGoogleMaps,
    validPhones,
    totalShops: await Shop.count()
  };
}

// Main execution
async function main() {
  try {
    log('🔧 PrintEasy QR - Shop Data Fix Tool', 'magenta');
    log('=====================================', 'magenta');
    
    // Check if CSV file exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      throw new Error(`CSV file not found: ${CSV_FILE_PATH}`);
    }
    
    // Run fixes
    const fixes = await fixShopData();
    
    // Verify results
    const verification = await verifyFixes();
    
    // Final summary
    log('\n📊 FIX SUMMARY', 'cyan');
    log('================', 'cyan');
    log(`📱 Phone numbers fixed: ${fixes.phoneFixed}`, 'green');
    log(`👤 User phone numbers fixed: ${fixes.userPhoneFixed}`, 'green');
    log(`🗺️ Google Maps URLs fixed: ${fixes.googleMapsFixed}`, 'green');
    log(`🕐 Working hours fixed: ${fixes.workingHoursFixed}`, 'green');
    log(`❌ Errors encountered: ${fixes.errors.length}`, 'red');
    
    if (fixes.errors.length > 0) {
      log('\n❌ Errors:', 'red');
      fixes.errors.forEach(error => log(`   - ${error}`, 'red'));
    }
    
    log('\n📊 VERIFICATION RESULTS', 'cyan');
    log('========================', 'cyan');
    log(`✅ Shops with valid phones: ${verification.validPhones}/${verification.totalShops}`, 'green');
    log(`⚠️ Shops with invalid phones: ${verification.invalidPhones}`, verification.invalidPhones > 0 ? 'yellow' : 'green');
    log(`⚠️ Shops with invalid Google Maps: ${verification.invalidGoogleMaps}`, verification.invalidGoogleMaps > 0 ? 'yellow' : 'green');
    
    if (verification.invalidPhones === 0) {
      log('🎉 All phone numbers are now valid!', 'green');
    }
    
  } catch (error) {
    log(`💥 Fix failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the fix
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as fixShopData };