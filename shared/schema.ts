/**
 * CRITICAL: Schema definition for Replit's database integration
 * This file tells Replit's deployment system EXACTLY what our database looks like
 * WITHOUT this file, Replit can't detect our Sequelize models
 */

// Mock Drizzle-style schema for Replit's database integration
// This is ONLY for deployment detection - actual database uses Sequelize

export const qr_scans = {
  tableName: 'qr_scans',
  columns: {
    id: { type: 'integer', primaryKey: true },
    customer_id: { type: 'integer', nullable: true },
    shop_id: { type: 'integer', nullable: false },
    resulted_in_unlock: { type: 'boolean', default: false },
    scan_location: { type: 'varchar', nullable: true },
    created_at: { type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
  }
};

export const users = {
  tableName: 'users',
  columns: {
    id: { type: 'integer', primaryKey: true },
    email: { type: 'varchar', nullable: true },
    phone: { type: 'varchar', nullable: true },
    name: { type: 'varchar', nullable: false },
    role: { type: 'enum', values: ['customer', 'shop_owner', 'admin'] },
    password: { type: 'varchar', nullable: true },
    is_verified: { type: 'boolean', default: false },
    created_at: { type: 'timestamp' },
    updated_at: { type: 'timestamp' }
  }
};

export const shops = {
  tableName: 'shops',
  columns: {
    id: { type: 'integer', primaryKey: true },
    name: { type: 'varchar', nullable: false },
    slug: { type: 'varchar', unique: true },
    email: { type: 'varchar', unique: true },
    phone: { type: 'varchar', nullable: true },
    owner_id: { type: 'integer', nullable: false },
    status: { type: 'enum', values: ['active', 'deactivated', 'banned'] },
    created_at: { type: 'timestamp' },
    updated_at: { type: 'timestamp' }
  }
};

export const orders = {
  tableName: 'orders',
  columns: {
    id: { type: 'integer', primaryKey: true },
    public_id: { type: 'varchar', unique: true },
    customer_id: { type: 'integer', nullable: false },
    shop_id: { type: 'integer', nullable: false },
    order_type: { type: 'enum', values: ['digital', 'upload', 'walkin', 'file_upload'] },
    status: { type: 'enum', values: ['new', 'pending', 'processing', 'ready', 'completed', 'cancelled'] },
    created_at: { type: 'timestamp' },
    updated_at: { type: 'timestamp' }
  }
};

export const notifications = {
  tableName: 'notifications',
  columns: {
    id: { type: 'integer', primaryKey: true },
    user_id: { type: 'integer', nullable: false },
    title: { type: 'varchar', nullable: false },
    message: { type: 'text', nullable: false },
    type: { type: 'enum', values: ['info', 'success', 'warning', 'error'] },
    is_read: { type: 'boolean', default: false },
    created_at: { type: 'timestamp' }
  }
};

export const shop_applications = {
  tableName: 'shop_applications',
  columns: {
    id: { type: 'integer', primaryKey: true },
    applicant_id: { type: 'integer', nullable: false },
    shop_name: { type: 'varchar', nullable: false },
    slug: { type: 'varchar', unique: true },
    email: { type: 'varchar', unique: true },
    status: { type: 'enum', values: ['pending', 'approved', 'rejected'] },
    created_at: { type: 'timestamp' },
    updated_at: { type: 'timestamp' }
  }
};

export const messages = {
  tableName: 'messages',
  columns: {
    id: { type: 'integer', primaryKey: true },
    order_id: { type: 'integer', nullable: false },
    sender_id: { type: 'integer', nullable: false },
    content: { type: 'text', nullable: false },
    type: { type: 'enum', values: ['text', 'image', 'file'] },
    created_at: { type: 'timestamp' }
  }
};

export const shop_unlocks = {
  tableName: 'shop_unlocks',
  columns: {
    id: { type: 'integer', primaryKey: true },
    customer_id: { type: 'integer', nullable: false },
    shop_id: { type: 'integer', nullable: false },
    unlocked_at: { type: 'timestamp' },
    created_at: { type: 'timestamp' }
  }
};

export const customer_shop_unlocks = {
  tableName: 'customer_shop_unlocks',
  columns: {
    id: { type: 'integer', primaryKey: true },
    customer_id: { type: 'integer', nullable: false },
    shop_id: { type: 'integer', nullable: false },
    unlocked_at: { type: 'timestamp' },
    created_at: { type: 'timestamp' }
  }
};

// Export schema object for Replit's database integration
export const schema = {
  qr_scans,
  users,
  shops,
  orders,
  notifications,
  shop_applications,
  messages,
  shop_unlocks,
  customer_shop_unlocks
};

// Tell Replit this is the ONLY schema
export default schema;

console.log('📋 Schema definition exported for Replit database integration');
console.log('✅ This allows Replit to detect our Sequelize tables');