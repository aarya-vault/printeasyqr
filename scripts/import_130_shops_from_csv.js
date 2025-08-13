import fs from 'fs';
import csv from 'csv-parser';
import bcrypt from 'bcrypt';
import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

// Import models
const User = sequelize.define('User', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  phone: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  name: Sequelize.STRING,
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  passwordHash: {
    type: Sequelize.STRING,
    allowNull: false
  },
  role: {
    type: Sequelize.ENUM('customer', 'shop_owner', 'admin'),
    allowNull: false,
    defaultValue: 'customer'
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  underscored: true
});

const Shop = sequelize.define('Shop', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ownerId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  slug: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
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
  services: {
    type: Sequelize.JSONB,
    defaultValue: []
  },
  equipment: {
    type: Sequelize.JSONB,
    defaultValue: []
  },
  customServices: Sequelize.TEXT,
  customEquipment: Sequelize.TEXT,
  yearsOfExperience: Sequelize.INTEGER,
  formationYear: Sequelize.INTEGER,
  workingHours: {
    type: Sequelize.JSONB,
    defaultValue: {}
  },
  acceptsWalkinOrders: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  isOnline: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  autoAvailability: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  isApproved: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  isPublic: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  status: {
    type: Sequelize.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active'
  },
  qrCode: Sequelize.TEXT,
  totalOrders: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  exteriorImage: Sequelize.TEXT,
  googleMapsLink: Sequelize.TEXT
}, {
  tableName: 'shops',
  underscored: true
});

// Utility functions
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50);
}

function generateEmailFromShopName(shopName) {
  // Generate clean email from shop name
  const cleanName = shopName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/xerox|copy|centre|center|shop|store|prints?|digital|enterprise|systems?|solutions?|services?/g, '') // Remove business words
    .substring(0, 20); // Limit length
    
  return cleanName ? `${cleanName}@printeasyqr.com` : `shop${Date.now()}@printeasyqr.com`;
}

function generateOwnerName(shopName) {
  // Remove common business words and generate owner name
  const cleanName = shopName
    .replace(/\b(xerox|copy|centre|center|shop|store|prints?|digital|enterprise|systems?|solutions?|services?)\b/gi, '')
    .trim();
  
  return cleanName ? `${cleanName} Owner` : `${shopName} Owner`;
}

function parseWorkingHours(row) {
  const workingHours = {};
  const daysMap = {
    'Monday': 'monday',
    'Tuesday': 'tuesday', 
    'Wednesday': 'wednesday',
    'Thursday': 'thursday',
    'Friday': 'friday',
    'Saturday': 'saturday',
    'Sunday': 'sunday'
  };

  // Parse opening hours from CSV columns (openingHours/0/day, openingHours/0/hours, etc.)
  for (let i = 0; i < 7; i++) {
    const dayKey = `openingHours/${i}/day`;
    const hoursKey = `openingHours/${i}/hours`;
    
    if (row[dayKey] && row[hoursKey]) {
      const dayName = daysMap[row[dayKey]];
      const hours = row[hoursKey];
      
      if (dayName && hours) {
        if (hours.toLowerCase().includes('closed')) {
          workingHours[dayName] = { isOpen: false };
        } else {
          // Parse time ranges like "9 AM to 10 PM", "10 AM–8:30 PM", "9:30 AM to 9:30 PM"
          const timeMatch = hours.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*(?:to|–|-)\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i);
          if (timeMatch) {
            const openTime = convertTo24Hour(timeMatch[1]);
            const closeTime = convertTo24Hour(timeMatch[2]);
            workingHours[dayName] = {
              isOpen: true,
              openTime: openTime,
              closeTime: closeTime
            };
          } else {
            // Default fallback for unparseable times
            workingHours[dayName] = {
              isOpen: true,
              openTime: "09:00",
              closeTime: "18:00"
            };
          }
        }
      }
    }
  }

  // If no working hours found, set default
  if (Object.keys(workingHours).length === 0) {
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].forEach(day => {
      workingHours[day] = {
        isOpen: true,
        openTime: "09:00",
        closeTime: "18:00"
      };
    });
    workingHours.sunday = { isOpen: false };
  }

  return workingHours;
}

function convertTo24Hour(timeStr) {
  const cleanTime = timeStr.trim().toUpperCase();
  const match = cleanTime.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/);
  
  if (!match) return "09:00";
  
  let hours = parseInt(match[1]);
  const minutes = match[2] ? match[2] : "00";
  const period = match[3];
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

function extractServices(row) {
  const services = [];
  
  // Extract from categories
  for (let i = 0; i < 10; i++) {
    const categoryKey = `categories/${i}`;
    if (row[categoryKey]) {
      services.push(row[categoryKey]);
    }
  }
  
  // Add default printing services
  if (services.length === 0) {
    services.push('Xerox', 'Printing', 'Copy Services');
  }
  
  return services;
}

function extractPhoneNumber(phoneStr) {
  if (!phoneStr || !phoneStr.toString().trim()) return null;
  
  // Extract 10-digit phone number from Indian format (+91 XXXXX XXXXX)
  const phoneDigits = phoneStr.toString().replace(/[^\d]/g, '');
  if (phoneDigits.length >= 10) {
    return phoneDigits.slice(-10); // Get last 10 digits
  }
  return null;
}

async function main() {
  try {
    console.log('🚀 Starting fresh import of 130 shops from CSV...');
    
    // Sync models
    await sequelize.sync();
    console.log('✅ Database models synchronized');
    
    const shops = [];
    const csvPath = 'attached_assets/updated filtered data!_1755023573628.csv';
    
    // Read and parse CSV - first get headers manually
    const headers = [];
    let dataStarted = false;
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv({
          skipEmptyLines: true
        }))
        .on('headers', (headerList) => {
          headers.push(...headerList);
          console.log(`📋 CSV Headers found: ${headers.slice(0, 10).join(', ')}...`);
        })
        .on('data', (row) => {
          if (!dataStarted) {
            dataStarted = true;
            console.log(`📋 First row data:`, {
              title: row[headers[0]],
              phone: row[headers[38]],
              availableKeys: Object.keys(row).slice(0, 5)
            });
          }
          
          // Map to proper field names
          const mappedRow = {
            title: row[headers[0]], // First column should be title
            address: row[headers[1]],
            phone: row[headers[38]], // Phone column
            phoneUnformatted: row[headers[39]],
            city: row[headers[14]],
            state: row[headers[47]],
            postalCode: row[headers[40]],
            url: row[headers[51]],
            imageUrl: row[headers[17]],
            neighborhood: row[headers[22]],
            street: row[headers[48]]
          };
          
          // Add opening hours
          for (let i = 0; i < 7; i++) {
            const dayIndex = 23 + (i * 2); // openingHours/0/day starts at index 23
            const hoursIndex = 24 + (i * 2); // openingHours/0/hours starts at index 24
            mappedRow[`openingHours/${i}/day`] = row[headers[dayIndex]];
            mappedRow[`openingHours/${i}/hours`] = row[headers[hoursIndex]];
          }
          
          // Add categories
          for (let i = 0; i < 10; i++) {
            mappedRow[`categories/${i}`] = row[headers[2 + i]];
          }
          
          shops.push(mappedRow);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`📊 Found ${shops.length} shops in CSV`);
    
    // Hash password once for all shops
    const hashedPassword = await bcrypt.hash('PrintEasyQR@2025', 12);
    console.log('🔐 Password hashed for all shops');
    
    // Filter shops with valid phone numbers
    const validShops = [];
    for (const row of shops) {
      const phoneNumber = extractPhoneNumber(row.phone);
      if (phoneNumber && row.title && row.title.trim()) {
        validShops.push({
          ...row,
          extractedPhone: phoneNumber
        });
      } else {
        // Debug logging for first few rejected shops
        if (validShops.length < 5) {
          console.log(`❌ Rejecting: "${row.title}" - Phone: "${row.phone}" - Extracted: "${phoneNumber}"`);
        }
      }
    }
    
    console.log(`📱 Found ${validShops.length} shops with valid phone numbers`);
    
    let importedCount = 0;
    const errors = [];
    
    for (const row of validShops) {
      try {
        const shopName = row.title.trim();
        const ownerName = generateOwnerName(shopName);
        const workingHours = parseWorkingHours(row);
        const services = extractServices(row);
        const ownerPhone = row.extractedPhone;
        
        console.log(`🔍 Processing: ${shopName} (Phone: ${ownerPhone})`);
        
        // Generate proper email from shop name
        const shopEmail = generateEmailFromShopName(shopName);
        
        // Create shop owner user - handle duplicates
        let user = await User.findOne({ where: { phone: ownerPhone } });
        if (!user) {
          // Check if email exists, make it unique if needed
          let finalEmail = shopEmail;
          let emailCounter = 1;
          while (await User.findOne({ where: { email: finalEmail } })) {
            const emailParts = shopEmail.split('@');
            finalEmail = `${emailParts[0]}${emailCounter}@${emailParts[1]}`;
            emailCounter++;
          }
          
          user = await User.create({
            phone: ownerPhone,
            name: ownerName,
            email: finalEmail,
            passwordHash: hashedPassword,
            role: 'shop_owner',
            isActive: true
          });
        }
        
        // Handle duplicate shop names
        let uniqueShopName = shopName;
        let shopSlug = generateSlug(shopName);
        
        // Check for existing shop with same name
        let nameCounter = 1;
        let finalShopName = uniqueShopName;
        while (await Shop.findOne({ where: { name: finalShopName } })) {
          const suffix = row.neighborhood || row.street || `Branch ${nameCounter}`;
          finalShopName = `${shopName} - ${suffix}`.substring(0, 100);
          nameCounter++;
        }
        
        // Ensure unique slug
        let slugCounter = 1;
        let finalSlug = shopSlug;
        while (await Shop.findOne({ where: { slug: finalSlug } })) {
          finalSlug = `${shopSlug}-${slugCounter}`;
          slugCounter++;
        }
        
        // Create shop
        const shop = await Shop.create({
          name: finalShopName,
          slug: finalSlug,
          address: row.street || row.address || '',
          city: row.city || 'Ahmedabad',
          state: row.state || 'Gujarat',
          pinCode: row.postalCode || '380001',
          phone: ownerPhone,
          publicOwnerName: ownerName,
          internalName: uniqueShopName,
          ownerFullName: ownerName,
          email: shopEmail,
          ownerPhone: ownerPhone,
          completeAddress: row.address || '',
          services: services,
          equipment: [], // No equipment data as requested
          workingHours: workingHours,
          acceptsWalkinOrders: false, // Disabled as requested
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
        console.log(`✅ Imported: ${uniqueShopName} (${importedCount}/${validShops.length})`);
        
      } catch (error) {
        const errorMsg = `❌ Error importing ${row.title}: ${error.message}`;
        console.log(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    console.log(`\n🎉 Successfully imported ${importedCount} shops!`);
    console.log(`📋 All shops have:`);
    console.log(`   - Password: PrintEasyQR@2025`);
    console.log(`   - Walk-in orders: DISABLED`);
    console.log(`   - No equipment data (as requested)`);
    console.log(`   - Proper working hours from CSV`);
    console.log(`   - Owner names like "Shop Name Owner"`);
    console.log(`   - Google Maps links included`);
    
    if (errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      errors.forEach(error => console.log(error));
    }
    
  } catch (error) {
    console.error('💥 Import failed:', error);
  } finally {
    await sequelize.close();
  }
}

main();