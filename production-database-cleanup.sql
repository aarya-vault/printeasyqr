-- PrintEasy QR Production Database Cleanup & Migration
-- This script cleans up duplicate constraints and synchronizes with development database
-- Date: August 16, 2025

-- ==============================================
-- PHASE 1: CLEANUP DUPLICATE CONSTRAINTS
-- ==============================================

-- Drop duplicate phone constraints for users table
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key1";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key2";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key3";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key4";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key5";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key6";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key7";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key8";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key9";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key10";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key11";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key12";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key13";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key14";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key15";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key16";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key17";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key18";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key19";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key20";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key21";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key22";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key23";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key24";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key25";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key26";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key27";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key28";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key29";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key30";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key31";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key32";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key33";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key34";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_key35";

-- Drop duplicate email constraints for users table
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key1";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key2";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key3";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key4";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key5";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key6";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key7";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key8";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key9";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key10";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key11";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key12";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key13";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key14";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key15";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key16";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key17";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key18";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key19";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key20";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key21";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key22";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key23";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key24";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key25";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key26";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key27";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key28";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key29";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key30";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key31";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key32";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key33";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key34";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key35";

-- Drop duplicate slug constraints for shops table
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key1";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key2";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key3";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key4";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key5";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key6";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key7";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key8";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key9";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key10";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key11";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key12";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key13";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key14";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key15";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key16";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key17";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key18";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key19";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key20";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key21";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key22";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key23";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key24";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key25";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key26";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key27";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key28";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key29";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key30";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key31";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key32";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key33";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key34";
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_slug_key35";

-- ==============================================
-- PHASE 2: ENSURE PROPER UNIQUE CONSTRAINTS
-- ==============================================

-- Add proper unique constraints for users table
ALTER TABLE "users" ADD CONSTRAINT "users_phone_unique" UNIQUE ("phone");
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE ("email");

-- Add proper unique constraint for shops table
ALTER TABLE "shops" ADD CONSTRAINT "shops_slug_unique" UNIQUE ("slug");

-- ==============================================
-- PHASE 3: VERIFICATION QUERIES
-- ==============================================

-- Check current constraints on users table
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    a.attname as column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey)
JOIN pg_class cl ON cl.oid = c.conrelid
WHERE cl.relname = 'users' 
    AND contype = 'u'
ORDER BY conname;

-- Check current constraints on shops table
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    a.attname as column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey)
JOIN pg_class cl ON cl.oid = c.conrelid
WHERE cl.relname = 'shops' 
    AND contype = 'u'
ORDER BY conname;

-- Check for any remaining duplicate constraints
SELECT 
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name IN ('users', 'shops')
    AND constraint_type = 'UNIQUE'
    AND (constraint_name LIKE '%_key%' OR constraint_name LIKE '%_unique%')
ORDER BY table_name, constraint_name;

-- ==============================================
-- PHASE 4: DATA INTEGRITY CHECKS
-- ==============================================

-- Check for duplicate phone numbers in users
SELECT phone, COUNT(*) as count
FROM users 
WHERE phone IS NOT NULL
GROUP BY phone 
HAVING COUNT(*) > 1;

-- Check for duplicate emails in users
SELECT email, COUNT(*) as count
FROM users 
WHERE email IS NOT NULL
GROUP BY email 
HAVING COUNT(*) > 1;

-- Check for duplicate slugs in shops
SELECT slug, COUNT(*) as count
FROM shops 
WHERE slug IS NOT NULL
GROUP BY slug 
HAVING COUNT(*) > 1;

-- ==============================================
-- PHASE 5: SUMMARY REPORT
-- ==============================================

-- Count total users and shops
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM shops) as total_shops,
    (SELECT COUNT(*) FROM users WHERE role = 'shop_owner') as shop_owners,
    (SELECT COUNT(*) FROM users WHERE role = 'customer') as customers,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as admins;

-- Show recent shops
SELECT 
    id, name, slug, phone, city, is_online, status, created_at
FROM shops 
ORDER BY created_at DESC 
LIMIT 10;

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

SELECT 'Production database cleanup and migration completed successfully!' as status;