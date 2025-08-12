import fs from 'fs';
import csv from 'csv-parser';
import bcrypt from 'bcrypt';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? { require: true, rejectUnauthorized: false } : false
  }
});

// Shop model definition (simplified for import)
const Shop = sequelize.define('Shop', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.STRING,
  address: Sequelize.TEXT,
  city: Sequelize.STRING,
  state: Sequelize.STRING,
  pinCode: Sequelize.STRING,
  phone: Sequelize.STRING,
  publicOwnerName: Sequelize.STRING,
  internalName: Sequelize.STRING,
  ownerFullName: Sequelize.STRING,
  email: Sequelize.STRING,
  ownerPhone: Sequelize.STRING,
  completeAddress: Sequelize.TEXT,
  services: Sequelize.JSON,
  workingHours: Sequelize.JSON,
  acceptsWalkinOrders: { type: Sequelize.BOOLEAN, defaultValue: false },
  isOnline: { type: Sequelize.BOOLEAN, defaultValue: true },
  autoAvailability: { type: Sequelize.BOOLEAN, defaultValue: true },
  isApproved: { type: Sequelize.BOOLEAN, defaultValue: true },
  isPublic: { type: Sequelize.BOOLEAN, defaultValue: true },
  status: { type: Sequelize.STRING, defaultValue: 'active' },
  googleMapsLink: Sequelize.TEXT,
  exteriorImage: Sequelize.TEXT,
  slug: Sequelize.STRING
}, {
  tableName: 'shops',
  underscored: true
});

// User model for shop owners
const User = sequelize.define('User', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  phone: Sequelize.STRING,
  name: Sequelize.STRING,
  email: Sequelize.STRING,
  passwordHash: Sequelize.STRING,
  role: { type: Sequelize.STRING, defaultValue: 'shop_owner' },
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true }
}, {
  tableName: 'users',
  underscored: true
});

// Define association
Shop.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });

function parseWorkingHours(row) {
  const workingHours = {};
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  for (let i = 0; i < 7; i++) {
    const dayKey = `openingHours/${i}/day`;
    const hoursKey = `openingHours/${i}/hours`;
    
    if (row[dayKey] && row[hoursKey]) {
      const day = row[dayKey].toLowerCase();
      const hours = row[hoursKey];
      
      if (hours === 'Closed') {
        workingHours[day] = { isOpen: false };
      } else {
        // Parse hours like "9 AM to 10 PM" or "24 hours"
        if (hours.includes('24 hours') || hours.includes('24/7')) {
          workingHours[day] = { isOpen: true, openTime: '00:00', closeTime: '23:59' };
        } else if (hours.includes(' to ')) {
          const [openTime, closeTime] = hours.split(' to ').map(t => t.trim());
          workingHours[day] = {
            isOpen: true,
            openTime: convertTo24Hour(openTime),
            closeTime: convertTo24Hour(closeTime)
          };
        } else {
          workingHours[day] = { isOpen: true, openTime: '09:00', closeTime: '18:00' };
        }
      }
    }
  }
  
  return workingHours;
}

function convertTo24Hour(time) {
  const match = time.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i);
  if (!match) return '09:00';
  
  let [, hours, minutes = '00', period] = match;
  hours = parseInt(hours);
  minutes = parseInt(minutes);
  
  if (period.toUpperCase() === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function generateSlug(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
}

function generateOwnerName(shopName) {
  // Remove common suffixes and create owner name
  const cleanName = shopName
    .replace(/\s+(xerox|centre|center|copy|digital|printing|shop|store|services?)$/i, '')
    .trim();
  return `${cleanName} Owner`;
}

function extractServices(row) {
  const services = [];
  
  // Extract from categories
  for (let i = 0; i < 10; i++) {
    const categoryKey = `categories/${i}`;
    if (row[categoryKey] && row[categoryKey].trim()) {
      services.push(row[categoryKey].trim());
    }
  }
  
  // Add primary category
  if (row.categoryName && row.categoryName.trim()) {
    services.push(row.categoryName.trim());
  }
  
  // Remove duplicates and common non-services
  return [...new Set(services)].filter(service => 
    service && !['Copy shop', 'Print shop', 'Digital printing service'].includes(service)
  );
}

async function importShops() {
  try {
    console.log('🚀 Starting shop import from CSV...');
    
    // Sync models
    await sequelize.sync();
    console.log('✅ Database models synchronized');
    
    const shops = [];
    const csvPath = 'clean_shops.csv';
    
    // Read and parse CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv({
          skipEmptyLines: true
        }))
        .on('data', (row) => {
          shops.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`📊 Found ${shops.length} shops in CSV`);
    
    // Hash password once for all shops
    const hashedPassword = await bcrypt.hash('PrintEasyQR@2025', 12);
    console.log('🔐 Password hashed for all shops');
    
    let importedCount = 0;
    
    for (const row of shops) {
      try {
        // Debug first few rows
        if (importedCount < 3) {
          console.log(`🔍 Row ${importedCount + 1}:`, Object.keys(row).slice(0, 5));
          console.log(`   Title: "${row.title}"`);
        }
        
        // Skip if shop name is missing
        if (!row.title || !row.title.trim()) {
          if (importedCount < 5) console.log(`❌ Skipping row ${importedCount + 1}: No title`);
          continue;
        }
        
        const shopName = row.title.trim();
        const ownerName = generateOwnerName(shopName);
        const workingHours = parseWorkingHours(row);
        const services = extractServices(row);
        const phone = row.phone ? row.phone.replace(/[^\d]/g, '').slice(-10) : null;
        const ownerPhone = row.phoneUnformatted ? row.phoneUnformatted.toString().slice(-10) : phone;
        
        // Create shop owner user
        const [user] = await User.findOrCreate({
          where: { phone: ownerPhone || `shop${importedCount + 1}@temp.com` },
          defaults: {
            phone: ownerPhone,
            name: ownerName,
            email: `shop${importedCount + 1}@printeasyqr.com`,
            passwordHash: hashedPassword,
            role: 'shop_owner',
            isActive: true
          }
        });
        
        // Handle duplicate shop names by adding suffix
        let uniqueShopName = shopName;
        let shopSlug = generateSlug(shopName);
        
        // Check if shop name already exists
        const existingShop = await Shop.findOne({ where: { name: uniqueShopName } });
        if (existingShop) {
          uniqueShopName = `${shopName} - ${row.neighborhood || row.street || 'Branch'}`.substring(0, 100);
          shopSlug = `${shopSlug}-${importedCount + 1}`;
        }
        
        // Create shop with unique identifiers
        const shop = await Shop.create({
          name: uniqueShopName,
          slug: shopSlug,
          address: row.street || row.address || '',
          city: row.city || 'Ahmedabad',
          state: row.state || 'Gujarat',
          pinCode: row.postalCode || '380001',
          phone: fallbackPhone,
          publicOwnerName: ownerName,
          internalName: uniqueShopName,
          ownerFullName: ownerName,
          email: uniqueEmail,
          ownerPhone: fallbackPhone,
          completeAddress: row.address || '',
          services: services,
          workingHours: workingHours,
          acceptsWalkinOrders: false, // As requested
          isOnline: true,
          autoAvailability: true,
          isApproved: true,
          isPublic: true,
          status: 'active',
          googleMapsLink: row.url || '',
          exteriorImage: row.imageUrl || null,
          ownerId: user.id
        });
        
        importedCount++;
        console.log(`✅ Imported: ${shopName} (${importedCount}/${shops.length})`);
        
      } catch (error) {
        console.error(`❌ Error importing ${row.title}:`, error.message);
      }
    }
    
    console.log(`🎉 Successfully imported ${importedCount} shops!`);
    console.log('📋 All shops have:');
    console.log('   - Password: PrintEasyQR@2025');
    console.log('   - Walk-in orders: DISABLED');
    console.log('   - No equipment data (as requested)');
    console.log('   - Proper working hours from CSV');
    console.log('   - Owner names like "Shop Name Owner"');
    console.log('   - Google Maps links included');
    
  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the import
importShops();