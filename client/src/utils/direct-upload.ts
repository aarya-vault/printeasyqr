// 🚀 TRUE R2 DIRECT UPLOAD SYSTEM
// Files upload directly to R2 with NO server proxy for maximum speed

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
    const token = localStorage.getItem('token');
    
    // JWT token is REQUIRED for R2 direct upload
    if (!token) {
      console.error('❌ No authentication token found - cannot use direct upload');
      return { useDirectUpload: false };
    }
    
    const response = await fetch(`/api/orders/${orderId}/get-upload-urls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        files: files.map(f => ({
          name: f.name,
          type: f.type,
          size: f.size
        }))
      })
    });

    if (!response.ok) {
      console.log(`⚠️ R2 upload not available: ${response.status}`);
      return { useDirectUpload: false };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get upload URLs:', error);
    return { useDirectUpload: false };
  }
}

/**
 * 🌍 Upload file DIRECTLY to R2 (no proxy) with progress tracking
 */
export async function uploadFileDirectly(
  file: File,
  uploadUrl: string,
  onProgress?: (loaded: number, total: number, speed: number) => void
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const startTime = Date.now();
    let lastLoaded = 0;
    let lastTime = startTime;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const currentTime = Date.now();
        const timeDiff = (currentTime - lastTime) / 1000;
        const bytesDiff = event.loaded - lastLoaded;
        const instantSpeed = timeDiff > 0 ? bytesDiff / timeDiff : 0;
        
        // Calculate average speed
        const totalTime = (currentTime - startTime) / 1000;
        const avgSpeed = totalTime > 0 ? event.loaded / totalTime : 0;
        
        // Use weighted average for stable speed
        const speed = instantSpeed * 0.3 + avgSpeed * 0.7;
        
        onProgress(event.loaded, event.total, speed);
        
        lastLoaded = event.loaded;
        lastTime = currentTime;
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log(`✅ Direct upload completed for ${file.name}`);
        resolve(true);
      } else if (xhr.status === 0) {
        // Status 0 usually means CORS failure
        console.error(`❌ CORS error detected for ${file.name} - falling back to server proxy`);
        reject(new Error('CORS_ERROR'));
      } else {
        console.error(`❌ Direct upload failed: ${xhr.status}`);
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      // Network errors are often CORS-related
      console.error('❌ Direct upload network error - likely CORS issue');
      reject(new Error('CORS_ERROR'));
    };

    // 🌍 TRUE DIRECT UPLOAD: Upload directly to R2 using presigned URL
    console.log(`🚀 Uploading ${file.name} directly to R2 (no server proxy)`);
    xhr.open('PUT', uploadUrl); // Direct to R2!
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    // No Authorization header needed - presigned URL has built-in auth
    xhr.send(file);
  });
}

/**
 * 🚀 Confirm files after successful R2 upload
 */
export async function confirmFilesUpload(
  orderId: string | number,
  files: { r2Key: string; originalName: string; size: number; mimetype: string }[]
) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required for file confirmation');
  }

  const response = await fetch(`/api/orders/${orderId}/confirm-files`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ files })
  });

  if (!response.ok) {
    throw new Error(`Failed to confirm files: ${response.status}`);
  }

  return response.json();
}

/**
 * 🚀 ULTRA-FAST: Upload multiple files directly to R2 in parallel
 */
export async function uploadFilesDirectlyToR2(
  files: File[],
  orderId: string | number,
  onProgress?: (progress: DirectUploadProgress) => void
): Promise<{ success: boolean; uploadedFiles: DirectUploadFile[] }> {
  console.log(`🚀 Starting TRUE R2 direct upload for ${files.length} files...`);
  
  // Check authentication first
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ Cannot upload without authentication');
    return { success: false, uploadedFiles: [] };
  }
  
  // Get presigned URLs for direct upload
  const { useDirectUpload, uploadUrls } = await getDirectUploadUrls(files, orderId);
  
  if (!useDirectUpload || !uploadUrls || uploadUrls.length === 0) {
    console.log('⚠️ Direct upload not available');
    return { success: false, uploadedFiles: [] };
  }

  const uploadFiles: DirectUploadFile[] = files.map((file, index) => {
    const urlInfo = uploadUrls[index];
    // Handle both direct and multipart upload types
    if (urlInfo?.uploadType === 'multipart') {
      console.log(`⚠️ File ${file.name} requires multipart upload (>100MB), using server fallback`);
      return {
        file,
        uploadUrl: undefined, // No direct URL for multipart
        key: urlInfo.key,
        progress: 0,
        status: 'error' as const,
        error: 'File too large for direct upload'
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
  const startTime = Date.now();

  // Upload files in parallel (max 3 concurrent for optimal speed)
  const maxConcurrent = 3;
  const uploadPromises: Promise<void>[] = [];

  for (let i = 0; i < uploadFiles.length; i += maxConcurrent) {
    const batch = uploadFiles.slice(i, i + maxConcurrent);
    
    const batchPromises = batch.map(async (uploadFile) => {
      if (!uploadFile.uploadUrl) {
        // Already marked as error (likely multipart file)
        if (uploadFile.status === 'error') {
          console.log(`⏭️ Skipping ${uploadFile.file.name}: ${uploadFile.error}`);
        } else {
          uploadFile.status = 'error';
          uploadFile.error = 'No upload URL';
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
            const elapsedTime = (currentTime - startTime) / 1000;
            const overallSpeed = elapsedTime > 0 ? uploadedBytes / elapsedTime : 0;
            const remainingBytes = totalBytes - uploadedBytes;
            const estimatedTime = overallSpeed > 0 ? Math.round(remainingBytes / overallSpeed) : 0;

            if (onProgress) {
              onProgress({
                totalFiles: files.length,
                completedFiles: completedCount,
                currentFile: uploadFile.file.name,
                overallProgress: Math.round((uploadedBytes / totalBytes) * 100),
                uploadSpeed: overallSpeed,
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
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        // If it's a CORS error, try server proxy fallback
        if (errorMessage === 'CORS_ERROR') {
          console.log(`🔄 Falling back to server proxy for ${uploadFile.file.name}`);
          
          try {
            // Upload via server proxy as fallback
            const formData = new FormData();
            formData.append('file', uploadFile.file);
            formData.append('orderId', orderId.toString());
            formData.append('key', uploadFile.key!);
            
            const proxyResponse = await fetch('/api/r2/proxy-upload', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: formData
            });
            
            if (proxyResponse.ok) {
              console.log(`✅ Server proxy upload succeeded for ${uploadFile.file.name}`);
              uploadFile.status = 'completed';
              uploadFile.progress = 100;
              completedCount++;
            } else {
              throw new Error('Server proxy upload failed');
            }
          } catch (proxyError) {
            console.error(`❌ Both direct and proxy upload failed for ${uploadFile.file.name}`);
            uploadFile.status = 'error';
            uploadFile.error = 'Upload failed - please try again';
          }
        } else {
          console.error(`Failed to upload ${uploadFile.file.name}:`, error);
          uploadFile.status = 'error';
          uploadFile.error = errorMessage;
        }
      }
    });

    // Wait for batch to complete before starting next batch
    await Promise.all(batchPromises);
  }

  const totalTime = (Date.now() - startTime) / 1000;
  const avgSpeed = totalBytes / totalTime;
  
  const totalTime = (Date.now() - startTime) / 1000;
  const avgSpeed = totalBytes / totalTime;
  
  // Check if we had CORS issues
  const corsErrors = uploadFiles.filter(f => f.error === 'CORS_ERROR').length;
  if (corsErrors > 0) {
    console.log(`⚠️ ${corsErrors} files had CORS issues and used fallback`);
  }
  
  console.log(`⚡ Upload completed in ${totalTime.toFixed(2)}s`);
  console.log(`📊 Average speed: ${(avgSpeed / (1024 * 1024)).toFixed(2)} MB/s`);
  console.log(`✅ Successfully uploaded ${completedCount}/${files.length} files`);

  // Confirm successful uploads with server
  if (completedCount > 0) {
    try {
      const successfulFiles = uploadFiles.filter(f => f.status === 'completed');
      const confirmData = successfulFiles.map(f => ({
        r2Key: f.key!,
        originalName: f.file.name,
        size: f.file.size,
        mimetype: f.file.type,
        bucket: process.env.VITE_R2_BUCKET_NAME || 'printeasy-qr',
        filename: f.key!.split('/').pop() || f.file.name
      }));

      console.log(`🔄 Confirming ${confirmData.length} successful uploads...`);
      await confirmFilesUpload(orderId, confirmData);
      console.log('✅ All ${confirmData.length} files uploaded directly to R2');
    } catch (confirmError) {
      console.error('❌ Failed to confirm uploads:', confirmError);
      // Don't fail the entire upload if confirmation fails
      // Files are already uploaded
    }
  }
  
  // Show warning if some files failed
  if (completedCount < files.length) {
    console.log(`⚠️ Some files may have failed to upload`);
  }

  return {
    success: completedCount === files.length,
    uploadedFiles: uploadFiles
  };
}