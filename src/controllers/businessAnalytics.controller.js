import { Op } from 'sequelize';
import { User, Shop, Order, ShopApplication, ShopUnlock, QRScan } from '../models/index.js';

class BusinessAnalyticsController {
  // Get business analytics for a specific shop owner
  static async getShopOwnerBusinessAnalytics(req, res) {
    try {
      const shopId = req.params.shopId;
      const userId = req.user.id; // From JWT middleware

      // Verify shop ownership
      const shop = await Shop.findOne({
        where: { id: shopId, ownerId: userId }
      });

      if (!shop) {
        return res.status(404).json({ message: 'Shop not found or access denied' });
      }

      // Get unique customers whose FIRST shop was this shop
      const firstShopCustomers = await User.sequelize.query(`
        WITH first_shop_per_customer AS (
          SELECT 
            customer_id,
            MIN(created_at) as first_order_date,
            (array_agg(shop_id ORDER BY created_at))[1] as first_shop_id
          FROM orders 
          WHERE customer_id IS NOT NULL
          GROUP BY customer_id
        )
        SELECT COUNT(*) as count
        FROM first_shop_per_customer 
        WHERE first_shop_id = :shopId
      `, {
        replacements: { shopId },
        type: User.sequelize.QueryTypes.SELECT
      });

      // Get total unique customers who have ordered from this shop
      const totalUniqueCustomers = await Order.count({
        where: { shopId },
        distinct: true,
        col: 'customerId'
      });

      // Get all customers who have unlocked this shop
      const totalUnlockedCustomers = await User.sequelize.query(`
        SELECT COUNT(DISTINCT customer_id) as count
        FROM orders 
        WHERE shop_id = :shopId AND customer_id IS NOT NULL
      `, {
        replacements: { shopId },
        type: User.sequelize.QueryTypes.SELECT
      });

      // Get recent activity (last 30 days)
      const recentActivity = await Order.findAll({
        where: {
          shopId,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        include: [{
          model: User,
          as: 'customer',
          attributes: ['name', 'phone']
        }],
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      // Calculate metrics
      const analytics = {
        uniqueCustomersFirstShop: parseInt(firstShopCustomers[0]?.count || 0),
        totalCustomersUnlocked: parseInt(totalUnlockedCustomers[0]?.count || 0),
        totalUniqueCustomers,
        shopDetails: {
          id: shop.id,
          name: shop.name,
          city: shop.city,
          totalOrders: shop.totalOrders || 0
        },
        recentActivity: recentActivity.map(order => ({
          id: order.id,
          customerName: order.customer?.name || 'Anonymous',
          type: order.type,
          status: order.status,
          createdAt: order.createdAt
        })),
        conversionRate: totalUniqueCustomers > 0 ? 
          Math.round((parseInt(firstShopCustomers[0]?.count || 0) / totalUniqueCustomers) * 100) : 0
      };

      res.json(analytics);
    } catch (error) {
      console.error('Business analytics error:', error);
      res.status(500).json({ message: 'Failed to fetch business analytics' });
    }
  }
}

export default BusinessAnalyticsController;