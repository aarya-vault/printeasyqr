import { Op, Sequelize } from 'sequelize';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Order from '../models/Order.js';

// Get comprehensive analytics for a specific shop
export const getShopAnalytics = async (req, res) => {
  try {
    console.log('🔍 ANALYTICS - Starting analytics request', req.params, req.userId);
    const { shopId } = req.params;
    const userId = req.userId;

    // Verify shop ownership
    const shop = await Shop.findOne({
      where: { 
        id: shopId,
        ownerId: userId 
      },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    console.log('🔍 ANALYTICS - Shop found:', shop ? 'YES' : 'NO');
    
    // Get all orders for this shop
    console.log('🔍 ANALYTICS - Fetching orders for shop:', shopId);
    const allOrders = await Order.findAll({
      where: { shopId },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    console.log('🔍 ANALYTICS - Orders found:', allOrders.length);

    if (!shop) {
      console.log('🔍 ANALYTICS - Shop not found or unauthorized');
      return res.status(404).json({ message: 'Shop not found or unauthorized' });
    }

    // Get date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Calculate QR Customer Acquisition metrics (replacing revenue focus)
    const totalOrders = allOrders.length;
    
    // Get QR customer acquisition data
    const customerUnlocks = await User.sequelize.query(`
      SELECT DISTINCT
        csu.customer_id,
        u.name as customer_name,
        u.phone as customer_phone,
        csu.created_at as first_unlock_date,
        MIN(o.created_at) as first_order_date,
        COUNT(o.id) as total_orders_from_customer
      FROM customer_shop_unlocks csu
      JOIN users u ON csu.customer_id = u.id
      LEFT JOIN orders o ON csu.customer_id = o.customer_id AND csu.shop_id = o.shop_id
      WHERE csu.shop_id = ?
      GROUP BY csu.customer_id, u.name, u.phone, csu.created_at
      ORDER BY csu.created_at DESC
    `, {
      replacements: [shopId],
      type: User.sequelize.QueryTypes.SELECT
    });

    const customersAcquiredViaQR = customerUnlocks.length;
    const customersWhoOrdered = customerUnlocks.filter(c => c.total_orders_from_customer > 0).length;

    // Order status distribution
    const orderStats = {
      new: allOrders.filter(order => order.status === 'new').length,
      processing: allOrders.filter(order => order.status === 'processing').length,
      ready: allOrders.filter(order => order.status === 'ready').length,
      completed: allOrders.filter(order => order.status === 'completed').length,
      cancelled: allOrders.filter(order => order.status === 'cancelled').length,
      lastWeek: allOrders.filter(order => new Date(order.createdAt) >= sevenDaysAgo).length,
      lastMonth: allOrders.filter(order => new Date(order.createdAt) >= thirtyDaysAgo).length
    };

    // Customer analytics
    const uniqueCustomers = [...new Set(allOrders.map(order => order.customerId))].length;
    const customersLast30Days = [...new Set(
      allOrders
        .filter(order => new Date(order.createdAt) >= thirtyDaysAgo)
        .map(order => order.customerId)
    )].length;
    const customersLast7Days = [...new Set(
      allOrders
        .filter(order => new Date(order.createdAt) >= sevenDaysAgo)
        .map(order => order.customerId)
    )].length;

    // Find repeat customers
    const customerOrderCounts = {};
    allOrders.forEach(order => {
      if (order.customerId) {
        customerOrderCounts[order.customerId] = (customerOrderCounts[order.customerId] || 0) + 1;
      }
    });

    // Enhanced repeat customers analysis focusing on QR acquisition
    const repeatCustomers = Object.entries(customerOrderCounts)
      .filter(([_, count]) => count > 1)
      .map(([customerId, count]) => {
        const customerOrders = allOrders.filter(order => order.customerId === parseInt(customerId));
        const lastOrder = customerOrders[0]; // Orders are sorted by createdAt DESC
        const loyaltyLevel = count >= 5 ? 'VIP' : count >= 3 ? 'Regular' : 'New';
        
        // Check if customer was acquired via QR
        const wasAcquiredViaQR = customerUnlocks.some(c => c.customer_id === parseInt(customerId));

        return {
          customer_id: parseInt(customerId),
          customer_name: lastOrder.customer?.name || 'Unknown Customer',
          customer_phone: lastOrder.customer?.phone || 'N/A',
          order_count: count,
          acquired_via_qr: wasAcquiredViaQR,
          last_order_date: lastOrder.createdAt,
          loyaltyLevel
        };
      })
      .sort((a, b) => b.order_count - a.order_count);

    const repeatCustomerCount = repeatCustomers.length;
    const repeatCustomerRate = uniqueCustomers > 0 
      ? Math.round((repeatCustomerCount / uniqueCustomers) * 100) 
      : 0;

    // Performance metrics
    const completedOrders = allOrders.filter(order => order.status === 'completed');
    const completionRate = totalOrders > 0 
      ? Math.round((completedOrders.length / totalOrders) * 100) 
      : 0;

    // Calculate average completion time (in hours)
    let avgCompletionTime = 0;
    if (completedOrders.length > 0) {
      const completionTimes = completedOrders
        .map(order => {
          const created = new Date(order.createdAt);
          const updated = new Date(order.updatedAt);
          return (updated - created) / (1000 * 60 * 60); // Convert to hours
        })
        .filter(time => time > 0 && time < 168); // Filter realistic times (less than a week)
      
      if (completionTimes.length > 0) {
        avgCompletionTime = Math.round(
          completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
        );
      }
    }

    // Order type breakdown
    const urgentOrders = allOrders.filter(order => order.isUrgent).length;
    const walkinOrders = allOrders.filter(order => order.type === 'walkin').length;
    const digitalOrders = allOrders.filter(order => order.type === 'digital' || order.type === 'upload').length;

    // Growth calculation
    const currentMonthOrders = allOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }).length;

    const lastMonthOrders = allOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= lastMonth && orderDate <= lastMonthEnd;
    }).length;

    const monthlyOrderGrowth = lastMonthOrders > 0 
      ? Math.round(((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100)
      : currentMonthOrders > 0 ? 100 : 0;

    const trending = monthlyOrderGrowth > 5 ? 'up' : monthlyOrderGrowth < -5 ? 'down' : 'stable';

    // QR Customer Conversion Rate
    const qrToOrderConversionRate = customersAcquiredViaQR > 0 
      ? Math.round((customersWhoOrdered / customersAcquiredViaQR) * 100) 
      : 0;

    const analytics = {
      shop: {
        id: shop.id,
        name: shop.name,
        city: shop.city,
        state: shop.state,
        totalOrders: shop.totalOrders || totalOrders
      },
      summary: {
        totalOrders,
        uniqueCustomers,
        customersAcquiredViaQR,
        customersWhoOrdered,
        qrToOrderConversionRate,
        completionRate,
        repeatCustomerRate,
        avgCompletionTime: avgCompletionTime.toString()
      },
      qrCustomerAcquisition: {
        totalCustomersAcquired: customersAcquiredViaQR,
        customersWhoOrdered,
        conversionRate: qrToOrderConversionRate,
        customerDetails: customerUnlocks.slice(0, 10) // Top 10 recent QR acquisitions
      },
      orderStats,
      customerStats: {
        total: uniqueCustomers,
        active30Days: customersLast30Days,
        active7Days: customersLast7Days,
        repeatCustomers: repeatCustomerCount,
        repeatRate: repeatCustomerRate
      },
      performance: {
        urgentOrders,
        walkinOrders,
        digitalOrders,
        avgCompletionTime,
        completionRate
      },
      growth: {
        monthlyOrderGrowth,
        trending
      },
      repeatCustomers: repeatCustomers.slice(0, 20) // Limit to top 20
    };

    console.log('🔍 ANALYTICS - Sending analytics response:', {
      shopName: analytics.shop.name,
      totalOrders: analytics.summary.totalOrders,
      revenue: analytics.summary.totalRevenue
    });

    res.json(analytics);

  } catch (error) {
    console.error('Error fetching shop analytics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch analytics',
      error: error.message 
    });
  }
};

// Get customer insights for a shop
export const getCustomerInsights = async (req, res) => {
  try {
    const { shopId } = req.params;
    const userId = req.userId;

    // Verify shop ownership
    const shop = await Shop.findOne({
      where: { 
        id: shopId,
        ownerId: userId 
      }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found or unauthorized' });
    }

    // Get customer behavior data
    const customerBehavior = await Order.findAll({
      where: { shopId },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'phone']
        }
      ],
      attributes: [
        'customerId',
        [Sequelize.fn('COUNT', Sequelize.col('Order.id')), 'orderCount'],
        [Sequelize.fn('SUM', Sequelize.col('finalAmount')), 'totalSpent'],
        [Sequelize.fn('MAX', Sequelize.col('Order.createdAt')), 'lastOrderDate'],
        [Sequelize.fn('MIN', Sequelize.col('Order.createdAt')), 'firstOrderDate']
      ],
      group: ['customerId', 'customer.id', 'customer.name', 'customer.phone'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('Order.id')), 'DESC']],
      raw: true
    });

    res.json(customerBehavior);

  } catch (error) {
    console.error('Error fetching customer insights:', error);
    res.status(500).json({ 
      message: 'Failed to fetch customer insights',
      error: error.message 
    });
  }
};