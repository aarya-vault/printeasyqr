import { Shop } from '../models/index.js';
import * as indianPincodeData from '../../shared/indian-pincode-data.js';
import { Op } from 'sequelize';

/**
 * Script to fix location data in database
 * Updates shops with pinCode but "Unknown" city/state to correct values
 */
async function fixLocationData() {
  try {
    console.log('🔄 Starting location data fix...');
    
    // Find all shops with Unknown city/state but valid pincode
    const shopsToFix = await Shop.findAll({
      where: {
        pinCode: {
          [Op.not]: null
        }
      }
    });

    console.log(`📍 Found ${shopsToFix.length} shops to check`);
    
    let fixedCount = 0;
    let errors = 0;
    
    for (const shop of shopsToFix) {
      // Skip if already has valid city and state
      if (shop.city && shop.state && 
          shop.city !== 'Unknown' && shop.state !== 'Unknown' &&
          shop.city.trim() !== '' && shop.state.trim() !== '') {
        console.log(`✅ Shop ${shop.name} already has valid location: ${shop.city}, ${shop.state}`);
        continue;
      }
      
      if (!shop.pinCode || shop.pinCode.length !== 6) {
        console.log(`❌ Shop ${shop.name} has invalid pincode: ${shop.pinCode}`);
        errors++;
        continue;
      }
      
      try {
        // Get location data from pincode
        const locationData = indianPincodeData.getPincodeData(shop.pinCode);
        
        if (locationData) {
          await shop.update({
            city: locationData.city,
            state: locationData.state
          });
          
          console.log(`✅ Fixed ${shop.name}: ${shop.pinCode} → ${locationData.city}, ${locationData.state}`);
          fixedCount++;
        } else {
          console.log(`❌ No data found for pincode ${shop.pinCode} (Shop: ${shop.name})`);
          errors++;
        }
      } catch (error) {
        console.error(`❌ Error fixing ${shop.name}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n📊 Location Data Fix Summary:');
    console.log(`✅ Successfully fixed: ${fixedCount} shops`);
    console.log(`❌ Errors: ${errors} shops`);
    console.log(`📍 Total processed: ${shopsToFix.length} shops`);
    
  } catch (error) {
    console.error('❌ Error in fixLocationData:', error);
  }
}

// Auto-fix function for use in API endpoints
async function autoFixShopLocation(shopId) {
  try {
    const shop = await Shop.findByPk(shopId);
    
    if (!shop) {
      return { success: false, error: 'Shop not found' };
    }
    
    // Skip if already has valid location
    if (shop.city && shop.state && 
        shop.city !== 'Unknown' && shop.state !== 'Unknown' &&
        shop.city.trim() !== '' && shop.state.trim() !== '') {
      return { 
        success: true, 
        message: 'Shop already has valid location',
        location: { city: shop.city, state: shop.state }
      };
    }
    
    if (!shop.pinCode || shop.pinCode.length !== 6) {
      return { success: false, error: 'Invalid pincode' };
    }
    
    const locationData = indianPincodeData.getPincodeData(shop.pinCode);
    
    if (locationData) {
      await shop.update({
        city: locationData.city,
        state: locationData.state
      });
      
      return {
        success: true,
        message: 'Location updated successfully',
        location: { city: locationData.city, state: locationData.state }
      };
    } else {
      return { success: false, error: 'Location data not found for pincode' };
    }
    
  } catch (error) {
    console.error('Error in autoFixShopLocation:', error);
    return { success: false, error: error.message };
  }
}

export { fixLocationData, autoFixShopLocation };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixLocationData().then(() => {
    console.log('🎉 Location data fix completed!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Error running fix:', error);
    process.exit(1);
  });
}