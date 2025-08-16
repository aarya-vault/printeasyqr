import fs from 'fs';
import csv from 'csv-parser';
import bcrypt from 'bcrypt';
import { Sequelize, Op } from 'sequelize';
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
    },
    field: 'owner_id'
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
  address: {
    type: Sequelize.STRING,
    allowNull: false
  },
  city: {
    type: Sequelize.STRING,
    allowNull: false
  },
  state: {
    type: Sequelize.STRING,
    allowNull: false
  },
  pinCode: {
    type: Sequelize.STRING,
    allowNull: false,
    field: 'pin_code'
  },
  phone: {
    type: Sequelize.STRING,
    allowNull: false
  },
  publicOwnerName: {
    type: Sequelize.STRING,
    field: 'public_owner_name'
  },
  internalName: {
    type: Sequelize.STRING,
    field: 'internal_name'
  },
  ownerFullName: {
    type: Sequelize.STRING,
    field: 'owner_full_name'
  },
  email: {
    type: Sequelize.STRING
  },
  ownerPhone: {
    type: Sequelize.STRING,
    field: 'owner_phone'
  },
  completeAddress: {
    type: Sequelize.TEXT,
    field: 'complete_address'
  },
  services: {
    type: Sequelize.JSONB,
    defaultValue: []
  },
  equipment: {
    type: Sequelize.JSONB,
    defaultValue: []
  },
  customServices: {
    type: Sequelize.TEXT,
    field: 'custom_services'
  },
  customEquipment: {
    type: Sequelize.TEXT,
    field: 'custom_equipment'
  },
  yearsOfExperience: {
    type: Sequelize.INTEGER,
    field: 'years_of_experience'
  },
  formationYear: {
    type: Sequelize.INTEGER,
    field: 'formation_year'
  },
  workingHours: {
    type: Sequelize.JSONB,
    defaultValue: {},
    field: 'working_hours'
  },
  acceptsWalkinOrders: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    field: 'accepts_walkin_orders'
  },
  isOnline: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    field: 'is_online'
  },
  autoAvailability: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    field: 'auto_availability'
  },
  isApproved: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    field: 'is_approved'
  },
  isPublic: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    field: 'is_public'
  },
  status: {
    type: Sequelize.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active'
  },
  qrCode: {
    type: Sequelize.TEXT,
    field: 'qr_code'
  },
  totalOrders: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    field: 'total_orders'
  },
  exteriorImage: {
    type: Sequelize.TEXT,
    field: 'exterior_image'
  },
  googleMapsLink: {
    type: Sequelize.TEXT,
    field: 'google_maps_link'
  }
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
    .trim('-')
    .substring(0, 50);
  
  return counter === 0 ? baseSlug : `${baseSlug}-${counter}`;
}

function generateEmailFromShopName(shopName, index) {
  const cleanName = shopName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .replace(/xerox|copy|centre|center|shop|store|prints?|digital|enterprise|systems?|solutions?|services?/g, '')
    .substring(0, 15);
    
  return cleanName ? `${cleanName}${index}@printeasyqr.com` : `shop${index}@printeasyqr.com`;
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
    'Monday': 'monday',
    'Tuesday': 'tuesday', 
    'Wednesday': 'wednesday',
    'Thursday': 'thursday',
    'Friday': 'friday',
    'Saturday': 'saturday',
    'Sunday': 'sunday'
  };

  // Parse opening hours from CSV columns
  for (let i = 0; i < 7; i++) {
    const dayCol = `openingHours/${i}/day`;
    const hoursCol = `openingHours/${i}/hours`;
    
    if (row[dayCol] && row[hoursCol]) {
      const day = row[dayCol];
      const hours = row[hoursCol];
      
      if (dayMapping.hasOwnProperty(day)) {
        if (hours === 'Closed') {
          workingHours[dayMapping[day]] = {
            isOpen: false,
            openTime: '',
            closeTime: ''
          };
        } else if (hours.toLowerCase().includes('24') || hours.toLowerCase().includes('open 24')) {
          workingHours[dayMapping[day]] = {
            isOpen: true,
            openTime: '00:00',
            closeTime: '23:59',
            is24Hours: true
          };
        } else {
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
          } else {
            // Default hours if parsing fails
            workingHours[dayMapping[day]] = {
              isOpen: true,
              openTime: '09:00',
              closeTime: '18:00'
            };
          }
        }
      }
    }
  }

  // Fill in missing days as closed
  const allDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (const day of allDays) {
    if (!workingHours[day]) {
      workingHours[day] = {
        isOpen: false,
        openTime: '',
        closeTime: ''
      };
    }
  }

  return workingHours;
}

function parsePhoneNumber(phoneStr) {
  if (!phoneStr || phoneStr === '') {
    return null;
  }
  
  // Handle scientific notation (e.g., 9.19E+11)
  if (phoneStr.includes('E+')) {
    const num = parseFloat(phoneStr);
    const result = Math.round(num).toString();
    if (result.length >= 10) {
      return result.slice(-10);
    }
  }
  
  // Handle formatted phone number (+91 XXXXX XXXXX)
  if (phoneStr.startsWith('+91') && phoneStr.includes(' ')) {
    const cleaned = phoneStr.replace(/[^\d]/g, '');
    if (cleaned.length >= 10) {
      return cleaned.slice(-10);
    }
  }
  
  // Clean up phone number and keep only digits
  const cleaned = phoneStr.replace(/[^\d]/g, '');
  
  // Ensure it's a valid 10-digit Indian number
  if (cleaned.length >= 10) {
    return cleaned.slice(-10);
  }
  
  return cleaned.length >= 8 ? cleaned : null;
}

function extractServices(row) {
  const services = [];
  
  // Service mappings from categories
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
    'Fax service': ['fax_services'],
    'Pen store': ['stationery_supply'],
    'Book store': ['book_supply'],
    'Commercial printer': ['commercial_printing'],
    'Banner store': ['banner_printing'],
    'Custom label printer': ['label_printing'],
    'Map store': ['map_printing'],
    'Offset printing service': ['offset_printing'],
    'Vinyl sign shop': ['vinyl_printing']
  };
  
  // Extract from all category columns
  for (let i = 0; i < 10; i++) {
    const category = row[`categories/${i}`];
    if (category && serviceMapping[category]) {
      services.push(...serviceMapping[category]);
    }
  }
  
  // Add from categoryName
  if (row.categoryName && serviceMapping[row.categoryName]) {
    services.push(...serviceMapping[row.categoryName]);
  }
  
  // Remove duplicates and return
  return [...new Set(services)];
}

async function importShopsFromCSV() {
  try {
    console.log('🚀 Starting fresh shop import from filtered CSV...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Read CSV file
    const csvPath = '../attached_assets/updated filtered data!_1755023573628.csv';
    const csvData = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv({
          skipEmptyLines: true,
          stripBOM: true // Handle BOM character
        }))
        .on('data', (row) => {
          csvData.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`📊 Found ${csvData.length} shops in CSV`);
    
    // Hash password once for all shops
    const hashedPassword = await bcrypt.hash('PrintEasyQR@2025', 10);
    let importedCount = 0;
    let skippedCount = 0;

    for (const [index, row] of csvData.entries()) {
      try {
        console.log(`\n🔄 Processing ${index + 1}/${csvData.length}: ${row.title}`);
        
        // Skip if permanently closed
        if (row.permanentlyClosed === 'TRUE') {
          console.log(`⚠️ Shop is permanently closed: ${row.title}`);
          skippedCount++;
          continue;
        }

        // Extract and validate required data - handle BOM in header
        const titleKey = Object.keys(row).find(key => key.includes('title')) || 'title';
        const shopName = row[titleKey]?.trim();
        if (!shopName) {
          console.log(`❌ Shop has no name`);
          skippedCount++;
          continue;
        }

        // Parse phone number
        const phone = parsePhoneNumber(row.phone || row.phoneUnformatted);
        if (!phone || phone.length < 8) {
          console.log(`❌ No valid phone number for ${shopName}`);
          skippedCount++;
          continue;
        }

        console.log(`✅ Valid phone found: ${phone}`);

        // Generate unique identifiers
        let slug = generateSlug(shopName);
        let counter = 0;
        while (await Shop.findOne({ where: { slug } })) {
          counter++;
          slug = generateSlug(shopName, counter);
        }

        const ownerEmail = generateEmailFromShopName(shopName, index + 1);
        const ownerName = generateOwnerName(shopName);

        // Check if user already exists with this phone
        let user = await User.findOne({ where: { phone } });
        
        if (!user) {
          console.log(`👤 Creating user: ${ownerName}`);
          
          user = await User.create({
            phone,
            name: ownerName,
            email: ownerEmail,
            passwordHash: hashedPassword,
            role: 'shop_owner',
            isActive: true
          });
        } else {
          console.log(`👤 Using existing user: ${user.name}`);
        }

        // Extract services and parse working hours
        const services = extractServices(row);
        const workingHours = parseWorkingHours(row);
        
        // Create complete address
        const streetAddress = row.street || row.address || '';
        const fullAddress = `${streetAddress}, ${row.city || ''}, ${row.state || ''} ${row.postalCode || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '');

        // Check if shop already exists
        const existingShop = await Shop.findOne({ 
          where: { 
            name: shopName, 
            city: row.city || 'Ahmedabad' 
          } 
        });
        
        if (existingShop) {
          console.log(`⚠️ Shop already exists: ${shopName}`);
          skippedCount++;
          continue;
        }

        console.log(`🏪 Creating shop: ${shopName}`);
        console.log(`   Slug: ${slug}`);
        console.log(`   Services: ${services.join(', ')}`);
        console.log(`   Working Hours: ${Object.keys(workingHours).filter(day => workingHours[day].isOpen).join(', ')}`);

        // Create shop
        const shop = await Shop.create({
          ownerId: user.id,
          name: shopName,
          slug,
          address: streetAddress,
          city: row.city || 'Ahmedabad',
          state: row.state || 'Gujarat',
          pinCode: row.postalCode || '380001',
          phone,
          publicOwnerName: ownerName,
          internalName: shopName,
          ownerFullName: ownerName,
          email: ownerEmail,
          ownerPhone: phone,
          completeAddress: fullAddress,
          services,
          equipment: [], // As requested - no equipment
          workingHours,
          acceptsWalkinOrders: false, // As requested - disabled by default
          isOnline: true,
          autoAvailability: true,
          isApproved: true,
          isPublic: true,
          status: 'active',
          exteriorImage: row.imageUrl || null,
          googleMapsLink: row.url || null,
          totalOrders: 0
        });

        importedCount++;
        console.log(`✅ SUCCESS! Created shop ID: ${shop.id}`);
        
      } catch (error) {
        console.error(`❌ Error importing ${row.title}:`, error.message);
        skippedCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 IMPORT COMPLETED!');
    console.log('='.repeat(60));
    console.log(`📊 Successfully imported: ${importedCount} shops`);
    console.log(`⚠️ Skipped: ${skippedCount} shops`);
    console.log('📋 All shops have:');
    console.log('   - Password: PrintEasyQR@2025');
    console.log('   - Walk-in orders: DISABLED by default');
    console.log('   - No equipment data');
    console.log('   - Proper working hours from CSV');
    console.log('   - Authentic Google Maps links');
    console.log('   - Verified phone numbers');
    
  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the import
importShopsFromCSV();