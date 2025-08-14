/**
 * Stub for object storage upload functions
 * Using local file storage instead of object storage
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to ensure uploads directory exists
function ensureUploadsDir() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
}

export async function uploadFileToObjectStorage(fileBuffer, originalName, mimetype) {
  try {
    const uploadsDir = ensureUploadsDir();
    const filename = `${Date.now()}-${originalName}`;
    const filepath = path.join(uploadsDir, filename);
    
    fs.writeFileSync(filepath, fileBuffer);
    
    // Return local path instead of object storage path
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Error saving file locally:', error);
    throw error;
  }
}

export async function uploadFilesToObjectStorage(files) {
  if (!files || !Array.isArray(files)) {
    return [];
  }
  
  return batchUploadToObjectStorage(files);
}

export async function batchUploadToObjectStorage(fileList) {
  const uploadedFiles = [];
  
  for (const file of fileList) {
    try {
      const path = await uploadFileToObjectStorage(
        file.buffer, 
        file.originalname || file.originalName, 
        file.mimetype
      );
      
      uploadedFiles.push({
        originalName: file.originalname || file.originalName,
        path: path,
        mimetype: file.mimetype,
        size: file.size || file.buffer.length
      });
    } catch (error) {
      console.error(`Failed to upload file ${file.originalname || file.originalName}:`, error);
    }
  }
  
  return uploadedFiles;
}