/**
 * Fix Remaining Phone Numbers - Target specific duplicate shops
 * Fix the 25 remaining shops with invalid phone numbers
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

// Create mapping of original CSV data
async function createCSVPhoneMapping() {
  log('📄 Reading CSV phone numbers...', 'cyan');
  
  const phoneMap = new Map();
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', (row) => {
        if (row.name && row.phone) {
          // Clean up name for matching
          const cleanName = row.name.trim().toLowerCase();
          const originalPhone = standardizePhoneNumber(row.phone);
          const originalOwnerPhone = standardizePhoneNumber(row.owner_phone);
          
          const phone = originalPhone || originalOwnerPhone;
          if (phone) {
            phoneMap.set(cleanName, phone);
            log(`📞 ${row.name}: ${phone}`, 'blue');
          }
        }
      })
      .on('end', () => {
        log(`📊 Loaded ${phoneMap.size} phone numbers from CSV`, 'blue');
        resolve(phoneMap);
      })
      .on('error', reject);
  });
}

// Main fix function
async function fixRemainingPhones() {
  log('🔧 Starting Remaining Phone Number Fix', 'cyan');
  
  // Check database connection
  try {
    await sequelize.authenticate();
    log('✅ Database connection established', 'green');
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'red');
    process.exit(1);
  }

  // Load CSV phone mapping
  const phoneMap = await createCSVPhoneMapping();
  
  // Get all shops with invalid phone numbers
  const shopsToFix = await Shop.findAll({
    where: {
      [Op.or]: [
        { phone: { [Op.like]: '0000%' } },
        { phone: { [Op.like]: '1234%' } }
      ]
    },
    include: [{
      model: User,
      as: 'owner'
    }]
  });

  log(`🔍 Found ${shopsToFix.length} shops with invalid phone numbers`, 'yellow');

  const fixes = {
    phoneFixed: 0,
    userPhoneFixed: 0,
    shopsDeleted: 0,
    errors: []
  };

  // Process each shop
  for (const shop of shopsToFix) {
    try {
      // Clean shop name for matching
      const cleanShopName = shop.name.trim().toLowerCase();
      
      // Try to find phone number from CSV
      let correctPhone = phoneMap.get(cleanShopName);
      
      // If no exact match, try partial matching
      if (!correctPhone) {
        for (const [csvName, csvPhone] of phoneMap) {
          if (csvName.includes(cleanShopName.split(' ')[0]) || 
              cleanShopName.includes(csvName.split(' ')[0])) {
            correctPhone = csvPhone;
            break;
          }
        }
      }

      if (correctPhone) {
        // Check if this phone number is already used by another shop
        const existingShop = await Shop.findOne({
          where: {
            phone: correctPhone,
            id: { [Op.ne]: shop.id }
          }
        });

        if (existingShop) {
          // This is a duplicate shop - delete it
          log(`🗑️ Deleting duplicate shop: ${shop.name} (phone ${correctPhone} already exists)`, 'yellow');
          
          // Delete the shop owner user first
          if (shop.owner) {
            await shop.owner.destroy();
          }
          
          // Delete the shop
          await shop.destroy();
          fixes.shopsDeleted++;
        } else {
          // Update with correct phone number
          await shop.update({
            phone: correctPhone,
            ownerPhone: correctPhone
          });

          // Update user phone too
          if (shop.owner) {
            await shop.owner.update({
              phone: correctPhone
            });
            fixes.userPhoneFixed++;
          }

          fixes.phoneFixed++;
          log(`📱 Fixed phone for ${shop.name}: ${shop.phone} → ${correctPhone}`, 'green');
        }
      } else {
        log(`⚠️ No phone number found for ${shop.name} - needs manual review`, 'yellow');
        fixes.errors.push(`No phone number found for ${shop.name}`);
      }

    } catch (error) {
      const errorMsg = `Failed to fix ${shop.name}: ${error.message}`;
      log(`❌ ${errorMsg}`, 'red');
      fixes.errors.push(errorMsg);
    }
  }

  return fixes;
}

// Verify fixes
async function verifyPhoneFixes() {
  log('🔍 Verifying phone fixes...', 'cyan');
  
  const invalidPhones = await Shop.count({
    where: {
      [Op.or]: [
        { phone: { [Op.like]: '0000%' } },
        { phone: { [Op.like]: '1234%' } }
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

  const totalShops = await Shop.count();

  return {
    invalidPhones,
    validPhones,
    totalShops
  };
}

// Main execution
async function main() {
  try {
    log('📱 PrintEasy QR - Phone Number Fix Tool', 'magenta');
    log('======================================', 'magenta');
    
    // Check if CSV file exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      throw new Error(`CSV file not found: ${CSV_FILE_PATH}`);
    }
    
    // Run fixes
    const fixes = await fixRemainingPhones();
    
    // Verify results
    const verification = await verifyPhoneFixes();
    
    // Final summary
    log('\n📊 PHONE FIX SUMMARY', 'cyan');
    log('====================', 'cyan');
    log(`📱 Phone numbers fixed: ${fixes.phoneFixed}`, 'green');
    log(`👤 User phone numbers fixed: ${fixes.userPhoneFixed}`, 'green');
    log(`🗑️ Duplicate shops deleted: ${fixes.shopsDeleted}`, 'yellow');
    log(`❌ Errors encountered: ${fixes.errors.length}`, 'red');
    
    if (fixes.errors.length > 0) {
      log('\n❌ Errors:', 'red');
      fixes.errors.forEach(error => log(`   - ${error}`, 'red'));
    }
    
    log('\n📊 VERIFICATION RESULTS', 'cyan');
    log('========================', 'cyan');
    log(`✅ Shops with valid phones: ${verification.validPhones}/${verification.totalShops}`, 'green');
    log(`⚠️ Shops with invalid phones: ${verification.invalidPhones}`, verification.invalidPhones > 0 ? 'yellow' : 'green');
    
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

export { main as fixRemainingPhones };