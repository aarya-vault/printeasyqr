import fs from 'fs';
import csv from 'csv-parser';
import bcrypt from 'bcrypt';
import { Sequelize, DataTypes, Op } from 'sequelize';

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
  owner_id: { type: DataTypes.INTEGER, allowNull: false },
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

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function importOneShop() {
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
            // Find a shop that doesn't already exist
            let shopData = null;
            let shopIndex = 0;
            
            for (let i = 0; i < results.length; i++) {
              const candidate = results[i];
              if (!candidate.title) continue;
              
              const slug = generateSlug(candidate.title);
              const email = `${slug}@printeasyqr.com`;
              
              // Check if user already exists (email or phone)
              let phone = '1234567890'; // default fallback
              
              // Try to get proper phone number from CSV data
              if (candidate.phone && candidate.phone.includes('+91')) {
                // Parse formatted phone like "+91 98983 97056"
                phone = candidate.phone.replace(/[^\d]/g, '').slice(-10);
              } else if (candidate.phoneUnformatted) {
                // Handle scientific notation like 9.20E+11
                const phoneNum = parseFloat(candidate.phoneUnformatted);
                if (!isNaN(phoneNum) && phoneNum > 1000000000) {
                  phone = Math.floor(phoneNum).toString().slice(-10);
                }
              }
              
              // Ensure 10 digits
              if (phone.length < 10) {
                phone = phone.padStart(10, '0');
              }
              
              const existingUser = await User.findOne({ 
                where: { 
                  [Op.or]: [{ email }, { phone }] 
                } 
              });
              if (!existingUser) {
                shopData = candidate;
                shopIndex = i;
                break;
              }
            }

            if (!shopData) {
              throw new Error('No new shops found to import');
            }

            console.log(`📊 Importing shop ${shopIndex + 1}: ${shopData.title}`);

            const slug = generateSlug(shopData.title);
            const email = `${slug}@printeasyqr.com`;
            let phone = '1234567890'; // default fallback
            
            // Try to get proper phone number from CSV data
            if (shopData.phone && shopData.phone.includes('+91')) {
              // Parse formatted phone like "+91 98983 97056"
              phone = shopData.phone.replace(/[^\d]/g, '').slice(-10);
            } else if (shopData.phoneUnformatted) {
              // Handle scientific notation like 9.20E+11
              const phoneNum = parseFloat(shopData.phoneUnformatted);
              if (!isNaN(phoneNum) && phoneNum > 1000000000) {
                phone = Math.floor(phoneNum).toString().slice(-10);
              }
            }
            
            // Ensure 10 digits
            if (phone.length < 10) {
              phone = phone.padStart(10, '0');
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

            console.log(`✅ Created user: ID ${user.id}, Email: ${user.email}`);

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

            console.log(`✅ Created shop: ID ${shop.id}, Name: ${shop.name}, Slug: ${shop.slug}`);
            console.log(`📍 Address: ${shop.address}`);
            console.log(`🏪 Services: ${JSON.stringify(shop.services)}`);
            console.log(`📞 Phone: ${shop.phone}`);
            console.log(`🌐 Google Maps: ${shop.google_maps_link}`);
            console.log(`🕐 Working Hours (Monday): ${JSON.stringify(workingHours.monday)}`);

            resolve({ user, shop });
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

importOneShop()
  .then(({ user, shop }) => {
    console.log('\n🎉 Single shop import successful!');
    console.log(`👤 User: ${user.name} (${user.email})`);
    console.log(`🏪 Shop: ${shop.name} (${shop.slug})`);
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Single shop import failed:', error);
    process.exit(1);
  });