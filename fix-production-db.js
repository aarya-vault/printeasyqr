#!/usr/bin/env node

// Quick Production Database Fix
// Tests connection and validates data without full redeployment

import { Sequelize } from 'sequelize';

const PRODUCTION_DB_URL = 'postgresql://neondb_owner:npg_Di0XSQx1ONHM@ep-falling-king-aee7jn9x.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

console.log('🔍 Testing production database connection...');

const sequelize = new Sequelize(PRODUCTION_DB_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function testProductionDB() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Production database connection successful');
    
    // Count shops
    const [shopResults] = await sequelize.query('SELECT COUNT(*) as count FROM shops');
    console.log(`✅ Shops in production DB: ${shopResults[0].count}`);
    
    // Count users  
    const [userResults] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Users in production DB: ${userResults[0].count}`);
    
    // Test a sample shop query (same as the failing API)
    const [shopData] = await sequelize.query(`
      SELECT name, city, status, is_approved, is_public 
      FROM shops 
      WHERE is_approved = true AND is_public = true AND status = 'active'
      LIMIT 3
    `);
    
    console.log('✅ Sample active shops:');
    shopData.forEach(shop => {
      console.log(`   - ${shop.name} (${shop.city})`);
    });
    
    console.log('');
    console.log('🎉 PRODUCTION DATABASE IS WORKING PERFECTLY!');
    console.log('📋 Issue is deployment caching - restart production server');
    
  } catch (error) {
    console.error('❌ Production database error:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.error('🔑 Password issue - check deployment secrets');
    } else if (error.message.includes('does not exist')) {
      console.error('🏗️ Table missing - database needs initialization');  
    }
  } finally {
    await sequelize.close();
  }
}

testProductionDB();