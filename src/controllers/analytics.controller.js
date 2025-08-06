import { Op } from 'sequelize';
import { User, Shop, Order, ShopApplication, ShopUnlock, QRScan } from '../models/index.js';

class AnalyticsController {
  // Enhanced admin analytics
  static async getEnhancedAdminAnalytics(req, res) {
    try {
      // Simple test data structure with QR Customer Acquisition focus
      const mockAnalytics = {
        qrCustomerAcquisition: {
          total_customers_via_qr: 127,
          shops_unlocked: 15,
          total_qr_orders: 89
        },
        monthlyGrowth: [
          { month: '2025-01', new_customers: 45, new_shops: 3 },
          { month: '2025-02', new_customers: 82, new_shops: 7 }
        ],
        shopPerformance: [
          { id: 1, name: 'PrintHub Express', city: 'Ahmedabad', unique_customers_acquired: 23 },
          { id: 2, name: 'QuickPrint Solutions', city: 'Mumbai', unique_customers_acquired: 19 }
        ],
        customerEngagement: {
          customers_acquired_via_qr: 127,
          customers_who_ordered: 89,
          qr_to_order_conversion_rate: 70.1
        },
        recentActivity: [],
        topPerformingShops: [
          { id: 1, name: 'PrintHub Express', city: 'Ahmedabad', unique_customers_acquired: 23, conversion_rate: 75 },
          { id: 2, name: 'QuickPrint Solutions', city: 'Mumbai', unique_customers_acquired: 19, conversion_rate: 68 }
        ],
        customerUnlocks: { total_unlocks: 287, unique_customers: 127 },
        qrScans: { total_scans: 456, unique_scanners: 134, conversion_rate: 0.78 }
      };

      res.json(mockAnalytics);
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