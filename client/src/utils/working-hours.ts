// Working hours utility functions for real-time shop status calculations
import { format, parse, isAfter, isBefore, isEqual } from 'date-fns';

export interface WorkingHours {
  [day: string]: {
    open?: string;
    close?: string;
    closed?: boolean;
    is24Hours?: boolean;
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
    return isAfter(currentTime, parsed.openTime) && isBefore(currentTime, parsed.closeTime);
  }
  
  if (typeof workingHours === 'object' && workingHours[currentDay]) {
    dayHours = workingHours[currentDay];
  } else {
    return false; // No hours defined for today
  }

  if (dayHours.closed) return false;
  if (dayHours.is24Hours) return true;

  if (dayHours.open && dayHours.close) {
    try {
      const openTime = parse(dayHours.open, dayHours.open.includes(':') ? 'h:mm a' : 'h a', new Date());
      const closeTime = parse(dayHours.close, dayHours.close.includes(':') ? 'h:mm a' : 'h a', new Date());
      const currentTime = parse(format(now, 'h:mm a'), 'h:mm a', new Date());
      
      return isAfter(currentTime, openTime) && isBefore(currentTime, closeTime);
    } catch (error) {
      console.warn('Failed to parse working hours for', currentDay, dayHours, error);
      return false;
    }
  }

  return false;
}

/**
 * Get display string for working hours
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
      if (todayHours.closed) return 'Closed Today';
      if (todayHours.is24Hours) return '24/7 Open';
      if (todayHours.open && todayHours.close) {
        return `${todayHours.open} - ${todayHours.close}`;
      }
    }
  }
  
  return 'Standard business hours';
}

/**
 * Format working hours for display in chronological order
 */
export function formatWorkingHoursForDisplay(workingHours: WorkingHours | string): Array<{day: string, hours: string}> {
  if (typeof workingHours === 'string') {
    return [{
      day: 'Daily',
      hours: workingHours
    }];
  }
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  return days.map(day => {
    const dayHours = workingHours[day];
    let hours = 'Standard hours';
    
    if (dayHours) {
      if (dayHours.closed) {
        hours = 'Closed';
      } else if (dayHours.is24Hours) {
        hours = '24/7 Open';
      } else if (dayHours.open && dayHours.close) {
        hours = `${dayHours.open} - ${dayHours.close}`;
      }
    }
    
    return {
      day: day.charAt(0).toUpperCase() + day.slice(1),
      hours
    };
  });
}