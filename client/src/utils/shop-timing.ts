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
  workingHours?: WorkingHours | string;
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
    workingHoursType: typeof shop?.workingHours,
    autoAvailability: shop?.autoAvailability
  });

  // Basic checks
  if (!shop) {
    console.log('❌ SHOP TIMING - No shop data provided');
    return false;
  }
  
  // MASTER OVERRIDE: Manual shop toggle takes absolute priority
  // If shop owner manually toggles OFFLINE, shop is closed regardless of working hours
  if (!shop.isOnline) {
    console.log('🔴 MANUAL OVERRIDE: Shop set to CLOSED by owner (ignoring working hours)');
    return false;
  }

  // Check if shop has working hours
  if (!shop.workingHours) {
    console.log('⚠️ No working hours defined - defaulting to closed');
    return false;
  }

  // Handle string format working hours (fallback to always open if isOnline)
  if (typeof shop.workingHours === 'string') {
    console.log('⚠️ String format working hours detected:', shop.workingHours);
    // Simple string format handling - if shop is online, assume it's open
    return true;
  }

  // Get current day and time in India timezone
  const now = new Date();
  const indiaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  const currentDay = indiaTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = indiaTime.toTimeString().slice(0, 5); // HH:MM format

  console.log('🕐 Current India time check:', {
    day: currentDay,
    time: currentTime,
    utcTime: now.toISOString()
  });

  // Get today's working hours
  const todayHours = shop.workingHours[currentDay];
  
  if (!todayHours) {
    console.log('❌ No working hours defined for', currentDay);
    return false;
  }

  // Check if shop is closed today
  if (todayHours.closed || (todayHours as any).isOpen === false) {
    console.log('🔴 Shop is closed on', currentDay);
    return false;
  }

  // Check for 24/7 operation
  if (todayHours.is24Hours || (todayHours.open === '00:00' && todayHours.close === '23:59')) {
    console.log('🟢 Shop is open 24/7');
    return true;
  }

  // Get open and close times (support both formats)
  const openTime = (todayHours as any).openTime || todayHours.open;
  const closeTime = (todayHours as any).closeTime || todayHours.close;

  if (!openTime || !closeTime) {
    console.log('❌ Missing open/close times for', currentDay);
    return false;
  }

  // Check if current time is within working hours
  const isOpen = currentTime >= openTime && currentTime <= closeTime;
  
  console.log('🕐 Time comparison:', {
    current: currentTime,
    open: openTime,
    close: closeTime,
    isOpen: isOpen
  });

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

  // Handle string format working hours
  if (typeof shop.workingHours === 'string') {
    return null; // Cannot calculate next opening time from string format
  }

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
export function formatWorkingHours(workingHours: WorkingHours | string): string {
  // Handle string format
  if (typeof workingHours === 'string') {
    return workingHours;
  }
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