// Server-side validation utilities
import { z } from 'zod';

// Phone number validation for Indian numbers
export const phoneSchema = z.string()
  .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number starting with 6-9');

// Email validation
export const emailSchema = z.string()
  .email('Please enter a valid email address');

// Password validation
export const passwordSchema = z.string()
  .min(6, 'Password must be at least 6 characters long')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number');

// Shop slug validation
export const shopSlugSchema = z.string()
  .min(3, 'Shop slug must be at least 3 characters long')
  .max(50, 'Shop slug cannot exceed 50 characters')
  .regex(/^[a-z0-9-]+$/, 'Shop slug can only contain lowercase letters, numbers, and hyphens');

// Working hours validation
export const workingHoursSchema = z.object({
  monday: z.object({
    open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    closed: z.boolean()
  }),
  tuesday: z.object({
    open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    closed: z.boolean()
  }),
  wednesday: z.object({
    open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    closed: z.boolean()
  }),
  thursday: z.object({
    open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    closed: z.boolean()
  }),
  friday: z.object({
    open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    closed: z.boolean()
  }),
  saturday: z.object({
    open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    closed: z.boolean()
  }),
  sunday: z.object({
    open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    closed: z.boolean()
  })
});

// File validation
export const validateFileType = (filename: string, mimetype: string): boolean => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'text/plain'
  ];

  const allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'txt'];
  const extension = filename.split('.').pop()?.toLowerCase();

  return allowedTypes.includes(mimetype) && 
         extension !== undefined && 
         allowedExtensions.includes(extension);
};

// Sanitization utilities
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>\"'&]/g, '');
};

export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Rate limiting validation
export const isValidRequestFrequency = (lastRequest: Date | null, minInterval: number): boolean => {
  if (!lastRequest) return true;
  return Date.now() - lastRequest.getTime() >= minInterval;
};

// Pagination validation
export const validatePagination = (page: number, limit: number) => {
  const validatedPage = Math.max(1, Math.floor(page));
  const validatedLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  
  return {
    page: validatedPage,
    limit: validatedLimit,
    offset: (validatedPage - 1) * validatedLimit
  };
};