// Safe constraint cleanup script for deployment
// This prevents the destructive DROP TABLE migrations by cleaning up duplicate constraints

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const safeConstraintCleanup = async () => {
  console.log('🔧 Starting safe constraint cleanup...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Count existing data BEFORE cleanup
    const [userCount] = await sequelize.query("SELECT COUNT(*) as count FROM users");
    const [shopCount] = await sequelize.query("SELECT COUNT(*) as count FROM shops");
    const [orderCount] = await sequelize.query("SELECT COUNT(*) as count FROM orders");
    
    console.log(`📊 Data check BEFORE cleanup:`);
    console.log(`   Users: ${userCount[0].count}`);
    console.log(`   Shops: ${shopCount[0].count}`);
    console.log(`   Orders: ${orderCount[0].count}`);

    // Clean up duplicate constraints safely
    const constraintsToClean = [
      // Users table phone constraints
      ...Array.from({length: 35}, (_, i) => `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key${i+1}";`),
      
      // Users table email constraints  
      ...Array.from({length: 35}, (_, i) => `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key${i+1}";`),
      
      // Shops table slug constraints
      ...Array.from({length: 35}, (_, i) => `ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key${i+1}";`)
    ];

    console.log(`🧹 Cleaning up ${constraintsToClean.length} potential duplicate constraints...`);
    
    for (const constraint of constraintsToClean) {
      try {
        await sequelize.query(constraint);
      } catch (error) {
        // Ignore errors for constraints that don't exist
        if (!error.message.includes('does not exist')) {
          console.warn(`⚠️ Constraint cleanup warning: ${error.message}`);
        }
      }
    }

    // Verify data is still intact AFTER cleanup
    const [userCountAfter] = await sequelize.query("SELECT COUNT(*) as count FROM users");
    const [shopCountAfter] = await sequelize.query("SELECT COUNT(*) as count FROM shops");
    const [orderCountAfter] = await sequelize.query("SELECT COUNT(*) as count FROM orders");
    
    console.log(`📊 Data check AFTER cleanup:`);
    console.log(`   Users: ${userCountAfter[0].count}`);
    console.log(`   Shops: ${shopCountAfter[0].count}`);
    console.log(`   Orders: ${orderCountAfter[0].count}`);

    // Verify no data loss
    if (userCount[0].count === userCountAfter[0].count && 
        shopCount[0].count === shopCountAfter[0].count && 
        orderCount[0].count === orderCountAfter[0].count) {
      console.log('✅ Constraint cleanup completed successfully - NO DATA LOST');
      console.log('✅ Database is ready for safe deployment');
    } else {
      console.error('❌ DATA MISMATCH DETECTED - STOPPING');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Constraint cleanup failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Run cleanup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  safeConstraintCleanup();
}

export { safeConstraintCleanup };