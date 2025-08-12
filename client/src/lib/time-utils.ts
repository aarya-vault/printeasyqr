// Utility functions for consistent time formatting

export const formatToIndiaTime = (date: Date | string | number | null | undefined): string => {
  // Handle null/undefined dates
  if (!date) {
    return 'Invalid time';
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid time';
  }
  
  // Convert to India time (UTC+5:30)
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  
  return dateObj.toLocaleTimeString('en-IN', options);
};

export const formatToIndiaDateTime = (date: Date | string | number | null | undefined): string => {
  // Handle null/undefined dates
  if (!date) {
    return 'Invalid date';
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  // Convert to India time with date
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  
  return dateObj.toLocaleString('en-IN', options);
};

export const formatToIndiaDate = (date: Date | string | number | null | undefined): string => {
  // Handle null/undefined dates
  if (!date) {
    return 'Invalid date';
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  // Convert to India date only
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return dateObj.toLocaleDateString('en-IN', options);
};

export const formatRelativeTime = (date: Date | string | number | null | undefined): string => {
  // Handle null/undefined dates
  if (!date) {
    return 'Unknown time';
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid time';
  }
  
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  
  return formatToIndiaDate(dateObj);
};

// Check if a date is today (in India timezone)
export const isToday = (date: Date | string | number | null | undefined): boolean => {
  // Handle null/undefined dates
  if (!date) {
    return false;
  }
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return false;
  }
  
  const today = new Date();
  
  const dateIndia = formatToIndiaDate(dateObj);
  const todayIndia = formatToIndiaDate(today);
  
  return dateIndia === todayIndia && dateIndia !== 'Invalid date';
};