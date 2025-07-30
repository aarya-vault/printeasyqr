import fs from 'fs';
import path from 'path';

export const deleteOrderFiles = async (files: any[]): Promise<void> => {
  if (!files || files.length === 0) return;

  const uploadDir = path.join(process.cwd(), 'uploads');
  
  for (const file of files) {
    try {
      const filename = file.filename || file.path;
      if (filename) {
        const filePath = path.join(uploadDir, filename);
        
        // Check if file exists before attempting to delete
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filename}`);
        }
      }
    } catch (error) {
      console.error(`Error deleting file ${file.filename}:`, error);
      // Continue deleting other files even if one fails
    }
  }
};

export const parseFilesFromOrder = (filesData: any): any[] => {
  if (!filesData) return [];
  
  try {
    if (typeof filesData === 'string') {
      return JSON.parse(filesData);
    }
    return Array.isArray(filesData) ? filesData : [];
  } catch (error) {
    console.error('Error parsing files data:', error);
    return [];
  }
};