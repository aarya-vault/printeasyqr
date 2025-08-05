import { Shop, User, Order, CustomerShopUnlock, ShopApplication } from '../models/index.js';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';

class ShopController {
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
      // Business Details
      services: shopData.services,
      equipment: shopData.equipment,
      yearsOfExperience: shopData.yearsOfExperience,
      // Working Hours and Availability
      workingHours: shopData.workingHours,
      acceptsWalkinOrders: shopData.acceptsWalkinOrders,
      isOnline: shopData.isOnline,
      autoAvailability: shopData.autoAvailability,
      // Admin and Status
      isApproved: shopData.isApproved,
      isPublic: shopData.isPublic,
      status: shopData.status,
      qrCode: shopData.qrCode,
      rating: shopData.rating,
      totalOrders: shopData.totalOrders,
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
      const shop = await Shop.findOne({
        where: { ownerId },
        include: [{ model: User, as: 'owner' }]
      });
      
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }
      
      const transformedShop = ShopController.transformShopData(shop);
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
      const shops = await Shop.findAll({
        where: {
          isApproved: true,
          isPublic: true,
          status: 'active'
        },
        include: [{ model: User, as: 'owner' }],
        order: [['createdAt', 'DESC']]
      });
      
      const transformedShops = (shops || []).map(shop => ShopController.transformShopData(shop));
      res.json(transformedShops);
    } catch (error) {
      console.error('Get all shops error:', error);
      res.status(500).json({ message: 'Failed to get shops' });
    }
  }

  // Get all shops (admin)
  static async getAllShops(req, res) {
    try {
      const shops = await Shop.findAll({
        include: [{ model: User, as: 'owner' }],
        order: [['createdAt', 'DESC']]
      });
      
      const transformedShops = shops.map(shop => ShopController.transformShopData(shop));
      res.json(transformedShops);
    } catch (error) {
      console.error('Error fetching shops:', error);
      res.status(500).json({ message: 'Failed to fetch shops' });
    }
  }

  // Get unlocked shops for customer - AUTO-UNLOCK shops with previous orders
  static async getUnlockedShops(req, res) {
    try {
      const customerId = parseInt(req.params.customerId);
      
      // First, get explicit unlocks
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
      
      // Get shops where customer has placed orders (auto-unlock)
      const { Order } = require('../models');
      const ordersWithShops = await Order.findAll({
        where: { customerId },
        include: [{
          model: Shop,
          as: 'shop',
          where: {
            isApproved: true,
            status: 'active'
          }
        }],
        group: ['shop.id']
      });
      
      // Auto-unlock shops where customer has orders but no explicit unlock record
      for (const order of ordersWithShops) {
        const existingUnlock = unlocks.find(unlock => unlock.shop.id === order.shop.id);
        if (!existingUnlock && order.shop) {
          try {
            await CustomerShopUnlock.findOrCreate({
              where: {
                customerId: customerId,
                shopId: order.shop.id
              },
              defaults: {
                qrScanLocation: 'auto_unlock_previous_order'
              }
            });
            // Add to response
            unlocks.push({
              shop: order.shop
            });
          } catch (autoUnlockError) {
            console.log('Auto-unlock failed for shop:', order.shop.id, autoUnlockError);
          }
        }
      }
      
      const unlockedShopIds = unlocks.map(unlock => unlock.shop.id);
      res.json({ unlockedShopIds });
    } catch (error) {
      console.error('Get unlocked shops error:', error);
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

  // Update shop settings
  static async updateShopSettings(req, res) {
    try {
      const updateData = req.body;
      const userId = req.user.id;
      
      // Find shop by owner ID
      const shop = await Shop.findOne({ where: { ownerId: userId } });
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }
      
      // Update shop with provided data
      await shop.update(updateData);
      
      const transformedShop = ShopController.transformShopData(shop);
      res.json(transformedShop);
    } catch (error) {
      console.error('Update shop settings error:', error);
      res.status(500).json({ message: 'Failed to update shop settings' });
    }
  }
}

export default ShopController;