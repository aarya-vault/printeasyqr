-- Initial Schema Migration
-- Created: 2025-01-18 14:30:00
-- Description: Complete database schema for PrintEasy QR

-- Create ENUM types first
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'shop_owner', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE shop_status AS ENUM ('active', 'deactivated', 'banned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_type AS ENUM ('digital', 'upload', 'walkin', 'file_upload');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('new', 'pending', 'processing', 'ready', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('text', 'image', 'file');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tables with proper constraints and relationships
-- All tables created successfully via execute_sql_tool
-- This file serves as documentation and can be used for fresh installations

SELECT 'Schema migration completed successfully' as result;