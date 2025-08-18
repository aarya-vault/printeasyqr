# Production Database Sync Guide

## Overview
This guide provides steps to sync the corrected shop and user data from development to production database.

## What Was Fixed
- ✅ 128 shops imported with correct phone numbers
- ✅ All 138 shop owner passwords standardized to "PrintEasyQR@2025"
- ✅ Phone numbers extracted from CSV scientific notation (9.19E+11 format)
- ✅ All placeholder phone numbers (0000xxx, 1234xxx) replaced with valid numbers

## Sync Options

### Option 1: Database Export/Import (Recommended)
1. **Export from Development:**
   ```bash
   pg_dump $DATABASE_URL > production_sync.sql
   ```

2. **Import to Production:**
   ```bash
   psql $PRODUCTION_DATABASE_URL < production_sync.sql
   ```

### Option 2: Selective Data Sync
Use the generated SQL statements to update specific records in production.

### Option 3: CSV-Based Sync
1. Export corrected data to CSV
2. Use existing import scripts on production
3. Run phone correction scripts on production

## Data Verification Steps
After sync, verify on production:

```sql
-- Check total shops and users
SELECT 'shops' as table_name, COUNT(*) as count FROM shops
UNION ALL
SELECT 'users' as table_name, COUNT(*) as count FROM users WHERE role = 'shop_owner';

-- Verify phone numbers
SELECT 
  COUNT(*) as total_shops,
  COUNT(CASE WHEN phone ~ '^[6-9][0-9]{9}$' THEN 1 END) as valid_phones,
  COUNT(CASE WHEN phone LIKE '%0000%' OR phone LIKE '%1234%' THEN 1 END) as placeholder_phones
FROM shops;

-- Test login credentials
SELECT email, name FROM users WHERE role = 'shop_owner' LIMIT 5;
```

## Login Credentials
All shop owners can log in with:
- **Email**: `{shop-slug}@printeasyqr.com`
- **Password**: `PrintEasyQR@2025`

## Important Notes
- Backup production database before sync
- Test on staging environment first
- Verify all 128 shops have valid 10-digit phone numbers
- Confirm password standardization works for login