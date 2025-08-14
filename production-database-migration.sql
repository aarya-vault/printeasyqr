-- PrintEasy QR Production Database Migration
-- Adding 5 Authentic Print Shops from Google Maps Import
-- Date: August 14, 2025

-- Step 1: Create User Accounts for Shop Owners
INSERT INTO users (phone, name, email, password_hash, role, is_active, created_at, updated_at) VALUES
('9574744155', 'Chhaya Xerox Center Owner', 'chhaya-xerox-center@printeasyqr.com', '$2b$10$PN9Jq7ZVT70ajle6vXV/kuYTamauznjmmOhtjbwQbgfjjlK4czJ7O', 'shop_owner', true, NOW(), NOW()),
('9998344661', 'Devanshi Xerox Owner', 'devanshi-xerox@printeasyqr.com', '$2b$10$PN9Jq7ZVT70ajle6vXV/kuYTamauznjmmOhtjbwQbgfjjlK4czJ7O', 'shop_owner', true, NOW(), NOW()),
('9999999998', 'Vishnu Xerox Owner', 'vishnu-xerox@printeasyqr.com', '$2b$10$PN9Jq7ZVT70ajle6vXV/kuYTamauznjmmOhtjbwQbgfjjlK4czJ7O', 'shop_owner', true, NOW(), NOW()),
('9173780728', 'ND Xerox Owner', 'nd-xerox-thesis-binding@printeasyqr.com', '$2b$10$PN9Jq7ZVT70ajle6vXV/kuYTamauznjmmOhtjbwQbgfjjlK4czJ7O', 'shop_owner', true, NOW(), NOW()),
('9999999997', 'Patidar Xerox Owner', 'patidar-xerox-csc@printeasyqr.com', '$2b$10$PN9Jq7ZVT70ajle6vXV/kuYTamauznjmmOhtjbwQbgfjjlK4czJ7O', 'shop_owner', true, NOW(), NOW());

-- Step 2: Get the user IDs that were just created (production will have different IDs)
-- You'll need to replace these with the actual user IDs from production after running step 1

-- For reference, these are the local development mappings:
-- Chhaya Xerox Center Owner -> User ID will be assigned in production
-- Devanshi Xerox Owner -> User ID will be assigned in production  
-- Vishnu Xerox Owner -> User ID will be assigned in production
-- ND Xerox Owner -> User ID will be assigned in production
-- Patidar Xerox Owner -> User ID will be assigned in production

-- Step 3: Create the Shop Records (UPDATE THE owner_id VALUES WITH PRODUCTION USER IDs)
-- First, get the user IDs from production:
-- SELECT id, phone, name FROM users WHERE phone IN ('9574744155', '9998344661', '9999999998', '9173780728', '9999999997') ORDER BY phone;

-- Then use those IDs in the INSERT statements below:

-- Shop 1: Chhaya Xerox Center
INSERT INTO shops (
  owner_id, name, slug, address, city, state, pin_code, phone,
  public_owner_name, internal_name, owner_full_name, email, owner_phone,
  complete_address, services, equipment, custom_services, custom_equipment,
  years_of_experience, formation_year, working_hours, accepts_walkin_orders,
  is_online, auto_availability, is_approved, is_public, status, qr_code,
  total_orders, google_maps_link, created_at, updated_at
) VALUES (
  [REPLACE_WITH_CHHAYA_USER_ID],
  'Chhaya Xerox Center',
  'chhaya-xerox-center',
  'U-2/1, Devalay Plaza, Near Sattadhar Cross Road, Sola Rd',
  'Ahmedabad',
  'Gujarat',
  '380061',
  '9574744155',
  'Chhaya Xerox Center',
  'Chhaya Xerox Center',
  'Chhaya Xerox Center Owner',
  'chhaya-xerox-center@printeasyqr.com',
  '9574744155',
  'U-2/1, Devalay Plaza, Near Sattadhar Cross Road, Sola Rd, Municipal Karmachari Nagar, Ghatlodiya, Ahmedabad, Gujarat 380061',
  '["document_printing", "photocopying", "color_printing", "scanning", "binding", "laminating", "thesis_binding"]',
  '[]',
  '[]',
  '[]',
  10,
  2014,
  '{"monday":{"open":"09:00","close":"22:00","closed":false},"tuesday":{"open":"09:00","close":"22:00","closed":false},"wednesday":{"open":"09:00","close":"22:00","closed":false},"thursday":{"open":"09:00","close":"22:00","closed":false},"friday":{"open":"09:00","close":"22:00","closed":false},"saturday":{"open":"09:00","close":"22:00","closed":false},"sunday":{"open":"09:00","close":"22:00","closed":false}}',
  false,
  true, true, true, true,
  'active',
  'GM750000',
  0,
  'https://maps.app.goo.gl/ADbFPjmH1RHPza7AA',
  NOW(), NOW()
);

-- Shop 2: DEVANSHI XEROX
INSERT INTO shops (
  owner_id, name, slug, address, city, state, pin_code, phone,
  public_owner_name, internal_name, owner_full_name, email, owner_phone,
  complete_address, services, equipment, custom_services, custom_equipment,
  years_of_experience, formation_year, working_hours, accepts_walkin_orders,
  is_online, auto_availability, is_approved, is_public, status, qr_code,
  total_orders, google_maps_link, created_at, updated_at
) VALUES (
  [REPLACE_WITH_DEVANSHI_USER_ID],
  'DEVANSHI XEROX',
  'devanshi-xerox',
  'G F 1, Center Plaza, Satadhar Cross Roads, nr. HP Petrol Pump',
  'Ahmedabad',
  'Gujarat',
  '380061',
  '9998344661',
  'DEVANSHI XEROX',
  'DEVANSHI XEROX',
  'Devanshi Xerox Owner',
  'devanshi-xerox@printeasyqr.com',
  '9998344661',
  'G F 1, Center Plaza, Satadhar Cross Roads, nr. HP Petrol Pump, Visharam Nagar, Ghatlodiya, Memnagar, Ahmedabad, Gujarat 380061',
  '["document_printing", "photocopying", "color_printing", "scanning", "binding", "laminating"]',
  '[]',
  '[]',
  '[]',
  5,
  2019,
  '{"monday":{"open":"09:30","close":"21:00","closed":false},"tuesday":{"open":"09:30","close":"21:00","closed":false},"wednesday":{"open":"09:30","close":"21:00","closed":false},"thursday":{"open":"09:30","close":"21:00","closed":false},"friday":{"open":"09:30","close":"21:00","closed":false},"saturday":{"open":"09:30","close":"21:00","closed":false},"sunday":{"open":"10:00","close":"14:00","closed":false}}',
  false,
  true, true, true, true,
  'active',
  'GM750001',
  0,
  'https://maps.app.goo.gl/EbHf6RVaiy7ii34k9',
  NOW(), NOW()
);

-- Shop 3: Vishnu Xerox
INSERT INTO shops (
  owner_id, name, slug, address, city, state, pin_code, phone,
  public_owner_name, internal_name, owner_full_name, email, owner_phone,
  complete_address, services, equipment, custom_services, custom_equipment,
  years_of_experience, formation_year, working_hours, accepts_walkin_orders,
  is_online, auto_availability, is_approved, is_public, status, qr_code,
  total_orders, google_maps_link, created_at, updated_at
) VALUES (
  [REPLACE_WITH_VISHNU_USER_ID],
  'Vishnu Xerox',
  'vishnu-xerox',
  '3G7J+FP8, Sattadhar Cross Rd, Sarvodaya Nagar',
  'Ahmedabad',
  'Gujarat',
  '380061',
  '9999999998',
  'Vishnu Xerox',
  'Vishnu Xerox',
  'Vishnu Xerox Owner',
  'vishnu-xerox@printeasyqr.com',
  '9999999998',
  '3G7J+FP8, Sattadhar Cross Rd, Sarvodaya Nagar, Ghatlodiya, Ahmedabad, Gujarat 380061',
  '["document_printing", "photocopying", "scanning", "stationery"]',
  '[]',
  '[]',
  '[]',
  5,
  2019,
  '{"monday":{"open":"08:00","close":"22:00","closed":false},"tuesday":{"open":"08:00","close":"22:00","closed":false},"wednesday":{"open":"08:00","close":"22:00","closed":false},"thursday":{"open":"08:00","close":"22:00","closed":false},"friday":{"open":"08:00","close":"22:00","closed":false},"saturday":{"open":"08:00","close":"22:00","closed":false},"sunday":{"open":"08:00","close":"22:00","closed":false}}',
  false,
  true, true, true, true,
  'active',
  'GM750002',
  0,
  'https://maps.app.goo.gl/fCHJYPhvySV167Jq7',
  NOW(), NOW()
);

-- Shop 4: ND Xerox & Thesis Binding
INSERT INTO shops (
  owner_id, name, slug, address, city, state, pin_code, phone,
  public_owner_name, internal_name, owner_full_name, email, owner_phone,
  complete_address, services, equipment, custom_services, custom_equipment,
  years_of_experience, formation_year, working_hours, accepts_walkin_orders,
  is_online, auto_availability, is_approved, is_public, status, qr_code,
  total_orders, google_maps_link, created_at, updated_at
) VALUES (
  [REPLACE_WITH_ND_USER_ID],
  'ND Xerox & Thesis Binding',
  'nd-xerox-thesis-binding',
  'Devalaya Plaza, Sattadhar Cross Rd, Sarvodaya Nagar',
  'Ahmedabad',
  'Gujarat',
  '380061',
  '9173780728',
  'ND Xerox & Thesis Binding',
  'ND Xerox & Thesis Binding',
  'ND Xerox Owner',
  'nd-xerox-thesis-binding@printeasyqr.com',
  '9173780728',
  'Devalaya Plaza, Sattadhar Cross Rd, Sarvodaya Nagar, Ghatlodiya, Ahmedabad, Gujarat 380061',
  '["document_printing", "photocopying", "binding", "thesis_binding", "scanning"]',
  '[]',
  '[]',
  '[]',
  7,
  2017,
  '{"monday":{"open":"08:30","close":"21:00","closed":false},"tuesday":{"open":"08:30","close":"21:00","closed":false},"wednesday":{"open":"08:30","close":"21:00","closed":false},"thursday":{"open":"08:30","close":"21:00","closed":false},"friday":{"open":"08:30","close":"21:00","closed":false},"saturday":{"open":"08:30","close":"21:00","closed":false},"sunday":{"open":"08:30","close":"21:00","closed":false}}',
  false,
  true, true, true, true,
  'active',
  'GM750003',
  0,
  'https://maps.app.goo.gl/HE1RWEkD7xCUbgsQ6',
  NOW(), NOW()
);

-- Shop 5: Patidar Xerox And CSC Center
INSERT INTO shops (
  owner_id, name, slug, address, city, state, pin_code, phone,
  public_owner_name, internal_name, owner_full_name, email, owner_phone,
  complete_address, services, equipment, custom_services, custom_equipment,
  years_of_experience, formation_year, working_hours, accepts_walkin_orders,
  is_online, auto_availability, is_approved, is_public, status, qr_code,
  total_orders, google_maps_link, created_at, updated_at
) VALUES (
  [REPLACE_WITH_PATIDAR_USER_ID],
  'Patidar Xerox And CSC Center',
  'patidar-xerox-csc-center',
  'L-94/1123, Sola Rd, Chitrakut Society, Bhuyangdev Society',
  'Ahmedabad',
  'Gujarat',
  '380061',
  '9999999997',
  'Patidar Xerox And CSC Center',
  'Patidar Xerox And CSC Center',
  'Patidar Xerox Owner',
  'patidar-xerox-csc@printeasyqr.com',
  '9999999997',
  'L-94/1123, Sola Rd, Chitrakut Society, Bhuyangdev Society, Naranpura, Ahmedabad, Gujarat 380061',
  '["document_printing", "photocopying", "scanning", "digital_services", "government_services"]',
  '[]',
  '[]',
  '[]',
  6,
  2018,
  '{"monday":{"open":"08:30","close":"21:00","closed":false},"tuesday":{"open":"08:30","close":"21:00","closed":false},"wednesday":{"open":"08:30","close":"21:00","closed":false},"thursday":{"open":"08:30","close":"21:00","closed":false},"friday":{"open":"08:30","close":"21:00","closed":false},"saturday":{"open":"08:30","close":"21:00","closed":false},"sunday":{"open":"00:00","close":"00:00","closed":true}}',
  false,
  true, true, true, true,
  'active',
  'GM750004',
  0,
  'https://maps.app.goo.gl/49xxeMPp9A4UQkpF8',
  NOW(), NOW()
);

-- Step 4: Verify the migration
SELECT 
  s.id, s.name, s.phone, s.google_maps_link,
  u.name as owner_name, u.phone as owner_phone
FROM shops s
JOIN users u ON s.owner_id = u.id
WHERE u.phone IN ('9574744155', '9998344661', '9999999998', '9173780728', '9999999997')
ORDER BY s.created_at DESC;