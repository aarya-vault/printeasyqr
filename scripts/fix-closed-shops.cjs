const { Sequelize, DataTypes } = require('sequelize');

// Database configuration
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

// Shop model
const Shop = sequelize.define('shops', {
  name: { type: DataTypes.STRING, allowNull: false },
  working_hours: { type: DataTypes.JSON, allowNull: false, field: 'working_hours' }
}, {
  timestamps: true,
  underscored: true
});

// Standard working hours template
const getStandardWorkingHours = () => ({
  monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
  tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
  wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
  thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
  friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
  saturday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
  sunday: { isOpen: false, openTime: '', closeTime: '' }
});

async function fixClosedShops() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Find shops where ALL days are closed
    const allShops = await Shop.findAll();
    let fixedCount = 0;
    let totalProblematic = 0;

    console.log(`📊 Checking ${allShops.length} shops for working hours issues...`);

    for (const shop of allShops) {
      const workingHours = shop.working_hours;
      
      // Check if all days are closed
      const allDaysClosed = Object.values(workingHours).every(day => 
        day && typeof day === 'object' && day.isOpen === false
      );

      // Check if working hours are malformed or empty
      const malformed = !workingHours || 
        typeof workingHours !== 'object' || 
        Object.keys(workingHours).length === 0;

      if (allDaysClosed || malformed) {
        totalProblematic++;
        console.log(`🔧 Fixing shop: ${shop.name}`);
        
        // Update with standard working hours
        await shop.update({
          working_hours: getStandardWorkingHours()
        });
        
        fixedCount++;
      }
    }

    console.log(`\n==================================================`);
    console.log(`📊 WORKING HOURS FIX COMPLETED`);
    console.log(`  Total shops checked: ${allShops.length}`);
    console.log(`  Problematic shops found: ${totalProblematic}`);
    console.log(`  Shops fixed: ${fixedCount}`);
    console.log(`  Standard hours applied: Mon-Sat 9AM-6PM, Sun Closed`);
    console.log(`==================================================`);

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during fix:', error);
    await sequelize.close();
    process.exit(1);
  }
}

fixClosedShops();