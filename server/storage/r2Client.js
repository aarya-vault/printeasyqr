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
        // Performance optimizations
        maxAttempts: 3,
        requestHandler: {
          connectionTimeout: 5000,
          socketTimeout: 60000
        }
      });
      
      this.bucket = process.env.R2_BUCKET_NAME;
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
      expiresIn: 3600 // 1 hour
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
}

// Export singleton instance
export default new R2Client();