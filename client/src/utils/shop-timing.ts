/**
 * Centralized Shop Timing Utility
 * Handles all shop availability calculations with robust 24/7 support and real-time updates
 */

export interface WorkingHours {
  [day: string]: {
    // Legacy format fields
    open?: string;
    close?: string;
    closed?: boolean;
    is24Hours?: boolean; // Explicit 24/7 flag
    // Database format fields
    isOpen?: boolean;
    openTime?: string;
    closeTime?: string;
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

  // Handle both database formats: {isOpen, openTime, closeTime} and {open, close, closed}
  // Database format uses isOpen/openTime/closeTime
  // Legacy format uses open/close/closed
  
  // Check if explicitly closed
  if (!todayHours || todayHours.closed === true || todayHours.isOpen === false) {
    console.log('❌ SHOP TIMING - Shop is explicitly closed today');
    return false;
  }
  
  // Get open and close times (handle both formats)
  const openTime = todayHours.openTime || todayHours.open;
  const closeTime = todayHours.closeTime || todayHours.close;
  
  // Check if hours are missing
  if (!openTime && !closeTime) {
    console.log('❌ SHOP TIMING - Shop has no valid hours defined for today');
    return false;
  }

  // Check for explicit 24/7 flag
  if (todayHours.is24Hours) {
    console.log('✅ SHOP TIMING - Shop is explicitly marked as 24/7 today');
    return true;
  }

  // Handle 24/7 operation - if open time equals close time (common pattern: 00:00 = 00:00)
  if (openTime === closeTime) {
    console.log('✅ SHOP TIMING - Shop has same open/close time, treating as 24/7');
    return true;
  }

  // Special 24/7 patterns
  if ((openTime === '00:00' && closeTime === '00:00') ||
      (openTime === '0:00' && closeTime === '0:00')) {
    console.log('✅ SHOP TIMING - Shop has 00:00-00:00 schedule, treating as 24/7');
    return true;
  }

  // Handle overnight operations (e.g., 22:00 to 06:00)
  if (openTime > closeTime) {
    const isOpen = currentTime >= openTime || currentTime <= closeTime;
    console.log(`${isOpen ? '✅' : '❌'} SHOP TIMING - Overnight operation: ${openTime}-${closeTime}, current: ${currentTime}`);
    return isOpen;
  }

  // Normal day operation (e.g., 09:00 to 18:00)
  const isOpen = currentTime >= openTime && currentTime <= closeTime;
  console.log(`${isOpen ? '✅' : '❌'} SHOP TIMING - Normal operation: ${openTime}-${closeTime}, current: ${currentTime}`);
  
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