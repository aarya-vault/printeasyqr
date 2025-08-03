const { Shop, User, Order, CustomerShopUnlock, ShopApplication } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');

class ShopController {
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
      
      res.json({ shop });
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
      
      res.json(shop);
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
      
      res.json(shops || []);
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
      
      res.json(shops);
    } catch (error) {
      console.error('Error fetching shops:', error);
      res.status(500).json({ message: 'Failed to fetch shops' });
    }
  }

  // Get unlocked shops for customer
  static async getUnlockedShops(req, res) {
    try {
      const customerId = parseInt(req.params.customerId);
      
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
      
      const shops = unlocks.map(unlock => unlock.shop);
      res.json(shops);
    } catch (error) {
      console.error('Get unlocked shops error:', error);
      res.status(500).json({ message: 'Failed to get unlocked shops' });
    }
  }

  // Unlock shop for customer
  static async unlockShop(req, res) {
    try {
      const { shopSlug } = req.params;
      const { customerId } = req.body;
      
      if (!customerId) {
        return res.status(400).json({ message: 'Customer ID required' });
      }
      
      const shop = await Shop.findOne({ where: { slug: shopSlug } });
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }
      
      // Create or find unlock record
      const [unlock, created] = await CustomerShopUnlock.findOrCreate({
        where: {
          customerId: parseInt(customerId),
          shopId: shop.id
        },
        defaults: {
          qrScanLocation: 'qr_scan'
        }
      });
      
      res.json({ success: true, shop });
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
      
      res.json(shop);
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
      
      res.json({ 
        message: 'Shop updated successfully',
        shop 
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
      
      res.json({ success: true, shop });
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
      
      res.json({ success: true, shop });
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
}

module.exports = ShopController;