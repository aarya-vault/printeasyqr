import express from 'express';
import { Shop, ShopApplication } from '../models/index.js';
import * as indianPincodeData from '../../shared/indian-pincode-data.js';
import { Op } from 'sequelize';

const router = express.Router();

/**
 * Fix location data for all shops
 * This endpoint will update all shops with correct city/state from pincode
 */
router.post('/fix-all-shops', async (req, res) => {
  try {
    const shops = await Shop.findAll({
      where: {
        pinCode: {
          [Op.not]: null
        }
      }
    });

    let updatedCount = 0;
    let errors = [];

    for (const shop of shops) {
      // Skip if already has valid location
      if (shop.city && shop.state && 
          shop.city !== 'Unknown' && shop.state !== 'Unknown' &&
          shop.city.trim() !== '' && shop.state.trim() !== '') {
        continue;
      }

      if (!shop.pinCode || shop.pinCode.length !== 6) {
        errors.push({ shopId: shop.id, name: shop.name, error: 'Invalid pincode' });
        continue;
      }

      try {
        const locationData = indianPincodeData.getPincodeData(shop.pinCode);
        
        if (locationData) {
          await shop.update({
            city: locationData.city,
            state: locationData.state
          });
          updatedCount++;
        } else {
          errors.push({ shopId: shop.id, name: shop.name, error: 'Location not found' });
        }
      } catch (error) {
        errors.push({ shopId: shop.id, name: shop.name, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Updated ${updatedCount} shops`,
      updatedCount,
      totalShops: shops.length,
      errors: errors.length,
      errorDetails: errors
    });

  } catch (error) {
    console.error('Error fixing shop locations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix shop locations',
      details: error.message
    });
  }
});

/**
 * Fix location data for a specific shop
 */
router.post('/fix-shop/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const shop = await Shop.findByPk(shopId);

    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }

    if (!shop.pinCode || shop.pinCode.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pincode'
      });
    }

    const locationData = indianPincodeData.getPincodeData(shop.pinCode);

    if (locationData) {
      await shop.update({
        city: locationData.city,
        state: locationData.state
      });

      res.json({
        success: true,
        message: 'Shop location updated successfully',
        shop: {
          id: shop.id,
          name: shop.name,
          city: locationData.city,
          state: locationData.state,
          pinCode: shop.pinCode
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Location data not found for pincode'
      });
    }

  } catch (error) {
    console.error('Error fixing shop location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix shop location',
      details: error.message
    });
  }
});

export default router;