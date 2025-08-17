// Working hours utility functions for real-time shop status calculations
import { format, parse, isAfter, isBefore, isEqual } from 'date-fns';

export interface WorkingHours {
  [day: string]: {
    // Legacy format
    open?: string;
    close?: string;
    closed?: boolean;
    is24Hours?: boolean;
    // Database format
    isOpen?: boolean;
    openTime?: string;
    closeTime?: string;
  };
}

export interface ParsedTimeRange {
  openTime: Date;
  closeTime: Date;
  is24Hours: boolean;
  closed: boolean;
}

/**
 * Parse string format working hours to structured time objects
 * Handles formats like "10 AM to 8:30 PM", "9:00 AM to 6:00 PM", "24/7", "Closed"
 */
export function parseWorkingHoursString(hoursString: string): ParsedTimeRange {
  if (!hoursString || hoursString.toLowerCase().includes('closed')) {
    return {
      openTime: new Date(),
      closeTime: new Date(),
      is24Hours: false,
      closed: true
    };
  }

  if (hoursString.toLowerCase().includes('24') || hoursString.toLowerCase().includes('24/7')) {
    return {
      openTime: new Date(),
      closeTime: new Date(),
      is24Hours: true,
      closed: false
    };
  }

  // Parse "10 AM to 8:30 PM" format
  const timePattern = /(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*(?:to|-)\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i;
  const match = hoursString.match(timePattern);
  
  if (match) {
    try {
      const [, openStr, closeStr] = match;
      const today = new Date();
      const openTime = parse(openStr.trim(), openStr.includes(':') ? 'h:mm a' : 'h a', today);
      const closeTime = parse(closeStr.trim(), closeStr.includes(':') ? 'h:mm a' : 'h a', today);
      
      return {
        openTime,
        closeTime,
        is24Hours: false,
        closed: false
      };
    } catch (error) {
      console.warn('Failed to parse working hours:', hoursString, error);
    }
  }

  // Default fallback for unparseable strings
  return {
    openTime: parse('9:00 AM', 'h:mm a', new Date()),
    closeTime: parse('6:00 PM', 'h:mm a', new Date()),
    is24Hours: false,
    closed: false
  };
}

/**
 * Check if shop is currently open based on working hours
 */
export function isShopCurrentlyOpen(workingHours: WorkingHours | string): boolean {
  const now = new Date();
  const currentDay = format(now, 'EEEE').toLowerCase();
  
  let dayHours;
  
  if (typeof workingHours === 'string') {
    // Handle string format working hours
    const parsed = parseWorkingHoursString(workingHours);
    if (parsed.closed) return false;
    if (parsed.is24Hours) return true;
    
    const currentTime = parse(format(now, 'h:mm a'), 'h:mm a', new Date());
    return (isAfter(currentTime, parsed.openTime) || isEqual(currentTime, parsed.openTime)) && 
           isBefore(currentTime, parsed.closeTime);
  }
  
  if (typeof workingHours === 'object' && workingHours[currentDay]) {
    dayHours = workingHours[currentDay];
  } else {
    return false; // No hours defined for today
  }

  // Handle database format: { isOpen: true/false, openTime: "10:00", closeTime: "20:30" }
  if (dayHours.isOpen === false) return false;
  if (dayHours.isOpen === true && dayHours.openTime && dayHours.closeTime) {
    try {
      const openTime = parse(dayHours.openTime, 'HH:mm', new Date());
      const closeTime = parse(dayHours.closeTime, 'HH:mm', new Date());
      const currentTime = parse(format(now, 'HH:mm'), 'HH:mm', new Date());
      
      // Shop is open if current time is >= opening time AND < closing time
      return (isAfter(currentTime, openTime) || isEqual(currentTime, openTime)) && 
             isBefore(currentTime, closeTime);
    } catch (error) {
      console.warn('Failed to parse working hours for', currentDay, dayHours, error);
      return false;
    }
  }

  // Handle legacy format
  if (dayHours.closed) return false;
  if (dayHours.is24Hours) return true;

  if (dayHours.open && dayHours.close) {
    try {
      const openTime = parse(dayHours.open, dayHours.open.includes(':') ? 'h:mm a' : 'h a', new Date());
      const closeTime = parse(dayHours.close, dayHours.close.includes(':') ? 'h:mm a' : 'h a', new Date());
      const currentTime = parse(format(now, 'h:mm a'), 'h:mm a', new Date());
      
      // Shop is open if current time is >= opening time AND < closing time
      return (isAfter(currentTime, openTime) || isEqual(currentTime, openTime)) && 
             isBefore(currentTime, closeTime);
    } catch (error) {
      console.warn('Failed to parse working hours for', currentDay, dayHours, error);
      return false;
    }
  }

  return false;
}

/**
 * Get display string for working hours
 * Note: This only shows the working hours schedule, not the actual open/closed status
 * For actual status, use calculateUnifiedShopStatus from shop-timing.ts
 */
export function getWorkingHoursDisplay(workingHours: WorkingHours | string): string {
  if (typeof workingHours === 'string') {
    return workingHours;
  }
  
  if (typeof workingHours === 'object') {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = format(new Date(), 'EEEE').toLowerCase();
    const todayHours = workingHours[today];
    
    if (todayHours) {
      // Handle database format: { isOpen: true/false, openTime: "10:00", closeTime: "20:30" }
      if (todayHours.isOpen === false) return 'Closed Today';
      if (todayHours.isOpen === true && todayHours.openTime && todayHours.closeTime) {
        return `Today: ${todayHours.openTime} - ${todayHours.closeTime}`;
      }
      
      // Handle legacy format
      if (todayHours.closed) return 'Closed Today';
      if (todayHours.is24Hours) return '24/7 Open';
      if (todayHours.open && todayHours.close) {
        return `Today: ${todayHours.open} - ${todayHours.close}`;
      }
    }
  }
  
  return 'Hours not available';
}

/**
 * Format working hours for display in chronological order
 */
export function formatWorkingHoursForDisplay(workingHours: WorkingHours | string | any): Array<{day: string, hours: string}> {
  if (typeof workingHours === 'string') {
    return [{
      day: 'Daily',
      hours: workingHours
    }];
  }
  
  // Helper function to parse legacy string format like "10 AM to 10 PM"
  const parseLegacyHoursString = (hoursStr: string): string => {
    if (!hoursStr || hoursStr.toLowerCase().includes('closed')) {
      return 'Closed';
    }
    
    if (hoursStr.toLowerCase().includes('24') || hoursStr.toLowerCase().includes('always')) {
      return '24/7 Open';
    }
    
    // Parse "10 AM to 10 PM" format and convert to 24-hour
    const timePattern = /(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*(?:to|-)\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i;
    const match = hoursStr.match(timePattern);
    
    if (match) {
      const [, openTime, closeTime] = match;
      
      const convertTo24Hour = (timeStr: string): string => {
        const parts = timeStr.trim().split(' ');
        if (parts.length < 2) {
          // If no AM/PM, assume it's already 24-hour format
          return timeStr.includes(':') ? timeStr : `${timeStr}:00`;
        }
        
        const [time, period] = parts;
        let [hours, minutes] = time.split(':');
        
        if (!minutes) minutes = '00';
        let hourNum = parseInt(hours);
        
        if (period && period.toUpperCase() === 'PM' && hourNum !== 12) {
          hourNum += 12;
        } else if (period && period.toUpperCase() === 'AM' && hourNum === 12) {
          hourNum = 0;
        }
        
        return `${hourNum.toString().padStart(2, '0')}:${minutes}`;
      }
      
      return `${convertTo24Hour(openTime)} - ${convertTo24Hour(closeTime)}`;
    }
    
    return hoursStr; // Return as-is if can't parse
  };
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  return days.map(day => {
    // Try different key formats (lowercase, capitalized, etc.)
    const dayKeys = [day, day.charAt(0).toUpperCase() + day.slice(1)];
    let dayHours = null;
    
    for (const dayKey of dayKeys) {
      if (workingHours[dayKey]) {
        dayHours = workingHours[dayKey];
        break;
      }
    }
    
    let hours = 'Details not available';
    
    if (dayHours) {
      // Handle database format: { isOpen: true/false, openTime: "10:00", closeTime: "20:30" }
      if (typeof dayHours === 'object' && dayHours.isOpen === false) {
        hours = 'Closed';
      } else if (typeof dayHours === 'object' && dayHours.isOpen === true && dayHours.openTime && dayHours.closeTime) {
        hours = `${dayHours.openTime} - ${dayHours.closeTime}`;
      }
      // Handle legacy structured format: { open: "10:00", close: "22:00", closed: false }
      else if (typeof dayHours === 'object' && dayHours.open && dayHours.close) {
        if (dayHours.closed === true) {
          hours = 'Closed';
        } else if (dayHours.is24Hours) {
          hours = '24/7 Open';
        } else {
          hours = `${dayHours.open} - ${dayHours.close}`;
        }
      }
      // Handle legacy string format: "10 AM to 10 PM"
      else if (typeof dayHours === 'string') {
        hours = parseLegacyHoursString(dayHours);
      }
    }
    
    return {
      day: day.charAt(0).toUpperCase() + day.slice(1),
      hours
    };
  });
}