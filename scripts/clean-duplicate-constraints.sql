-- PrintEasy QR - Clean Duplicate Constraints Script
-- This script removes all duplicate unique constraints created by Sequelize's alter:true bug
-- Run this ONCE on production database before deployment

-- Drop all duplicate phone constraints on users table
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint c 
        JOIN pg_class t ON c.conrelid = t.oid 
        WHERE t.relname = 'users' 
        AND contype = 'u' 
        AND conname LIKE 'users_phone_key%'
        AND conname != 'users_phone_key'
    LOOP
        EXECUTE format('ALTER TABLE users DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Drop all duplicate email constraints on users table
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint c 
        JOIN pg_class t ON c.conrelid = t.oid 
        WHERE t.relname = 'users' 
        AND contype = 'u' 
        AND conname LIKE 'users_email_key%'
        AND conname != 'users_email_key'
    LOOP
        EXECUTE format('ALTER TABLE users DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Drop all duplicate slug constraints on shops table
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint c 
        JOIN pg_class t ON c.conrelid = t.oid 
        WHERE t.relname = 'shops' 
        AND contype = 'u' 
        AND conname LIKE 'shops_slug_key%'
        AND conname != 'shops_slug_key'
    LOOP
        EXECUTE format('ALTER TABLE shops DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Verify only proper constraints remain
SELECT 
    't_' || t.relname as table_name,
    COUNT(*) as constraint_count,
    STRING_AGG(conname, ', ' ORDER BY conname) as constraint_names
FROM pg_constraint c 
JOIN pg_class t ON c.conrelid = t.oid 
WHERE t.relname IN ('users', 'shops') 
AND contype = 'u' 
GROUP BY t.relname
ORDER BY t.relname;

-- Expected output:
-- t_shops | 1 | shops_slug_key
-- t_users | 2 | users_email_key, users_phone_key