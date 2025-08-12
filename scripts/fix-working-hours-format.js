import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Helper function to convert time format like "10 AM" to "10:00"
function convertTo24Hour(timeStr) {
  const cleanStr = timeStr.trim();
  
  // If it already looks like 24-hour format (e.g., "14:30"), return as is
  if (/^\d{1,2}:\d{2}$/.test(cleanStr)) {
    return cleanStr;
  }
  
  // Parse AM/PM format
  const ampmMatch = cleanStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (ampmMatch) {
    const [, hoursStr, minutesStr = '00', period] = ampmMatch;
    let hours = parseInt(hoursStr);
    const minutes = minutesStr;
    
    if (period.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  
  // If we can't parse it, try to extract just the number and assume it's hours
  const numberMatch = cleanStr.match(/(\d{1,2})/);
  if (numberMatch) {
    return `${numberMatch[1].padStart(2, '0')}:00`;
  }
  
  // Final fallback
  return '09:00';
}

// Helper function to parse legacy hours string like "10 AM to 10 PM"
function parseLegacyHoursString(hoursStr) {
  if (!hoursStr || hoursStr.toLowerCase().includes('closed')) {
    return { open: '09:00', close: '18:00', closed: true };
  }
  
  if (hoursStr.toLowerCase().includes('24') || hoursStr.toLowerCase().includes('always')) {
    return { open: '00:00', close: '23:59', closed: false, is24Hours: true };
  }
  
  // Parse "10 AM to 10 PM" format
  const timePattern = /(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*(?:to|-)\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i;
  const match = hoursStr.match(timePattern);
  
  if (match) {
    const [, openTime, closeTime] = match;
    try {
      return {
        open: convertTo24Hour(openTime),
        close: convertTo24Hour(closeTime),
        closed: false
      };
    } catch (error) {
      console.warn('Failed to parse time:', openTime, closeTime, error);
      return { open: '09:00', close: '18:00', closed: false };
    }
  }
  
  // Default fallback
  return { open: '09:00', close: '18:00', closed: false };
}

// Function to normalize working hours to the correct format
function normalizeWorkingHours(workingHours) {
  if (!workingHours || typeof workingHours !== 'object') {
    // Default working hours if none provided
    return {
      sunday: { open: '09:00', close: '18:00', closed: true },
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false }
    };
  }
  
  const normalizedHours = {};
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  for (const day of days) {
    // Try different case formats
    const dayKeys = [day, day.charAt(0).toUpperCase() + day.slice(1)];
    let dayHours = null;
    
    for (const dayKey of dayKeys) {
      if (workingHours[dayKey]) {
        dayHours = workingHours[dayKey];
        break;
      }
    }
    
    if (dayHours) {
      // If it's already in the correct format
      if (typeof dayHours === 'object' && dayHours.open && dayHours.close) {
        normalizedHours[day] = {
          open: dayHours.open,
          close: dayHours.close,
          closed: dayHours.closed === true || dayHours.isOpen === false
        };
      }
      // If it's a legacy string format
      else if (typeof dayHours === 'string') {
        normalizedHours[day] = parseLegacyHoursString(dayHours);
      }
      // Default fallback
      else {
        normalizedHours[day] = { open: '09:00', close: '18:00', closed: false };
      }
    } else {
      // Day not found, set default
      normalizedHours[day] = { open: '09:00', close: '18:00', closed: true };
    }
  }
  
  return normalizedHours;
}

async function fixWorkingHoursFormat() {
  try {
    console.log('🔄 Starting working hours format fix...');
    
    // Get all shops
    const result = await pool.query('SELECT id, name, working_hours FROM shops');
    const shops = result.rows;
    
    console.log(`📍 Found ${shops.length} shops to check`);
    
    let fixedCount = 0;
    let alreadyCorrect = 0;
    let errors = 0;
    
    for (const shop of shops) {
      try {
        const currentHours = shop.working_hours;
        const normalizedHours = normalizeWorkingHours(currentHours);
        
        // Check if normalization changed anything
        const needsUpdate = JSON.stringify(currentHours) !== JSON.stringify(normalizedHours);
        
        if (needsUpdate) {
          await pool.query(
            'UPDATE shops SET working_hours = $1 WHERE id = $2',
            [JSON.stringify(normalizedHours), shop.id]
          );
          
          console.log(`✅ Fixed ${shop.name} (ID: ${shop.id})`);
          console.log(`   Old: ${JSON.stringify(currentHours)}`);
          console.log(`   New: ${JSON.stringify(normalizedHours)}`);
          fixedCount++;
        } else {
          console.log(`✓ ${shop.name} already has correct format`);
          alreadyCorrect++;
        }
      } catch (error) {
        console.error(`❌ Error fixing ${shop.name}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n📊 Working Hours Format Fix Summary:');
    console.log(`✅ Successfully fixed: ${fixedCount} shops`);
    console.log(`✓ Already correct: ${alreadyCorrect} shops`);
    console.log(`❌ Errors: ${errors} shops`);
    console.log(`📍 Total processed: ${shops.length} shops`);
    
  } catch (error) {
    console.error('❌ Error in fixWorkingHoursFormat:', error);
  } finally {
    await pool.end();
  }
}

// Run the fix
fixWorkingHoursFormat();