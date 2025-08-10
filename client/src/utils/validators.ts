// Centralized validation utilities
import { VALIDATION_PATTERNS, FILE_UPLOAD } from '@/constants';

export const validatePhoneNumber = (phone: string): boolean => {
  return VALIDATION_PATTERNS.INDIAN_PHONE.test(phone);
};

export const validateEmail = (email: string): boolean => {
  return VALIDATION_PATTERNS.EMAIL.test(email);
};

export const validateShopSlug = (slug: string): boolean => {
  return VALIDATION_PATTERNS.SHOP_SLUG.test(slug);
};

export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file size
  if (file.size > FILE_UPLOAD.MAX_SIZE) {
    return {
      isValid: false,
      error: `File size must be less than ${FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB`
    };
  }

  // Check file type
  if (!FILE_UPLOAD.ALLOWED_TYPES.includes(file.type as any)) {
    return {
      isValid: false,
      error: 'File type not supported. Please upload PDF, DOC, DOCX, JPG, PNG, or TXT files.'
    };
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !FILE_UPLOAD.ALLOWED_EXTENSIONS.includes(extension as any)) {
    return {
      isValid: false,
      error: 'Invalid file extension.'
    };
  }

  return { isValid: true };
};

export const validateWorkingHours = (hours: any): boolean => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  return days.every(day => {
    const dayHours = hours[day];
    if (!dayHours) return false;
    
    if (dayHours.closed) return true;
    
    return (
      typeof dayHours.open === 'string' &&
      typeof dayHours.close === 'string' &&
      /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(dayHours.open) &&
      /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(dayHours.close)
    );
  });
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>\"']/g, '');
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/[A-Za-z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};