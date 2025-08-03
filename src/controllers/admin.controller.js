import { User, Shop, Order, ShopApplication, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

class AdminController {
  // Get platform statistics
  static async getPlatformStats(req, res) {
    try {
      const [
        totalUsers,
        totalShops,
        totalOrders,
        pendingApplications,
        customerCount,
        shopOwnerCount,
        activeShops,
        totalRevenue
      ] = await Promise.all([
        User.count(),
        Shop.count(),
        Order.count(),
        ShopApplication.count({ where: { status: 'pending' } }),
        User.count({ where: { role: 'customer' } }),
        User.count({ where: { role: 'shop_owner' } }),
        Shop.count({ where: { isApproved: true, status: 'active' } }),
        Order.sum('finalAmount', { where: { status: 'completed' } })
      ]);

      // Get recent orders
      const recentOrders = await Order.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [
          { model: User, as: 'customer' },
          { model: Shop, as: 'shop' }
        ]
      });

      // Get order stats by status
      const ordersByStatus = await Order.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('status')), 'count']
        ],
        group: ['status']
      });

      const orderStats = {
        new: 0,
        processing: 0,
        ready: 0,
        completed: 0
      };

      ordersByStatus.forEach(row => {
        orderStats[row.status] = parseInt(row.get('count'));
      });

      // Get monthly growth data
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyGrowth = await sequelize.query(`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(DISTINCT CASE WHEN role = 'customer' THEN id END) as new_customers,
          COUNT(DISTINCT CASE WHEN role = 'shop_owner' THEN id END) as new_shops
        FROM users
        WHERE created_at >= :startDate
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month ASC
      `, {
        replacements: { startDate: sixMonthsAgo },
        type: sequelize.QueryTypes.SELECT
      });

      res.json({
        totalUsers,
        totalShops,
        totalOrders,
        pendingApplications,
        customerCount,
        shopOwnerCount,
        activeShops,
        totalRevenue: totalRevenue || 0,
        recentOrders,
        orderStats,
        monthlyGrowth
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch platform statistics' });
    }
  }

  // Get shop details with complete data
  static async getShopComplete(req, res) {
    try {
      const shopId = parseInt(req.params.id);
      const shop = await Shop.findByPk(shopId, {
        include: [
          { model: User, as: 'owner' },
          { 
            model: Order, 
            as: 'orders',
            include: [{ model: User, as: 'customer' }]
          }
        ]
      });
      
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }

      // Get shop statistics
      const totalOrders = shop.orders.length;
      const completedOrders = shop.orders.filter(order => order.status === 'completed').length;
      
      const shopData = {
        ...shop.toJSON(),
        totalOrders,
        completedOrders,
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

      res.json(shopData);
    } catch (error) {
      console.error('Error fetching complete shop details:', error);
      res.status(500).json({ message: 'Failed to fetch shop details' });
    }
  }

  // Get revenue analytics
  static async getRevenueAnalytics(req, res) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyRevenue = await sequelize.query(`
        SELECT 
          DATE(created_at) as date,
          SUM(final_amount) as revenue,
          COUNT(*) as order_count
        FROM orders
        WHERE status = 'completed' 
        AND created_at >= :startDate
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, {
        replacements: { startDate: thirtyDaysAgo },
        type: sequelize.QueryTypes.SELECT
      });

      const topShops = await sequelize.query(`
        SELECT 
          s.id,
          s.name,
          COUNT(o.id) as total_orders,
          SUM(o.final_amount) as total_revenue
        FROM shops s
        LEFT JOIN orders o ON s.id = o.shop_id AND o.status = 'completed'
        GROUP BY s.id, s.name
        ORDER BY total_revenue DESC
        LIMIT 10
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      res.json({
        dailyRevenue,
        topShops
      });
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      res.status(500).json({ message: 'Failed to fetch revenue analytics' });
    }
  }
}

export default AdminController;