// Working Hours Utilities for Real-time Shop Status Calculation

export interface ParsedWorkingHours {
  open: string;      // 24-hour format: "10:00"
  close: string;     // 24-hour format: "20:30"
  closed: boolean;
  is24Hours: boolean;
}

export interface WorkingHoursData {
  [day: string]: ParsedWorkingHours;
}

/**
 * Parse time string like "10 AM" or "8:30 PM" to 24-hour format
 */
export function parseTimeString(timeStr: string): string {
  if (!timeStr || typeof timeStr !== 'string') return '09:00';
  
  const cleanTime = timeStr.trim().toUpperCase();
  
  // Handle already 24-hour format
  if (/^\d{1,2}:\d{2}$/.test(cleanTime)) {
    return cleanTime.length === 4 ? `0${cleanTime}` : cleanTime;
  }
  
  // Parse 12-hour format
  const match = cleanTime.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/);
  if (!match) return '09:00';
  
  let hours = parseInt(match[1]);
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const period = match[3];
  
  // Convert to 24-hour format
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Parse string working hours like "10 AM to 8:30 PM" to structured format
 */
export function parseWorkingHoursString(hoursStr: string): ParsedWorkingHours {
  if (!hoursStr || typeof hoursStr !== 'string') {
    return { open: '09:00', close: '18:00', closed: false, is24Hours: false };
  }
  
  const cleanHours = hoursStr.trim();
  
  // Check for special cases
  if (cleanHours.toLowerCase().includes('24') || cleanHours.toLowerCase().includes('24/7')) {
    return { open: '00:00', close: '23:59', closed: false, is24Hours: true };
  }
  
  if (cleanHours.toLowerCase().includes('closed')) {
    return { open: '09:00', close: '18:00', closed: true, is24Hours: false };
  }
  
  // Parse "10 AM to 8:30 PM" format
  const timeParts = cleanHours.split(/\s*(?:to|-|–|—)\s*/i);
  if (timeParts.length === 2) {
    const openTime = parseTimeString(timeParts[0]);
    const closeTime = parseTimeString(timeParts[1]);
    
    return {
      open: openTime,
      close: closeTime,
      closed: false,
      is24Hours: false
    };
  }
  
  // Fallback
  return { open: '09:00', close: '18:00', closed: false, is24Hours: false };
}

/**
 * Convert working hours from any format to structured format
 */
export function normalizeWorkingHours(workingHours: any): WorkingHoursData {
  if (!workingHours) return getDefaultWorkingHours();
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const normalized: WorkingHoursData = {};
  
  days.forEach(day => {
    const dayLower = day.toLowerCase();
    const dayData = workingHours[day] || workingHours[dayLower] || workingHours[day.substring(0, 3).toLowerCase()];
    
    if (typeof dayData === 'string') {
      // String format like "10 AM to 8:30 PM"
      normalized[day] = parseWorkingHoursString(dayData);
    } else if (typeof dayData === 'object' && dayData !== null) {
      // Object format (legacy support)
      normalized[day] = {
        open: dayData.open || '09:00',
        close: dayData.close || '18:00',
        closed: dayData.closed || false,
        is24Hours: dayData.is24Hours || false
      };
    } else {
      // Default hours
      normalized[day] = { open: '09:00', close: '18:00', closed: false, is24Hours: false };
    }
  });
  
  return normalized;
}

/**
 * Get default working hours (9 AM to 6 PM, Monday to Saturday)
 */
export function getDefaultWorkingHours(): WorkingHoursData {
  return {
    'Sunday': { open: '10:00', close: '18:00', closed: false, is24Hours: false },
    'Monday': { open: '09:00', close: '18:00', closed: false, is24Hours: false },
    'Tuesday': { open: '09:00', close: '18:00', closed: false, is24Hours: false },
    'Wednesday': { open: '09:00', close: '18:00', closed: false, is24Hours: false },
    'Thursday': { open: '09:00', close: '18:00', closed: false, is24Hours: false },
    'Friday': { open: '09:00', close: '18:00', closed: false, is24Hours: false },
    'Saturday': { open: '09:00', close: '18:00', closed: false, is24Hours: false }
  };
}

/**
 * Check if shop is currently open based on working hours
 */
export function isShopCurrentlyOpen(workingHours: any, timezone = 'Asia/Kolkata'): boolean {
  try {
    const now = new Date();
    const indiaTime = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const parts = indiaTime.formatToParts(now);
    const dayName = parts.find(p => p.type === 'weekday')?.value;
    const currentTime = `${parts.find(p => p.type === 'hour')?.value}:${parts.find(p => p.type === 'minute')?.value}`;
    
    if (!dayName) return false;
    
    const normalizedHours = normalizeWorkingHours(workingHours);
    const todayHours = normalizedHours[dayName];
    
    if (!todayHours || todayHours.closed) return false;
    if (todayHours.is24Hours) return true;
    
    // Compare times
    const current = timeToMinutes(currentTime);
    const open = timeToMinutes(todayHours.open);
    const close = timeToMinutes(todayHours.close);
    
    // Handle overnight hours (e.g., 22:00 to 06:00)
    if (close < open) {
      return current >= open || current <= close;
    } else {
      return current >= open && current <= close;
    }
  } catch (error) {
    console.error('Error checking shop status:', error);
    return false;
  }
}

/**
 * Convert time string to minutes since midnight for comparison
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Format working hours for display
 */
export function formatWorkingHoursDisplay(workingHours: any): Array<{day: string, schedule: string, status: string}> {
  const normalizedHours = normalizeWorkingHours(workingHours);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return days.map(day => {
    const hours = normalizedHours[day];
    
    if (hours.closed) {
      return { day, schedule: 'Closed', status: 'closed' };
    }
    
    if (hours.is24Hours) {
      return { day, schedule: '24/7 Open', status: '24hours' };
    }
    
    // Format times for display
    const openDisplay = formatTimeForDisplay(hours.open);
    const closeDisplay = formatTimeForDisplay(hours.close);
    
    return {
      day,
      schedule: `${openDisplay} to ${closeDisplay}`,
      status: 'open'
    };
  });
}

/**
 * Convert 24-hour time to 12-hour display format
 */
function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMinutes = minutes === 0 ? '' : `:${minutes.toString().padStart(2, '0')}`;
  
  return `${displayHours}${displayMinutes} ${period}`;
}

/**
 * Get shop status text with real-time calculation
 */
export function getShopStatusText(workingHours: any): { text: string; isOpen: boolean; className: string } {
  const isOpen = isShopCurrentlyOpen(workingHours);
  
  if (isOpen) {
    return {
      text: 'Open Now',
      isOpen: true,
      className: 'bg-green-100 text-green-800'
    };
  } else {
    return {
      text: 'Currently Closed',
      isOpen: false,
      className: 'bg-gray-100 text-gray-800'
    };
  }
}