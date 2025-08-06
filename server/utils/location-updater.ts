import { Shop, ShopApplication } from '../models/index.js';
import * as indianPincodeData from '../../shared/indian-pincode-data.js';
import { Op } from 'sequelize';

/**
 * Updates shop location data from pincode
 * This will be called automatically when needed
 */
export async function updateShopLocationFromPincode(shopId: number): Promise<{ success: boolean; location?: { city: string; state: string }; error?: string }> {
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
        location: { city: locationData.city, state: locationData.state }
      };
    } else {
      return { success: false, error: 'Location data not found for pincode' };
    }
    
  } catch (error) {
    console.error('Error in updateShopLocationFromPincode:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Updates shop application location data from pincode
 */
export async function updateShopApplicationLocationFromPincode(applicationId: number): Promise<{ success: boolean; location?: { city: string; state: string }; error?: string }> {
  try {
    const application = await ShopApplication.findByPk(applicationId);
    
    if (!application) {
      return { success: false, error: 'Application not found' };
    }
    
    // Skip if already has valid location
    if (application.city && application.state && 
        application.city !== 'Unknown' && application.state !== 'Unknown' &&
        application.city.trim() !== '' && application.state.trim() !== '') {
      return { 
        success: true, 
        location: { city: application.city, state: application.state }
      };
    }
    
    if (!application.pinCode || application.pinCode.length !== 6) {
      return { success: false, error: 'Invalid pincode' };
    }
    
    const locationData = indianPincodeData.getPincodeData(application.pinCode);
    
    if (locationData) {
      await application.update({
        city: locationData.city,
        state: locationData.state
      });
      
      return {
        success: true,
        location: { city: locationData.city, state: locationData.state }
      };
    } else {
      return { success: false, error: 'Location data not found for pincode' };
    }
    
  } catch (error) {
    console.error('Error in updateShopApplicationLocationFromPincode:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Batch update all shops with Unknown location data
 */
export async function batchUpdateShopLocations(): Promise<{ updated: number; errors: number; details: Array<{ shopId?: number; name?: string; status: string; location?: { city: string; state: string }; error?: string }> }> {
  try {
    const shopsToUpdate = await Shop.findAll({
      where: {
        pinCode: {
          [Op.not]: null
        }
      }
    });

    let updated = 0;
    let errors = 0;
    const details = [];

    for (const shop of shopsToUpdate) {
      const result = await updateShopLocationFromPincode(shop.id);
      if (result.success) {
        updated++;
        details.push({ 
          shopId: shop.id, 
          name: shop.name, 
          status: 'updated', 
          location: result.location 
        });
      } else {
        errors++;
        details.push({ 
          shopId: shop.id, 
          name: shop.name, 
          status: 'error', 
          error: result.error 
        });
      }
    }

    return { updated, errors, details };
  } catch (error) {
    console.error('Error in batchUpdateShopLocations:', error);
    return { updated: 0, errors: 1, details: [{ status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }] };
  }
}