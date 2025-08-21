import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand, HeadObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from '@aws-sdk/client-s3';
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
        // 🚀 ULTRA PERFORMANCE V2: Maximum speed optimizations
        maxAttempts: 3, // Faster retries
        requestHandler: {
          connectionTimeout: 5000, // 5s for faster connection
          socketTimeout: 300000, // 5 minutes for large file transfers
          requestTimeout: 300000 // 5 minutes request timeout
        },
        // 🔥 ADVANCED: Enhanced throughput settings
        forcePathStyle: false, // Use virtual-hosted style for better performance
        useAccelerateEndpoint: false // Disable acceleration for R2
      });
      
      this.bucket = process.env.R2_BUCKET_NAME;
      
      // 🚀 MULTIPART UPLOAD CONFIGURATION - OPTIMIZED FOR PERFORMANCE
      this.multipartThreshold = 10 * 1024 * 1024; // 10MB - Use multipart for files >10MB
      this.partSize = 10 * 1024 * 1024; // 10MB per part for optimal network utilization
      this.maxConcurrentParts = 5; // Upload 5 parts simultaneously for balanced performance
      
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
      expiresIn: 7200 // 2 hours for large file uploads
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
    
    
    if (results.failed.length > 0) {
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
   * 🚀 ULTRA-FAST MULTIPART UPLOAD for massive files
   * Breaks large files into chunks and uploads them in parallel
   */
  async multipartUpload(key, buffer, mimetype) {
    if (!this.isAvailable()) {
      throw new Error('R2 client not configured');
    }
    
    const fileSize = buffer.length;
    const startTime = Date.now();
    
    let UploadId;
    try {
      // Create multipart upload
      const createCommand = new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mimetype,
        Metadata: {
          'uploaded-at': new Date().toISOString(),
          'upload-type': 'multipart'
        }
      });
      
      const createResult = await this.client.send(createCommand);
      UploadId = createResult.UploadId;
      
      // Calculate parts
      const parts = [];
      const totalParts = Math.ceil(fileSize / this.partSize);
      
      // Upload parts in parallel batches
      const uploadPromises = [];
      
      for (let i = 0; i < totalParts; i++) {
        const start = i * this.partSize;
        const end = Math.min(start + this.partSize, fileSize);
        const partBuffer = buffer.slice(start, end);
        
        const uploadPromise = this.uploadPart(key, UploadId, i + 1, partBuffer)
          .then(etag => {
            return { PartNumber: i + 1, ETag: etag };
          });
        
        uploadPromises.push(uploadPromise);
        
        // Process in batches to avoid overwhelming the connection
        if (uploadPromises.length >= this.maxConcurrentParts || i === totalParts - 1) {
          const batchResults = await Promise.all(uploadPromises);
          parts.push(...batchResults);
          uploadPromises.length = 0; // Clear array
        }
      }
      
      // Complete multipart upload
      const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId,
        MultipartUpload: {
          Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber)
        }
      });
      
      const result = await this.client.send(completeCommand);
      
      return {
        key,
        bucket: this.bucket,
        url: `https://${this.bucket}.r2.cloudflarestorage.com/${key}`,
        uploadType: 'multipart',
        totalParts: parts.length
      };
      
    } catch (error) {
      // Attempt to abort the multipart upload
      if (UploadId) {
        try {
          await this.client.send(new AbortMultipartUploadCommand({
            Bucket: this.bucket,
            Key: key,
            UploadId
          }));
        } catch (abortError) {
          // Ignore abort errors
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Upload a single part of a multipart upload
   */
  async uploadPart(key, uploadId, partNumber, buffer) {
    const command = new UploadPartCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: buffer
    });
    
    const result = await this.client.send(command);
    return result.ETag;
  }
  
  /**
   * 💨 INTELLIGENT UPLOAD: Automatically choose between regular and multipart
   */
  async intelligentUpload(key, buffer, mimetype) {
    const fileSize = buffer.length;
    
    // Use multipart for files over 10MB (threshold changed from 50MB)
    if (fileSize > this.multipartThreshold) {
      return await this.multipartUpload(key, buffer, mimetype);
    } else {
      return await this.upload(key, buffer, mimetype);
    }
  }
  
  /**
   * 🔥 BATCH PRESIGNED URLs for direct frontend uploads
   */
  async getBatchPresignedUrls(files, orderId) {
    if (!this.isAvailable()) {
      throw new Error('R2 client not configured');
    }
    
    // Process in parallel for maximum speed
    const urlPromises = files.map(async (file, index) => {
      const key = this.generateKey(orderId, file.name);
      
      // Use multipart for files over 10MB
      if (file.size > this.multipartThreshold) {
        // For multipart, generate presigned URLs for each part
        const totalParts = Math.ceil(file.size / this.partSize);
        const createCommand = new CreateMultipartUploadCommand({
          Bucket: this.bucket,
          Key: key,
          ContentType: file.type
        });
        
        const { UploadId } = await this.client.send(createCommand);
        
        // Generate presigned URLs for each part
        const partUrls = [];
        for (let i = 1; i <= totalParts; i++) {
          const uploadPartCommand = new UploadPartCommand({
            Bucket: this.bucket,
            Key: key,
            UploadId,
            PartNumber: i
          });
          
          const partUrl = await getSignedUrl(this.client, uploadPartCommand, {
            expiresIn: 7200 // 2 hours
          });
          
          partUrls.push(partUrl);
        }
        
        return {
          filename: file.name,
          key: key,
          uploadType: 'multipart',
          uploadId: UploadId,
          partUrls: partUrls,
          partSize: this.partSize,
          totalParts: totalParts,
          size: file.size
        };
      } else {
        // Direct upload for files under 10MB
        const url = await this.getPresignedUploadUrl(key, file.type);
        return {
          filename: file.name,
          key: key,
          uploadType: 'direct',
          uploadUrl: url,
          size: file.size
        };
      }
    });
    
    const results = await Promise.all(urlPromises);
    
    return results;
  }
  
  /**
   * Complete a multipart upload after all parts are uploaded
   */
  async completeMultipartUpload(key, uploadId, parts) {
    if (!this.isAvailable()) {
      throw new Error('R2 client not configured');
    }
    
    const command = new CompleteMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber)
      }
    });
    
    const result = await this.client.send(command);
    return result;
  }
}

// Export singleton instance
export default new R2Client();