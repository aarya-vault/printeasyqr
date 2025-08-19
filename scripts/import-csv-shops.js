/**
 * Comprehensive CSV Shop Import Script
 * Imports all 128 shops from CSV with complete data validation and phone number handling
 */

import fs from 'fs';
import csv from 'csv-parser';
import bcrypt from 'bcrypt';
import { sequelize } from '../src/config/database.js';
import { User, Shop } from '../src/models/index.js';

// Configuration
const CSV_FILE_PATH = './attached_assets/shops_export_2025-08-18T19-09-04_1755589014937.csv';
const DEFAULT_PASSWORD = 'PrintEasyQR@2025';

// Utility functions
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Phone number standardization
function standardizePhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const cleaned = phone.toString().replace(/\D/g, '');
  
  // Handle different phone number formats
  if (cleaned.length === 10) {
    return cleaned; // Already 10 digits
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return cleaned.substring(1); // Remove leading 0
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned.substring(2); // Remove +91 country code
  } else if (cleaned.length === 13 && cleaned.startsWith('091')) {
    return cleaned.substring(3); // Remove 091
  }
  
  // Return last 10 digits if longer
  if (cleaned.length > 10) {
    return cleaned.slice(-10);
  }
  
  return cleaned;
}

// Parse services from CSV string
function parseServices(servicesStr) {
  if (!servicesStr || servicesStr === '[object Object]') {
    return ['Digital printing service']; // Default service
  }
  
  if (typeof servicesStr === 'string') {
    // Split by common separators and clean up
    return servicesStr
      .split(/[,;|]/)
      .map(s => s.trim())
      .filter(s => s && s !== '[object Object]')
      .slice(0, 10); // Limit to 10 services
  }
  
  return Array.isArray(servicesStr) ? servicesStr : ['Digital printing service'];
}

// Parse working hours from CSV
function parseWorkingHours(workingHoursStr) {
  // Default working hours
  const defaultHours = {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '18:00', closed: false },
    sunday: { open: '09:00', close: '18:00', closed: false }
  };

  if (!workingHoursStr || workingHoursStr === '[object Object]') {
    return defaultHours;
  }

  try {
    // Try to parse as JSON if it looks like JSON
    if (workingHoursStr.startsWith('{')) {
      return JSON.parse(workingHoursStr);
    }
  } catch (e) {
    // Fall back to default if parsing fails
  }

  return defaultHours;
}

// Generate unique slug
function generateUniqueSlug(name, existingSlugs) {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();

  // Remove leading/trailing hyphens
  baseSlug = baseSlug.replace(/^-+|-+$/g, '');
  
  // Limit length
  if (baseSlug.length > 50) {
    baseSlug = baseSlug.substring(0, 50);
  }

  let slug = baseSlug;
  let counter = 1;

  // Ensure uniqueness
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  existingSlugs.add(slug);
  return slug;
}

// Main import function
async function importShopsFromCSV() {
  log('🚀 Starting CSV Shop Import Process', 'cyan');
  log(`📁 Reading file: ${CSV_FILE_PATH}`, 'blue');

  const results = [];
  const errors = [];
  const existingSlugs = new Set();
  const existingEmails = new Set();
  const existingPhones = new Set();

  // Check database connection
  try {
    await sequelize.authenticate();
    log('✅ Database connection established', 'green');
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'red');
    process.exit(1);
  }

  // Get existing data to avoid conflicts
  try {
    const existingShops = await Shop.findAll({
      attributes: ['slug', 'email', 'phone', 'ownerPhone']
    });
    
    existingShops.forEach(shop => {
      existingSlugs.add(shop.slug);
      existingEmails.add(shop.email);
      if (shop.phone) existingPhones.add(standardizePhoneNumber(shop.phone));
      if (shop.ownerPhone) existingPhones.add(standardizePhoneNumber(shop.ownerPhone));
    });

    const existingUsers = await User.findAll({
      attributes: ['phone', 'email']
    });
    
    existingUsers.forEach(user => {
      if (user.phone) existingPhones.add(standardizePhoneNumber(user.phone));
      if (user.email) existingEmails.add(user.email);
    });

    log(`📊 Found ${existingSlugs.size} existing shops, ${existingPhones.size} phone numbers`, 'blue');
  } catch (error) {
    log(`⚠️ Warning: Could not fetch existing data: ${error.message}`, 'yellow');
  }

  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', (row) => {
        try {
          // Skip header or invalid rows
          if (!row.name || row.name === 'name') return;

          // Standardize phone numbers
          const shopPhone = standardizePhoneNumber(row.phone);
          const ownerPhone = standardizePhoneNumber(row.owner_phone);

          // Use original phone numbers from CSV if standardization fails
          const finalShopPhone = shopPhone || row.phone;
          const finalOwnerPhone = ownerPhone || row.owner_phone;
          
          // Skip only if absolutely no phone numbers exist
          if (!finalShopPhone && !finalOwnerPhone) {
            errors.push(`Skipped ${row.name}: No phone numbers in CSV`);
            return;
          }

          // Generate unique identifiers
          const slug = generateUniqueSlug(row.name, existingSlugs);
          const email = `${slug}@printeasyqr.com`;

          // Use the best available phone number
          const phoneToUse = finalShopPhone || finalOwnerPhone;
          
          // Skip duplicates but allow import of unique phones
          if (existingPhones.has(phoneToUse)) {
            errors.push(`Skipped ${row.name}: Phone ${phoneToUse} already exists`);
            return;
          }

          // Parse services and working hours
          const services = parseServices(row.services);
          const workingHours = parseWorkingHours(row.working_hours);

          // Prepare shop data
          const shopData = {
            // Required fields
            name: row.name?.trim() || 'Unknown Shop',
            slug: slug,
            address: row.address?.trim() || 'Address not provided',
            city: row.city?.trim() || 'Unknown City',
            state: row.state?.trim() || 'Unknown State',
            pinCode: row.pin_code?.toString().trim() || '000000',
            phone: phoneToUse,
            
            // Owner information
            publicOwnerName: row.public_owner_name?.trim() || `${row.name} Owner`,
            internalName: row.internal_name?.trim() || row.name?.trim() || 'Unknown Shop',
            ownerFullName: row.owner_full_name?.trim() || `${row.name} Owner`,
            email: email,
            ownerPhone: phoneToUse,
            completeAddress: row.complete_address?.trim() || row.address?.trim() || 'Address not provided',
            
            // Services and features
            services: services,
            equipment: row.equipment ? parseServices(row.equipment) : [],
            customServices: row.custom_services ? parseServices(row.custom_services) : [],
            customEquipment: row.custom_equipment ? parseServices(row.custom_equipment) : [],
            
            // Business details
            yearsOfExperience: row.years_of_experience?.toString() || null,
            formationYear: row.formation_year ? parseInt(row.formation_year) : null,
            workingHours: workingHours,
            
            // Status and availability
            acceptsWalkinOrders: row.accepts_walkin_orders !== 'false',
            isOnline: row.is_online !== 'false',
            autoAvailability: row.auto_availability !== 'false',
            isApproved: row.is_approved !== 'false',
            isPublic: row.is_public !== 'false',
            status: 'active', // Use only valid status values: active, deactivated, banned
            
            // Additional data
            totalOrders: parseInt(row.total_orders) || 0,
            googleMapsLink: row.google_maps_link || null,
            exteriorImage: row.exterior_image || null,
            qrCode: row.qr_code || null
          };

          // Prepare user data
          const userData = {
            phone: phoneToUse,
            name: shopData.ownerFullName,
            email: email,
            passwordHash: DEFAULT_PASSWORD,
            role: 'shop_owner',
            isActive: true
          };

          results.push({ userData, shopData });
          existingPhones.add(phoneToUse);
          existingEmails.add(email);

        } catch (error) {
          errors.push(`Error processing row for ${row.name}: ${error.message}`);
        }
      })
      .on('end', () => {
        log(`📊 Processed ${results.length} valid shops`, 'blue');
        if (errors.length > 0) {
          log(`⚠️ ${errors.length} errors/skips:`, 'yellow');
          errors.forEach(error => log(`   - ${error}`, 'yellow'));
        }
        resolve(results);
      })
      .on('error', (error) => {
        log(`❌ CSV parsing error: ${error.message}`, 'red');
        reject(error);
      });
  });
}

// Database import function
async function importToDatabase(shopDataArray) {
  log('💾 Starting database import...', 'cyan');
  
  const imported = [];
  const failed = [];
  
  // Use transaction for data integrity
  const transaction = await sequelize.transaction();
  
  try {
    for (let i = 0; i < shopDataArray.length; i++) {
      const { userData, shopData } = shopDataArray[i];
      
      try {
        // Create user first
        const user = await User.create(userData, { transaction });
        
        // Create shop with user ID
        const shop = await Shop.create({
          ...shopData,
          ownerId: user.id
        }, { transaction });
        
        imported.push({
          shopName: shop.name,
          phone: shop.phone,
          slug: shop.slug,
          userId: user.id,
          shopId: shop.id
        });
        
        // Progress indicator
        if ((i + 1) % 10 === 0) {
          log(`✅ Imported ${i + 1}/${shopDataArray.length} shops...`, 'green');
        }
        
      } catch (error) {
        failed.push({
          shopName: shopData.name,
          phone: shopData.phone,
          error: error.message
        });
        log(`❌ Failed to import ${shopData.name}: ${error.message}`, 'red');
      }
    }
    
    // Commit transaction
    await transaction.commit();
    
    log(`🎉 Import completed!`, 'green');
    log(`✅ Successfully imported: ${imported.length} shops`, 'green');
    log(`❌ Failed imports: ${failed.length} shops`, 'red');
    
    if (imported.length > 0) {
      log('\n📋 Successfully Imported Shops:', 'cyan');
      imported.forEach(shop => {
        log(`   📱 ${shop.shopName} | Phone: ${shop.phone} | Slug: ${shop.slug}`, 'blue');
      });
    }
    
    if (failed.length > 0) {
      log('\n❌ Failed Imports:', 'red');
      failed.forEach(fail => {
        log(`   📱 ${fail.shopName} | Phone: ${fail.phone} | Error: ${fail.error}`, 'red');
      });
    }
    
    return { imported, failed };
    
  } catch (error) {
    await transaction.rollback();
    log(`❌ Transaction failed: ${error.message}`, 'red');
    throw error;
  }
}

// Main execution
async function main() {
  try {
    log('🏪 PrintEasy QR - CSV Shop Import Tool', 'magenta');
    log('=======================================', 'magenta');
    
    // Check if CSV file exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      throw new Error(`CSV file not found: ${CSV_FILE_PATH}`);
    }
    
    // Import from CSV
    const shopDataArray = await importShopsFromCSV();
    
    if (shopDataArray.length === 0) {
      log('⚠️ No valid shops found to import', 'yellow');
      return;
    }
    
    // Import to database
    const results = await importToDatabase(shopDataArray);
    
    // Final summary
    log('\n📊 IMPORT SUMMARY', 'cyan');
    log('==================', 'cyan');
    log(`📁 CSV File: ${CSV_FILE_PATH}`, 'blue');
    log(`✅ Successful: ${results.imported.length} shops`, 'green');
    log(`❌ Failed: ${results.failed.length} shops`, 'red');
    log(`📱 All shops have phone numbers`, 'blue');
    log(`🔐 Default password: ${DEFAULT_PASSWORD}`, 'blue');
    log(`📧 Email format: {slug}@printeasyqr.com`, 'blue');
    
  } catch (error) {
    log(`💥 Import failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the import
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as importShops };