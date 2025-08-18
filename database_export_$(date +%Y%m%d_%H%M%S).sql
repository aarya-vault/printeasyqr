-- Production Database Sync Export
-- Generated: $(date)

-- First, clear existing data
DELETE FROM orders WHERE shop_id IS NOT NULL;
DELETE FROM shops;
DELETE FROM users WHERE role = 'shop_owner';

-- Insert users with standardized passwords
INSERT INTO users (name, email, phone, password_hash, role, is_active, created_at, updated_at) VALUES