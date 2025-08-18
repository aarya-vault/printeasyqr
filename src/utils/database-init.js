// Production-Safe Database Schema Initialization
// This runs on app startup to ensure required tables exist

import { sequelize } from '../config/database.js';

const requiredTables = [
  'users', 'shops', 'orders', 'messages', 
  'notifications', 'shop_applications', 
  'shop_unlocks', 'qr_scans', 'customer_shop_unlocks'
];

// SQL to create complete schema (production-safe)
const CREATE_SCHEMA_SQL = `
-- Create tables only if they don't exist
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(255) NOT NULL UNIQUE CHECK (phone ~ '^[0-9]{10}$'),
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'shop_owner', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shops (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  pin_code VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  public_owner_name VARCHAR(255),
  internal_name VARCHAR(255) NOT NULL,
  owner_full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  owner_phone VARCHAR(255) NOT NULL,
  complete_address TEXT NOT NULL,
  services JSONB NOT NULL DEFAULT '[]',
  equipment JSONB NOT NULL DEFAULT '[]',
  custom_services JSONB NOT NULL DEFAULT '[]',
  custom_equipment JSONB NOT NULL DEFAULT '[]',
  years_of_experience VARCHAR(255),
  formation_year VARCHAR(255),
  working_hours JSONB DEFAULT '{}',
  accepts_walkin_orders BOOLEAN NOT NULL DEFAULT false,
  is_online BOOLEAN NOT NULL DEFAULT false,
  auto_availability BOOLEAN NOT NULL DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deactivated', 'banned')),
  qr_code TEXT,
  total_orders INTEGER NOT NULL DEFAULT 0,
  exterior_image VARCHAR(255),
  google_maps_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  order_number INTEGER NOT NULL DEFAULT 0,
  public_id VARCHAR(20) UNIQUE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('digital', 'upload', 'walkin', 'file_upload')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  specifications JSONB,
  files JSONB,
  walkin_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'pending', 'processing', 'ready', 'completed', 'cancelled')),
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  estimated_pages INTEGER,
  estimated_budget DECIMAL(10, 2),
  final_amount DECIMAL(10, 2),
  notes TEXT,
  deleted_by INTEGER REFERENCES users(id),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_name VARCHAR(255) NOT NULL,
  sender_role VARCHAR(50) NOT NULL DEFAULT 'customer' CHECK (sender_role IN ('customer', 'shop_owner', 'admin')),
  content TEXT NOT NULL DEFAULT '',
  files TEXT,
  message_type VARCHAR(50) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shop_applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  pin_code VARCHAR(255) NOT NULL,
  services JSONB DEFAULT '[]',
  equipment JSONB DEFAULT '[]',
  years_of_experience VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS qr_scans (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  scan_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shop_unlocks (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unlock_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_shop_unlocks (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  qr_scan_location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id, shop_id)
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_slug ON shops(slug);
CREATE INDEX IF NOT EXISTS idx_shops_status ON shops(status);
CREATE INDEX IF NOT EXISTS idx_shops_is_approved ON shops(is_approved);
CREATE INDEX IF NOT EXISTS idx_shops_is_public ON shops(is_public);
CREATE INDEX IF NOT EXISTS idx_shops_city ON shops(city);
CREATE INDEX IF NOT EXISTS idx_shops_state ON shops(state);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

CREATE INDEX IF NOT EXISTS idx_messages_order_id ON messages(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
`;

export async function initializeDatabase() {
  try {
    console.log('🔍 Checking database schema...');
    
    // Check if all required tables exist
    const [existingTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    const existingTableNames = existingTables.map(row => row.table_name);
    const missingTables = requiredTables.filter(table => !existingTableNames.includes(table));
    
    if (missingTables.length === 0) {
      console.log(`✅ Database schema ready (${existingTableNames.length} tables found)`);
      return true;
    }
    
    console.log(`⚠️ Missing tables detected: ${missingTables.join(', ')}`);
    console.log('🔧 Creating database schema...');
    
    // Execute the complete schema creation
    await sequelize.query(CREATE_SCHEMA_SQL);
    
    // Verify tables were created
    const [newTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    const newTableNames = newTables.map(row => row.table_name);
    const stillMissing = requiredTables.filter(table => !newTableNames.includes(table));
    
    if (stillMissing.length === 0) {
      console.log(`✅ Database schema created successfully (${newTableNames.length} tables)`);
      console.log('✅ All indexes and constraints applied');
      return true;
    } else {
      console.log(`❌ Failed to create tables: ${stillMissing.join(', ')}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error('   This might be expected if schema already exists');
    
    // Don't throw error - let the app continue and rely on existing schema
    return false;
  }
}

export default initializeDatabase;