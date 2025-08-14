/**
 * Database Connection Policy
 * 
 * CRITICAL: Never use sequelize.sync({ alter: true })
 * This causes duplicate unique constraints in PostgreSQL
 * 
 * Allowed operations:
 * - sequelize.authenticate() - Connection validation only
 * - sequelize.sync({ force: true }) - Complete rebuild (dev only)
 * 
 * For production schema changes:
 * - Use proper migration tools (Sequelize CLI)
 * - Never auto-alter schema in production
 */

export const DATABASE_POLICY = {
  // Connection validation only - safe for all environments
  validateConnection: async (sequelize) => {
    try {
      await sequelize.authenticate();
      return true;
    } catch (error) {
      console.error('Database connection failed:', error.message);
      return false;
    }
  },
  
  // Never allow alter in any environment
  ALLOW_ALTER: false,
  
  // Force sync only in development with explicit flag
  ALLOW_FORCE_SYNC: process.env.NODE_ENV === 'development' && process.env.FORCE_DB_SYNC === 'true'
};