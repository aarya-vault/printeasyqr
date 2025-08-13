import fs from 'fs';
import csv from 'csv-parser';
import bcrypt from 'bcrypt';
import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? { require: true, rejectUnauthorized: false } : false
  }
});

// User model definition
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
    unique: true
  },
  passwordHash: Sequelize.STRING,
  role: {
    type: Sequelize.ENUM('customer', 'shop_owner', 'admin'),
    defaultValue: 'shop_owner'
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  underscored: true
});

// Shop model definition
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
    defaultValue: true
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
function generateSlug(name, counter = 0) {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 40);
  
  return counter === 0 ? baseSlug : `${baseSlug}-${counter}`;
}

function generateEmailFromShopName(shopName) {
  const cleanName = shopName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/xerox|copy|centre|center|shop|store|prints?|digital|enterprise|systems?|solutions?|services?/g, '') // Remove business words
    .substring(0, 20); // Limit length
    
  return cleanName ? `${cleanName}@printeasyqr.com` : `shop${Date.now()}@printeasyqr.com`;
}

function generateOwnerName(shopName) {
  const cleanName = shopName
    .replace(/\b(xerox|copy|centre|center|shop|store|prints?|digital|enterprise|systems?|solutions?|services?)\b/gi, '')
    .trim();
  
  return cleanName ? `${cleanName} Owner` : `${shopName} Owner`;
}

function parseWorkingHours(row) {
  const workingHours = {};
  const dayMapping = {
    'Monday': 0,
    'Tuesday': 1, 
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4,
    'Saturday': 5,
    'Sunday': 6
  };

  // Parse opening hours from CSV columns
  for (let i = 0; i < 7; i++) {
    const dayCol = `openingHours/${i}/day`;
    const hoursCol = `openingHours/${i}/hours`;
    
    if (row[dayCol] && row[hoursCol]) {
      const day = row[dayCol];
      const hours = row[hoursCol];
      
      if (dayMapping.hasOwnProperty(day) && hours !== 'Closed') {
        // Parse time format "9 AM to 10 PM" or "9:30 AM to 9:30 PM"
        const timeMatch = hours.match(/(\d{1,2}):?(\d{0,2})\s*(AM|PM)\s*to\s*(\d{1,2}):?(\d{0,2})\s*(AM|PM)/i);
        if (timeMatch) {
          let [, startHour, startMin = '00', startPeriod, endHour, endMin = '00', endPeriod] = timeMatch;
          
          // Convert to 24-hour format
          startHour = parseInt(startHour);
          endHour = parseInt(endHour);
          
          if (startPeriod.toUpperCase() === 'PM' && startHour !== 12) startHour += 12;
          if (startPeriod.toUpperCase() === 'AM' && startHour === 12) startHour = 0;
          if (endPeriod.toUpperCase() === 'PM' && endHour !== 12) endHour += 12;
          if (endPeriod.toUpperCase() === 'AM' && endHour === 12) endHour = 0;
          
          const openTime = `${startHour.toString().padStart(2, '0')}:${startMin.padStart(2, '0')}`;
          const closeTime = `${endHour.toString().padStart(2, '0')}:${endMin.padStart(2, '0')}`;
          
          workingHours[dayMapping[day]] = {
            isOpen: true,
            openTime,
            closeTime
          };
        }
      } else if (hours === 'Closed') {
        workingHours[dayMapping[day]] = {
          isOpen: false,
          openTime: '',
          closeTime: ''
        };
      }
    }
  }

  // Fill in missing days as closed
  for (let i = 0; i < 7; i++) {
    if (!workingHours[i]) {
      workingHours[i] = {
        isOpen: false,
        openTime: '',
        closeTime: ''
      };
    }
  }

  return workingHours;
}

function parsePhoneNumber(phoneStr) {
  if (!phoneStr || phoneStr === '') return null;
  
  // Handle scientific notation (e.g., 9.19E+11)
  if (phoneStr.includes('E+')) {
    const num = parseFloat(phoneStr);
    return num.toString();
  }
  
  // Clean up phone number
  return phoneStr.replace(/[^\d]/g, '');
}

function extractServices(categories) {
  const services = [];
  
  // Common service mappings from categories
  const serviceMapping = {
    'Copy shop': ['photocopying', 'document_printing'],
    'Digital printing service': ['digital_printing', 'document_printing', 'color_printing'],
    'Print shop': ['document_printing', 'business_cards'],
    'Bookbinder': ['binding_services'],
    'Graphic designer': ['design_services'],
    'Invitation printing service': ['invitation_printing', 'custom_printing'],
    'Lamination service': ['lamination'],
    'Screen printing shop': ['screen_printing', 'custom_printing'],
    'Stationery store': ['stationery_supply'],
    'Typing service': ['typing_services'],
    'Fax service': ['fax_services']
  };
  
  // Extract from all category columns
  for (let i = 0; i < 10; i++) {
    const category = categories[`categories/${i}`];
    if (category && serviceMapping[category]) {
      services.push(...serviceMapping[category]);
    }
  }
  
  // Add from categoryName
  if (categories.categoryName && serviceMapping[categories.categoryName]) {
    services.push(...serviceMapping[categories.categoryName]);
  }
  
  // Remove duplicates and return
  return [...new Set(services)];
}

async function importShops() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    const results = [];
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    // Read and parse CSV from root directory
    const csvStream = fs.createReadStream('../clean_shops.csv')
      .pipe(csv());

    const csvData = [];
    
    csvStream.on('data', (row) => {
      csvData.push(row);
    });

    csvStream.on('end', async () => {
      console.log(`📊 Found ${csvData.length} shops in CSV`);
      
      for (const row of csvData) {
        try {
          processedCount++;
          console.log(`\n🔄 Processing shop ${processedCount}/${csvData.length}: ${row.title}`);
          
          // Skip if permanently closed
          if (row.permanentlyClosed === 'TRUE') {
            console.log(`⚠️ Skipping permanently closed shop: ${row.title}`);
            continue;
          }

          // Extract and validate required data
          const shopName = row.title?.trim();
          if (!shopName) {
            console.log(`❌ Skipping shop with no name`);
            continue;
          }

          // Generate unique slug
          let slug = generateSlug(shopName);
          let counter = 0;
          while (await Shop.findOne({ where: { slug } })) {
            counter++;
            slug = generateSlug(shopName, counter);
          }

          // Parse phone number
          const phone = parsePhoneNumber(row.phoneUnformatted || row.phone);
          if (!phone || phone.length < 10) {
            console.log(`⚠️ Invalid phone number for ${shopName}, using generated number`);
          }

          const finalPhone = phone || `98765${String(processedCount).padStart(5, '0')}`;

          // Check if user already exists with this phone
          let user = await User.findOne({ where: { phone: finalPhone } });
          
          if (!user) {
            // Create shop owner user
            const ownerEmail = generateEmailFromShopName(shopName);
            const ownerName = generateOwnerName(shopName);
            
            user = await User.create({
              phone: finalPhone,
              name: ownerName,
              email: ownerEmail,
              passwordHash: await bcrypt.hash('printeasy123', 10),
              role: 'shop_owner',
              isActive: true
            });
            
            console.log(`👤 Created user: ${ownerName} (${finalPhone})`);
          }

          // Extract services from categories
          const services = extractServices(row);
          
          // Parse working hours
          const workingHours = parseWorkingHours(row);
          
          // Create complete address
          const completeAddress = `${row.address || ''}, ${row.city || ''}, ${row.state || ''} ${row.postalCode || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '');

          // Check if shop already exists
          const existingShop = await Shop.findOne({ where: { name: shopName, city: row.city } });
          if (existingShop) {
            console.log(`⚠️ Shop already exists: ${shopName} in ${row.city}`);
            continue;
          }

          // Create shop
          const shop = await Shop.create({
            ownerId: user.id,
            name: shopName,
            slug,
            address: row.address || '',
            city: row.city || '',
            state: row.state || '',
            pinCode: row.postalCode || '',
            phone: finalPhone,
            publicOwnerName: generateOwnerName(shopName),
            internalName: shopName,
            ownerFullName: user.name,
            email: user.email,
            ownerPhone: finalPhone,
            completeAddress,
            services,
            equipment: ['printer', 'scanner', 'photocopier'], // Default equipment
            workingHours,
            acceptsWalkinOrders: true,
            isOnline: true,
            autoAvailability: true,
            isApproved: true,
            isPublic: true,
            status: 'active',
            exteriorImage: row.imageUrl || null,
            googleMapsLink: row.url || null,
            totalOrders: 0
          });

          console.log(`✅ Created shop: ${shopName} (ID: ${shop.id}, Slug: ${slug})`);
          successCount++;
          
        } catch (error) {
          console.error(`❌ Error processing ${row.title}:`, error.message);
          errorCount++;
          
          // Continue processing other shops even if one fails
          continue;
        }
      }

      // Final summary
      console.log('\n' + '='.repeat(50));
      console.log('📊 IMPORT SUMMARY');
      console.log('='.repeat(50));
      console.log(`Total processed: ${processedCount}`);
      console.log(`✅ Successfully imported: ${successCount}`);
      console.log(`❌ Errors: ${errorCount}`);
      console.log(`📱 Active shops now available on PrintEasy QR platform`);
      
      process.exit(0);
    });

    csvStream.on('error', (error) => {
      console.error('❌ Error reading CSV:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importShops();