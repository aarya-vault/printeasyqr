import fs from 'fs';
import csv from 'csv-parser';
import bcrypt from 'bcrypt';
import { Sequelize, DataTypes } from 'sequelize';

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

// Define User model
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  phone: { type: DataTypes.STRING, allowNull: false },
  password_hash: { type: DataTypes.STRING, allowNull: true },
  role: { type: DataTypes.ENUM('customer', 'shop_owner', 'admin'), allowNull: false, defaultValue: 'customer' },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define Shop model
const Shop = sequelize.define('Shop', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  owner_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }},
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  address: DataTypes.TEXT,
  city: DataTypes.STRING,
  state: DataTypes.STRING,
  pin_code: DataTypes.STRING,
  phone: DataTypes.STRING,
  email: DataTypes.STRING,
  complete_address: DataTypes.TEXT,
  services: DataTypes.JSONB,
  equipment: DataTypes.JSONB,
  working_hours: DataTypes.JSONB,
  accepts_walkin_orders: { type: DataTypes.BOOLEAN, defaultValue: true },
  is_online: { type: DataTypes.BOOLEAN, defaultValue: true },
  auto_availability: { type: DataTypes.BOOLEAN, defaultValue: true },
  is_approved: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_public: { type: DataTypes.BOOLEAN, defaultValue: true },
  status: DataTypes.STRING,
  total_orders: { type: DataTypes.INTEGER, defaultValue: 0 },
  google_maps_link: DataTypes.TEXT,
  public_owner_name: DataTypes.STRING,
  owner_full_name: DataTypes.STRING,
  owner_phone: DataTypes.STRING
}, {
  tableName: 'shops',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

function parseWorkingHours(row) {
  const workingHours = {};
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  for (let i = 0; i < 7; i++) {
    const dayKey = `openingHours/${i}/day`;
    const hoursKey = `openingHours/${i}/hours`;
    
    if (row[dayKey] && row[hoursKey]) {
      const day = row[dayKey].toLowerCase();
      const hours = row[hoursKey];
      
      if (hours === 'Closed') {
        workingHours[day] = { closed: true, open: '', close: '', is24Hours: false };
      } else {
        const timeMatch = hours.match(/(\d{1,2}(?::\d{2})?)\s*(AM|PM)?\s*to\s*(\d{1,2}(?::\d{2})?)\s*(AM|PM)/i);
        if (timeMatch) {
          let [, openTime, openPeriod, closeTime, closePeriod] = timeMatch;
          
          const convertTo24Hour = (time, period) => {
            let [hours, minutes = '00'] = time.split(':');
            hours = parseInt(hours);
            
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            
            return `${hours.toString().padStart(2, '0')}:${minutes}`;
          };
          
          workingHours[day] = {
            closed: false,
            open: convertTo24Hour(openTime, openPeriod || (parseInt(openTime) < 8 ? 'PM' : 'AM')),
            close: convertTo24Hour(closeTime, closePeriod),
            is24Hours: false
          };
        } else {
          workingHours[day] = { closed: false, open: '09:00', close: '18:00', is24Hours: false };
        }
      }
    } else {
      workingHours[day] = { closed: false, open: '09:00', close: '18:00', is24Hours: false };
    }
  }
  
  return workingHours;
}

function parseServices(row) {
  const services = [];
  const categoryColumns = [
    'categories/0', 'categories/1', 'categories/2', 'categories/3', 
    'categories/4', 'categories/5', 'categories/6', 'categories/7', 
    'categories/8', 'categories/9', 'categoryName'
  ];
  
  categoryColumns.forEach(col => {
    if (row[col] && row[col].trim()) {
      const service = row[col].trim();
      if (!services.includes(service)) {
        services.push(service);
      }
    }
  });
  
  return services.length > 0 ? services : ['Print shop'];
}

function generateSlug(name, index = 0) {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  if (index > 0) {
    slug += `-${index}`;
  }
  
  return slug;
}

function generateUniquePhone(basePhone, index) {
  // Clean phone number
  let phone = basePhone.toString().replace(/[^\d]/g, '');
  
  // Ensure 10 digits minimum
  if (phone.length < 10) {
    phone = phone.padStart(10, '0');
  } else if (phone.length > 10) {
    phone = phone.slice(-10);
  }
  
  // Add unique suffix if needed
  if (index > 0) {
    phone = phone.slice(0, 7) + index.toString().padStart(3, '0');
  }
  
  return phone;
}

async function fullImport() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const results = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream('clean_shops.csv')
        .pipe(csv())
        .on('data', (row) => {
          results.push(row);
        })
        .on('end', async () => {
          try {
            console.log(`📊 Found ${results.length} shops to import`);
            
            const importResults = {
              success: 0,
              failed: 0,
              errors: []
            };

            for (let i = 0; i < results.length; i++) {
              const shopData = results[i];
              
              try {
                if (!shopData.title || !shopData.title.trim()) {
                  console.log(`⏭️  Skipping row ${i}: No title`);
                  continue;
                }

                console.log(`\n📍 Processing shop ${i + 1}/${results.length}: ${shopData.title}`);

                // Generate unique identifiers
                const baseSlug = generateSlug(shopData.title);
                let slug = baseSlug;
                let slugIndex = 0;
                
                // Check for slug uniqueness
                while (await Shop.findOne({ where: { slug } })) {
                  slugIndex++;
                  slug = generateSlug(shopData.title, slugIndex);
                }

                const email = `${slug}@printeasyqr.com`;
                const basePhone = shopData.phoneUnformatted || shopData.phone || '1234567890';
                let phone = generateUniquePhone(basePhone, 0);
                let phoneIndex = 0;

                // Check for phone uniqueness
                while (await User.findOne({ where: { phone } })) {
                  phoneIndex++;
                  phone = generateUniquePhone(basePhone, phoneIndex);
                }

                // Check for email uniqueness
                if (await User.findOne({ where: { email } })) {
                  console.log(`⚠️  Email ${email} already exists, skipping shop: ${shopData.title}`);
                  continue;
                }

                // Create user
                const hashedPassword = await bcrypt.hash('password123', 10);
                const user = await User.create({
                  name: shopData.title + ' Owner',
                  email: email,
                  phone: phone,
                  password_hash: hashedPassword,
                  role: 'shop_owner',
                  is_active: true
                });

                console.log(`✅ Created user: ${user.id} (${user.email})`);

                // Parse shop data
                const workingHours = parseWorkingHours(shopData);
                const services = parseServices(shopData);

                // Create shop
                const shop = await Shop.create({
                  owner_id: user.id,
                  name: shopData.title,
                  slug: slug,
                  address: shopData.address || '',
                  city: shopData.city || 'Ahmedabad',
                  state: shopData.state || 'Gujarat',
                  pin_code: shopData.postalCode || '380001',
                  phone: phone,
                  email: email,
                  complete_address: shopData.address || '',
                  services: services,
                  equipment: [],
                  working_hours: workingHours,
                  accepts_walkin_orders: true,
                  is_online: true,
                  auto_availability: true,
                  is_approved: true,
                  is_public: true,
                  status: 'active',
                  total_orders: 0,
                  google_maps_link: shopData.url || '',
                  public_owner_name: shopData.title + ' Owner',
                  owner_full_name: shopData.title + ' Owner',
                  owner_phone: phone
                });

                console.log(`✅ Created shop: ${shop.id} (${shop.name}) - Slug: ${shop.slug}`);
                importResults.success++;

              } catch (error) {
                console.error(`❌ Failed to import shop ${shopData.title}:`, error.message);
                importResults.failed++;
                importResults.errors.push({
                  shop: shopData.title,
                  error: error.message
                });
              }
            }

            console.log(`\n🎉 Import completed!`);
            console.log(`✅ Successful: ${importResults.success}`);
            console.log(`❌ Failed: ${importResults.failed}`);
            
            if (importResults.errors.length > 0) {
              console.log('\n❌ Errors:');
              importResults.errors.forEach(err => {
                console.log(`  - ${err.shop}: ${err.error}`);
              });
            }

            resolve(importResults);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

fullImport()
  .then((results) => {
    console.log(`\n🏁 Final Results: ${results.success} successful, ${results.failed} failed`);
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Full import failed:', error);
    process.exit(1);
  });