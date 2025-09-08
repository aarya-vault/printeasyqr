// Define upload file interface
export interface DirectUploadFile {
  file: File;
  uploadUrl?: string;
  key?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  speed?: number;
  error?: string;
}

export interface DirectUploadProgress {
  totalFiles: number;
  completedFiles: number;
  currentFile: string;
  overallProgress: number;
  uploadSpeed: number;
  estimatedTime: number;
  bytesUploaded: number;
  totalBytes: number;
}

/**
 * 🚀 Get presigned URLs for direct R2 upload (no proxy)
 */
export async function getDirectUploadUrls(
  files: File[],
  orderId: string | number
): Promise<{ useDirectUpload: boolean; uploadUrls?: any[] }> {
  
  try {
    // Try multiple token storage locations for compatibility
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    // JWT token is REQUIRED for R2 direct upload
    if (!token) {
      return { useDirectUpload: false };
    }
    
    const fileDetails = files.map(f => ({
      name: f.name,
      type: f.type,
      size: f.size
    }));
    
    const response = await fetch(`/api/orders/${orderId}/get-upload-urls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        files: fileDetails
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { useDirectUpload: false };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    return { useDirectUpload: false };
  }
}

/**
 * 🎯 Upload a single file directly to R2 without server proxy
 */
async function uploadFileDirectly(
  file: File,
  uploadUrl: string,
  onProgress?: (loaded: number, total: number, speed: number) => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const startTime = Date.now();
    let lastLoaded = 0;
    let lastTime = startTime;
    
    // Track upload progress with fixed speed calculation
    xhr.upload.onprogress = (event: ProgressEvent) => {
      if (event.lengthComputable) {
        const currentTime = Date.now();
        const timeDiff = (currentTime - lastTime) / 1000; // Convert to seconds
        const bytesDiff = event.loaded - lastLoaded;
        
        // Calculate speed with better smoothing to avoid speed drops
        let speed = 0;
        if (timeDiff > 0.05) { // Reduce interval for more responsive calculation
          speed = bytesDiff / timeDiff;
          lastLoaded = event.loaded;
          lastTime = currentTime;
        } else if (event.loaded > 0) {
          // Use average speed from start if interval too short
          const totalTime = (currentTime - startTime) / 1000;
          speed = totalTime > 0.5 ? event.loaded / totalTime : bytesDiff / 0.05; // Better fallback speed
        }
        
        const progressPercent = Math.round((event.loaded / event.total) * 100);
        const uploadedMB = (event.loaded / (1024 * 1024)).toFixed(2);
        const totalMB = (event.total / (1024 * 1024)).toFixed(2);
        const speedMBps = (speed / (1024 * 1024)).toFixed(2);
        
        // Call progress callback
        if (onProgress) {
          onProgress(event.loaded, event.total, speed);
        }
      }
    };
    
    // Handle upload completion
    xhr.onload = () => {
      const totalTime = (Date.now() - startTime) / 1000;
      const avgSpeed = (file.size / totalTime / (1024 * 1024)).toFixed(2);
      
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    };
    
    // Handle network errors
    xhr.onerror = () => {
      const totalTime = (Date.now() - startTime) / 1000;
      reject(new Error('Network error during upload'));
    };
    
    xhr.open('PUT', uploadUrl, true);
    
    // Set longer timeout for large files (6 hours to match presigned URL)
    xhr.timeout = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
    
    // Set content type from file MIME type
    if (file.type) {
      xhr.setRequestHeader('Content-Type', file.type);
    }
    
    xhr.send(file);
  });
}

/**
 * 🚀 Upload multiple files directly to R2 with 15 parallel uploads for optimal performance
 */
export async function uploadFilesDirectlyToR2(
  files: File[],
  orderId: string | number,
  onProgress?: (progress: DirectUploadProgress) => void
): Promise<{ success: boolean; uploadedFiles: DirectUploadFile[] }> {
  const batchStartTime = Date.now();
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  
  // Check authentication first - try multiple token locations
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  if (!token) {
    return { success: false, uploadedFiles: [] };
  }
  
  // Get presigned URLs for direct upload
  const { useDirectUpload, uploadUrls } = await getDirectUploadUrls(files, orderId);
  
  if (!useDirectUpload || !uploadUrls || uploadUrls.length === 0) {
    return { success: false, uploadedFiles: [] };
  }

  const uploadFiles: DirectUploadFile[] = files.map((file, index) => {
    const urlInfo = uploadUrls[index];
    
    return {
      file,
      uploadUrl: urlInfo?.uploadUrl,
      key: urlInfo?.key,
      progress: 0,
      status: 'pending' as const
    };
  });

  let completedCount = 0;
  let totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  let uploadedBytes = 0;

  // 🚀 OPTIMIZED 15 PARALLEL UPLOADS: Maximum performance per order
  const maxConcurrent = Math.min(15, files.length); // Always use 15 parallel uploads
  
  for (let i = 0; i < uploadFiles.length; i += maxConcurrent) {
    const batch = uploadFiles.slice(i, i + maxConcurrent);
    const batchNumber = Math.floor(i / maxConcurrent) + 1;
    const totalBatches = Math.ceil(uploadFiles.length / maxConcurrent);
    
    console.log(`🚀 Starting batch ${batchNumber}/${totalBatches} with ${batch.length} files`);
    
    const batchPromises = batch.map(async (uploadFile) => {
      if (!uploadFile.uploadUrl) {
        uploadFile.status = 'error';
        uploadFile.error = 'No upload URL available';
        return;
      }

      uploadFile.status = 'uploading';
      let fileUploadedBytes = 0;
      const batchStartTime = Date.now();

      try {
        await uploadFileDirectly(
          uploadFile.file,
          uploadFile.uploadUrl, // Direct R2 URL - no proxy!
          (loaded, total, speed) => {
            // Update individual file progress
            uploadFile.progress = Math.round((loaded / total) * 100);
            uploadFile.speed = speed;

            // Update overall progress
            const byteDiff = loaded - fileUploadedBytes;
            uploadedBytes += byteDiff;
            fileUploadedBytes = loaded;

            const currentTime = Date.now();
            const elapsedTime = (currentTime - batchStartTime) / 1000;
            
            // Calculate aggregate speed from all parallel uploads
            let totalSpeed = 0;
            let activeUploads = 0;
            uploadFiles.forEach(f => {
              if (f.status === 'uploading' && f.speed) {
                totalSpeed += f.speed;
                activeUploads++;
              }
            });
            
            const remainingBytes = totalBytes - uploadedBytes;
            const estimatedTime = totalSpeed > 0 ? Math.round(remainingBytes / totalSpeed) : 0;

            if (onProgress) {
              onProgress({
                totalFiles: files.length,
                completedFiles: completedCount,
                currentFile: uploadFile.file.name,
                overallProgress: Math.round((uploadedBytes / totalBytes) * 100),
                uploadSpeed: totalSpeed, // Use totalSpeed from all 15 parallel uploads
                estimatedTime,
                bytesUploaded: uploadedBytes,
                totalBytes
              });
            }
          }
        );

        uploadFile.status = 'completed';
        uploadFile.progress = 100;
        completedCount++;
        
        console.log(`✅ File completed: ${uploadFile.file.name} (${completedCount}/${files.length})`);
        
      } catch (error) {
        uploadFile.status = 'error';
        uploadFile.error = error instanceof Error ? error.message : 'Upload failed';
        console.error(`❌ File failed: ${uploadFile.file.name}`, error);
      }
    });

    // Wait for batch to complete before starting next batch
    await Promise.all(batchPromises);
  }

  const totalTime = (Date.now() - batchStartTime) / 1000;
  const avgSpeed = totalBytes / totalTime;
  
  console.log(`🎯 Upload completed: ${completedCount}/${files.length} files in ${totalTime.toFixed(2)}s`);
  console.log(`📊 Average speed: ${(avgSpeed / (1024 * 1024)).toFixed(2)} MB/s`);
  
  // Confirm successful uploads with the server
  if (completedCount > 0) {
    try {
      const successfulFiles = uploadFiles.filter(f => f.status === 'completed');
      const confirmData = successfulFiles.map(f => ({
        r2Key: f.key!,
        originalName: f.file.name,
        size: f.file.size,
        mimetype: f.file.type || 'application/octet-stream',
        bucket: 'printeasy-qr', // Use hardcoded bucket name
        filename: f.key!.split('/').pop() || f.file.name
      }));
      
      // Send confirmation to backend
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`/api/orders/${orderId}/confirm-files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ files: confirmData })
      });
      
      if (response.ok) {
        console.log('✅ File confirmations sent to backend');
      }
    } catch (confirmError: any) {
      console.warn('⚠️ File confirmation failed:', confirmError);
      // Don't throw - allow order creation to complete even if confirmation fails
    }
  }

  return {
    success: completedCount === files.length,
    uploadedFiles: uploadFiles
  };
}