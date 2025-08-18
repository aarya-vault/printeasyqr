import fs from 'fs';
import csv from 'csv-parser';
import bcrypt from 'bcrypt';
import { Sequelize, DataTypes } from 'sequelize';

const sequelize = new Sequelize(process.env.DATABASE_URL, { dialect: 'postgres', logging: false });

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  phone: { type: DataTypes.STRING, allowNull: false },
  password_hash: { type: DataTypes.STRING, allowNull: true },
  role: { type: DataTypes.ENUM('customer', 'shop_owner', 'admin'), allowNull: false, defaultValue: 'customer' },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'users', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

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
}, { tableName: 'shops', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

function extractPhoneNumber(phoneFormatted, phoneUnformatted) {
  // Try phoneUnformatted first (scientific notation)
  if (phoneUnformatted && !isNaN(parseFloat(phoneUnformatted))) {
    const phoneNum = parseFloat(phoneUnformatted);
    if (phoneNum > 1000000000 && phoneNum < 99999999999) {
      return Math.floor(phoneNum).toString().slice(-10);
    }
  }
  
  // Try formatted phone
  if (phoneFormatted && phoneFormatted.includes('+91')) {
    const cleaned = phoneFormatted.replace(/[^\d]/g, '');
    if (cleaned.length >= 10) {
      return cleaned.slice(-10);
    }
  }
  
  return null;
}

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

async function fixPhoneNumbers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const csvData = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream('clean_shops.csv')
        .pipe(csv())
        .on('data', (row) => {
          csvData.push(row);
        })
        .on('end', async () => {
          try {
            console.log(`📊 Found ${csvData.length} shops in CSV`);
            
            let successCount = 0;
            let errorCount = 0;
            let noPhoneCount = 0;
            
            // Create mapping of shop names to phone numbers
            for (const csvRow of csvData) {
              if (!csvRow.title) continue;
              
              const shopName = csvRow.title.trim();
              const slug = generateSlug(shopName);
              
              // Extract phone number
              const extractedPhone = extractPhoneNumber(csvRow.phone, csvRow.phoneUnformatted);
              
              if (!extractedPhone) {
                console.log(`⚠️  No valid phone found for: ${shopName}`);
                noPhoneCount++;
                continue;
              }
              
              try {
                // Find existing shop by name or slug
                const existingShop = await Shop.findOne({ 
                  where: { 
                    name: shopName
                  },
                  include: [{ model: User, as: 'Owner' }]
                });
                
                if (existingShop) {
                  // Update shop phone numbers
                  await Shop.update(
                    { 
                      phone: extractedPhone,
                      owner_phone: extractedPhone 
                    },
                    { where: { id: existingShop.id } }
                  );
                  
                  // Update user phone number
                  await User.update(
                    { phone: extractedPhone },
                    { where: { id: existingShop.owner_id } }
                  );
                  
                  console.log(`✅ Updated ${shopName}: ${extractedPhone}`);
                  successCount++;
                } else {
                  console.log(`⚠️  Shop not found: ${shopName}`);
                }
              } catch (error) {
                console.error(`❌ Error updating ${shopName}:`, error.message);
                errorCount++;
              }
            }
            
            console.log('\n🎉 Phone number fix completed!');
            console.log(`✅ Successfully updated: ${successCount} shops`);
            console.log(`⚠️  No phone data: ${noPhoneCount} shops`);
            console.log(`❌ Errors: ${errorCount} shops`);
            
            resolve({ successCount, noPhoneCount, errorCount });

          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

fixPhoneNumbers()
  .then(({ successCount, noPhoneCount, errorCount }) => {
    console.log(`\n📊 Final Results:`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`⚠️  No phone: ${noPhoneCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Phone fix failed:', error);
    process.exit(1);
  });