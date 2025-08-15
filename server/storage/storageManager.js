import r2Client from './r2Client.js';
import { promises as fs } from 'fs';
import path from 'path';

class StorageManager {
  constructor() {
    this.r2Available = r2Client.isAvailable();
    console.log(`📦 Storage Manager initialized - R2: ${this.r2Available ? 'Available' : 'Not Available'}`);
  }
  
  async initialize() {
    // Check R2 health on startup
    if (this.r2Available) {
      this.r2Available = await r2Client.healthCheck();
    }
    return this.r2Available;
  }
  
  /**
   * Save file based on category
   * @param {Object} file - File object with buffer, originalname, mimetype
   * @param {string} category - 'ORDER', 'QR', or 'CHAT'
   * @param {Object} metadata - Additional metadata (orderId, etc.)
   */
  async saveFile(file, category, metadata = {}) {
    if (category === 'ORDER' && this.r2Available) {
      // Use R2 for order files
      return await this.saveOrderFileToR2(file, metadata);
    } else {
      // Use local storage for QR codes and chat attachments
      return await this.saveFileLocally(file, category, metadata);
    }
  }
  
  async saveOrderFileToR2(file, metadata) {
    try {
      const { orderId } = metadata;
      if (!orderId) {
        throw new Error('Order ID required for R2 storage');
      }
      
      // Generate R2 key
      const key = r2Client.generateKey(orderId, file.originalname || file.originalName);
      
      // PERFORMANCE: Upload to R2 with optimized settings
      const startTime = Date.now();
      const result = await r2Client.upload(key, file.buffer, file.mimetype);
      const uploadTime = Date.now() - startTime;
      
      console.log(`⚡ R2 upload completed in ${uploadTime}ms for ${file.originalname}`);
      
      return {
        filename: path.basename(key),
        originalName: file.originalname || file.originalName,
        mimetype: file.mimetype,
        size: file.size || file.buffer.length,
        path: key, // R2 key
        r2Key: key,
        storageType: 'r2',
        bucket: result.bucket
      };
    } catch (r2Error) {
      console.error('❌ R2 upload failed, falling back to local:', r2Error.message);
      // Fallback to local storage
      return await this.saveFileLocally(file, 'ORDER', metadata);
    }
  }
  
  async saveFileLocally(file, category, metadata) {
    const timestamp = Date.now();
    const index = metadata.index || 0;
    const originalName = file.originalname || file.originalName;
    const filename = `${timestamp}-${index}-${originalName}`;
    
    // Determine directory based on category
    let directory = 'uploads';
    if (category === 'QR') {
      directory = 'qr-codes';
    } else if (category === 'CHAT') {
      directory = 'chat-attachments';
    }
    
    const localPath = path.join(directory, filename);
    
    // Ensure directory exists
    await fs.mkdir(directory, { recursive: true });
    
    // Write file to disk
    await fs.writeFile(localPath, file.buffer);
    console.log(`💾 File saved locally: ${localPath}`);
    
    return {
      filename: filename,
      originalName: originalName,
      mimetype: file.mimetype,
      size: file.size || file.buffer.length,
      path: localPath,
      storageType: 'local',
      isLocalFile: true
    };
  }
  
  /**
   * Get file URL or path based on storage type
   */
  async getFileAccess(fileInfo, accessType = 'download') {
    if (fileInfo.storageType === 'r2' && this.r2Available) {
      // Generate presigned URL based on access type
      if (accessType === 'download') {
        return await r2Client.getPresignedDownloadUrl(
          fileInfo.r2Key || fileInfo.path,
          'attachment',
          fileInfo.originalName
        );
      } else if (accessType === 'print' || accessType === 'view') {
        return await r2Client.getPresignedPrintUrl(
          fileInfo.r2Key || fileInfo.path,
          fileInfo.mimetype,
          fileInfo.originalName
        );
      }
    } else {
      // Return local path for local files
      return fileInfo.path;
    }
  }
  
  /**
   * Delete file based on storage type
   */
  async deleteFile(fileInfo) {
    try {
      if (fileInfo.storageType === 'r2' && this.r2Available) {
        // Delete from R2
        return await r2Client.delete(fileInfo.r2Key || fileInfo.path);
      } else {
        // Delete local file
        const filePath = fileInfo.path.startsWith('/') 
          ? fileInfo.path 
          : path.join(process.cwd(), fileInfo.path);
          
        await fs.unlink(filePath);
        console.log(`✅ Deleted local file: ${filePath}`);
        return true;
      }
    } catch (error) {
      console.error(`❌ Failed to delete file:`, error.message);
      return false;
    }
  }
  
  /**
   * Get presigned URLs for multiple files - OPTIMIZED FOR PARALLEL PROCESSING
   */
  async getBatchUrls(files, accessType = 'download') {
    // Process in batches of 10 for optimal performance
    const batchSize = 10;
    const results = [];
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchUrls = await Promise.all(
        batch.map(async (file) => {
          try {
            const url = await this.getFileAccess(file, accessType);
            return {
              fileId: file.id || file.filename,
              originalName: file.originalName,
              mimetype: file.mimetype,
              url: url,
              storageType: file.storageType || 'local'
            };
          } catch (error) {
            console.error(`Failed to get URL for file ${file.originalName}:`, error);
            return null;
          }
        })
      );
      results.push(...batchUrls);
    }
    
    return results.filter(url => url !== null);
  }
  
  /**
   * ULTRA FAST: Save multiple files in parallel batches
   */
  async saveMultipleFiles(files, category, metadata = {}) {
    // Process files in parallel batches for optimal performance
    const batchSize = 5; // Process 5 files at a time to avoid memory issues
    const results = [];
    
    console.log(`🚀 Processing ${files.length} files in parallel batches...`);
    const startTime = Date.now();
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((file, index) => 
          this.saveFile(file, category, { ...metadata, index: i + index })
        )
      );
      results.push(...batchResults);
      
      console.log(`✅ Batch ${Math.floor(i/batchSize) + 1} completed: ${batchResults.length} files`);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`⚡ All ${files.length} files saved in ${totalTime}ms (${Math.round(totalTime/files.length)}ms per file)`);
    
    return results;
  }
}

// Export singleton instance
export default new StorageManager();