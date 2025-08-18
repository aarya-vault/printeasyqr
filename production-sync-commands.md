# Production Database Sync Commands

## Quick Sync Steps

### 1. Export Development Data
```bash
# Already created for you:
pg_dump $DATABASE_URL > production-sync-export.sql
```

### 2. Import to Production
```bash
# Connect to your production database and run:
psql $PRODUCTION_DATABASE_URL < production-sync-export.sql
```

### 3. Alternative: Selective Update
If you only want to update phone numbers and passwords:

```sql
-- Update shop phone numbers (run these on production)
UPDATE shops SET phone = 'CORRECT_PHONE' WHERE name = 'SHOP_NAME';

-- Update user passwords (run this on production)
UPDATE users SET password_hash = '$2b$10$vv.XHc0DBByucTFJ.BbokuMB.he8MK4z1WdGrHtXnH8TMoQ9xm8LK' 
WHERE role = 'shop_owner';
```

## What's Been Fixed in Development:
- ✅ **128 shops** with correct phone numbers
- ✅ **All passwords** standardized to "PrintEasyQR@2025" 
- ✅ **Phone extraction** from CSV scientific notation (9.19E+11 format)
- ✅ **Zero placeholder numbers** remaining

## Login Credentials for All Shops:
- **Email Format**: `{shop-slug}@printeasyqr.com`
- **Password**: `PrintEasyQR@2025`

## Verification After Production Sync:
```sql
-- Check phone number status
SELECT 
  COUNT(*) as total_shops,
  COUNT(CASE WHEN phone ~ '^[6-9][0-9]{9}$' THEN 1 END) as valid_phones
FROM shops;

-- Test a few logins
SELECT email, name FROM users WHERE role = 'shop_owner' LIMIT 5;
```