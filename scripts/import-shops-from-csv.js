import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database imports
import { sequelize } from '../src/models/index.js';
import User from '../src/models/user.js';
import Shop from '../src/models/shop.js';

// Utility function to parse opening hours from CSV format
function parseOpeningHours(data) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const workingHours = {};
  
  for (let i = 0; i < 7; i++) {
    const dayKey = `openingHours/${i}/day`;
    const hoursKey = `openingHours/${i}/hours`;
    
    if (data[dayKey] && data[hoursKey]) {
      const day = data[dayKey].toLowerCase();
      const hours = data[hoursKey];
      
      // Convert day names to our format
      const dayMap = {
        'monday': 'Monday',
        'tuesday': 'Tuesday', 
        'wednesday': 'Wednesday',
        'thursday': 'Thursday',
        'friday': 'Friday',
        'saturday': 'Saturday',
        'sunday': 'Sunday'
      };
      
      if (dayMap[day] && hours !== 'Closed') {
        workingHours[dayMap[day]] = hours;
      }
    }
  }
  
  return workingHours;
}

// Smart service detection based on category and title
function detectServices(title, categories) {
  const services = [];
  const titleLower = title.toLowerCase();
  
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

// Smart equipment detection
function detectEquipment(services) {
  const equipment = [];
  
  if (services.includes('Photocopying')) {
    equipment.push('High-Speed Photocopier');
  }
  
  if (services.includes('Digital Printing') || services.includes('Color Printing')) {
    equipment.push('Color Laser Printer');
  }
  
  if (services.includes('Document Scanning')) {
    equipment.push('Document Scanner');
  }
  
  if (services.includes('Lamination')) {
    equipment.push('Lamination Machine');
  }
  
  if (services.includes('Binding Services')) {
    equipment.push('Binding Machine');
  }
  
  if (services.includes('Large Format Printing')) {
    equipment.push('Large Format Printer');
  }
  
  // Default equipment
  if (equipment.length === 0) {
    equipment.push('Basic Photocopier');
  }
  
  return equipment;
}

// Generate shop slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
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

async function importLastFiveShops() {
  try {
    console.log('🔍 Starting shop import from CSV dataset...');
    
    // Read and parse CSV
    const csvPath = path.join(__dirname, '../attached_assets/dataset_google-maps-scraper-task_2025-06-09_10-49-17-150_1754994158446.csv');
    const shops = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => {
          shops.push(data);
        })
        .on('end', async () => {
          try {
            console.log(`📊 Total shops in CSV: ${shops.length}`);
            
            // Get last 5 shops
            const lastFiveShops = shops.slice(-5);
            console.log('🎯 Processing last 5 shops for import...');
            
            // Create a demo shop owner for all imported shops
            let demoOwner = await User.findOne({ where: { email: 'demo-owner@printeasy.com' } });
            if (!demoOwner) {
              demoOwner = await User.create({
                phone: '9876543210',
                name: 'Demo Shop Owner',
                email: 'demo-owner@printeasy.com',
                role: 'shop_owner',
                isActive: true
              });
              console.log('🔧 Created demo shop owner');
            }
            
            const importedShops = [];
            
            for (const [index, shopData] of lastFiveShops.entries()) {
              console.log(`\n📝 Processing Shop ${index + 1}: ${shopData.title}`);
              
              // Parse shop data
              const workingHours = parseOpeningHours(shopData);
              const services = detectServices(shopData.title, shopData);
              const equipment = detectEquipment(services);
              const slug = generateSlug(shopData.title);
              const pincode = extractPincode(shopData.address);
              const { city, state } = extractCityState(shopData.address);
              
              // Extract owner name from shop name (smart logic)
              const shopName = shopData.title;
              let ownerName = 'Shop Owner';
              if (shopName.includes('Shree ')) {
                ownerName = shopName.replace('Shree ', '').split(' ')[0] + ' Patel';
              } else if (shopName.includes('Krishna')) {
                ownerName = 'Krishna Shah';
              } else if (shopName.includes('Sai')) {
                ownerName = 'Sai Gupta';
              } else {
                // Use first word of shop name + common surname
                const firstWord = shopName.split(' ')[0];
                ownerName = `${firstWord} Kumar`;
              }
              
              // Create shop data
              const shopCreateData = {
                ownerId: demoOwner.id,
                name: shopData.title,
                slug: slug,
                address: shopData.address.split(',')[0].trim(), // First part of address
                city: city,
                state: state,
                pinCode: pincode,
                phone: shopData.phoneNumber || '9876543210',
                publicOwnerName: ownerName,
                internalName: shopData.title,
                ownerFullName: ownerName,
                email: `${slug}@printeasy.com`,
                ownerPhone: shopData.phoneNumber || '9876543210',
                completeAddress: shopData.address,
                services: services,
                equipment: equipment,
                customServices: [],
                customEquipment: [],
                yearsOfExperience: Math.floor(Math.random() * 10) + 5, // 5-15 years
                formationYear: new Date().getFullYear() - Math.floor(Math.random() * 10) - 5,
                workingHours: workingHours,
                acceptsWalkinOrders: true,
                isOnline: true,
                autoAvailability: true,
                isApproved: true,
                isPublic: true,
                status: 'active',
                totalOrders: Math.floor(Math.random() * 100) // Random order count
              };
              
              // Check if shop already exists
              const existingShop = await Shop.findOne({ where: { slug: slug } });
              if (existingShop) {
                console.log(`⚠️  Shop with slug '${slug}' already exists, skipping...`);
                continue;
              }
              
              // Create shop
              const createdShop = await Shop.create(shopCreateData);
              importedShops.push(createdShop);
              
              console.log(`✅ Created shop: ${createdShop.name}`);
              console.log(`   📍 Address: ${createdShop.completeAddress}`);
              console.log(`   🕒 Working Hours: ${Object.keys(workingHours).length} days`);
              console.log(`   🛠️  Services: ${services.join(', ')}`);
              console.log(`   ⚙️  Equipment: ${equipment.join(', ')}`);
            }
            
            console.log(`\n🎉 Successfully imported ${importedShops.length} shops!`);
            
            // Display summary
            console.log('\n📋 IMPORT SUMMARY:');
            console.log('==================');
            importedShops.forEach((shop, index) => {
              console.log(`${index + 1}. ${shop.name}`);
              console.log(`   Slug: ${shop.slug}`);
              console.log(`   Location: ${shop.city}, ${shop.state} - ${shop.pinCode}`);
              console.log(`   Services: ${shop.services.length} services`);
              console.log(`   Equipment: ${shop.equipment.length} items`);
              console.log(`   Working Days: ${Object.keys(shop.workingHours).length}`);
              console.log('');
            });
            
            resolve(importedShops);
          } catch (error) {
            console.error('❌ Error during import:', error);
            reject(error);
          }
        })
        .on('error', (error) => {
          console.error('❌ Error reading CSV:', error);
          reject(error);
        });
    });
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

// Run the import if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importLastFiveShops()
    .then(() => {
      console.log('✅ Import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
}

export { importLastFiveShops };