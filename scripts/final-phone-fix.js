/**
 * Final Phone Fix - Use correct phone numbers from first 128 shops
 * The issue is that duplicate shops are using placeholder numbers
 */

import { Op } from 'sequelize';
import { sequelize } from '../src/config/database.js';
import { User, Shop } from '../src/models/index.js';

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

// Main fix function
async function finalPhoneFix() {
  log('🔧 Starting Final Phone Number Fix', 'cyan');
  
  // Check database connection
  try {
    await sequelize.authenticate();
    log('✅ Database connection established', 'green');
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'red');
    process.exit(1);
  }

  // Strategy: Find shops with real phone numbers and match them to shops with fake phone numbers
  // by name similarity, then either fix or delete duplicates

  // Get all shops with valid phone numbers (real numbers)
  const validShops = await Shop.findAll({
    where: {
      phone: {
        [Op.and]: [
          { [Op.notLike]: '0000%' },
          { [Op.notLike]: '1234%' },
          { [Op.ne]: null }
        ]
      }
    },
    order: [['id', 'ASC']]
  });

  // Get all shops with invalid phone numbers
  const invalidShops = await Shop.findAll({
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

  log(`✅ Found ${validShops.length} shops with valid phone numbers`, 'green');
  log(`⚠️ Found ${invalidShops.length} shops with invalid phone numbers`, 'yellow');

  const fixes = {
    phoneFixed: 0,
    userPhoneFixed: 0,
    shopsDeleted: 0,
    errors: []
  };

  // Create a map of valid shops by name for easy lookup
  const validShopMap = new Map();
  validShops.forEach(shop => {
    const cleanName = shop.name.trim().toLowerCase();
    validShopMap.set(cleanName, shop);
  });

  // Process each invalid shop
  for (const invalidShop of invalidShops) {
    try {
      const cleanInvalidName = invalidShop.name.trim().toLowerCase();
      
      // Try to find a matching valid shop
      let matchingValidShop = validShopMap.get(cleanInvalidName);
      
      // If no exact match, try partial matching
      if (!matchingValidShop) {
        for (const [validName, validShop] of validShopMap) {
          // Check if names are similar (contains main keywords)
          const invalidWords = cleanInvalidName.split(' ').filter(w => w.length > 3);
          const validWords = validName.split(' ').filter(w => w.length > 3);
          
          const hasCommonWords = invalidWords.some(word => 
            validWords.some(vWord => 
              word.includes(vWord) || vWord.includes(word)
            )
          );
          
          if (hasCommonWords) {
            matchingValidShop = validShop;
            break;
          }
        }
      }

      if (matchingValidShop) {
        // This invalid shop is a duplicate of a valid shop - delete it
        log(`🗑️ Deleting duplicate shop: ${invalidShop.name} (duplicate of ${matchingValidShop.name})`, 'yellow');
        
        // Delete the shop owner user first
        if (invalidShop.owner) {
          await invalidShop.owner.destroy();
        }
        
        // Delete the invalid shop
        await invalidShop.destroy();
        fixes.shopsDeleted++;
      } else {
        // No matching valid shop found - this might be a unique shop with a bad phone number
        // We'll leave it as is for manual review
        log(`⚠️ No match found for ${invalidShop.name} - keeping for manual review`, 'yellow');
        fixes.errors.push(`No match found for ${invalidShop.name}`);
      }

    } catch (error) {
      const errorMsg = `Failed to process ${invalidShop.name}: ${error.message}`;
      log(`❌ ${errorMsg}`, 'red');
      fixes.errors.push(errorMsg);
    }
  }

  return fixes;
}

// Verify results
async function verifyResults() {
  log('🔍 Verifying final results...', 'cyan');
  
  const totalShops = await Shop.count();
  const validPhones = await Shop.count({
    where: {
      phone: {
        [Op.and]: [
          { [Op.notLike]: '0000%' },
          { [Op.notLike]: '1234%' },
          { [Op.ne]: null }
        ]
      }
    }
  });
  
  const invalidPhones = await Shop.count({
    where: {
      [Op.or]: [
        { phone: { [Op.like]: '0000%' } },
        { phone: { [Op.like]: '1234%' } }
      ]
    }
  });

  return {
    totalShops,
    validPhones,
    invalidPhones
  };
}

// Main execution
async function main() {
  try {
    log('🧹 PrintEasy QR - Final Phone Fix Tool', 'magenta');
    log('====================================', 'magenta');
    
    // Run fixes
    const fixes = await finalPhoneFix();
    
    // Verify results
    const verification = await verifyResults();
    
    // Final summary
    log('\n📊 FINAL FIX SUMMARY', 'cyan');
    log('=====================', 'cyan');
    log(`📱 Phone numbers fixed: ${fixes.phoneFixed}`, 'green');
    log(`👤 User phone numbers fixed: ${fixes.userPhoneFixed}`, 'green');
    log(`🗑️ Duplicate shops deleted: ${fixes.shopsDeleted}`, 'yellow');
    log(`⚠️ Shops needing manual review: ${fixes.errors.length}`, 'yellow');
    
    if (fixes.errors.length > 0) {
      log('\n⚠️ Shops needing manual review:', 'yellow');
      fixes.errors.forEach(error => log(`   - ${error}`, 'yellow'));
    }
    
    log('\n📊 FINAL VERIFICATION', 'cyan');
    log('======================', 'cyan');
    log(`📱 Total shops: ${verification.totalShops}`, 'blue');
    log(`✅ Shops with valid phones: ${verification.validPhones}`, 'green');
    log(`⚠️ Shops with invalid phones: ${verification.invalidPhones}`, verification.invalidPhones > 0 ? 'yellow' : 'green');
    log(`📊 Phone coverage: ${((verification.validPhones / verification.totalShops) * 100).toFixed(1)}%`, 'blue');
    
    if (verification.invalidPhones === 0) {
      log('🎉 All phone numbers are now valid!', 'green');
    } else if (verification.validPhones / verification.totalShops >= 0.95) {
      log('✅ 95%+ phone coverage achieved - excellent!', 'green');
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

export { main as finalPhoneFix };