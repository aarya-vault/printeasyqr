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

  // SIMPLIFIED LOGIC: If shop owner toggles ONLINE, shop is ALWAYS OPEN
  // This is the master override - no need to check working hours when manually set to online
  console.log('🟢 MANUAL OVERRIDE: Shop set to OPEN by owner - ALWAYS OPEN regardless of working hours');
  return true;
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