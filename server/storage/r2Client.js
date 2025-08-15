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
      
      // 🚀 MULTIPART UPLOAD CONFIGURATION
      this.multipartThreshold = 100 * 1024 * 1024; // 100MB - Use multipart for files larger than this
      this.partSize = 10 * 1024 * 1024; // 10MB per part for optimal speed
      this.maxConcurrentParts = 10; // Upload 10 parts simultaneously
      
      console.log('✅ R2 Client initialized with bucket:', this.bucket);
    } else {
      console.log('⚠️ R2 Client not configured - missing credentials');
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
      console.log('✅ R2 health check passed');
      return true;
    } catch (error) {
      console.error('❌ R2 health check failed:', error.message);
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
      console.log('✅ Uploaded to R2:', key);
      return {
        key,
        bucket: this.bucket,
        url: `https://${this.bucket}.r2.cloudflarestorage.com/${key}`
      };
    } catch (error) {
      console.error('❌ R2 upload failed:', error);
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
      console.log('✅ Deleted from R2:', key);
      return true;
    } catch (error) {
      console.error('❌ R2 delete failed:', error);
      return false;
    }
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
    console.log(`🚀 Starting multipart upload for ${key} (${Math.round(fileSize/1024/1024)}MB)`);
    
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
      console.log(`✅ Multipart upload initiated: ${UploadId}`);
      
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
            console.log(`✅ Part ${i + 1}/${totalParts} uploaded`);
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
      console.log(`🎉 Multipart upload completed: ${key}`);
      
      return {
        key,
        bucket: this.bucket,
        url: `https://${this.bucket}.r2.cloudflarestorage.com/${key}`,
        uploadType: 'multipart',
        totalParts: parts.length
      };
      
    } catch (error) {
      console.error('❌ Multipart upload failed:', error);
      
      // Attempt to abort the multipart upload
      if (UploadId) {
        try {
          await this.client.send(new AbortMultipartUploadCommand({
            Bucket: this.bucket,
            Key: key,
            UploadId
          }));
          console.log('🗑️ Aborted failed multipart upload');
        } catch (abortError) {
          console.error('Failed to abort multipart upload:', abortError);
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
    
    // Use multipart for large files (>100MB)
    if (fileSize > this.multipartThreshold) {
      console.log(`🚀 Large file detected (${Math.round(fileSize/1024/1024)}MB) - Using multipart upload`);
      return await this.multipartUpload(key, buffer, mimetype);
    } else {
      console.log(`📤 Standard upload for ${Math.round(fileSize/1024/1024)}MB file`);
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
    
    console.log(`🚀 Generating ${files.length} presigned URLs for direct upload`);
    
    // Process in parallel for maximum speed
    const urlPromises = files.map(async (file, index) => {
      const key = this.generateKey(orderId, file.name);
      
      // For large files, create multipart upload
      if (file.size > this.multipartThreshold) {
        const createCommand = new CreateMultipartUploadCommand({
          Bucket: this.bucket,
          Key: key,
          ContentType: file.type
        });
        
        const { UploadId } = await this.client.send(createCommand);
        
        return {
          filename: file.name,
          key: key,
          uploadType: 'multipart',
          uploadId: UploadId,
          size: file.size
        };
      } else {
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
    console.log(`✅ Generated ${results.length} presigned URLs`);
    
    return results;
  }
}

// Export singleton instance
export default new R2Client();