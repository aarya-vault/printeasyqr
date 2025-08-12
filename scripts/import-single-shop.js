import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Helper function to convert time format like "10 AM" to "10:00"
function convertTo24Hour(timeStr) {
  const cleanStr = timeStr.trim();
  
  // If it already looks like 24-hour format (e.g., "14:30"), return as is
  if (/^\d{1,2}:\d{2}$/.test(cleanStr)) {
    return cleanStr;
  }
  
  // Parse AM/PM format
  const ampmMatch = cleanStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (ampmMatch) {
    const [, hoursStr, minutesStr = '00', period] = ampmMatch;
    let hours = parseInt(hoursStr);
    const minutes = minutesStr;
    
    if (period.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  
  // Final fallback
  return '09:00';
}

// Helper function to parse hours string like "10 AM to 10 PM"
function parseHoursString(hoursStr) {
  if (!hoursStr || hoursStr.toLowerCase().includes('closed')) {
    return { open: '09:00', close: '18:00', closed: true };
  }
  
  if (hoursStr.toLowerCase().includes('24') || hoursStr.toLowerCase().includes('always')) {
    return { open: '00:00', close: '23:59', closed: false, is24Hours: true };
  }
  
  // Parse "10 AM to 10 PM" format
  const timePattern = /(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*(?:to|-)\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i;
  const match = hoursStr.match(timePattern);
  
  if (match) {
    const [, openTime, closeTime] = match;
    try {
      return {
        open: convertTo24Hour(openTime),
        close: convertTo24Hour(closeTime),
        closed: false
      };
    } catch (error) {
      console.warn('Failed to parse time:', openTime, closeTime, error);
      return { open: '09:00', close: '18:00', closed: false };
    }
  }
  
  // Default fallback
  return { open: '09:00', close: '18:00', closed: false };
}

// Utility function to parse opening hours from CSV format
function parseOpeningHours(data) {
  const workingHours = {};
  
  for (let i = 0; i < 7; i++) {
    const dayKey = `openingHours/${i}/day`;
    const hoursKey = `openingHours/${i}/hours`;
    
    if (data[dayKey] && data[hoursKey]) {
      const day = data[dayKey].toLowerCase();
      const hours = data[hoursKey];
      
      // Convert day names to our format (lowercase keys as per database schema)
      const dayMap = {
        'monday': 'monday',
        'tuesday': 'tuesday', 
        'wednesday': 'wednesday',
        'thursday': 'thursday',
        'friday': 'friday',
        'saturday': 'saturday',
        'sunday': 'sunday'
      };
      
      if (dayMap[day]) {
        workingHours[dayMap[day]] = parseHoursString(hours);
      }
    }
  }
  
  // Ensure all 7 days are present with defaults if missing
  const allDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (const day of allDays) {
    if (!workingHours[day]) {
      workingHours[day] = { open: '09:00', close: '18:00', closed: true };
    }
  }
  
  return workingHours;
}

// Smart service detection based on category and title
function detectServices(title, categories) {
  const services = [];
  const titleLower = (title || '').toLowerCase();
  
  // Combine all categories into one string
  const allCategories = [];
  for (let i = 0; i < 10; i++) {
    if (categories[`categories/${i}`]) {
      allCategories.push(categories[`categories/${i}`].toLowerCase());
    }
  }
  const categoryText = allCategories.join(' ');
  
  // Service detection logic
  if (titleLower.includes('xerox') || categoryText.includes('copy') || categoryText.includes('digital printing')) {
    services.push('Photocopying');
    services.push('Document Scanning');
  }
  
  if (titleLower.includes('digital') || categoryText.includes('digital printing')) {
    services.push('Digital Printing');
  }
  
  if (titleLower.includes('mobile') || categoryText.includes('mobile') || categoryText.includes('phone')) {
    services.push('Mobile Accessories');
  }
  
  if (titleLower.includes('stationery') || categoryText.includes('stationery') || categoryText.includes('pen store')) {
    services.push('Office Supplies');
  }
  
  if (titleLower.includes('lamination') || categoryText.includes('lamination')) {
    services.push('Lamination');
  }
  
  if (titleLower.includes('binding') || categoryText.includes('bookbinder')) {
    services.push('Binding Services');
  }
  
  if (titleLower.includes('printing') || categoryText.includes('print shop')) {
    services.push('Color Printing');
    services.push('Large Format Printing');
  }
  
  // Default services if none detected
  if (services.length === 0) {
    services.push('Photocopying', 'Document Scanning');
  }
  
  return services;
}

// No equipment detection - leave empty as requested
function detectEquipment(services) {
  return []; // Equipment details not available as per user requirements
}

// Generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
}

// Extract pincode from address
function extractPincode(address) {
  const pincodeMatch = address.match(/\b\d{6}\b/);
  return pincodeMatch ? pincodeMatch[0] : '380028'; // Default to Ahmedabad pincode
}

// Extract city and state
function extractCityState(address) {
  const parts = address.split(',');
  let city = 'Ahmedabad';
  let state = 'Gujarat';
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('Gujarat')) {
      state = 'Gujarat';
      // City is usually the part before Gujarat
      const index = parts.indexOf(part);
      if (index > 0) {
        const cityPart = parts[index - 1].trim();
        if (!cityPart.match(/\d{6}/)) { // Not a pincode
          city = cityPart;
        }
      }
    }
  }
  
  return { city, state };
}

async function importShopByName(targetShopName) {
  try {
    console.log('🔍 Looking for shop:', targetShopName);
    
    // Read and parse CSV
    const csvPath = path.join(__dirname, '../attached_assets/dataset_google-maps-scraper-task_2025-06-09_10-49-17-150_1754994158446.csv');
    const shops = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => {
          // Fix BOM issue - clean the keys
          const cleanData = {};
          for (const [key, value] of Object.entries(data)) {
            const cleanKey = key.replace(/^\uFEFF/, ''); // Remove BOM
            cleanData[cleanKey] = value;
          }
          
          shops.push(cleanData);
        })
        .on('end', async () => {
          try {
            console.log(`📊 Total shops in CSV: ${shops.length}`);
            
            // Find the specific shop
            const targetShop = shops.find(shop => 
              shop.title && shop.title.trim().toLowerCase().includes(targetShopName.toLowerCase())
            );
            
            if (!targetShop) {
              console.log(`❌ Shop "${targetShopName}" not found in CSV`);
              resolve();
              return;
            }
            
            console.log(`✅ Found shop: ${targetShop.title}`);
            console.log(`📍 Address: ${targetShop.address}`);
            
            // Log working hours data from CSV
            console.log('\n📅 Working Hours from CSV:');
            for (let i = 0; i < 7; i++) {
              const dayKey = `openingHours/${i}/day`;
              const hoursKey = `openingHours/${i}/hours`;
              if (targetShop[dayKey] && targetShop[hoursKey]) {
                console.log(`  ${targetShop[dayKey]}: ${targetShop[hoursKey]}`);
              }
            }
            
            // Parse shop data
            const workingHours = parseOpeningHours(targetShop);
            console.log('\n🔄 Parsed Working Hours Structure:');
            console.log(JSON.stringify(workingHours, null, 2));
            
            const services = detectServices(targetShop.title, targetShop);
            const equipment = detectEquipment(services);
            const slug = generateSlug(targetShop.title);
            const pincode = extractPincode(targetShop.address || '');
            const { city, state } = extractCityState(targetShop.address || '');
            
            console.log('\n📦 Processed Data:');
            console.log('Services:', services);
            console.log('Equipment:', equipment);
            console.log('Slug:', slug);
            console.log('Pincode:', pincode);
            console.log('City/State:', city, state);
            
            // Generate owner name from shop name + "Owner"
            const shopName = targetShop.title;
            let ownerName = `${shopName} Owner`;
            
            // Clean up common redundant words for better formatting
            ownerName = ownerName
              .replace(/\s+(Shop|Centre|Center)\s+Owner/gi, ' Owner')
              .replace(/\s+&\s+Xerox Owner/gi, ' Owner')
              .replace(/\s+Xerox Owner/gi, ' Owner');
            
            // Check if shop already exists
            const existingShop = await pool.query(
              'SELECT id FROM shops WHERE slug = $1',
              [slug]
            );
            
            if (existingShop.rows.length > 0) {
              console.log(`⚠️  Shop with slug '${slug}' already exists, skipping...`);
              resolve();
              return;
            }
            
            // Create shop
            const createShopResult = await pool.query(`
              INSERT INTO shops (
                owner_id, name, slug, address, city, state, pin_code, phone,
                public_owner_name, internal_name, owner_full_name, email,
                owner_phone, complete_address, services, equipment,
                custom_services, custom_equipment, years_of_experience,
                formation_year, working_hours, accepts_walkin_orders,
                is_online, auto_availability, is_approved, is_public, status,
                total_orders, exterior_image, created_at, updated_at
              ) VALUES (
                1, $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11,
                $12, $13, $14, $15,
                $16, $17, $18,
                $19, $20, $21,
                $22, $23, $24, $25, $26,
                $27, $28, NOW(), NOW()
              ) RETURNING id
            `, [
              targetShop.title, // name
              slug, // slug
              targetShop.address || '', // address
              city, // city
              state, // state
              pincode, // pin_code
              targetShop.phone || '9876543210', // phone
              ownerName, // public_owner_name
              targetShop.title, // internal_name
              ownerName, // owner_full_name
              `${slug}@printeasy.com`, // email
              targetShop.phone || '9876543210', // owner_phone
              targetShop.address || '', // complete_address
              JSON.stringify(services), // services
              JSON.stringify(equipment), // equipment
              JSON.stringify([]), // custom_services
              JSON.stringify([]), // custom_equipment
              'Not Available', // years_of_experience
              '2019', // formation_year
              JSON.stringify(workingHours), // working_hours
              false, // accepts_walkin_orders - disabled as requested
              true, // is_online
              true, // auto_availability
              true, // is_approved
              true, // is_public
              'active', // status
              0, // total_orders
              null // exterior_image
            ]);
            
            const newShopId = createShopResult.rows[0].id;
            console.log(`\n✅ Successfully imported shop with ID: ${newShopId}`);
            console.log(`📝 Name: ${targetShop.title}`);
            console.log(`🏷️  Slug: ${slug}`);
            console.log(`📍 Location: ${city}, ${state} - ${pincode}`);
            console.log(`🕒 Working Hours: Properly structured with actual times from CSV`);
            
            resolve();
            
          } catch (error) {
            console.error('❌ Error importing shop:', error);
            await pool.end();
            reject(error);
          }
        })
        .on('error', (error) => {
          pool.end();
          reject(error);
        });
    });
    
  } catch (error) {
    console.error('❌ Error in importShopByName:', error);
    await pool.end();
  }
}

// Run the import
const shopName = process.argv[2] || 'New Jai Ambe Mobile Shop & Xerox';
importShopByName(shopName);