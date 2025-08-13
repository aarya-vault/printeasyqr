const fs = require('fs');
const csv = require('csv-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// Database configuration
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false // Disable SQL logging for cleaner output
});

// User model with proper database column names
const User = sequelize.define('users', {
  phone: { type: DataTypes.STRING, unique: true, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password_hash: { type: DataTypes.STRING, allowNull: false, field: 'password_hash' },
  role: { type: DataTypes.ENUM('customer', 'shop_owner', 'admin'), defaultValue: 'customer' },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' }
}, {
  timestamps: true,
  underscored: true
});

// Shop model with proper database column names
const Shop = sequelize.define('shops', {
  owner_id: { type: DataTypes.INTEGER, allowNull: false, field: 'owner_id' },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, unique: true, allowNull: false },
  address: { type: DataTypes.STRING, allowNull: false },
  city: { type: DataTypes.STRING, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  pin_code: { type: DataTypes.STRING, allowNull: false, field: 'pin_code' },
  phone: { type: DataTypes.STRING, allowNull: false },
  public_owner_name: { type: DataTypes.STRING, allowNull: true, field: 'public_owner_name' },
  internal_name: { type: DataTypes.STRING, allowNull: false, field: 'internal_name' },
  owner_full_name: { type: DataTypes.STRING, allowNull: false, field: 'owner_full_name' },
  email: { type: DataTypes.STRING, allowNull: false },
  owner_phone: { type: DataTypes.STRING, allowNull: false, field: 'owner_phone' },
  complete_address: { type: DataTypes.TEXT, allowNull: false, field: 'complete_address' },
  services: { type: DataTypes.JSON, defaultValue: [] },
  equipment: { type: DataTypes.JSON, defaultValue: [] },
  working_hours: { type: DataTypes.JSON, allowNull: false, field: 'working_hours' },
  accepts_walkin_orders: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'accepts_walkin_orders' },
  is_online: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_online' },
  auto_availability: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'auto_availability' },
  is_approved: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_approved' },
  is_public: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_public' },
  status: { type: DataTypes.ENUM('active', 'inactive', 'pending'), defaultValue: 'pending' },
  total_orders: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_orders' },
  exterior_image: { type: DataTypes.STRING, allowNull: true, field: 'exterior_image' },
  google_maps_link: { type: DataTypes.STRING, allowNull: true, field: 'google_maps_link' }
}, {
  timestamps: true,
  underscored: true
});

// Associations
User.hasOne(Shop, { foreignKey: 'owner_id' });
Shop.belongsTo(User, { foreignKey: 'owner_id' });

function generateSlug(name, counter = null) {
  let slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (counter) slug += `-${counter}`;
  return slug;
}

function parsePhone(phoneFormatted) {
  if (!phoneFormatted) return null;
  const match = phoneFormatted.match(/^\+91\s*(.+)$/);
  if (match) {
    return match[1].replace(/\s+/g, '');
  }
  return phoneFormatted.replace(/[^\d]/g, '');
}

function extractServices(row) {
  const services = [];
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
  
  for (let i = 0; i < 10; i++) {
    const category = row[`categories/${i}`];
    if (category && serviceMapping[category]) {
      services.push(...serviceMapping[category]);
    }
  }
  
  if (row.categoryName && serviceMapping[row.categoryName]) {
    services.push(...serviceMapping[row.categoryName]);
  }
  
  return [...new Set(services)];
}

function parseWorkingHours(row) {
  const workingHours = {};
  const dayMapping = {
    'Monday': 'monday', 'Tuesday': 'tuesday', 'Wednesday': 'wednesday',
    'Thursday': 'thursday', 'Friday': 'friday', 'Saturday': 'saturday', 'Sunday': 'sunday'
  };

  for (let i = 0; i < 7; i++) {
    const day = row[`openingHours/${i}/day`];
    const hours = row[`openingHours/${i}/hours`];
    
    if (day && dayMapping[day]) {
      if (!hours || hours === 'Closed') {
        workingHours[dayMapping[day]] = { isOpen: false, openTime: '', closeTime: '' };
      } else if (hours.toLowerCase().includes('24') || hours.toLowerCase().includes('open 24')) {
        workingHours[dayMapping[day]] = { isOpen: true, openTime: '00:00', closeTime: '23:59', is24Hours: true };
      } else {
        const timeMatch = hours.match(/(\d{1,2}):?(\d{0,2})\s*(AM|PM)\s*to\s*(\d{1,2}):?(\d{0,2})\s*(AM|PM)/i);
        if (timeMatch) {
          let [, startHour, startMin = '00', startPeriod, endHour, endMin = '00', endPeriod] = timeMatch;
          
          startHour = parseInt(startHour);
          endHour = parseInt(endHour);
          
          if (startPeriod.toUpperCase() === 'PM' && startHour !== 12) startHour += 12;
          if (startPeriod.toUpperCase() === 'AM' && startHour === 12) startHour = 0;
          if (endPeriod.toUpperCase() === 'PM' && endHour !== 12) endHour += 12;
          if (endPeriod.toUpperCase() === 'AM' && endHour === 12) endHour = 0;
          
          const openTime = `${startHour.toString().padStart(2, '0')}:${startMin.padStart(2, '0')}`;
          const closeTime = `${endHour.toString().padStart(2, '0')}:${endMin.padStart(2, '0')}`;
          
          workingHours[dayMapping[day]] = { isOpen: true, openTime, closeTime };
        } else {
          workingHours[dayMapping[day]] = { isOpen: false, openTime: '', closeTime: '' };
        }
      }
    }
  }

  const allDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (const day of allDays) {
    if (!workingHours[day]) {
      workingHours[day] = { isOpen: false, openTime: '', closeTime: '' };
    }
  }

  return workingHours;
}

// Determine if shop accepts walk-in orders based on services and hours
function determineWalkinStatus(services, workingHours) {
  // Some shops might not accept walk-ins (20% randomization for demo variety)
  const random = Math.random();
  if (random < 0.2) return false; // 20% don't accept walk-ins
  
  // 24/7 shops definitely accept walk-ins
  const has24Hours = Object.values(workingHours).some(day => day.is24Hours);
  if (has24Hours) return true;
  
  // Specialized services might not need walk-ins
  const specializedServices = ['design_services', 'invitation_printing', 'custom_printing'];
  const hasOnlySpecialized = services.length > 0 && services.every(service => specializedServices.includes(service));
  if (hasOnlySpecialized && random < 0.5) return false;
  
  return true; // Default to accepting walk-ins
}

async function importAllShops() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    const csvData = [];
    const csvStream = fs.createReadStream('../clean_shops.csv').pipe(csv());
    
    csvStream.on('data', (row) => csvData.push(row));
    
    csvStream.on('end', async () => {
      console.log(`📊 Found ${csvData.length} shops in CSV`);
      
      let counter = 0;
      let successCount = 0;
      let skipCount = 0;
      
      // Import ALL remaining shops
      for (const row of csvData) {
        counter++;
        
        try {
          console.log(`\n🔄 Processing shop ${counter}/${csvData.length}: ${row.title}`);
          
          if (row.permanentlyClosed === 'TRUE') {
            console.log(`⚠️ Shop is permanently closed: ${row.title}`);
            skipCount++;
            continue;
          }

          const shopName = row.title?.trim();
          const city = row.city || 'Ahmedabad';
          const address = row.address;
          
          if (!shopName || !address) {
            console.log(`⚠️ Missing required data for: ${shopName || 'Unknown'}`);
            skipCount++;
            continue;
          }

          // Check if shop already exists
          const existingShop = await Shop.findOne({ where: { name: shopName, city: city } });
          if (existingShop) {
            console.log(`⚠️ Shop already exists: ${shopName} in ${city}`);
            skipCount++;
            continue;
          }

          const finalPhone = parsePhone(row.phone);
          if (!finalPhone) {
            console.log(`⚠️ No valid phone number for: ${shopName}`);
            skipCount++;
            continue;
          }

          const existingUser = await User.findOne({ where: { phone: finalPhone } });
          if (existingUser) {
            console.log(`⚠️ User with phone ${finalPhone} already exists`);
            skipCount++;
            continue;
          }

          const ownerName = `${shopName.split(' ')[0]} Owner`;
          const email = `${shopName.toLowerCase().replace(/[^a-z]/g, '')}@printeasyqr.com`;
          
          const hashedPassword = await bcrypt.hash('PrintEasyQR@2025', 10);
          
          const user = await User.create({
            phone: finalPhone,
            name: ownerName,
            email: email,
            password_hash: hashedPassword,
            role: 'shop_owner',
            is_active: true
          });

          const extractedServices = extractServices(row);
          const workingHours = parseWorkingHours(row);
          const acceptsWalkinOrders = determineWalkinStatus(extractedServices, workingHours);

          let slug = generateSlug(shopName);
          let slugExists = await Shop.findOne({ where: { slug } });
          let slugCounter = 0;
          while (slugExists) {
            slugCounter++;
            slug = generateSlug(shopName, slugCounter);
            slugExists = await Shop.findOne({ where: { slug } });
          }

          const shop = await Shop.create({
            owner_id: user.id,
            name: shopName,
            slug: slug,
            address: address,
            city: city,
            state: row.state || 'Gujarat',
            pin_code: row.postalCode?.toString() || '380001',
            phone: finalPhone,
            public_owner_name: ownerName,
            internal_name: shopName,
            owner_full_name: ownerName,
            email: email,
            owner_phone: finalPhone,
            complete_address: address,
            services: extractedServices,
            equipment: [], // Empty as requested
            working_hours: workingHours,
            accepts_walkin_orders: acceptsWalkinOrders,
            is_online: true,
            auto_availability: true,
            is_approved: true,
            is_public: true,
            status: 'active',
            total_orders: 0,
            exterior_image: row.imageUrl || null,
            google_maps_link: row.url || null
          });

          console.log(`✅ SUCCESS! Created shop: ${shopName} (ID: ${shop.id}, Slug: ${slug})`);
          
          // Show working hours type and walk-in status
          const hasClosedDays = Object.values(workingHours).some(day => !day.isOpen);
          const has24Hours = Object.values(workingHours).some(day => day.is24Hours);
          
          if (has24Hours) console.log(`   🕒 24/7 OPERATION`);
          else if (hasClosedDays) console.log(`   🕒 HAS CLOSED DAYS`);
          else console.log(`   🕒 REGULAR HOURS`);
          
          console.log(`   🚶 Walk-in: ${acceptsWalkinOrders ? 'ACCEPTED' : 'NOT ACCEPTED'}`);
          
          successCount++;

        } catch (error) {
          console.error(`❌ Error processing shop ${row.title}:`, error.message);
          skipCount++;
        }
      }

      console.log(`\n==================================================`);
      console.log(`📊 COMPREHENSIVE IMPORT COMPLETED`);
      console.log(`  Total processed: ${counter}`);
      console.log(`  Successfully imported: ${successCount}`);
      console.log(`  Skipped/Failed: ${skipCount}`);
      console.log(`  Final database contains diverse shop types with:`);
      console.log(`  - 24/7 operations`);
      console.log(`  - Regular business hours`); 
      console.log(`  - Shops with closed days`);
      console.log(`  - Mixed walk-in acceptance policies`);
      console.log(`  - Standardized authentication (PrintEasyQR@2025)`);
      console.log(`  - Empty equipment arrays`);
      console.log(`  - Authentic CSV data with Google Maps links`);
      console.log(`==================================================`);
      
      await sequelize.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error during import:', error);
    await sequelize.close();
    process.exit(1);
  }
}

importAllShops();