import express from 'express';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { User, Shop } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { 
  STANDARD_SHOP_CONFIG,
  parseWorkingHours,
  generateServices,
  createShopSlug,
  extractPinCode,
  cleanPhoneNumber
} from '../utils/google-maps-shop-creator.js';

const router = express.Router();

/**
 * Create shop from Google Maps data
 * POST /api/google-maps-import/create-shop
 */
router.post('/create-shop', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const {
      name,
      address,
      phone,
      workingHours,
      googleMapsLink,
      city = 'Unknown',
      state = 'Unknown',
      rating,
      establishedYear
    } = req.body;

    if (!name || !address || !phone) {
      return res.status(400).json({
        error: 'Missing required fields: name, address, phone'
      });
    }

    // Generate standardized password hash
    const passwordHash = await bcrypt.hash(STANDARD_SHOP_CONFIG.standardPassword, 10);
    
    // Clean and process data
    const cleanPhone = cleanPhoneNumber(phone);
    const shopSlug = createShopSlug(name);
    const pinCode = extractPinCode(address);
    const services = generateServices(name);
    const processedHours = parseWorkingHours(workingHours);

    // 🚨 CRITICAL SAFEGUARD: Check if user already exists to prevent data loss
    const existingUser = await User.findOne({ where: { phone: cleanPhone } });
    if (existingUser) {
      return res.status(400).json({
        error: 'DUPLICATE_PREVENTION: User with this phone already exists',
        message: 'This phone number belongs to an existing user. Use shop update endpoints instead of creation.',
        existingUserId: existingUser.id,
        suggestion: 'Use PUT /api/admin/shops/:id or PATCH /api/shops/settings to update existing shops'
      });
    }

    // 🚨 CRITICAL SAFEGUARD: Check if shop name already exists 
    const existingShop = await Shop.findOne({ where: { name: { [Op.iLike]: `%${name}%` } } });
    if (existingShop) {
      return res.status(400).json({
        error: 'DUPLICATE_PREVENTION: Shop with similar name already exists',
        message: 'A shop with a similar name already exists. Use update endpoints instead.',
        existingShopId: existingShop.id,
        existingShopName: existingShop.name,
        suggestion: 'Use PUT /api/admin/shops/:id or PATCH /api/shops/settings to update existing shops'
      });
    }

    // Create user account ONLY if no duplicates found
    const userData = {
      phone: cleanPhone,
      name: `${name} Owner`,
      email: `${shopSlug}@printeasyqr.com`,
      passwordHash,
      role: 'shop_owner',
      isActive: true
    };

    const user = await User.create(userData);

    // Create shop with standardized settings
    const shopData = {
      ownerId: user.id,
      name,
      slug: shopSlug,
      address,
      city,
      state,
      pinCode,
      phone: cleanPhone,
      publicOwnerName: name,
      internalName: name,
      ownerFullName: `${name} Owner`,
      email: userData.email,
      ownerPhone: cleanPhone,
      completeAddress: address,
      services: JSON.stringify(services),
      equipment: JSON.stringify([]), // NO EQUIPMENT by requirement
      customServices: JSON.stringify([]),
      customEquipment: JSON.stringify([]), // NO CUSTOM EQUIPMENT by requirement
      yearsOfExperience: establishedYear ? new Date().getFullYear() - establishedYear : 5,
      formationYear: establishedYear || 2020,
      workingHours: JSON.stringify(processedHours),
      acceptsWalkinOrders: false, // DISABLED by requirement
      isOnline: STANDARD_SHOP_CONFIG.isOnline,
      autoAvailability: STANDARD_SHOP_CONFIG.autoAvailability,
      isApproved: STANDARD_SHOP_CONFIG.isApproved,
      isPublic: STANDARD_SHOP_CONFIG.isPublic,
      status: STANDARD_SHOP_CONFIG.status,
      qrCode: `GM${Date.now().toString().slice(-6)}`,
      totalOrders: STANDARD_SHOP_CONFIG.totalOrders,
      googleMapsLink
    };

    const shop = await Shop.create(shopData);

    res.status(201).json({
      success: true,
      message: 'Shop created successfully from Google Maps data',
      shop: {
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        phone: shop.phone,
        address: shop.completeAddress,
        acceptsWalkinOrders: false, // Confirm disabled
        equipment: [], // Confirm empty
        password: STANDARD_SHOP_CONFIG.standardPassword
      },
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Google Maps shop creation error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Shop with this phone number or slug already exists'
      });
    }

    res.status(500).json({
      error: 'Failed to create shop from Google Maps data',
      details: error.message
    });
  }
});

export default router;