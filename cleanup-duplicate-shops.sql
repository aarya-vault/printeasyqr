-- CRITICAL CLEANUP: Enforce One-Email-One-Shop Constraint
-- This script removes duplicate shops and keeps only the first shop for each email

-- Step 1: Backup orders from shops that will be removed
-- Move all orders from duplicate shops to the main shop for each email

-- Get the list of duplicate shop IDs that will be removed
-- Shop IDs to remove: 81,86,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,104,105,106,107

-- Step 2: Update orders to point to the main shop for each email
UPDATE orders SET shop_id = 10 WHERE shop_id IN (81, 95); -- Krishna shops
UPDATE orders SET shop_id = 6 WHERE shop_id = 91; -- Radhey shops  
UPDATE orders SET shop_id = 14 WHERE shop_id = 99; -- Mahakali shops
UPDATE orders SET shop_id = 22 WHERE shop_id = 107; -- SONAL shops
UPDATE orders SET shop_id = 13 WHERE shop_id = 98; -- Shree Umiya shops
UPDATE orders SET shop_id = 16 WHERE shop_id = 101; -- Meet shops
UPDATE orders SET shop_id = 11 WHERE shop_id = 96; -- Dhwani shops
UPDATE orders SET shop_id = 9 WHERE shop_id = 94; -- Gujarat shops
UPDATE orders SET shop_id = 7 WHERE shop_id = 92; -- Shivam shops
UPDATE orders SET shop_id = 15 WHERE shop_id = 100; -- Radhe shops
UPDATE orders SET shop_id = 12 WHERE shop_id = 97; -- Shraddha shops
UPDATE orders SET shop_id = 19 WHERE shop_id = 104; -- Morari Jumbo shops
UPDATE orders SET shop_id = 21 WHERE shop_id = 106; -- Patel Stationers shops
UPDATE orders SET shop_id = 3 WHERE shop_id = 88; -- Hello shops
UPDATE orders SET shop_id = 17 WHERE shop_id = 102; -- Swastik shops
UPDATE orders SET shop_id = 20 WHERE shop_id = 105; -- Urgent Thesis shops
UPDATE orders SET shop_id = 1 WHERE shop_id = 86; -- gujarat shops
UPDATE orders SET shop_id = 5 WHERE shop_id = 90; -- Janta shops
UPDATE orders SET shop_id = 4 WHERE shop_id = 89; -- Shree Saikrupa shops
UPDATE orders SET shop_id = 8 WHERE shop_id = 93; -- Saniya Colour shops

-- Step 3: Update customer shop unlocks to point to main shops
UPDATE customer_shop_unlocks SET shop_id = 10 WHERE shop_id IN (81, 95);
UPDATE customer_shop_unlocks SET shop_id = 6 WHERE shop_id = 91;
UPDATE customer_shop_unlocks SET shop_id = 14 WHERE shop_id = 99;
UPDATE customer_shop_unlocks SET shop_id = 22 WHERE shop_id = 107;
UPDATE customer_shop_unlocks SET shop_id = 13 WHERE shop_id = 98;
UPDATE customer_shop_unlocks SET shop_id = 16 WHERE shop_id = 101;
UPDATE customer_shop_unlocks SET shop_id = 11 WHERE shop_id = 96;
UPDATE customer_shop_unlocks SET shop_id = 9 WHERE shop_id = 94;
UPDATE customer_shop_unlocks SET shop_id = 7 WHERE shop_id = 92;
UPDATE customer_shop_unlocks SET shop_id = 15 WHERE shop_id = 100;
UPDATE customer_shop_unlocks SET shop_id = 12 WHERE shop_id = 97;
UPDATE customer_shop_unlocks SET shop_id = 19 WHERE shop_id = 104;
UPDATE customer_shop_unlocks SET shop_id = 21 WHERE shop_id = 106;
UPDATE customer_shop_unlocks SET shop_id = 3 WHERE shop_id = 88;
UPDATE customer_shop_unlocks SET shop_id = 17 WHERE shop_id = 102;
UPDATE customer_shop_unlocks SET shop_id = 20 WHERE shop_id = 105;
UPDATE customer_shop_unlocks SET shop_id = 1 WHERE shop_id = 86;
UPDATE customer_shop_unlocks SET shop_id = 5 WHERE shop_id = 90;
UPDATE customer_shop_unlocks SET shop_id = 4 WHERE shop_id = 89;
UPDATE customer_shop_unlocks SET shop_id = 8 WHERE shop_id = 93;

-- Step 4: Remove duplicate shops (keep only the original shop for each email)
DELETE FROM shops WHERE id IN (81,86,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,104,105,106,107);

-- Step 5: Add database constraints to prevent future duplicates
-- Note: This will be added after cleanup to prevent constraint violations
-- ALTER TABLE shops ADD CONSTRAINT unique_owner_per_shop UNIQUE (owner_id);