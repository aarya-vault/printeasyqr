import express from 'express';
import { sequelize } from '../config/database.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    // Test a simple query
    const result = await sequelize.query('SELECT 1 as test');
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      testQuery: result[0][0].test === 1 ? 'passed' : 'failed',
      pool: {
        max: sequelize.options.pool.max,
        min: sequelize.options.pool.min,
        acquire: sequelize.options.pool.acquire,
        idle: sequelize.options.pool.idle
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;