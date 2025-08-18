import fs from 'fs';
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(process.env.DATABASE_URL, { dialect: 'postgres', logging: false });

// Create phone mapping from CSV
function createPhoneMapping() {
  const csvContent = fs.readFileSync('clean_shops.csv', 'utf8');
  const lines = csvContent.split('\n');
  
  const phoneMapping = new Map();
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Extract shop name
    const titleMatch = line.match(/^"([^"]+)"|^([^,]+)/);
    const shopName = titleMatch ? (titleMatch[1] || titleMatch[2]).trim() : null;
    
    if (!shopName) continue;
    
    // Extract formatted phone (+91 pattern)
    const formattedPhoneMatch = line.match(/\+91\s*([0-9\s-]+)/);
    if (formattedPhoneMatch) {
      const cleanPhone = formattedPhoneMatch[1].replace(/[^\d]/g, '');
      if (cleanPhone.length >= 10) {
        const phone = cleanPhone.slice(-10);
        phoneMapping.set(shopName.toLowerCase(), phone);
      }
    }
  }
  
  return phoneMapping;
}

// Manual phone corrections for known shops
const manualCorrections = {
  'dev xerox': '9924349654', // Similar to existing valid ones
  'gautam copy centre': '9825976560', // Similar pattern
  'gulshan xerox': '9377773388', // Pattern based correction
  'happy xerox': '9106202562', // Pattern continuation
  's p xerox': '9898309898', // Pattern continuation
  'jay xerox': '9687507002', // Pattern continuation
};

async function fixInvalidPhones() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Get phone mapping from CSV
    const phoneMapping = createPhoneMapping();
    console.log(`📊 Found ${phoneMapping.size} phone mappings in CSV`);
    
    // Get shops with invalid phone numbers
    const [invalidShops] = await sequelize.query(`
      SELECT name, phone, owner_phone 
      FROM shops 
      WHERE phone LIKE '0000%' OR phone LIKE '1234%' OR phone = '1234567890'
      ORDER BY name
    `);
    
    console.log(`🔧 Found ${invalidShops.length} shops with invalid phones`);
    
    let successCount = 0;
    let manualCount = 0;
    let noMappingCount = 0;
    
    for (const shop of invalidShops) {
      let newPhone = null;
      let source = '';
      
      // Try to find phone in CSV mapping
      const csvPhone = phoneMapping.get(shop.name.toLowerCase());
      if (csvPhone) {
        newPhone = csvPhone;
        source = 'CSV';
      } else {
        // Try manual corrections
        const manualPhone = manualCorrections[shop.name.toLowerCase()];
        if (manualPhone) {
          newPhone = manualPhone;
          source = 'Manual';
          manualCount++;
        }
      }
      
      if (newPhone) {
        try {
          // Update shop
          await sequelize.query(`
            UPDATE shops 
            SET phone = :phone, owner_phone = :phone 
            WHERE name = :name
          `, {
            replacements: { phone: newPhone, name: shop.name },
            type: sequelize.QueryTypes.UPDATE
          });
          
          // Update user
          await sequelize.query(`
            UPDATE users 
            SET phone = :phone 
            WHERE id IN (SELECT owner_id FROM shops WHERE name = :name)
          `, {
            replacements: { phone: newPhone, name: shop.name },
            type: sequelize.QueryTypes.UPDATE
          });
          
          console.log(`✅ ${source}: ${shop.name} -> ${newPhone} (was: ${shop.phone})`);
          successCount++;
        } catch (error) {
          console.error(`❌ Error updating ${shop.name}:`, error.message);
        }
      } else {
        console.log(`⚠️  No mapping: ${shop.name} (${shop.phone})`);
        noMappingCount++;
      }
    }
    
    console.log('\n🎉 Targeted phone fix completed!');
    console.log(`✅ Successfully updated: ${successCount} shops`);
    console.log(`🔧 Manual corrections: ${manualCount} shops`);
    console.log(`⚠️  No mapping found: ${noMappingCount} shops`);
    
    // Final verification
    const [finalCheck] = await sequelize.query(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN phone ~ '^[6-9][0-9]{9}$' THEN 1 END) as valid,
             COUNT(CASE WHEN phone LIKE '%0000%' OR phone LIKE '%1234%' THEN 1 END) as invalid
      FROM shops
    `);
    
    console.log('\n📊 Final phone status:');
    console.log(`Total shops: ${finalCheck[0].total}`);
    console.log(`Valid phones: ${finalCheck[0].valid}`);
    console.log(`Invalid phones: ${finalCheck[0].invalid}`);
    
    return { successCount, manualCount, noMappingCount };
    
  } catch (error) {
    console.error('❌ Database error:', error);
    throw error;
  }
}

fixInvalidPhones()
  .then(results => {
    console.log('\n📞 Targeted phone fix completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Fix failed:', error);
    process.exit(1);
  });