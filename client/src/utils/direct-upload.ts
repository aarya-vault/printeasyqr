// 🚀 ULTRA-FAST DIRECT R2 UPLOAD SYSTEM
// Bypasses server completely for 2x speed improvement

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
 * 🚀 Get presigned URLs for direct R2 upload (bypasses server)
 */
export async function getDirectUploadUrls(
  files: File[],
  orderId: string | number
): Promise<{ useDirectUpload: boolean; uploadUrls?: any[] }> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/orders/${orderId}/get-upload-urls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
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
      console.log('⚠️ Direct upload not available, falling back to server upload');
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
 * 🚀 Upload file directly to R2 with progress tracking
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
      } else {
        console.error(`❌ Direct upload failed: ${xhr.status}`);
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      console.error('❌ Direct upload network error');
      reject(new Error('Network error during upload'));
    };

    // Direct upload to R2 - no auth needed (presigned URL has auth)
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.send(file);
  });
}

/**
 * 🚀 ULTRA-FAST: Upload multiple files directly to R2 in parallel
 */
export async function uploadFilesDirectlyToR2(
  files: File[],
  orderId: string | number,
  onProgress?: (progress: DirectUploadProgress) => void
): Promise<{ success: boolean; uploadedFiles: DirectUploadFile[] }> {
  console.log(`🚀 Starting ultra-fast direct upload for ${files.length} files...`);
  
  // Get presigned URLs for direct upload
  const { useDirectUpload, uploadUrls } = await getDirectUploadUrls(files, orderId);
  
  if (!useDirectUpload || !uploadUrls) {
    console.log('⚠️ Direct upload not available');
    return { success: false, uploadedFiles: [] };
  }

  const uploadFiles: DirectUploadFile[] = files.map((file, index) => ({
    file,
    uploadUrl: uploadUrls[index]?.uploadUrl,
    key: uploadUrls[index]?.key,
    progress: 0,
    status: 'pending' as const
  }));

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
        uploadFile.status = 'error';
        uploadFile.error = 'No upload URL';
        return;
      }

      uploadFile.status = 'uploading';
      let fileUploadedBytes = 0;

      try {
        await uploadFileDirectly(
          uploadFile.file,
          uploadFile.uploadUrl,
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
        console.error(`Failed to upload ${uploadFile.file.name}:`, error);
        uploadFile.status = 'error';
        uploadFile.error = error instanceof Error ? error.message : 'Upload failed';
      }
    });

    // Wait for batch to complete before starting next batch
    await Promise.all(batchPromises);
  }

  const totalTime = (Date.now() - startTime) / 1000;
  const avgSpeed = totalBytes / totalTime;
  
  console.log(`⚡ Direct upload completed in ${totalTime.toFixed(2)}s`);
  console.log(`📊 Average speed: ${(avgSpeed / (1024 * 1024)).toFixed(2)} MB/s`);
  console.log(`✅ Successfully uploaded ${completedCount}/${files.length} files`);

  return {
    success: completedCount === files.length,
    uploadedFiles: uploadFiles
  };
}