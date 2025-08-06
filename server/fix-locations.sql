-- SQL Script to fix shop location data
-- This will update shops where city/state is "Unknown" but we have valid pincodes

-- First, let's see the current state
SELECT id, name, city, state, pin_code as pincode, 
  CASE 
    WHEN (city = 'Unknown' OR city IS NULL OR city = '') 
         AND (state = 'Unknown' OR state IS NULL OR state = '') 
         AND pin_code IS NOT NULL 
         AND LENGTH(pin_code) = 6 
    THEN 'NEEDS_FIX'
    ELSE 'OK'
  END as status
FROM shops 
ORDER BY status DESC, name;

-- Based on the pincode 380059 (Ahmedabad, Gujarat), let's update specific known pincodes
-- We need to do this carefully based on our pincode data

-- Update for Ahmedabad pincodes (380xxx)
UPDATE shops 
SET city = 'Ahmedabad', state = 'Gujarat' 
WHERE (city = 'Unknown' OR city IS NULL OR city = '') 
  AND (state = 'Unknown' OR state IS NULL OR state = '') 
  AND pin_code LIKE '380%'
  AND LENGTH(pin_code) = 6;

-- Show updated results
SELECT id, name, city, state, pin_code as pincode
FROM shops 
WHERE pin_code LIKE '380%'
ORDER BY name;