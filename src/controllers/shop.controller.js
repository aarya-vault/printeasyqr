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

  // Helper function to parse JSON objects or return empty object
  static parseJsonObject(data) {
    if (typeof data === 'object' && data !== null) return data;
    if (typeof data === 'string' && data.trim()) {
      try {
        const parsed = JSON.parse(data);
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
      } catch (e) {
        return {};
      }
    }
    return {};
  }

  // CRITICAL FIX: Normalize working hours format for consistent frontend usage
  static normalizeWorkingHours(hours) {
    const rawHours = ShopController.parseJsonObject(hours);
    if (!rawHours || typeof rawHours !== 'object') return {};
    
    const normalizedHours = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(day => {
      const dayHours = rawHours[day];
      if (dayHours) {
        // Handle old format: {isOpen, openTime, closeTime} -> new format: {open, close, closed, is24Hours}
        if (dayHours.hasOwnProperty('isOpen') && dayHours.hasOwnProperty('openTime')) {
          normalizedHours[day] = {
            open: dayHours.openTime || '09:00',
            close: dayHours.closeTime || '18:00',
            closed: !dayHours.isOpen,
            is24Hours: false
          };
        } 
        // Handle new format: keep as is
        else if (dayHours.hasOwnProperty('open') && dayHours.hasOwnProperty('close')) {
          normalizedHours[day] = {
            open: dayHours.open || '09:00',
            close: dayHours.close || '18:00',
            closed: dayHours.closed || false,
            is24Hours: dayHours.is24Hours || false
          };
        }
        // Handle any other format: provide defaults
        else {
          normalizedHours[day] = {
            open: '09:00',
            close: '18:00',
            closed: false,
            is24Hours: false
          };
        }
      } else {
        // Provide default for missing days
        normalizedHours[day] = {
          open: '09:00',
          close: '18:00',
          closed: false,
          is24Hours: false
        };
      }
    });
    
    console.log('🔧 WORKING HOURS NORMALIZATION - Input:', hours);
    console.log('🔧 WORKING HOURS NORMALIZATION - Output:', normalizedHours);
    return normalizedHours;
  }

  // Calculate unified shop status combining working hours and manual override with time-based reset
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
    
    // Step 2: Check if we need to reset manual override based on time
    const shouldResetToScheduled = ShopController.shouldResetManualOverride(shopData);
    
    // Step 3: Determine final status with time-based reset logic
    let isOpen;
    let reason;
    
    if (shouldResetToScheduled) {
      // Time-based reset: Follow scheduled hours (manual override expired)
      isOpen = isWithinWorkingHours;
      reason = isWithinWorkingHours 
        ? 'Open and accepting orders (following schedule)'
        : 'Closed according to schedule';
    } else {
      // Manual override still active
      const manualOverride = Boolean(shopData.isOnline);
      isOpen = manualOverride;
      reason = manualOverride
        ? 'Open and accepting orders (manually opened)'
        : 'Temporarily closed (manually closed)';
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

  // Check if manual override should be reset to scheduled hours
  static shouldResetManualOverride(shopData) {
    if (!shopData.manualOverrideTimestamp) {
      // No manual override timestamp means follow scheduled hours
      return true;
    }

    // Get current time in India timezone
    const now = new Date();
    const indiaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const overrideTime = new Date(shopData.manualOverrideTimestamp);
    
    // Check if it's a new day since the manual override
    const currentDay = indiaTime.toDateString();
    const overrideDay = overrideTime.toDateString();
    
    if (currentDay !== overrideDay) {
      // New day: Reset to scheduled hours
      return true;
    }

    // Same day: Check if we've entered a new scheduled period
    const workingHours = ShopController.parseJsonObject(shopData.workingHours);
    const currentDayName = indiaTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todaySchedule = workingHours[currentDayName];
    
    if (!todaySchedule || todaySchedule.closed) {
      // No schedule for today or closed: follow manual override
      return false;
    }

    const currentTime = indiaTime.toTimeString().slice(0, 5); // HH:MM format
    const scheduleStartTime = todaySchedule.open || todaySchedule.openTime;
    const overrideTimeHM = overrideTime.toTimeString().slice(0, 5);
    
    // If manual close happened before schedule start and we're now at/after schedule start
    if (overrideTimeHM < scheduleStartTime && currentTime >= scheduleStartTime) {
      return true; // Reset to follow schedule (auto-open)
    }
    
    return false; // Keep manual override active
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
      pinCode: shopData.pin_code || shopData.pinCode,
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
      customServices: ShopController.parseJsonArray(shopData.custom_services || shopData.customServices),
      customEquipment: ShopController.parseJsonArray(shopData.custom_equipment || shopData.customEquipment),
      servicesOffered: ShopController.parseJsonArray(shopData.services), // Alias
      equipmentAvailable: ShopController.parseJsonArray(shopData.equipment), // Alias
      yearsOfExperience: shopData.yearsOfExperience,
      formationYear: shopData.formationYear,
      // Working Hours and Availability - Parse JSON string and normalize format
      workingHours: ShopController.normalizeWorkingHours(shopData.working_hours || shopData.workingHours),
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

      // CRITICAL FIX: Properly handle array fields that need JSON stringification
      const processedUpdateData = { ...updateData };
      
      // Process array fields for database storage
      if (Array.isArray(updateData.services)) {
        processedUpdateData.services = JSON.stringify(updateData.services);
      }
      if (Array.isArray(updateData.equipment)) {
        processedUpdateData.equipment = JSON.stringify(updateData.equipment);
      }
      if (Array.isArray(updateData.customServices)) {
        processedUpdateData.custom_services = JSON.stringify(updateData.customServices);
      }
      if (Array.isArray(updateData.customEquipment)) {
        processedUpdateData.custom_equipment = JSON.stringify(updateData.customEquipment);
      }
      if (typeof updateData.workingHours === 'object' && updateData.workingHours !== null) {
        processedUpdateData.working_hours = JSON.stringify(updateData.workingHours);
      }

      await shop.update(processedUpdateData);
      
      // CRITICAL FIX: Refresh shop data after update to get latest values
      await shop.reload();
      
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
      
      // CRITICAL FIX: Refresh shop data after update
      await shop.reload();
      
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
      
      // CRITICAL FIX: Refresh shop data after update
      await shop.reload();
      
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
      // CRITICAL FIX: Use req.user.id instead of req.userId for consistency with other methods
      const userId = req.user.id;
      const updateData = req.body;

      console.log('🔍 UPDATE SHOP SETTINGS - User ID:', userId);
      console.log('🔍 UPDATE SHOP SETTINGS - Update data keys:', Object.keys(updateData));
      console.log('🔧 UPDATE SHOP SETTINGS - Custom Equipment Received:', updateData.customEquipment);

      const shop = await Shop.findOne({ where: { ownerId: userId } });
      if (!shop) {
        console.log('🔍 No shop found for owner ID:', userId);
        return res.status(404).json({ message: 'Shop not found for this user' });
      }

      console.log('🔍 Found shop for update:', { id: shop.id, name: shop.name });

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
        pinCode: updateData.pinCode || updateData.pin_code,
        city: updateData.city,
        state: updateData.state,
        
        // Business Details
        services: Array.isArray(updateData.services) ? updateData.services : updateData.services,
        equipment: Array.isArray(updateData.equipment) ? updateData.equipment : updateData.equipment,
        customServices: Array.isArray(updateData.customServices) ? updateData.customServices : updateData.customServices,
        customEquipment: Array.isArray(updateData.customEquipment) ? updateData.customEquipment : updateData.customEquipment,
        yearsOfExperience: updateData.yearsOfExperience ? parseInt(updateData.yearsOfExperience) : null,
        formationYear: updateData.formationYear ? parseInt(updateData.formationYear) : null,
        
        // Working Hours
        workingHours: typeof updateData.workingHours === 'object' ? updateData.workingHours : updateData.workingHours,
        
        // Google Maps Link
        googleMapsLink: updateData.googleMapsLink,
        
        // Shop Settings
        isOnline: updateData.isOnline,
        manualOverrideTimestamp: updateData.isOnline !== undefined ? new Date() : undefined,
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

      console.log('🔍 Updating shop with fields:', Object.keys(fieldsToUpdate));
      console.log('🔧 UPDATING CUSTOM EQUIPMENT:', updateData.customEquipment);
      console.log('🔧 FIELDS TO UPDATE - customEquipment:', fieldsToUpdate.customEquipment);
      console.log('🔧 ALL FIELDS TO UPDATE:', JSON.stringify(fieldsToUpdate, null, 2));
      await shop.update(fieldsToUpdate);
      console.log('✅ Shop updated successfully');
      
      // CRITICAL FIX: Refresh shop data after update to get latest values
      await shop.reload();
      console.log('🔧 AFTER RELOAD - Custom equipment from DB:', shop.custom_equipment);
      
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

      console.log('✅ Shop settings update completed for:', updatedShop.name);
      res.json({ 
        message: 'Settings updated successfully', 
        shop: ShopController.transformShopData(updatedShop) 
      });
    } catch (error) {
      console.error('❌ Update shop settings error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        userId: req.user?.id,
        updateDataKeys: Object.keys(req.body || {})
      });
      res.status(500).json({ 
        message: 'Failed to update settings',
        error: error.message 
      });
    }
  }

  // Toggle shop online/offline status with timestamp tracking
  static async toggleShopStatus(req, res) {
    try {
      const userId = req.user.id;
      const { isOnline } = req.body;

      const shop = await Shop.findOne({ where: { ownerId: userId } });
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found for this user' });
      }

      // Update status and set manual override timestamp
      await shop.update({
        isOnline: Boolean(isOnline),
        manualOverrideTimestamp: new Date()
      });

      console.log(`🔄 Shop ${shop.name} status toggled to:`, isOnline ? 'ONLINE' : 'OFFLINE');
      
      // Return updated shop data
      await shop.reload();
      const transformedShop = ShopController.transformShopData(shop);
      
      res.json({ 
        message: `Shop status updated to ${isOnline ? 'online' : 'offline'}`, 
        shop: transformedShop 
      });
    } catch (error) {
      console.error('❌ Toggle shop status error:', error);
      res.status(500).json({ 
        message: 'Failed to update shop status',
        error: error.message 
      });
    }
  }
}

export default ShopController;