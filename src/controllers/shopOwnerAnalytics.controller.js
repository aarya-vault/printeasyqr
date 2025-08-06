import { Op } from 'sequelize';
import { User, Shop, Order, sequelize } from '../models/index.js';

class ShopOwnerAnalyticsController {
  // Get comprehensive shop analytics for shop owner
  static async getShopAnalytics(req, res) {
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
        orderStats,
        revenueStats,
        customerStats,
        performanceMetrics,
        recentOrders,
        repeatCustomers,
        monthlyTrends
      ] = await Promise.all([
        // Order statistics
        sequelize.query(`
          SELECT 
            COUNT(*) as total_orders,
            COUNT(CASE WHEN status = 'new' THEN 1 END) as new_orders,
            COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
            COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready_orders,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as orders_last_week,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as orders_last_month
          FROM orders 
          WHERE shop_id = :shopId AND deleted_at IS NULL
        `, { 
          replacements: { shopId },
          type: sequelize.QueryTypes.SELECT 
        }),

        // Revenue statistics
        sequelize.query(`
          SELECT 
            COALESCE(SUM(final_amount), 0) as total_revenue,
            COALESCE(SUM(CASE WHEN status = 'completed' THEN final_amount END), 0) as completed_revenue,
            COALESCE(AVG(final_amount), 0) as avg_order_value,
            COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN final_amount END), 0) as revenue_last_30_days,
            COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN final_amount END), 0) as revenue_last_7_days
          FROM orders 
          WHERE shop_id = :shopId AND deleted_at IS NULL
        `, {
          replacements: { shopId },
          type: sequelize.QueryTypes.SELECT
        }),

        // Customer statistics
        sequelize.query(`
          SELECT 
            COUNT(DISTINCT customer_id) as total_unique_customers,
            COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN customer_id END) as active_customers_30_days,
            COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN customer_id END) as active_customers_7_days
          FROM orders 
          WHERE shop_id = :shopId AND deleted_at IS NULL
        `, {
          replacements: { shopId },
          type: sequelize.QueryTypes.SELECT
        }),

        // Performance metrics
        sequelize.query(`
          SELECT 
            AVG(
              CASE 
                WHEN status = 'completed' AND updated_at IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600
              END
            ) as avg_completion_time_hours,
            COUNT(CASE WHEN is_urgent = true THEN 1 END) as urgent_orders,
            COUNT(CASE WHEN type = 'walkin' THEN 1 END) as walkin_orders,
            COUNT(CASE WHEN type = 'digital' THEN 1 END) as digital_orders
          FROM orders 
          WHERE shop_id = :shopId AND deleted_at IS NULL
        `, {
          replacements: { shopId },
          type: sequelize.QueryTypes.SELECT
        }),

        // Recent orders with customer info
        Order.findAll({
          where: { shopId, deletedAt: null },
          include: [{
            model: User,
            as: 'customer',
            attributes: ['id', 'name', 'phone']
          }],
          order: [['createdAt', 'DESC']],
          limit: 10
        }),

        // Repeat customers analysis
        sequelize.query(`
          SELECT 
            customer_id,
            COUNT(*) as order_count,
            u.name as customer_name,
            u.phone as customer_phone,
            MAX(created_at) as last_order_date,
            SUM(final_amount) as total_spent
          FROM orders o
          JOIN users u ON o.customer_id = u.id
          WHERE o.shop_id = :shopId AND o.deleted_at IS NULL
          GROUP BY customer_id, u.name, u.phone
          HAVING COUNT(*) > 1
          ORDER BY order_count DESC, total_spent DESC
          LIMIT 20
        `, {
          replacements: { shopId },
          type: sequelize.QueryTypes.SELECT
        }),

        // Monthly trends (last 6 months)
        sequelize.query(`
          SELECT 
            DATE_TRUNC('month', created_at) as month,
            COUNT(*) as orders,
            COUNT(DISTINCT customer_id) as unique_customers,
            COALESCE(SUM(final_amount), 0) as revenue,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders
          FROM orders 
          WHERE shop_id = :shopId 
            AND deleted_at IS NULL
            AND created_at >= NOW() - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', created_at)
          ORDER BY month ASC
        `, {
          replacements: { shopId },
          type: sequelize.QueryTypes.SELECT
        })
      ]);

      // Calculate additional metrics
      const orderData = orderStats[0];
      const revenueData = revenueStats[0];
      const customerData = customerStats[0];
      const performanceData = performanceMetrics[0];

      // Calculate repeat customer rate
      const repeatCustomerRate = customerData.total_unique_customers > 0 
        ? (repeatCustomers.length / customerData.total_unique_customers * 100).toFixed(1)
        : '0';

      // Calculate completion rate
      const completionRate = orderData.total_orders > 0
        ? (orderData.completed_orders / orderData.total_orders * 100).toFixed(1)
        : '0';

      // Growth calculations
      const currentMonthOrders = monthlyTrends.length > 0 ? monthlyTrends[monthlyTrends.length - 1]?.orders || 0 : 0;
      const previousMonthOrders = monthlyTrends.length > 1 ? monthlyTrends[monthlyTrends.length - 2]?.orders || 0 : 0;
      const orderGrowth = previousMonthOrders > 0 
        ? (((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100).toFixed(1)
        : currentMonthOrders > 0 ? '100' : '0';

      res.json({
        shop: {
          id: shop.id,
          name: shop.name,
          city: shop.city,
          state: shop.state,
          rating: shop.rating || 0,
          totalOrders: shop.totalOrders || 0
        },
        summary: {
          totalOrders: parseInt(orderData.total_orders),
          totalRevenue: parseFloat(revenueData.total_revenue),
          uniqueCustomers: parseInt(customerData.total_unique_customers),
          completionRate: parseFloat(completionRate),
          repeatCustomerRate: parseFloat(repeatCustomerRate),
          avgOrderValue: parseFloat(revenueData.avg_order_value),
          avgCompletionTime: parseFloat(performanceData.avg_completion_time_hours || 0).toFixed(1)
        },
        orderStats: {
          new: parseInt(orderData.new_orders),
          processing: parseInt(orderData.processing_orders),
          ready: parseInt(orderData.ready_orders),
          completed: parseInt(orderData.completed_orders),
          cancelled: parseInt(orderData.cancelled_orders),
          lastWeek: parseInt(orderData.orders_last_week),
          lastMonth: parseInt(orderData.orders_last_month)
        },
        revenueStats: {
          total: parseFloat(revenueData.total_revenue),
          completed: parseFloat(revenueData.completed_revenue),
          last30Days: parseFloat(revenueData.revenue_last_30_days),
          last7Days: parseFloat(revenueData.revenue_last_7_days),
          avgOrderValue: parseFloat(revenueData.avg_order_value)
        },
        customerStats: {
          total: parseInt(customerData.total_unique_customers),
          active30Days: parseInt(customerData.active_customers_30_days),
          active7Days: parseInt(customerData.active_customers_7_days),
          repeatCustomers: repeatCustomers.length,
          repeatRate: parseFloat(repeatCustomerRate)
        },
        performance: {
          urgentOrders: parseInt(performanceData.urgent_orders),
          walkinOrders: parseInt(performanceData.walkin_orders),
          digitalOrders: parseInt(performanceData.digital_orders),
          avgCompletionTime: parseFloat(performanceData.avg_completion_time_hours || 0),
          completionRate: parseFloat(completionRate)
        },
        growth: {
          monthlyOrderGrowth: parseFloat(orderGrowth),
          trending: parseFloat(orderGrowth) > 0 ? 'up' : parseFloat(orderGrowth) < 0 ? 'down' : 'stable'
        },
        recentOrders,
        repeatCustomers: repeatCustomers.map(customer => ({
          ...customer,
          totalSpent: parseFloat(customer.total_spent || 0),
          orderCount: parseInt(customer.order_count),
          lastOrderDate: customer.last_order_date
        })),
        monthlyTrends: monthlyTrends.map(trend => ({
          month: trend.month,
          orders: parseInt(trend.orders),
          uniqueCustomers: parseInt(trend.unique_customers),
          revenue: parseFloat(trend.revenue),
          completedOrders: parseInt(trend.completed_orders)
        }))
      });
    } catch (error) {
      console.error('Shop owner analytics error:', error);
      res.status(500).json({ message: 'Failed to fetch shop analytics' });
    }
  }

  // Get customer insights for shop owner
  static async getCustomerInsights(req, res) {
    try {
      const shopId = req.params.shopId;
      const userId = req.user.id;

      // Verify shop ownership
      const shop = await Shop.findOne({
        where: { id: shopId, ownerId: userId }
      });

      if (!shop) {
        return res.status(404).json({ message: 'Shop not found or access denied' });
      }

      const [
        topCustomers,
        newCustomers,
        customerRetention
      ] = await Promise.all([
        // Top customers by spending
        sequelize.query(`
          SELECT 
            u.id,
            u.name,
            u.phone,
            COUNT(o.id) as total_orders,
            COALESCE(SUM(o.final_amount), 0) as total_spent,
            MAX(o.created_at) as last_order,
            MIN(o.created_at) as first_order
          FROM users u
          JOIN orders o ON u.id = o.customer_id
          WHERE o.shop_id = :shopId AND o.deleted_at IS NULL
          GROUP BY u.id, u.name, u.phone
          ORDER BY total_spent DESC
          LIMIT 15
        `, {
          replacements: { shopId },
          type: sequelize.QueryTypes.SELECT
        }),

        // New customers (last 30 days)
        sequelize.query(`
          SELECT 
            u.id,
            u.name,
            u.phone,
            MIN(o.created_at) as first_order,
            COUNT(o.id) as orders_count,
            COALESCE(SUM(o.final_amount), 0) as total_spent
          FROM users u
          JOIN orders o ON u.id = o.customer_id
          WHERE o.shop_id = :shopId 
            AND o.deleted_at IS NULL
            AND o.created_at >= NOW() - INTERVAL '30 days'
          GROUP BY u.id, u.name, u.phone
          HAVING MIN(o.created_at) >= NOW() - INTERVAL '30 days'
          ORDER BY first_order DESC
          LIMIT 10
        `, {
          replacements: { shopId },
          type: sequelize.QueryTypes.SELECT
        }),

        // Customer retention analysis
        sequelize.query(`
          SELECT 
            'new_customers' as period,
            COUNT(DISTINCT customer_id) as count
          FROM orders
          WHERE shop_id = :shopId 
            AND deleted_at IS NULL
            AND created_at >= NOW() - INTERVAL '30 days'
            AND customer_id NOT IN (
              SELECT DISTINCT customer_id 
              FROM orders 
              WHERE shop_id = :shopId 
                AND deleted_at IS NULL
                AND created_at < NOW() - INTERVAL '30 days'
            )
          UNION ALL
          SELECT 
            'returning_customers' as period,
            COUNT(DISTINCT customer_id) as count
          FROM orders
          WHERE shop_id = :shopId 
            AND deleted_at IS NULL
            AND created_at >= NOW() - INTERVAL '30 days'
            AND customer_id IN (
              SELECT DISTINCT customer_id 
              FROM orders 
              WHERE shop_id = :shopId 
                AND deleted_at IS NULL
                AND created_at < NOW() - INTERVAL '30 days'
            )
        `, {
          replacements: { shopId },
          type: sequelize.QueryTypes.SELECT
        })
      ]);

      const retention = {};
      customerRetention.forEach(row => {
        retention[row.period] = parseInt(row.count);
      });

      res.json({
        topCustomers: topCustomers.map(customer => ({
          ...customer,
          totalSpent: parseFloat(customer.total_spent),
          totalOrders: parseInt(customer.total_orders),
          lastOrder: customer.last_order,
          firstOrder: customer.first_order,
          loyaltyLevel: parseInt(customer.total_orders) >= 10 ? 'VIP' : 
                       parseInt(customer.total_orders) >= 5 ? 'Regular' : 'New'
        })),
        newCustomers: newCustomers.map(customer => ({
          ...customer,
          totalSpent: parseFloat(customer.total_spent),
          ordersCount: parseInt(customer.orders_count),
          firstOrder: customer.first_order
        })),
        retention: {
          newCustomers: retention.new_customers || 0,
          returningCustomers: retention.returning_customers || 0,
          retentionRate: retention.returning_customers && retention.new_customers
            ? ((retention.returning_customers / (retention.returning_customers + retention.new_customers)) * 100).toFixed(1)
            : '0'
        }
      });
    } catch (error) {
      console.error('Customer insights error:', error);
      res.status(500).json({ message: 'Failed to fetch customer insights' });
    }
  }
}

export default ShopOwnerAnalyticsController;