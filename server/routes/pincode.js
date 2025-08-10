import express from 'express';
import { getPincodeData, isValidIndianPincode } from '../../shared/indian-pincode-data.js';

const router = express.Router();

// Auto-fetch location from pincode
router.get('/location/:pincode', async (req, res) => {
  try {
    const { pincode } = req.params;
    
    // Validate pincode format
    if (!isValidIndianPincode(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pincode format. Please enter a valid 6-digit Indian pincode.'
      });
    }
    
    // Get location data from local database
    const locationData = getPincodeData(pincode);
    
    if (locationData) {
      return res.json({
        success: true,
        data: locationData
      });
    } else {
      return res.json({
        success: false,
        message: 'Location data not found for this pincode. Please enter city and state manually.'
      });
    }
    
  } catch (error) {
    console.error('Pincode lookup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch location data. Please try again.'
    });
  }
});

// Validate pincode format
router.get('/validate/:pincode', (req, res) => {
  try {
    const { pincode } = req.params;
    const isValid = isValidIndianPincode(pincode);
    
    return res.json({
      success: true,
      isValid: isValid,
      message: isValid ? 'Valid pincode format' : 'Invalid pincode format'
    });
    
  } catch (error) {
    console.error('Pincode validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to validate pincode'
    });
  }
});

export default router;