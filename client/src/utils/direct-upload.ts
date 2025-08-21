// Define upload file interface

// Define upload file interface
export interface DirectUploadFile {
  file: File;
  uploadUrl?: string;
  key?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  speed?: number;
  error?: string;
  multipartId?: string;
  partUrls?: string[];
  partSize?: number;
  totalParts?: number;
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
 * Upload multipart file in chunks
 */
async function uploadMultipartFile(
  file: File,
  partUrls: string[],
  partSize: number,
  onProgress: (progress: number) => void
): Promise<Array<{PartNumber: number, ETag: string}>> {
  const parts: Array<{PartNumber: number, ETag: string}> = [];
  const totalParts = partUrls.length;
  let uploadedParts = 0;
  
  // Upload parts in parallel (max 5 concurrent)
  const maxConcurrent = 5;
  
  for (let i = 0; i < totalParts; i += maxConcurrent) {
    const batch = Math.min(maxConcurrent, totalParts - i);
    const batchPromises = [];
    
    for (let j = 0; j < batch; j++) {
      const partNumber = i + j + 1;
      const start = (partNumber - 1) * partSize;
      const end = Math.min(start + partSize, file.size);
      const partBlob = file.slice(start, end);
      
      const uploadPart = async () => {
        const response = await fetch(partUrls[partNumber - 1], {
          method: 'PUT',
          body: partBlob,
          headers: {
            'Content-Type': file.type || 'application/octet-stream'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to upload part ${partNumber}`);
        }
        
        const etag = response.headers.get('ETag') || '';
        uploadedParts++;
        onProgress(Math.round((uploadedParts / totalParts) * 100));
        return { PartNumber: partNumber, ETag: etag };
      };
      
      batchPromises.push(uploadPart());
    }
    
    const batchResults = await Promise.all(batchPromises);
    parts.push(...batchResults);
  }
  
  return parts.sort((a, b) => a.PartNumber - b.PartNumber);
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
    
    // Track upload progress
    xhr.upload.onprogress = (event: ProgressEvent) => {
      if (event.lengthComputable) {
        const currentTime = Date.now();
        const timeDiff = (currentTime - lastTime) / 1000; // Convert to seconds
        const bytesDiff = event.loaded - lastLoaded;
        
        // Calculate speed (bytes per second)
        const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;
        
        // Update tracking variables
        lastLoaded = event.loaded;
        lastTime = currentTime;
        
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
    
    // Set content type from file MIME type
    if (file.type) {
      xhr.setRequestHeader('Content-Type', file.type);
    }
    
    xhr.send(file);
  });
}

/**
 * 🚀 Upload multiple files directly to R2 in parallel
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
    const fileSize = Math.round(file.size/1024/1024);
    
    // Handle both direct and multipart upload types
    if (urlInfo?.uploadType === 'multipart') {
      return {
        file,
        uploadUrl: undefined, // No direct URL for multipart uploads
        key: urlInfo.key,
        progress: 0,
        status: 'pending' as const,
        multipartId: urlInfo.uploadId, // Store multipart ID separately
        partUrls: urlInfo.partUrls,
        partSize: urlInfo.partSize,
        totalParts: urlInfo.totalParts
      };
    }
    
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

  // Upload files in parallel with optimized concurrency
  const maxConcurrent = 5; // 5 concurrent uploads for optimal bandwidth utilization
  const uploadPromises: Promise<void>[] = [];

  for (let i = 0; i < uploadFiles.length; i += maxConcurrent) {
    const batch = uploadFiles.slice(i, i + maxConcurrent);
    const batchNumber = Math.floor(i / maxConcurrent) + 1;
    const totalBatches = Math.ceil(uploadFiles.length / maxConcurrent);
    
    const batchPromises = batch.map(async (uploadFile) => {
      if (!uploadFile.uploadUrl) {
        // Handle multipart upload
        if (uploadFile.multipartId && uploadFile.partUrls && uploadFile.partSize) {
          uploadFile.status = 'uploading';
          try {
            const parts = await uploadMultipartFile(
              uploadFile.file,
              uploadFile.partUrls,
              uploadFile.partSize,
              (progress) => {
                uploadFile.progress = progress;
                const overallProgress = Math.round((uploadedBytes + (uploadFile.file.size * progress / 100)) / totalBytes * 100);
                if (onProgress) {
                  onProgress({
                    totalFiles: files.length,
                    completedFiles: completedCount,
                    currentFile: uploadFile.file.name,
                    overallProgress,
                    uploadSpeed: 0,
                    estimatedTime: 0,
                    bytesUploaded: uploadedBytes,
                    totalBytes
                  });
                }
              }
            );
            
            // Complete multipart upload
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const completeResponse = await fetch(`/api/orders/${orderId}/complete-multipart`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                key: uploadFile.key,
                uploadId: uploadFile.multipartId,
                parts: parts
              })
            });
            
            if (!completeResponse.ok) {
              throw new Error('Failed to complete multipart upload');
            }
            
            uploadFile.status = 'completed';
            uploadFile.progress = 100;
            uploadedBytes += uploadFile.file.size;
            completedCount++;
          } catch (error) {
            uploadFile.status = 'error';
            uploadFile.error = error instanceof Error ? error.message : 'Multipart upload failed';
          }
        } else {
          // Skip if no upload info
          uploadFile.status = 'error';
          uploadFile.error = 'No upload URL available';
        }
        return;
      }

      uploadFile.status = 'uploading';
      let fileUploadedBytes = 0;

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
                uploadSpeed: totalSpeed, // Use totalSpeed from all parallel uploads
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
      } catch (error) {
        uploadFile.status = 'error';
        uploadFile.error = error instanceof Error ? error.message : 'Upload failed';
      }
    });

    // Wait for batch to complete before starting next batch
    await Promise.all(batchPromises);
  }

  const totalTime = (Date.now() - batchStartTime) / 1000;
  const avgSpeed = totalBytes / totalTime;
  
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
    } catch (confirmError: any) {
      // Don't throw - allow order creation to complete even if confirmation fails
    }
  }

  return {
    success: completedCount === files.length,
    uploadedFiles: uploadFiles
  };
}