import { z } from "zod";

export const phoneValidationSchema = z.string()
  .regex(/^[6-9]\d{9}$/, "Phone Number must be valid");

export const validatePhoneNumber = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Must be exactly 10 digits and start with 6, 7, 8, or 9
  if (cleanPhone.length !== 10) return false;
  
  const firstDigit = cleanPhone.charAt(0);
  return ['6', '7', '8', '9'].includes(firstDigit);
};

export const orderFormSchema = z.object({
  shopId: z.number().min(1, "Please select a shop"),
  type: z.enum(['upload', 'walkin']),
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().optional(),
  specifications: z.object({
    copies: z.number().min(1).optional(),
    colorType: z.enum(['bw', 'color']).optional(),
    paperSize: z.string().optional(),
    binding: z.string().optional(),
    specialInstructions: z.string().optional(),
  }).optional(),
  isUrgent: z.boolean().optional(),
  estimatedPages: z.number().min(1).optional(),
  estimatedBudget: z.number().min(0).optional(),
});

export const shopApplicationSchema = z.object({
  shopName: z.string().min(3, "Shop name must be at least 3 characters").max(50, "Shop name too long"),
  address: z.string().min(10, "Address must be at least 10 characters").max(500, "Address too long"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pinCode: z.string().regex(/^\d{6}$/, "PIN code must be 6 digits"),
  email: z.string().email("Invalid email address").optional(),
  services: z.array(z.string()).min(1, "Select at least one service"),
  workingHours: z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
    close: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  }),
  yearsOfExperience: z.string().optional(),
});

export const messageSchema = z.object({
  orderId: z.number().min(1),
  content: z.string().min(1, "Message cannot be empty").max(1000, "Message too long"),
});

export const fileValidation = {
  allowedTypes: [
    // Allow ALL file types - Updated for maximum flexibility
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    'image/tiff',
    'image/svg+xml',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/json',
    'application/xml',
    'text/html',
    // Wildcard to allow ANY file type
    '*/*'
  ],
  
  validateFile: (file: File): { isValid: boolean; error?: string } => {
    // Updated validation: Allow ALL file types
    // Only check for basic file existence and reasonable naming
    
    if (!file || !file.name) {
      return { isValid: false, error: 'Invalid file - please select a valid file' };
    }

    // Allow all file types - no restrictions
    return { isValid: true };
  }
};
