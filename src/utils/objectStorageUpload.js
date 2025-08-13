// 🚀 OBJECT STORAGE UPLOAD UTILITY
// Handles uploading files from memory to object storage

import { Storage } from '@google-cloud/storage';

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const DEFAULT_BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || 'replit-objstore-1b4dcb0d-4d6c-4bd5-9fa1-4c7d43cf178f';
const PRIVATE_OBJECT_DIR = process.env.PRIVATE_OBJECT_DIR || '/replit-objstore-1b4dcb0d-4d6c-4bd5-9fa1-4c7d43cf178f/.private';

// Initialize Google Cloud Storage client for Replit
const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

/**
 * Upload file buffer to object storage
 * @param {Buffer} fileBuffer - File data in memory
 * @param {string} originalName - Original filename
 * @param {string} mimetype - File MIME type
 * @returns {Promise<string>} - Object storage path
 */
export async function uploadFileToObjectStorage(fileBuffer, originalName, mimetype) {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const extension = originalName.split('.').pop() || '';
    const filename = `files-${timestamp}-${randomSuffix}.${extension}`;
    
    // Construct object path in private directory
    const objectPath = `${PRIVATE_OBJECT_DIR}/uploads/${filename}`;
    
    // Parse bucket and object name from path
    const bucketName = DEFAULT_BUCKET_ID;
    const objectName = `uploads/${filename}`;
    
    console.log(`📤 Uploading file to object storage: ${filename} (${fileBuffer.length} bytes)`);
    
    // Get bucket reference
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    // Upload file buffer
    const stream = file.createWriteStream({
      metadata: {
        contentType: mimetype,
        metadata: {
          originalName: originalName,
          uploadedAt: new Date().toISOString()
        }
      }
    });
    
    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        console.error(`❌ Upload failed for ${filename}:`, error);
        reject(new Error(`Failed to upload ${filename}: ${error.message}`));
      });
      
      stream.on('finish', () => {
        console.log(`✅ Successfully uploaded ${filename} to object storage`);
        
        // Return object storage path that matches frontend expectations
        const objectStoragePath = `/objects/.private/uploads/${filename}`;
        resolve({
          path: objectStoragePath,
          filename: filename,
          originalName: originalName,
          mimetype: mimetype,
          size: fileBuffer.length
        });
      });
      
      stream.end(fileBuffer);
    });
    
  } catch (error) {
    console.error('❌ Object storage upload error:', error);
    throw new Error(`Object storage upload failed: ${error.message}`);
  }
}

/**
 * Upload multiple files to object storage
 * @param {Array} files - Array of file objects with buffer, originalname, mimetype
 * @returns {Promise<Array>} - Array of uploaded file info
 */
export async function uploadFilesToObjectStorage(files) {
  if (!files || files.length === 0) {
    return [];
  }
  
  console.log(`🚀 PARALLEL UPLOAD: ${files.length} files (NO COMPRESSION - ORIGINAL SIZES)`);
  
  // Upload all files in parallel for maximum speed
  const uploadPromises = files.map(file => {
    console.log(`📤 Uploading ${file.originalname} (${file.buffer.length} bytes) - ORIGINAL SIZE`);
    return uploadFileToObjectStorage(file.buffer, file.originalname, file.mimetype);
  });
  
  try {
    const results = await Promise.all(uploadPromises);
    console.log(`✅ Successfully uploaded ${results.length} files to object storage`);
    return results;
  } catch (error) {
    console.error('❌ Batch upload failed:', error);
    throw error;
  }
}