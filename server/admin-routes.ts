import { Router } from 'express';
import bcrypt from 'bcrypt';
import { storage } from './storage';
import { db } from './db';
import { shops, orders } from '../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Get complete shop details with all data for admin management
router.get('/shops/:id/complete', async (req, res) => {
  try {
    const shopId = parseInt(req.params.id);
    const shopResult = await db.select().from(shops).where(eq(shops.id, shopId));
    const shop = shopResult[0];
    
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Get additional shop statistics
    const shopOrders = await db.select().from(orders).where(eq(orders.shopId, shopId));
    const totalOrders = shopOrders.length;
    const completedOrders = shopOrders.filter((order: any) => order.status === 'completed').length;
    
    const completeShopData = {
      ...shop,
      totalOrders,
      completedOrders,
      // Add working hours if not present
      workingHours: shop.workingHours || {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '18:00', closed: false },
        sunday: { open: '10:00', close: '17:00', closed: false }
      }
    };

    res.json(completeShopData);
  } catch (error) {
    console.error('Error fetching complete shop details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update shop with comprehensive data including password management
router.put('/shops/:id', async (req, res) => {
  try {
    const shopId = parseInt(req.params.id);
    const updateData = req.body;

    // Hash password if provided
    if (updateData.password && updateData.password.trim()) {
      const saltRounds = 12;
      updateData.passwordHash = await bcrypt.hash(updateData.password, saltRounds);
      delete updateData.password; // Remove plain password from update data
    }

    // Update shop data
    const [updatedShop] = await db
      .update(shops)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(shops.id, shopId))
      .returning();
    
    if (!updatedShop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    res.json({ 
      message: 'Shop updated successfully',
      shop: updatedShop 
    });
  } catch (error) {
    console.error('Error updating shop:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Simple admin endpoints that were working before
router.get('/stats', async (req, res) => {
  try {
    const stats = await storage.getPlatformStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

router.get('/shop-applications', async (req, res) => {
  try {
    const applications = await storage.getAllShopApplications();
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { users } = await import('../shared/schema');
    const allUsers = await db.select().from(users).orderBy(users.createdAt);
    res.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.get('/shops', async (req, res) => {
  try {
    const shops = await storage.getAllShops();
    res.json(shops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ message: 'Failed to fetch shops' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { users } = await import('../shared/schema');
    
    // Check if user exists
    const [existingUser] = await db.select().from(users).where(eq(users.id, userId));
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent admin from deleting themselves
    if (req.user && req.user.id === userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    // Delete the user
    await db.delete(users).where(eq(users.id, userId));
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Update user (admin only) 
router.patch('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const updatedUser = await storage.updateUser(userId, req.body);
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Toggle user status (admin only)
router.patch('/users/:id/status', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { isActive } = req.body;
    
    const updatedUser = await storage.updateUser(userId, { isActive });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// Deactivate shop (admin only)
router.patch('/shops/:id/deactivate', async (req, res) => {
  try {
    const shopId = parseInt(req.params.id);
    const updatedShop = await storage.updateShop(shopId, { isApproved: false });
    
    if (!updatedShop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    res.json({ success: true, shop: updatedShop });
  } catch (error) {
    console.error('Error deactivating shop:', error);
    res.status(500).json({ message: 'Failed to deactivate shop' });
  }
});

// Activate shop (admin only)
router.patch('/shops/:id/activate', async (req, res) => {
  try {
    const shopId = parseInt(req.params.id);
    const updatedShop = await storage.updateShop(shopId, { isApproved: true });
    
    if (!updatedShop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    res.json({ success: true, shop: updatedShop });
  } catch (error) {
    console.error('Error activating shop:', error);
    res.status(500).json({ message: 'Failed to activate shop' });
  }
});

export default router;