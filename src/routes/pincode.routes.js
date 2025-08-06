const express = require('express');
const router = express.Router();

// Import the comprehensive pincode utilities (complete Indian database with Gujarat/Ahmedabad coverage)
const { getPincodeData, isValidIndianPincode, searchPincodesByCity, getAllStates, getPincodesByState } = require('../../shared/indian-pincode-data.js');

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
    
    // Get location data from comprehensive Indian database (19,583+ pincodes)
    const locationData = getPincodeData(pincode);
    
    if (locationData) {
      console.log(`📍 Pincode lookup: ${pincode} -> ${locationData.city}, ${locationData.state} (District: ${locationData.district})`);
      return res.json({
        success: true,
        data: {
          city: locationData.city,
          state: locationData.state,
          district: locationData.district || locationData.city,
          pincode: locationData.pincode
        }
      });
    } else {
      console.log(`❌ Pincode not found: ${pincode}`);
      return res.json({
        success: false,
        message: 'Pincode not found in database. Please enter city and state manually.'
      });
    }
    
  } catch (error) {
    console.error('❌ Pincode lookup error:', error);
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
    console.error('❌ Pincode validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to validate pincode'
    });
  }
});

// Search pincodes by city/state name
router.get('/search/:term', (req, res) => {
  try {
    const { term } = req.params;
    
    if (!term || term.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search term must be at least 2 characters long'
      });
    }

    const results = searchPincodesByCity(term);
    
    console.log(`🔍 Pincode search: "${term}" -> ${results.length} results`);
    
    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    console.error('❌ Pincode search error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during search'
    });
  }
});

// Get all states
router.get('/states', (req, res) => {
  try {
    const states = getAllStates();
    
    res.json({
      success: true,
      data: states,
      count: states.length
    });
  } catch (error) {
    console.error('❌ States lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving states'
    });
  }
});

// Get pincodes by state
router.get('/state/:stateName', (req, res) => {
  try {
    const { stateName } = req.params;
    
    if (!stateName) {
      return res.status(400).json({
        success: false,
        message: 'State name is required'
      });
    }

    const pincodes = getPincodesByState(stateName);
    
    console.log(`🗺️ State lookup: ${stateName} -> ${pincodes.length} pincodes`);
    
    res.json({
      success: true,
      data: pincodes,
      count: pincodes.length
    });
  } catch (error) {
    console.error('❌ State pincodes lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving state data'
    });
  }
});

module.exports = router;