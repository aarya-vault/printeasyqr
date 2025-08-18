import fs from 'fs';
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(process.env.DATABASE_URL, { dialect: 'postgres', logging: false });

// Extract phones from CSV using regex patterns
function extractAllPhoneData() {
  const csvContent = fs.readFileSync('clean_shops.csv', 'utf8');
  const lines = csvContent.split('\n');
  
  const phoneData = [];
  
  for (let i = 1; i < lines.length; i++) { // Skip header
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Extract shop name (first field, handle quoted names)
    const titleMatch = line.match(/^"([^"]+)"|^([^,]+)/);
    const shopName = titleMatch ? (titleMatch[1] || titleMatch[2]).trim() : null;
    
    if (!shopName) continue;
    
    // Extract phone numbers using different patterns
    let extractedPhone = null;
    
    // Pattern 1: +91 formatted phones
    const formattedPhoneMatch = line.match(/\+91\s*([0-9\s-]+)/);
    if (formattedPhoneMatch) {
      const cleanPhone = formattedPhoneMatch[1].replace(/[^\d]/g, '');
      if (cleanPhone.length >= 10) {
        extractedPhone = cleanPhone.slice(-10);
      }
    }
    
    // Pattern 2: Scientific notation (9.19E+11 format)
    const scientificMatch = line.match(/9\.[0-9]+E\+11/);
    if (!extractedPhone && scientificMatch) {
      const scientificNumber = parseFloat(scientificMatch[0]);
      if (scientificNumber > 9000000000 && scientificNumber < 99999999999) {
        extractedPhone = Math.floor(scientificNumber).toString().slice(-10);
      }
    }
    
    // Pattern 3: Direct 10-digit numbers
    const directPhoneMatch = line.match(/[^0-9]([6-9][0-9]{9})[^0-9]/);
    if (!extractedPhone && directPhoneMatch) {
      extractedPhone = directPhoneMatch[1];
    }
    
    phoneData.push({
      shopName,
      phone: extractedPhone,
      lineNumber: i
    });
  }
  
  return phoneData;
}

async function updatePhoneNumbers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    const phoneData = extractAllPhoneData();
    console.log(`📊 Processed ${phoneData.length} shops from CSV`);
    
    let successCount = 0;
    let noPhoneCount = 0;
    let notFoundCount = 0;
    
    for (const { shopName, phone } of phoneData) {
      if (!phone) {
        console.log(`⚠️  No phone: ${shopName}`);
        noPhoneCount++;
        continue;
      }
      
      try {
        // Update shop phone numbers
        const [shopUpdated] = await sequelize.query(`
          UPDATE shops 
          SET phone = :phone, owner_phone = :phone 
          WHERE name = :shopName
        `, {
          replacements: { phone, shopName },
          type: sequelize.QueryTypes.UPDATE
        });
        
        if (shopUpdated > 0) {
          // Update corresponding user phone
          await sequelize.query(`
            UPDATE users 
            SET phone = :phone 
            WHERE id IN (SELECT owner_id FROM shops WHERE name = :shopName)
          `, {
            replacements: { phone, shopName },
            type: sequelize.QueryTypes.UPDATE
          });
          
          console.log(`✅ Updated ${shopName}: ${phone}`);
          successCount++;
        } else {
          console.log(`⚠️  Not found in DB: ${shopName}`);
          notFoundCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating ${shopName}:`, error.message);
      }
    }
    
    console.log('\n🎉 Phone number update completed!');
    console.log(`✅ Successfully updated: ${successCount} shops`);
    console.log(`⚠️  No phone data found: ${noPhoneCount} shops`);
    console.log(`⚠️  Shop not found in DB: ${notFoundCount} shops`);
    
    // Verification query
    const [results] = await sequelize.query(`
      SELECT COUNT(*) as total_shops,
             COUNT(CASE WHEN phone ~ '^[6-9][0-9]{9}$' THEN 1 END) as valid_phones,
             COUNT(CASE WHEN phone LIKE '%0000%' OR phone LIKE '%1234%' THEN 1 END) as placeholder_phones
      FROM shops
    `);
    
    console.log('\n📊 Database phone status:');
    console.log(`Total shops: ${results[0].total_shops}`);
    console.log(`Valid phones: ${results[0].valid_phones}`);
    console.log(`Placeholder phones: ${results[0].placeholder_phones}`);
    
    return { successCount, noPhoneCount, notFoundCount };
    
  } catch (error) {
    console.error('❌ Database error:', error);
    throw error;
  }
}

updatePhoneNumbers()
  .then(results => {
    console.log('\n📞 Phone fix process completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Process failed:', error);
    process.exit(1);
  });