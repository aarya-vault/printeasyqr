/**
 * Centralized Shop Timing Utility
 * Handles all shop availability calculations with robust 24/7 support and real-time updates
 */

export interface WorkingHours {
  [day: string]: {
    open: string;
    close: string;
    closed?: boolean;
    is24Hours?: boolean; // Explicit 24/7 flag
  };
}

export interface ShopTimingData {
  isOnline: boolean;
  workingHours?: WorkingHours;
  acceptsWalkinOrders?: boolean;
  autoAvailability?: boolean;
}

/**
 * Calculate if shop is currently open with comprehensive 24/7 support
 * This is the single source of truth for shop availability
 */
export function isShopCurrentlyOpen(shop: ShopTimingData): boolean {
  console.log('🔍 SHOP TIMING - Checking shop availability:', {
    isOnline: shop?.isOnline,
    hasWorkingHours: !!shop?.workingHours,
    autoAvailability: shop?.autoAvailability
  });

  // Basic checks
  if (!shop) {
    console.log('❌ SHOP TIMING - No shop data provided');
    return false;
  }
  
  if (!shop.isOnline) {
    console.log('❌ SHOP TIMING - Shop is manually set to offline');
    return false;
  }

  // If no working hours defined, assume 24/7 operation (always open)
  if (!shop.workingHours) {
    console.log('✅ SHOP TIMING - No working hours defined, assuming 24/7 operation');
    return true;
  }

  // Get current time info
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  const todayHours = shop.workingHours[currentDay];

  console.log('🔍 SHOP TIMING - Current time analysis:', {
    currentDay,
    currentTime,
    todayHours
  });

  // If day is explicitly marked as closed or missing required fields
  if (!todayHours || todayHours.closed === true) {
    console.log('❌ SHOP TIMING - Shop is explicitly closed today');
    return false;
  }
  
  // Check if hours object exists but missing isOpen flag or open/close times
  if (!todayHours.isOpen && !todayHours.open && !todayHours.close) {
    console.log('❌ SHOP TIMING - Shop has no valid hours defined for today');
    return false;
  }

  // Check for explicit 24/7 flag
  if (todayHours.is24Hours) {
    console.log('✅ SHOP TIMING - Shop is explicitly marked as 24/7 today');
    return true;
  }

  // Handle 24/7 operation - if open time equals close time (common pattern: 00:00 = 00:00)
  if (todayHours.open === todayHours.close) {
    console.log('✅ SHOP TIMING - Shop has same open/close time, treating as 24/7');
    return true;
  }

  // Special 24/7 patterns
  if ((todayHours.open === '00:00' && todayHours.close === '00:00') ||
      (todayHours.open === '0:00' && todayHours.close === '0:00')) {
    console.log('✅ SHOP TIMING - Shop has 00:00-00:00 schedule, treating as 24/7');
    return true;
  }

  // Handle overnight operations (e.g., 22:00 to 06:00)
  if (todayHours.open > todayHours.close) {
    const isOpen = currentTime >= todayHours.open || currentTime <= todayHours.close;
    console.log(`${isOpen ? '✅' : '❌'} SHOP TIMING - Overnight operation: ${todayHours.open}-${todayHours.close}, current: ${currentTime}`);
    return isOpen;
  }

  // Normal day operation (e.g., 09:00 to 18:00)
  const isOpen = currentTime >= todayHours.open && currentTime <= todayHours.close;
  console.log(`${isOpen ? '✅' : '❌'} SHOP TIMING - Normal operation: ${todayHours.open}-${todayHours.close}, current: ${currentTime}`);
  
  return isOpen;
}

/**
 * Check if shop accepts walk-in orders right now
 */
export function canPlaceWalkinOrder(shop: ShopTimingData): boolean {
  return shop?.acceptsWalkinOrders === true && isShopCurrentlyOpen(shop);
}

/**
 * Get human-readable shop status
 */
export function getShopStatusText(shop: ShopTimingData): string {
  if (!shop?.isOnline) return 'Offline';
  
  const isOpen = isShopCurrentlyOpen(shop);
  return isOpen ? 'Open' : 'Closed';
}

/**
 * Get next opening time for closed shops
 */
export function getNextOpeningTime(shop: ShopTimingData): string | null {
  if (!shop?.workingHours || isShopCurrentlyOpen(shop)) return null;

  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayIndex = days.indexOf(currentDay);

  // Check next 7 days for opening time
  for (let i = 0; i < 7; i++) {
    const dayIndex = (currentDayIndex + i) % 7;
    const dayName = days[dayIndex];
    const dayHours = shop.workingHours[dayName];

    if (dayHours && !dayHours.closed && dayHours.open) {
      if (i === 0) {
        // Today - check if we haven't passed opening time
        const currentTime = now.toTimeString().slice(0, 5);
        if (currentTime < dayHours.open) {
          return `Today at ${dayHours.open}`;
        }
      } else {
        // Future day
        const dayNameCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        return `${dayNameCapitalized} at ${dayHours.open}`;
      }
    }
  }

  return null;
}

/**
 * Format working hours for display
 */
export function formatWorkingHours(workingHours: WorkingHours): string {
  if (!workingHours) return '24/7';

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const formattedDays: string[] = [];

  days.forEach(day => {
    const hours = workingHours[day];
    if (hours) {
      if (hours.closed) {
        formattedDays.push(`${day.charAt(0).toUpperCase() + day.slice(1)}: Closed`);
      } else if (hours.is24Hours || hours.open === hours.close) {
        formattedDays.push(`${day.charAt(0).toUpperCase() + day.slice(1)}: 24/7`);
      } else {
        formattedDays.push(`${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours.open} - ${hours.close}`);
      }
    }
  });

  return formattedDays.join(', ');
}