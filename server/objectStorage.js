/**
 * Stub for ObjectStorageService
 * Provides compatibility layer for local file storage
 */

import fs from 'fs';
import path from 'path';

export class ObjectStorageService {
  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadsDir();
  }

  ensureUploadsDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async getSignedUrl(filePath) {
    // Return local file URL
    return filePath;
  }

  async downloadFile(filePath) {
    try {
      const fullPath = path.join(process.cwd(), filePath.replace(/^\//, ''));
      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath);
      }
      return null;
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }

  async uploadFile(buffer, filename) {
    try {
      const filepath = path.join(this.uploadsDir, filename);
      fs.writeFileSync(filepath, buffer);
      return `/uploads/${filename}`;
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }
}

export default ObjectStorageService;