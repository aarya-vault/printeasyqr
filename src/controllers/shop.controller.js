import { Shop, User, Order, CustomerShopUnlock, ShopApplication } from '../models/index.js';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';

class ShopController {
  // Helper function to parse JSON arrays or return empty array
  static parseJsonArray(data) {
    if (Array.isArray(data)) return data;
    if (typeof data === 'string' && data.trim()) {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  // Calculate unified shop status combining working hours and manual override
  static calculateUnifiedStatus(shopData) {
    if (!shopData) {
      return {
        isOpen: false,
        canAcceptOrders: false,
        statusText: 'CLOSED',
        reason: 'No shop data'
      };
    }

    // Step 1: Check if within working hours
    const isWithinWorkingHours = ShopController.isWithinWorkingHours(shopData);
    
    // Step 2: Check manual override
    const manualOverride = Boolean(shopData.isOnline);
    
    // UPDATED LOGIC: Manual override takes precedence
    // Shop shows as OPEN if manually set to online (regardless of working hours)
    // Shop shows as CLOSED only if manually set to offline
    const isOpen = manualOverride;
    
    // Determine reason for status
    let reason = '';
    if (!manualOverride) {
      reason = 'Manually closed by shop owner';
    } else if (!isWithinWorkingHours) {
      reason = 'Open (outside working hours)';
    } else {
      reason = 'Open and accepting orders';
    }

    return {
      isOpen,
      canAcceptOrders: isOpen,
      statusText: isOpen ? 'OPEN' : 'CLOSED',
      reason
    };
  }

  // Check if shop is within working hours
  static isWithinWorkingHours(shopData) {
    if (!shopData.workingHours) {
      return false;
    }

    // Handle string format working hours (fallback to true if shop is online)
    if (typeof shopData.workingHours === 'string') {
      return true;
    }

    // Get current day and time in India timezone
    const now = new Date();
    const indiaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const currentDay = indiaTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    let workingHours = shopData.workingHours;
    if (typeof workingHours === 'string') {
      try {
        workingHours = JSON.parse(workingHours);
      } catch (e) {
        return true; // Default to open if can't parse
      }
    }

    const todayHours = workingHours[currentDay];
    if (!todayHours) {
      return false;
    }

    // Check if closed today
    if (todayHours.closed === true) {
      return false;
    }

    // Check 24/7 operation
    if (todayHours.is24Hours === true) {
      return true;
    }

    // Parse time from different formats
    const openTime = todayHours.open || todayHours.openTime;
    const closeTime = todayHours.close || todayHours.closeTime;

    if (!openTime || !closeTime) {
      return false;
    }

    const currentTime = indiaTime.toTimeString().slice(0, 5); // HH:MM format
    return currentTime >= openTime && currentTime <= closeTime;
  }
  // Data transformation helper for consistent API responses
  static transformShopData(shop) {
    if (!shop) return null;
    
    const shopData = shop.toJSON ? shop.toJSON() : shop;
    
    return {
      id: shopData.id,
      name: shopData.name,
      slug: shopData.slug,
      address: shopData.address,
      city: shopData.city,
      state: shopData.state,
      pinCode: shopData.pinCode,
      phone: shopData.phone,
      contactNumber: shopData.phone, // Frontend compatibility
      publicOwnerName: shopData.publicOwnerName,
      ownerName: shopData.ownerFullName, // Frontend compatibility
      // Internal Information
      internalName: shopData.internalName,
      ownerFullName: shopData.ownerFullName,
      email: shopData.email,
      ownerPhone: shopData.ownerPhone,
      completeAddress: shopData.completeAddress,
      // Business Details - Parse JSON strings and ensure arrays for frontend
      services: ShopController.parseJsonArray(shopData.services),
      equipment: ShopController.parseJsonArray(shopData.equipment),
      customServices: ShopController.parseJsonArray(shopData.customServices),
      customEquipment: ShopController.parseJsonArray(shopData.customEquipment),
      servicesOffered: ShopController.parseJsonArray(shopData.services), // Alias
      equipmentAvailable: ShopController.parseJsonArray(shopData.equipment), // Alias
      yearsOfExperience: shopData.yearsOfExperience,
      formationYear: shopData.formationYear,
      // Working Hours and Availability
      workingHours: shopData.workingHours || {},
      acceptsWalkinOrders: Boolean(shopData.acceptsWalkinOrders),
      isOnline: Boolean(shopData.isOnline),
      isOpen: Boolean(shopData.isOnline), // Alias for frontend
      autoAvailability: shopData.autoAvailability,
      // UNIFIED STATUS - Calculate real-time status combining hours + manual override
      unifiedStatus: ShopController.calculateUnifiedStatus(shopData),
      // Admin and Status
      isApproved: shopData.isApproved,
      isPublic: shopData.isPublic,
      status: shopData.status,
      qrCode: shopData.qrCode,
      rating: shopData.rating ? parseFloat(shopData.rating) : 0,
      totalOrders: shopData.totalOrders || 0,
      exteriorImage: shopData.exteriorImage || null,
      googleMapsLink: shopData.googleMapsLink || null,
      // Frontend compatibility aliases
      publicName: shopData.publicOwnerName,
      publicAddress: shopData.completeAddress || shopData.address,
      publicContactNumber: shopData.phone,
      // Timestamps
      createdAt: shopData.createdAt,
      updatedAt: shopData.updatedAt,
      // Include owner data if present
      owner: shopData.owner ? {
        id: shopData.owner.id,
        name: shopData.owner.name,
        phone: shopData.owner.phone,
        email: shopData.owner.email,
        role: shopData.owner.role
      } : undefined
    };
  }

  // Get shop by owner ID
  static async getShopByOwnerId(req, res) {
    try {
      const ownerId = parseInt(req.params.ownerId);
      console.log('🔍 Getting shop for owner ID:', ownerId);
      
      const shop = await Shop.findOne({
        where: { ownerId },
        include: [{ model: User, as: 'owner' }]
      });
      
      if (!shop) {
        console.log('❌ Shop not found for owner:', ownerId);
        return res.status(404).json({ message: 'Shop not found' });
      }
      
      console.log('✅ Shop found:', { 
        id: shop.id, 
        name: shop.name, 
        services: shop.services,
        equipment: shop.equipment 
      });
      
      const transformedShop = ShopController.transformShopData(shop);
      
      // Return the shop data in the expected format for dashboard compatibility
      res.json({ shop: transformedShop });
    } catch (error) {
      console.error('Get shop error:', error);
      res.status(500).json({ message: 'Failed to get shop' });
    }
  }

  // Get shop by slug
  static async getShopBySlug(req, res) {
    try {
      const { slug } = req.params;
      const shop = await Shop.findOne({
        where: { slug },
        include: [{ model: User, as: 'owner' }]
      });
      
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }
      
      const transformedShop = ShopController.transformShopData(shop);
      res.json(transformedShop);
    } catch (error) {
      console.error('Get shop by slug error:', error);
      res.status(500).json({ message: 'Failed to get shop' });
    }
  }

  // Get all active shops
  static async getActiveShops(req, res) {
    try {
      console.log('🔍 Fetching active shops - DATABASE_URL present:', !!process.env.DATABASE_URL);
      
      const shops = await Shop.findAll({
        where: {
          isApproved: true,
          isPublic: true,
          status: 'active'
        },
        include: [{ model: User, as: 'owner' }],
        order: [['createdAt', 'DESC']]
      });
      
      console.log('✅ Active shops found:', shops?.length || 0);
      const transformedShops = (shops || []).map(shop => ShopController.transformShopData(shop));
      res.json(transformedShops);
    } catch (error) {
      console.error('❌ CRITICAL: Get active shops error:', error);
      console.error('❌ Database URL available:', !!process.env.DATABASE_URL);
      console.error('❌ Error details:', error.message, error.stack);
      res.status(500).json({ 
        message: 'Failed to get shops',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Database connection error'
      });
    }
  }

  // Get all shops (admin)
  static async getAllShops(req, res) {
    try {
      console.log('🔍 Admin fetching all shops - DATABASE_URL present:', !!process.env.DATABASE_URL);
      
      const shops = await Shop.findAll({
        include: [{ model: User, as: 'owner' }],
        order: [['createdAt', 'DESC']]
      });
      
      console.log('✅ All shops found:', shops?.length || 0);
      const transformedShops = shops.map(shop => ShopController.transformShopData(shop));
      res.json(transformedShops);
    } catch (error) {
      console.error('❌ CRITICAL: Error fetching all shops:', error);
      console.error('❌ Database URL available:', !!process.env.DATABASE_URL);
      console.error('❌ Error details:', error.message, error.stack);
      res.status(500).json({ 
        message: 'Failed to fetch shops',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Database connection error'
      });
    }
  }

  // Get unlocked shops for customer - AUTO-UNLOCK shops with previous orders
  static async getUnlockedShops(req, res) {
    try {
      const customerId = parseInt(req.params.customerId);
      console.log('🔍 Getting unlocked shops for customer:', customerId);
      
      // First, get explicit unlocks with shop data
      const unlocks = await CustomerShopUnlock.findAll({
        where: { customerId },
        include: [{
          model: Shop,
          as: 'shop',
          where: {
            isApproved: true,
            status: 'active'
          }
        }]
      });
      
      console.log('🔍 Found explicit unlocks:', unlocks.length);
      
      // Get all orders for this customer to check for auto-unlock opportunities
      const customerOrders = await Order.findAll({
        where: { customerId },
        attributes: ['shopId'],
        distinct: true
      });
      
      console.log('🔍 Found customer orders from shops:', customerOrders.map(o => o.shopId));
      
      // Get unique shop IDs from orders
      const uniqueShopIds = [...new Set(customerOrders.map(order => order.shopId))];
      
      // Process auto-unlocks for shops where customer has orders but no explicit unlock
      for (const shopId of uniqueShopIds) {
        const existingUnlock = unlocks.find(unlock => unlock.shop && unlock.shop.id === shopId);
        
        if (!existingUnlock) {
          console.log('🔍 Processing auto-unlock for shop:', shopId);
          
          // Get the shop data to verify it's active and approved
          const shop = await Shop.findOne({
            where: {
              id: shopId,
              isApproved: true,
              status: 'active'
            }
          });
          
          if (shop) {
            try {
              // Create unlock record
              const [unlockRecord, created] = await CustomerShopUnlock.findOrCreate({
                where: {
                  customerId: customerId,
                  shopId: shopId
                },
                defaults: {
                  qrScanLocation: 'auto_unlock_previous_order'
                }
              });
              
              console.log('🔍 Auto-unlock created:', created, 'for shop:', shopId);
              
              // Add to response with shop data
              unlocks.push({
                id: unlockRecord.id,
                customerId: unlockRecord.customerId,
                shopId: unlockRecord.shopId,
                shop: shop
              });
            } catch (autoUnlockError) {
              console.log('❌ Auto-unlock failed for shop:', shopId, autoUnlockError);
            }
          } else {
            console.log('🔍 Shop not found or not active/approved:', shopId);
          }
        }
      }
      
      // Return both shop IDs and full shop data
      const unlockedShopIds = unlocks.map(unlock => unlock.shop.id);
      const unlockedShops = unlocks.map(unlock => ShopController.transformShopData(unlock.shop));
      
      console.log('🔍 Final result:', { unlockedShopIds, shopCount: unlockedShops.length });
      
      res.json({ 
        unlockedShopIds,
        unlockedShops 
      });
    } catch (error) {
      console.error('❌ Get unlocked shops error:', error);
      res.status(500).json({ message: 'Failed to get unlocked shops' });
    }
  }

  // Unlock shop for customer (only through legitimate QR scan)
  static async unlockShop(req, res) {
    try {
      const { shopSlug } = req.params;
      const { customerId, qrToken } = req.body;
      
      if (!customerId) {
        return res.status(400).json({ message: 'Customer ID required' });
      }
      
      // Validate that this unlock is from authenticated user session
      if (req.user && req.user.id !== parseInt(customerId)) {
        return res.status(403).json({ message: 'Access denied - customer ID mismatch' });
      }
      
      const shop = await Shop.findOne({ where: { slug: shopSlug } });
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }
      
      // For authenticated users, allow unlock only if they don't already have access
      // This prevents abuse of direct URL access
      if (req.user) {
        const existingUnlock = await CustomerShopUnlock.findOne({
          where: {
            customerId: parseInt(customerId),
            shopId: shop.id
          }
        });
        
        // If already unlocked, just return the shop data
        if (existingUnlock) {
          const transformedShop = ShopController.transformShopData(shop);
          return res.json({ success: true, shop: transformedShop, alreadyUnlocked: true });
        }
      }
      
      // Create unlock record (only for legitimate QR scans or authenticated users)
      const [unlock, created] = await CustomerShopUnlock.findOrCreate({
        where: {
          customerId: parseInt(customerId),
          shopId: shop.id
        },
        defaults: {
          qrScanLocation: qrToken ? 'qr_scan' : 'direct_access'
        }
      });
      
      const transformedShop = ShopController.transformShopData(shop);
      res.json({ success: true, shop: transformedShop, newUnlock: created });
    } catch (error) {
      console.error('Unlock shop error:', error);
      res.status(500).json({ message: 'Failed to unlock shop' });
    }
  }

  // Toggle shop online status
  static async toggleShopStatus(req, res) {
    try {
      const shopId = parseInt(req.params.id);
      
      const shop = await Shop.findByPk(shopId);
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }
      
      // Check ownership
      if (shop.ownerId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      await shop.update({ isOnline: !shop.isOnline });
      
      // Broadcast shop status update to all connected WebSocket clients
      console.log(`📢 Broadcasting shop status update: Shop ${shopId} is now ${!shop.isOnline ? 'OFFLINE' : 'ONLINE'}`);
      const { broadcast } = await import('../utils/websocket.js');
      if (broadcast) {
        broadcast({
          type: 'SHOP_STATUS_UPDATE',
          shopId: shopId,
          isOnline: shop.isOnline,
          timestamp: new Date().toISOString()
        });
      }
      
      const transformedShop = ShopController.transformShopData(shop);
      res.json(transformedShop);
    } catch (error) {
      console.error('Toggle shop status error:', error);
      res.status(500).json({ message: 'Failed to update shop status' });
    }
  }

  // Update shop (admin)
  static async updateShop(req, res) {
    try {
      const shopId = parseInt(req.params.id);
      const updateData = req.body;

      // Handle password update for shop owner if provided
      if (updateData.password && updateData.password.trim()) {
        const shop = await Shop.findByPk(shopId);
        if (shop) {
          const user = await User.findByPk(shop.ownerId);
          if (user) {
            await user.update({ passwordHash: updateData.password });
          }
        }
        delete updateData.password;
      }

      const shop = await Shop.findByPk(shopId);
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }

      await shop.update(updateData);
      
      const transformedShop = ShopController.transformShopData(shop);
      res.json({ 
        message: 'Shop updated successfully',
        shop: transformedShop
      });
    } catch (error) {
      console.error('Error updating shop:', error);
      res.status(500).json({ message: 'Failed to update shop' });
    }
  }

  // Deactivate shop (admin)
  static async deactivateShop(req, res) {
    try {
      const shopId = parseInt(req.params.id);
      
      const shop = await Shop.findByPk(shopId);
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }
      
      await shop.update({ isApproved: false });
      
      const transformedShop = ShopController.transformShopData(shop);
      res.json({ success: true, shop: transformedShop });
    } catch (error) {
      console.error('Error deactivating shop:', error);
      res.status(500).json({ message: 'Failed to deactivate shop' });
    }
  }

  // Activate shop (admin)
  static async activateShop(req, res) {
    try {
      const shopId = parseInt(req.params.id);
      
      const shop = await Shop.findByPk(shopId);
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }
      
      await shop.update({ isApproved: true });
      
      const transformedShop = ShopController.transformShopData(shop);
      res.json({ success: true, shop: transformedShop });
    } catch (error) {
      console.error('Error activating shop:', error);
      res.status(500).json({ message: 'Failed to activate shop' });
    }
  }

  // Check slug availability
  static async checkSlug(req, res) {
    try {
      const { slug } = req.params;
      const shop = await Shop.findOne({ where: { slug } });
      res.json({ available: !shop });
    } catch (error) {
      res.status(500).json({ message: 'Failed to check slug availability' });
    }
  }

  // Get shop by ID
  static async getShopById(req, res) {
    try {
      const shopId = parseInt(req.params.id);
      
      const shop = await Shop.findByPk(shopId, {
        include: [{ model: User, as: 'owner' }]
      });
      
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }
      
      const transformedShop = ShopController.transformShopData(shop);
      res.json(transformedShop);
    } catch (error) {
      console.error('Get shop by ID error:', error);
      res.status(500).json({ message: 'Failed to get shop' });
    }
  }

  // Update shop settings - Enhanced with all application fields
  static async updateShopSettings(req, res) {
    try {
      const userId = req.userId;
      const updateData = req.body;

      const shop = await Shop.findOne({ where: { ownerId: userId } });
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }

      // Prepare update data with all fields from enhanced settings
      const fieldsToUpdate = {
        // Basic Information
        name: updateData.name,
        publicOwnerName: updateData.publicOwnerName,
        address: updateData.address,
        phone: updateData.phone,
        slug: updateData.slug,
        
        // Internal Information
        internalName: updateData.internalName,
        ownerFullName: updateData.ownerFullName,
        email: updateData.email,
        ownerPhone: updateData.ownerPhone,
        completeAddress: updateData.completeAddress,
        description: updateData.description,
        
        // Location
        pinCode: updateData.pinCode,
        city: updateData.city,
        state: updateData.state,
        
        // Business Details
        services: Array.isArray(updateData.services) ? JSON.stringify(updateData.services) : updateData.services,
        equipment: Array.isArray(updateData.equipment) ? JSON.stringify(updateData.equipment) : updateData.equipment,
        yearsOfExperience: updateData.yearsOfExperience ? parseInt(updateData.yearsOfExperience) : null,
        formationYear: updateData.formationYear ? parseInt(updateData.formationYear) : null,
        
        // Working Hours
        workingHours: typeof updateData.workingHours === 'object' ? JSON.stringify(updateData.workingHours) : updateData.workingHours,
        
        // Google Maps Link
        googleMapsLink: updateData.googleMapsLink,
        
        // Shop Settings
        isOnline: updateData.isOnline,
        acceptsWalkinOrders: updateData.acceptsWalkinOrders,
        
        // Notifications (if supported by model)
        notifications: typeof updateData.notifications === 'object' ? JSON.stringify(updateData.notifications) : updateData.notifications,
      };

      // Remove undefined fields
      Object.keys(fieldsToUpdate).forEach(key => {
        if (fieldsToUpdate[key] === undefined) {
          delete fieldsToUpdate[key];
        }
      });

      await shop.update(fieldsToUpdate);
      
      // Fetch updated shop data with owner
      const updatedShop = await Shop.findOne({
        where: { id: shop.id },
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email', 'phone']
          }
        ]
      });

      res.json({ 
        message: 'Settings updated successfully', 
        shop: ShopController.transformShopData(updatedShop) 
      });
    } catch (error) {
      console.error('Update shop settings error:', error);
      res.status(500).json({ 
        message: 'Failed to update settings',
        error: error.message 
      });
    }
  }
}

export default ShopController;