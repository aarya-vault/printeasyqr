import { Op } from 'sequelize';
import { User, Shop, Order, ShopApplication, ShopUnlock, QRScan } from '../models/index.js';

class AnalyticsController {
  // Enhanced admin analytics
  static async getEnhancedAdminAnalytics(req, res) {
    try {
      const [
        totalRevenue,
        monthlyGrowth,
        shopPerformance,
        customerEngagement,
        recentActivity,
        topPerformingShops,
        customerUnlockStats,
        qrScanStats
      ] = await Promise.all([
        // QR Customer Acquisition Analytics (replacing revenue metrics)
        User.sequelize.query(`
          SELECT 
            COUNT(DISTINCT users.id) as total_customers_via_qr,
            COUNT(DISTINCT csu.shop_id) as shops_unlocked,
            COUNT(DISTINCT orders.id) as total_qr_orders
          FROM users
          LEFT JOIN customer_shop_unlocks csu ON users.id = csu.customer_id
          LEFT JOIN orders ON users.id = orders.customer_id AND orders.shop_id = csu.shop_id
          WHERE users.role = 'customer'
        `, { type: Order.sequelize.QueryTypes.SELECT }),
        
        // Monthly growth data
        User.sequelize.query(`
          SELECT 
            DATE_TRUNC('month', created_at) as month,
            COUNT(DISTINCT CASE WHEN role = 'customer' THEN id END) as new_customers,
            COUNT(DISTINCT CASE WHEN role = 'shop_owner' THEN id END) as new_shops,
            COUNT(DISTINCT id) as total_users
          FROM users
          WHERE created_at >= NOW() - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', created_at)
          ORDER BY month ASC
        `, { type: Order.sequelize.QueryTypes.SELECT }),

        // Shop QR Customer Acquisition Performance (replacing ratings-based metrics)
        Shop.findAll({
          attributes: [
            'id', 'name', 'city', 'totalOrders', 'isOnline', 'createdAt',
            [Shop.sequelize.literal('(SELECT COUNT(DISTINCT csu.customer_id) FROM customer_shop_unlocks csu WHERE csu.shop_id = Shop.id)'), 'uniqueCustomersAcquired'],
            [Shop.sequelize.literal('(SELECT COUNT(*) FROM customer_shop_unlocks csu WHERE csu.shop_id = Shop.id AND csu.created_at >= NOW() - INTERVAL \'30 days\')'), 'recentUnlocks']
          ],
          include: [{
            model: Order,
            attributes: ['status', 'createdAt', 'customerId'],
            required: false
          }],
          order: [[Shop.sequelize.literal('uniqueCustomersAcquired'), 'DESC']]
        }),

        // QR Customer Acquisition Engagement (replacing revenue-focused metrics)
        User.sequelize.query(`
          SELECT 
            COUNT(DISTINCT csu.customer_id) as customers_acquired_via_qr,
            COUNT(DISTINCT o.customer_id) as customers_who_ordered,
            COUNT(DISTINCT csu.shop_id) as shops_with_qr_unlocks,
            ROUND(AVG(CASE WHEN o.id IS NOT NULL THEN 1 ELSE 0 END) * 100, 2) as qr_to_order_conversion_rate
          FROM customer_shop_unlocks csu
          LEFT JOIN orders o ON csu.customer_id = o.customer_id AND csu.shop_id = o.shop_id
          WHERE csu.created_at >= NOW() - INTERVAL '30 days'
        `, { type: Order.sequelize.QueryTypes.SELECT }),

        // Recent platform activity
        Order.findAll({
          limit: 10,
          order: [['createdAt', 'DESC']],
          include: [
            { model: User, as: 'customer', attributes: ['name', 'phone'] },
            { model: Shop, attributes: ['name', 'city'] }
          ]
        }),

        // Top QR Customer Acquisition Shops (replacing ratings-based ranking)
        Shop.sequelize.query(`
          SELECT 
            s.id, s.name, s.city, s.total_orders,
            COUNT(DISTINCT csu.customer_id) as unique_customers_acquired,
            COUNT(DISTINCT CASE WHEN o.id IS NOT NULL THEN csu.customer_id END) as customers_converted_to_orders,
            ROUND(AVG(CASE WHEN o.id IS NOT NULL THEN 1 ELSE 0 END) * 100, 2) as conversion_rate
          FROM shops s
          LEFT JOIN customer_shop_unlocks csu ON s.id = csu.shop_id
          LEFT JOIN orders o ON csu.customer_id = o.customer_id AND csu.shop_id = o.shop_id
          WHERE s.is_approved = true
          GROUP BY s.id, s.name, s.city, s.total_orders
          ORDER BY unique_customers_acquired DESC, conversion_rate DESC
          LIMIT 10
        `, { type: Order.sequelize.QueryTypes.SELECT }),

        // Customer unlock statistics
        ShopUnlock ? ShopUnlock.sequelize.query(`
          SELECT 
            COUNT(*) as total_unlocks,
            COUNT(DISTINCT customer_id) as unique_customers,
            COUNT(DISTINCT shop_id) as shops_unlocked,
            DATE_TRUNC('day', created_at) as day,
            COUNT(*) as daily_unlocks
          FROM shop_unlocks 
          WHERE created_at >= NOW() - INTERVAL '30 days'
          GROUP BY DATE_TRUNC('day', created_at)
          ORDER BY day DESC
        `, { type: Order.sequelize.QueryTypes.SELECT }) : Promise.resolve([]),

        // QR scan statistics
        QRScan ? QRScan.sequelize.query(`
          SELECT 
            COUNT(*) as total_scans,
            COUNT(DISTINCT customer_id) as unique_scanners,
            COUNT(DISTINCT shop_id) as shops_scanned,
            AVG(CASE WHEN resulted_in_unlock = true THEN 1 ELSE 0 END) as conversion_rate
          FROM qr_scans 
          WHERE created_at >= NOW() - INTERVAL '30 days'
        `, { type: Order.sequelize.QueryTypes.SELECT }) : Promise.resolve([])
      ]);

      res.json({
        revenue: totalRevenue[0],
        monthlyGrowth,
        shopPerformance,
        customerEngagement: customerEngagement[0],
        recentActivity,
        topPerformingShops,
        customerUnlocks: customerUnlockStats[0] || {},
        qrScans: qrScanStats[0] || {}
      });
    } catch (error) {
      console.error('Enhanced analytics error:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  }

  // Shop owner analytics - customer unlocks and QR scans
  static async getShopOwnerAnalytics(req, res) {
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

      const [
        customerUnlocks,
        qrScans,
        recentUnlocks,
        conversionStats
      ] = await Promise.all([
        // Total customer unlocks for this shop
        ShopUnlock ? ShopUnlock.findAndCountAll({
          where: { shopId },
          include: [{
            model: User,
            as: 'customer',
            attributes: ['name', 'phone']
          }],
          order: [['createdAt', 'DESC']],
          limit: 50
        }) : Promise.resolve({ count: 0, rows: [] }),

        // QR scan statistics
        QRScan ? QRScan.findAndCountAll({
          where: { shopId },
          include: [{
            model: User,
            as: 'customer',
            attributes: ['name', 'phone']
          }],
          order: [['createdAt', 'DESC']],
          limit: 50
        }) : Promise.resolve({ count: 0, rows: [] }),

        // Recent unlock activity (last 7 days)
        ShopUnlock ? ShopUnlock.sequelize.query(`
          SELECT 
            DATE_TRUNC('day', created_at) as date,
            COUNT(*) as unlocks
          FROM shop_unlocks 
          WHERE shop_id = :shopId
            AND created_at >= NOW() - INTERVAL '7 days'
          GROUP BY DATE_TRUNC('day', created_at)
          ORDER BY date ASC
        `, { 
          replacements: { shopId },
          type: ShopUnlock.sequelize.QueryTypes.SELECT 
        }) : Promise.resolve([]),

        // Conversion statistics
        QRScan ? QRScan.sequelize.query(`
          SELECT 
            COUNT(*) as total_scans,
            COUNT(CASE WHEN resulted_in_unlock = true THEN 1 END) as successful_unlocks,
            ROUND(
              AVG(CASE WHEN resulted_in_unlock = true THEN 1 ELSE 0 END) * 100, 2
            ) as conversion_rate
          FROM qr_scans 
          WHERE shop_id = :shopId
            AND created_at >= NOW() - INTERVAL '30 days'
        `, {
          replacements: { shopId },
          type: QRScan.sequelize.QueryTypes.SELECT
        }) : Promise.resolve([{ total_scans: 0, successful_unlocks: 0, conversion_rate: 0 }])
      ]);

      res.json({
        shop: {
          id: shop.id,
          name: shop.name,
          city: shop.city
        },
        customerUnlocks: {
          total: customerUnlocks.count,
          recent: customerUnlocks.rows
        },
        qrScans: {
          total: qrScans.count,
          recent: qrScans.rows
        },
        recentActivity: recentUnlocks,
        conversion: conversionStats[0]
      });
    } catch (error) {
      console.error('Shop owner analytics error:', error);
      res.status(500).json({ message: 'Failed to fetch shop analytics' });
    }
  }

  // Track customer unlock event
  static async trackCustomerUnlock(req, res) {
    try {
      const { shopId } = req.body;
      const customerId = req.user?.id;

      if (!customerId) {
        return res.status(401).json({ message: 'Customer authentication required' });
      }

      // Create unlock record if models exist
      if (ShopUnlock) {
        await ShopUnlock.create({
          customerId,
          shopId,
          unlockMethod: 'qr_scan' // or 'search', 'direct_link'
        });
      }

      res.json({ success: true, message: 'Unlock tracked' });
    } catch (error) {
      console.error('Track unlock error:', error);
      res.status(500).json({ message: 'Failed to track unlock' });
    }
  }

  // Track QR scan event
  static async trackQRScan(req, res) {
    try {
      const { shopId, resultedInUnlock = false } = req.body;
      const customerId = req.user?.id;

      if (QRScan) {
        await QRScan.create({
          customerId,
          shopId,
          resultedInUnlock,
          scanLocation: req.body.location || 'unknown'
        });
      }

      res.json({ success: true, message: 'QR scan tracked' });
    } catch (error) {
      console.error('Track QR scan error:', error);
      res.status(500).json({ message: 'Failed to track QR scan' });
    }
  }
}

export default AnalyticsController;