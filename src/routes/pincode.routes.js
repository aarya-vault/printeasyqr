import express from 'express';
import PinCodeService from '../services/pincode.service.js';
const router = express.Router();

// Lookup city and state by PIN code
router.get('/lookup/:pincode', async (req, res) => {
  try {
    const { pincode } = req.params;
    const result = await PinCodeService.lookupByPinCode(pincode);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('PIN code lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to lookup PIN code. Please try again.'
    });
  }
});

// Get all available states
router.get('/states', (req, res) => {
  try {
    const states = PinCodeService.getAllStates();
    res.json({ success: true, states });
  } catch (error) {
    console.error('Get states error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to get states'
    });
  }
});

// Get cities by state
router.get('/cities/:state', (req, res) => {
  try {
    const { state } = req.params;
    const cities = PinCodeService.getCitiesByState(state);
    res.json({ success: true, cities });
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to get cities'
    });
  }
});

export default router;