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
    if (category === 'ORDER') {
      // Always use R2 for order files (no fallback)
      if (!this.r2Available) {
        throw new Error('R2 storage is not available. Please try again later.');
      }
      return await this.saveOrderFileToR2(file, metadata);
    } else {
      // Use local storage for QR codes and chat attachments
      return await this.saveFileLocally(file, category, metadata);
    }
  }
  
  async saveOrderFileToR2(file, metadata) {
    const { orderId } = metadata;
    if (!orderId) {
      throw new Error('Order ID required for R2 storage');
    }
    
    // Generate R2 key
    const key = r2Client.generateKey(orderId, file.originalname || file.originalName);
    
    // 🚀 ULTRA PERFORMANCE: Use intelligent upload (multipart for large files)
    const startTime = Date.now();
    const result = await r2Client.intelligentUpload(key, file.buffer, file.mimetype);
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
    // 🚀 ENHANCED: Process in larger batches for ultra-fast URL generation
    const batchSize = 15;
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
   * ULTRA FAST: Save multiple files in parallel batches with enhanced concurrency
   */
  async saveMultipleFiles(files, category, metadata = {}) {
    // 🔥 MAXIMUM PERFORMANCE: Parallel processing for ALL file sizes
    const optimalBatchSize = Math.min(20, files.length); // Process up to 20 files simultaneously
    const results = [];
    
    console.log(`🚀 Uploading ${files.length} files with ${optimalBatchSize} parallel connections...`);
    const startTime = Date.now();
    let totalBytesUploaded = 0;
    
    // Process all files in optimized parallel batches
    for (let i = 0; i < files.length; i += optimalBatchSize) {
      const batch = files.slice(i, i + optimalBatchSize);
      const batchStartTime = Date.now();
      
      // Upload batch in parallel with error handling
      const batchResults = await Promise.allSettled(
        batch.map(async (file, index) => {
          try {
            const result = await this.saveFile(file, category, { ...metadata, index: i + index });
            totalBytesUploaded += file.size || file.buffer?.length || 0;
            return result;
          } catch (error) {
            console.error(`❌ Failed to upload ${file.originalname || file.originalName}:`, error.message);
            throw error;
          }
        })
      );
      
      // Process results and handle any failures
      const successfulUploads = batchResults
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
      
      const failedUploads = batchResults
        .filter(result => result.status === 'rejected')
        .map((result, idx) => batch[idx].originalname || batch[idx].originalName);
      
      if (failedUploads.length > 0) {
        console.warn(`⚠️ Failed uploads in batch: ${failedUploads.join(', ')}`);
      }
      
      results.push(...successfulUploads);
      
      const batchTime = Date.now() - batchStartTime;
      const batchBytes = batch.reduce((sum, f) => sum + (f.size || f.buffer?.length || 0), 0);
      const batchSpeed = batchBytes / (batchTime / 1000) / (1024 * 1024); // MB/s
      
      console.log(`✅ Batch ${Math.floor(i/optimalBatchSize) + 1} completed: ${successfulUploads.length}/${batch.length} files in ${batchTime}ms (${batchSpeed.toFixed(2)} MB/s)`);
    }
    
    const totalTime = Date.now() - startTime;
    const overallSpeed = totalBytesUploaded / (totalTime / 1000) / (1024 * 1024); // MB/s
    
    console.log(`⚡ Upload complete: ${results.length}/${files.length} files in ${totalTime}ms`);
    console.log(`📊 Performance: ${overallSpeed.toFixed(2)} MB/s average, ${Math.round(totalTime/files.length)}ms per file`);
    
    // Throw error if any critical files failed
    if (results.length < files.length) {
      const failureRate = ((files.length - results.length) / files.length) * 100;
      if (failureRate > 10) { // More than 10% failure rate
        throw new Error(`Upload failed: ${files.length - results.length} files could not be uploaded`);
      }
    }
    
    return results;
  }
}

// Export singleton instance
export default new StorageManager();