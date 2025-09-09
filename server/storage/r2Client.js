import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

class R2Client {
  constructor() {
    if (R2Client.instance) {
      return R2Client.instance;
    }
    
    // Check if R2 credentials are available
    this.isConfigured = !!(
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_ENDPOINT
    );
    
    if (this.isConfigured) {
      this.client = new S3Client({
        endpoint: process.env.R2_ENDPOINT,
        region: 'auto',
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
        },
        // 🚀 OPTIMIZED: Maximum speed for direct uploads
        maxAttempts: 3, // Faster retries
        requestHandler: {
          connectionTimeout: 5000, // 5s for faster connection
          socketTimeout: 600000, // 10 minutes for large file transfers
          requestTimeout: 600000 // 10 minutes request timeout
        },
        // 🔥 ADVANCED: Enhanced throughput settings
        forcePathStyle: false, // Use virtual-hosted style for better performance
        useAccelerateEndpoint: false // Disable acceleration for R2
      });
      
      this.bucket = process.env.R2_BUCKET_NAME;
      
    } else {
      this.client = null;
      this.bucket = null;
    }
    
    R2Client.instance = this;
  }
  
  isAvailable() {
    return this.isConfigured && this.client !== null;
  }
  
  async healthCheck() {
    if (!this.isAvailable()) {
      return false;
    }
    
    try {
      const command = new HeadBucketCommand({ Bucket: this.bucket });
      await this.client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  generateKey(orderId, filename) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now();
    // Sanitize filename to prevent path traversal
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `orders/${year}/${month}/order-${orderId}/${timestamp}-${sanitizedFilename}`;
  }
  
  async upload(key, buffer, mimetype) {
    if (!this.isAvailable()) {
      throw new Error('R2 client not configured');
    }
    
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
        // Add metadata for tracking
        Metadata: {
          'uploaded-at': new Date().toISOString()
        }
      });
      
      await this.client.send(command);
      return {
        key,
        bucket: this.bucket,
        url: `https://${this.bucket}.r2.cloudflarestorage.com/${key}`
      };
    } catch (error) {
      throw error;
    }
  }
  
  async getPresignedUploadUrl(key, mimetype) {
    if (!this.isAvailable()) {
      throw new Error('R2 client not configured');
    }
    
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimetype
    });
    
    const url = await getSignedUrl(this.client, command, { 
      expiresIn: 21600 // 6 HOURS for large file uploads
    });
    
    return url;
  }
  
  async getPresignedDownloadUrl(key, disposition = 'attachment', filename = null) {
    if (!this.isAvailable()) {
      throw new Error('R2 client not configured');
    }
    
    const params = {
      Bucket: this.bucket,
      Key: key
    };
    
    // Add response headers for disposition
    if (disposition === 'attachment' && filename) {
      params.ResponseContentDisposition = `attachment; filename="${filename}"`;
      params.ResponseContentType = 'application/octet-stream';
    } else if (disposition === 'inline') {
      params.ResponseContentDisposition = 'inline';
    }
    
    const command = new GetObjectCommand(params);
    
    const url = await getSignedUrl(this.client, command, { 
      expiresIn: 3600 // 1 hour
    });
    
    return url;
  }
  
  async getPresignedPrintUrl(key, mimetype, filename) {
    if (!this.isAvailable()) {
      throw new Error('R2 client not configured');
    }
    
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: `inline; filename="${filename}"`,
      ResponseContentType: mimetype
    });
    
    const url = await getSignedUrl(this.client, command, { 
      expiresIn: 3600 // 1 hour
    });
    
    return url;
  }
  
  async delete(key) {
    if (!this.isAvailable()) {
      throw new Error('R2 client not configured');
    }
    
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      });
      
      await this.client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 🗑️ BATCH DELETE: Delete multiple files efficiently
   * Uses parallel deletion for better performance
   */
  async batchDelete(keys) {
    if (!this.isAvailable()) {
      return { success: [], failed: [] };
    }
    
    if (!keys || keys.length === 0) {
      return { success: [], failed: [] };
    }
    
    const results = {
      success: [],
      failed: []
    };
    
    // Process deletions in parallel (max 10 concurrent for safety)
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < keys.length; i += batchSize) {
      batches.push(keys.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      const deletePromises = batch.map(async (key) => {
        try {
          const success = await this.delete(key);
          if (success) {
            results.success.push(key);
          } else {
            results.failed.push({ key, error: 'Delete operation returned false' });
          }
        } catch (error) {
          results.failed.push({ key, error: error.message });
        }
      });
      
      await Promise.all(deletePromises);
    }
    
    return results;
  }
  
  async exists(key) {
    if (!this.isAvailable()) {
      return false;
    }
    
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key
      });
      
      await this.client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 🎯 DIRECT UPLOAD ONLY: Simplified upload for all file sizes
   * All files use single direct upload regardless of size
   */
  async intelligentUpload(key, buffer, mimetype) {
    return await this.upload(key, buffer, mimetype);
  }
  
  /**
   * 🔥 BATCH PRESIGNED URLs for direct frontend uploads
   * Optimized for 15 parallel uploads per order
   */
  async getBatchPresignedUrls(files, orderId) {
    if (!this.isAvailable()) {
      throw new Error('R2 client not configured');
    }
    
    // 🚀 CRITICAL FIX: Use Promise.allSettled to prevent array length mismatch
    // This ensures we ALWAYS get a result for each file, even if some fail
    const urlPromises = files.map(async (file, index) => {
      const key = this.generateKey(orderId, file.name);
      
      try {
        // ALWAYS USE DIRECT UPLOAD - Single part uploads only
        const url = await this.getPresignedUploadUrl(key, file.type);
        return {
          filename: file.name,
          key: key,
          uploadType: 'direct',
          uploadUrl: url,
          size: file.size,
          index: index // CRITICAL: Track original index
        };
      } catch (error) {
        // 🛡️ CRITICAL: Return error object instead of throwing
        // This maintains array length and prevents silent file drops
        console.error(`❌ Failed to generate URL for file ${file.name}:`, error);
        return {
          filename: file.name,
          key: key,
          uploadType: 'direct',
          uploadUrl: null, // Explicit null for failed URLs
          size: file.size,
          index: index,
          error: error.message || 'Failed to generate upload URL'
        };
      }
    });
    
    // 🚀 BULLETPROOF: Use Promise.allSettled to handle partial failures
    const settledResults = await Promise.allSettled(urlPromises);
    
    // Extract results and maintain original array order/length
    const results = settledResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Handle any rejected promises
        console.error(`❌ Promise rejected for file ${files[index]?.name}:`, result.reason);
        return {
          filename: files[index]?.name || `file_${index}`,
          key: this.generateKey(orderId, files[index]?.name || `file_${index}`),
          uploadType: 'direct',
          uploadUrl: null,
          size: files[index]?.size || 0,
          index: index,
          error: result.reason?.message || 'Promise rejected'
        };
      }
    });
    
    // 🚨 BULLETPROOF VALIDATION: Critical array length check
    if (results.length !== files.length) {
      console.error(`❌ [R2-CRITICAL] ARRAY LENGTH CATASTROPHE: ${files.length} input files → ${results.length} output results`);
      console.error(`❌ [R2-CRITICAL] Input files:`, files.map((f, i) => `${i}: ${f.name}`));
      console.error(`❌ [R2-CRITICAL] Output results:`, results.map((r, i) => `${i}: ${r?.filename || 'MISSING'}`));
      throw new Error(`R2 URL generation array length mismatch: ${files.length} → ${results.length}`);
    }
    
    // 🔍 DIAGNOSTIC: Log array length consistency
    console.log(`🔍 [R2-SUCCESS] URL Generation: ${files.length} files requested, ${results.length} URLs generated`);
    const successCount = results.filter(r => r.uploadUrl).length;
    const failCount = results.length - successCount;
    
    if (failCount > 0) {
      console.warn(`⚠️ [R2-PARTIAL] ${failCount}/${results.length} files failed URL generation`);
      results.filter(r => !r.uploadUrl).forEach(r => {
        console.warn(`   - ${r.filename}: ${r.error}`);
      });
    } else {
      console.log(`✅ [R2-PERFECT] All ${files.length} files got valid URLs`);
    }
    
    return results;
  }
}

// Export singleton instance
export default new R2Client();