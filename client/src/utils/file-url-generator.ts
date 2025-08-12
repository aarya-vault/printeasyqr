/**
 * Centralized File URL Generation Utility
 * Handles all file URL patterns consistently across the platform
 */

export interface FileObject {
  path?: string;
  filename?: string;
  originalName?: string;
  size?: number;
  mimetype?: string;
}

/**
 * Generate the correct object storage URL for a file
 * Handles both legacy (filename) and current (path) formats
 */
export const generateFileUrl = (file: FileObject | string): string => {
  // Handle string input (legacy format)
  if (typeof file === 'string') {
    return `/objects/.private/uploads/${file}`;
  }

  // Handle object input with path (current format)
  if (file.path) {
    // If path already includes uploads/, use as-is
    if (file.path.includes('uploads/')) {
      return `/objects/.private/${file.path}`;
    }
    // Otherwise add uploads/ prefix
    return `/objects/.private/uploads/${file.path}`;
  }

  // Handle object input with filename (legacy format)
  if (file.filename) {
    return `/objects/.private/uploads/${file.filename}`;
  }

  // Fallback - should not happen in normal operation
  console.warn('Invalid file object provided to generateFileUrl:', file);
  return '/objects/.private/uploads/unknown-file';
};

/**
 * Get display name for a file
 */
export const getFileDisplayName = (file: FileObject | string): string => {
  if (typeof file === 'string') {
    return file;
  }

  return file.originalName || file.filename || 'Unknown File';
};

/**
 * Get file size in human readable format
 */
export const getFileSize = (file: FileObject): string => {
  if (!file.size) return 'Unknown size';
  
  const sizeInKB = file.size / 1024;
  if (sizeInKB < 1024) {
    return `${sizeInKB.toFixed(1)} KB`;
  }
  
  const sizeInMB = sizeInKB / 1024;
  return `${sizeInMB.toFixed(1)} MB`;
};

/**
 * Check if a file is likely accessible (not deleted)
 * Based on order status and file existence patterns
 */
export const isFileAccessible = (file: FileObject, orderStatus: string): boolean => {
  // Files in completed orders are deleted
  if (orderStatus === 'completed') {
    return false;
  }
  
  // File must have valid path or filename
  return !!(file.path || file.filename);
};

/**
 * Generate download filename with proper extension
 */
export const getDownloadFilename = (file: FileObject | string): string => {
  const displayName = getFileDisplayName(file);
  
  // If filename already has extension, use as-is
  if (displayName.includes('.')) {
    return displayName;
  }
  
  // Try to infer extension from mimetype
  if (typeof file === 'object' && file.mimetype) {
    const extension = file.mimetype.split('/')[1];
    if (extension && extension !== 'octet-stream') {
      return `${displayName}.${extension}`;
    }
  }
  
  // Default fallback
  return displayName;
};