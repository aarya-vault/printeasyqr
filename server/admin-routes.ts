import { Router } from 'express';
import bcrypt from 'bcrypt';
import { storage } from './storage';
import { db } from './db';
import { shops, orders, users, shopApplications } from '../shared/schema';
import { eq, desc, count, sql } from 'drizzle-orm';
import { requireAuth, requireAdmin } from './middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

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

// Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [shopCount] = await db.select({ count: count() }).from(shops).where(eq(shops.isApproved, true));
    const [orderCount] = await db.select({ count: count() }).from(orders);
    
    res.json({
      totalUsers: userCount.count || 0,
      activeShops: shopCount.count || 0,
      totalOrders: orderCount.count || 0
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// Get all shop applications
router.get('/shop-applications', async (req, res) => {
  try {
    const applications = await storage.getAllShopApplications();
    res.json(applications);
  } catch (error) {
    console.error('Error fetching shop applications:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    res.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get all shops
router.get('/shops', async (req, res) => {
  try {
    const allShops = await storage.getAllShops();
    res.json(allShops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ message: 'Failed to fetch shops' });
  }
});

// Update user
router.patch('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const updates = req.body;
    
    const user = await storage.updateUser(userId, updates);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Update user status
router.patch('/users/:id/status', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { isActive } = req.body;
    
    const user = await storage.updateUser(userId, { isActive });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User status updated', user });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// Get shop orders for analytics
router.get('/shop-orders', async (req, res) => {
  try {
    const shopOrders = await db
      .select({
        shopId: orders.shopId,
        shopName: shops.name,
        orderCount: count(orders.id),
        completedOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'completed' THEN 1 END)`
      })
      .from(orders)
      .leftJoin(shops, eq(orders.shopId, shops.id))
      .groupBy(orders.shopId, shops.name)
      .orderBy(desc(count(orders.id)));
    
    res.json(shopOrders);
  } catch (error) {
    console.error('Error fetching shop orders:', error);
    res.status(500).json({ message: 'Failed to fetch shop orders' });
  }
});

export default router;