import { Order, Shop, User, Message, getSequelize } from '../models/index.js';
import { Op } from 'sequelize';
import fs from 'fs/promises';
import path from 'path';

const sequelize = getSequelize();

class ReportsController {
  // Generate comprehensive order history report for a shop
  static async generateOrderHistoryReport(req, res) {
    try {
      const shopId = parseInt(req.params.shopId);
      const { startDate, endDate, includeDeleted = true, format = 'json' } = req.query;
      
      // Verify shop ownership
      const shop = await Shop.findByPk(shopId, {
        include: [{ model: User, as: 'owner' }]
      });
      
      if (!shop || shop.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Build date filter
      let dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate);
        if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate);
      }
      
      // Build where condition - include deleted orders if requested
      const whereCondition = { 
        shopId,
        ...dateFilter
      };
      
      if (!includeDeleted) {
        whereCondition.deletedAt = { [Op.is]: null };
      }
      
      // Fetch comprehensive order data
      const orders = await Order.findAll({
        where: whereCondition,
        include: [
          { 
            model: User, 
            as: 'customer',
            attributes: ['id', 'name', 'phone', 'email', 'createdAt']
          },
          { 
            model: Shop, 
            as: 'shop',
            attributes: ['id', 'name', 'phone', 'address', 'city']
          },
          { 
            model: User, 
            as: 'deletedByUser',
            attributes: ['id', 'name', 'role'],
            required: false
          }
        ],
        order: [['createdAt', 'ASC']] // Oldest first for chronological reports
      });
      
      // Fetch chat history for all orders (including deleted ones)
      const chatHistoryPromises = orders.map(async (order) => {
        const messages = await Message.findAll({
          where: { orderId: order.id },
          include: [
            { 
              model: User, 
              as: 'sender',
              attributes: ['id', 'name', 'role']
            }
          ],
          order: [['createdAt', 'ASC']]
        });
        return { orderId: order.id, messages };
      });
      
      const chatHistories = await Promise.all(chatHistoryPromises);
      const chatMap = new Map(chatHistories.map(ch => [ch.orderId, ch.messages]));
      
      // Process orders with comprehensive details
      const detailedOrders = await Promise.all(orders.map(async (order) => {
        let files = [];
        let totalPages = 0;
        let printJobs = [];
        
        // Parse files if they exist
        if (order.files) {
          try {
            files = Array.isArray(order.files) ? order.files : JSON.parse(order.files);
            
            // Calculate estimated page counts and track print requests
            for (const file of files) {
              if (file.mimetype === 'application/pdf' && file.size) {
                // Rough estimate: 1 page = ~50KB for PDFs
                const estimatedPages = Math.max(1, Math.ceil(file.size / 51200));
                totalPages += estimatedPages;
                file.estimatedPages = estimatedPages;
              } else if (file.mimetype && file.mimetype.startsWith('image/')) {
                // Images count as 1 page each
                totalPages += 1;
                file.estimatedPages = 1;
              } else {
                // Other document types - estimate based on size
                const estimatedPages = Math.max(1, Math.ceil(file.size / 2048)); // ~2KB per page
                totalPages += estimatedPages;
                file.estimatedPages = estimatedPages;
              }
            }
          } catch (e) {
            console.error('Error parsing order files:', e);
          }
        }
        
        // Get print job tracking from database if available
        const printJobQuery = await sequelize.query(`
          SELECT 
            COUNT(*) as print_requests,
            SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful_prints,
            MAX(created_at) as last_print_attempt
          FROM print_jobs 
          WHERE order_id = :orderId
        `, {
          replacements: { orderId: order.id },
          type: sequelize.QueryTypes.SELECT
        });
        
        const printJobData = printJobQuery[0] || { 
          print_requests: 0, 
          successful_prints: 0, 
          last_print_attempt: null 
        };
        
        // Build comprehensive order data
        return {
          // Basic order info
          id: order.id,
          publicId: order.publicId,
          orderNumber: order.orderNumber,
          type: order.type,
          title: order.title,
          description: order.description,
          specifications: order.specifications,
          notes: order.notes,
          status: order.status,
          isUrgent: order.isUrgent,
          
          // Financial info
          estimatedPages: order.estimatedPages || totalPages,
          estimatedBudget: order.estimatedBudget,
          finalAmount: order.finalAmount,
          
          // Customer details
          customer: {
            id: order.customer?.id,
            name: order.customer?.name,
            phone: order.customer?.phone,
            email: order.customer?.email,
            customerSince: order.customer?.createdAt
          },
          
          // Files and print details
          files: files.map(file => ({
            ...file,
            sizeFormatted: ReportsController.formatFileSize(file.size || 0)
          })),
          totalFiles: files.length,
          totalPages,
          printJobs: {
            totalRequests: parseInt(printJobData.print_requests) || 0,
            successfulPrints: parseInt(printJobData.successful_prints) || 0,
            lastPrintAttempt: printJobData.last_print_attempt
          },
          
          // Chat and communication
          chatHistory: (chatMap.get(order.id) || []).map(msg => ({
            id: msg.id,
            senderName: msg.senderName,
            senderRole: msg.senderRole,
            content: msg.content,
            files: msg.files,
            messageType: msg.messageType,
            createdAt: msg.createdAt,
            // Always preserve chat for accessibility
            isAccessible: true
          })),
          totalMessages: (chatMap.get(order.id) || []).length,
          
          // Timestamps
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          completedAt: order.completedAt,
          
          // Deletion info (if applicable)
          isDeleted: !!order.deletedAt,
          deletedAt: order.deletedAt,
          deletedBy: order.deletedBy,
          deletedByUser: order.deletedByUser ? {
            id: order.deletedByUser.id,
            name: order.deletedByUser.name,
            role: order.deletedByUser.role
          } : null,
          
          // Accessibility flags
          canCallCustomer: true, // Always accessible
          canViewChat: true,     // Always accessible even if deleted
          
          // Processing time calculation
          processingTime: order.completedAt && order.createdAt ? 
            Math.round((new Date(order.completedAt) - new Date(order.createdAt)) / (1000 * 60 * 60)) : null // hours
        };
      }));
      
      // Generate summary statistics
      const summary = {
        totalOrders: detailedOrders.length,
        completedOrders: detailedOrders.filter(o => o.status === 'completed').length,
        deletedOrders: detailedOrders.filter(o => o.isDeleted).length,
        totalRevenue: detailedOrders.reduce((sum, o) => sum + (parseFloat(o.finalAmount) || 0), 0),
        totalCustomers: new Set(detailedOrders.map(o => o.customer.id)).size,
        totalFiles: detailedOrders.reduce((sum, o) => sum + o.totalFiles, 0),
        totalPages: detailedOrders.reduce((sum, o) => sum + o.totalPages, 0),
        totalPrintRequests: detailedOrders.reduce((sum, o) => sum + o.printJobs.totalRequests, 0),
        averageProcessingTime: (() => {
          const completedWithTimes = detailedOrders.filter(o => o.processingTime !== null);
          return completedWithTimes.length > 0 
            ? Math.round(completedWithTimes.reduce((sum, o) => sum + o.processingTime, 0) / completedWithTimes.length)
            : 0;
        })(),
        dateRange: {
          from: startDate || (detailedOrders.length > 0 ? detailedOrders[0].createdAt : null),
          to: endDate || (detailedOrders.length > 0 ? detailedOrders[detailedOrders.length - 1].createdAt : null)
        }
      };
      
      const reportData = {
        shop: {
          id: shop.id,
          name: shop.name,
          phone: shop.phone,
          address: shop.address,
          city: shop.city,
          owner: shop.owner ? {
            name: shop.owner.name,
            email: shop.owner.email
          } : null
        },
        summary,
        orders: detailedOrders,
        generatedAt: new Date().toISOString(),
        generatedBy: {
          id: req.user.id,
          name: req.user.name,
          role: req.user.role
        }
      };
      
      // Return in requested format
      if (format === 'csv') {
        const csv = ReportsController.generateCSVReport(reportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="order-history-${shopId}-${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csv);
      }
      
      res.json(reportData);
      
    } catch (error) {
      console.error('Error generating order history report:', error);
      res.status(500).json({ message: 'Failed to generate report' });
    }
  }
  
  // Generate CSV format report
  static generateCSVReport(reportData) {
    const headers = [
      'Order ID', 'Public ID', 'Queue Number', 'Customer Name', 'Customer Phone', 'Customer Email',
      'Order Type', 'Title', 'Description', 'Status', 'Is Urgent', 'Total Files', 'Total Pages',
      'Estimated Budget', 'Final Amount', 'Print Requests', 'Successful Prints',
      'Total Messages', 'Created At', 'Completed At', 'Processing Hours',
      'Is Deleted', 'Deleted At', 'Order Notes'
    ];
    
    const rows = reportData.orders.map(order => [
      order.id,
      order.publicId || '',
      order.orderNumber,
      order.customer.name || '',
      order.customer.phone || '',
      order.customer.email || '',
      order.type,
      order.title,
      `"${(order.description || '').replace(/"/g, '""')}"`, // Escape quotes in CSV
      order.status,
      order.isUrgent ? 'Yes' : 'No',
      order.totalFiles,
      order.totalPages,
      order.estimatedBudget || '',
      order.finalAmount || '',
      order.printJobs.totalRequests,
      order.printJobs.successfulPrints,
      order.totalMessages,
      order.createdAt,
      order.completedAt || '',
      order.processingTime || '',
      order.isDeleted ? 'Yes' : 'No',
      order.deletedAt || '',
      `"${(order.notes || '').replace(/"/g, '""')}"` // Escape quotes in CSV
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
  
  // Helper function to format file sizes
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // Track print job requests (called when print is initiated)
  static async trackPrintJob(req, res) {
    try {
      const { orderId, files, success = true } = req.body;
      
      // Create print_jobs table entry if it doesn't exist
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS print_jobs (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          files_count INTEGER DEFAULT 0,
          pages_count INTEGER DEFAULT 0,
          success BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES orders(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);
      
      // Calculate total pages
      let totalPages = 0;
      if (files && Array.isArray(files)) {
        totalPages = files.reduce((sum, file) => {
          return sum + (file.estimatedPages || 1);
        }, 0);
      }
      
      // Insert print job record
      await sequelize.query(`
        INSERT INTO print_jobs (order_id, user_id, files_count, pages_count, success)
        VALUES (:orderId, :userId, :filesCount, :pagesCount, :success)
      `, {
        replacements: {
          orderId: parseInt(orderId),
          userId: req.user.id,
          filesCount: files ? files.length : 0,
          pagesCount: totalPages,
          success
        }
      });
      
      res.json({ success: true, message: 'Print job tracked' });
      
    } catch (error) {
      console.error('Error tracking print job:', error);
      res.status(500).json({ message: 'Failed to track print job' });
    }
  }
}

export default ReportsController;