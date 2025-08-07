import express from 'express';
import { Shop } from '../models/index.js';
const router = express.Router();

// Check slug availability
router.get('/check-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Validate slug format
    if (!slug || slug.length < 3) {
      return res.json({ available: false, message: 'Slug must be at least 3 characters' });
    }
    
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.json({ available: false, message: 'Slug can only contain lowercase letters, numbers, and hyphens' });
    }
    
    if (slug.startsWith('-') || slug.endsWith('-') || slug.includes('--')) {
      return res.json({ available: false, message: 'Invalid slug format' });
    }
    
    // Check if slug exists in database
    const existingShop = await Shop.findOne({
      where: { slug: slug }
    });
    
    if (existingShop) {
      return res.json({ 
        available: false, 
        message: 'This shop URL is already taken. Please choose another.' 
      });
    }
    
    res.json({ 
      available: true, 
      message: 'This shop URL is available!' 
    });
    
  } catch (error) {
    console.error('Check slug error:', error);
    res.status(500).json({ 
      available: false, 
      message: 'Unable to check availability. Please try again.' 
    });
  }
});

export default router;