// Bulletproof print function using Print Host pattern with window monitoring
export const printFile = async (file: any, orderStatus?: string): Promise<void> => {
  // Check if order is completed - files are deleted after completion
  if (orderStatus === 'completed') {
    throw new Error('Files are no longer available for completed orders');
  }
  
  // Build the correct file URL based on storage type
  let fileUrl;
  const storageType = file.storageType || 'local';
  
  if (storageType === 'r2' && file.r2Key) {
    // For R2 files, use the key and indicate it's from R2
    fileUrl = `/api/download/${file.r2Key}?storageType=r2&originalName=${encodeURIComponent(file.originalName || file.filename || 'file')}`;
  } else if (file.path) {
    // Keep full path with uploads/ prefix for local storage
    fileUrl = `/api/download/${file.path}?storageType=local`;
  } else {
    fileUrl = `/api/download/${file.filename || file}?storageType=local`;
  }
  
  const filename = file.originalName || file.filename || file;
  console.log(`🖨️ Preparing to print: ${filename}`);

  // Detect file type for smart printing
  const getFileType = (file: any) => {
    const mimetype = file.mimetype || '';
    const filename = file.originalName || file.filename || '';
    
    if (mimetype.startsWith('image/') || filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
      return 'image';
    }
    return 'pdf'; // Default to PDF handling
  };
  
  const fileType = getFileType(file);
  const printHostUrl = `/api/print-host?file=${encodeURIComponent(fileUrl)}&type=${fileType}`;
  
  const printWindow = window.open(printHostUrl, '_blank', 'width=800,height=600');

  if (!printWindow) {
    // This is the ONLY correct fallback. Inform the user.
    console.error('Popup blocked. Cannot open print host.');
    throw new Error('Please allow popups for this site to print files.');
  }

  // BULLETPROOF FIX: Monitor the window instead of using setTimeout
  // Wait until the user closes the print window before continuing
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      // When the user closes the window, printWindow.closed becomes true
      if (printWindow.closed) {
        clearInterval(checkInterval); // Stop checking
        console.log(`✅ Window for ${filename} closed. Continuing...`);
        resolve();
      }
    }, 500); // Check every half-second
  });
};

// Direct download function - super easy, no prompts
export const downloadFile = (file: any, orderStatus?: string): void => {
  // Check if file is accessible before attempting to download
  if (orderStatus === 'completed') {
    console.warn('Cannot download file: File deleted after order completion');
    throw new Error('File no longer available - deleted after order completion');
  }

  // Handle both R2 and local storage
  let downloadPath;
  const storageType = file.storageType || 'local';
  
  if (storageType === 'r2' && file.r2Key) {
    // For R2 files, use the key and force download
    downloadPath = `/api/download/${file.r2Key}?download=true&storageType=r2&originalName=${encodeURIComponent(file.originalName || file.filename || 'download')}`;
  } else if (file.path) {
    // Keep full path with uploads/ prefix for local storage
    downloadPath = `/api/download/${file.path}?download=true&storageType=local`;
  } else if (file.filename) {
    // Use filename directly
    downloadPath = `/api/download/${file.filename}?download=true&storageType=local`;
  } else {
    // Fallback for string filename
    downloadPath = `/api/download/${file}?download=true&storageType=local`;
  }
  
  // Use the original filename if available, otherwise fall back to the generated filename
  const originalName = file.originalName || file.filename || 'document.pdf';
  
  // Force direct download without "Save As" dialog using programmatic approach
  const link = document.createElement('a');
  link.href = `${downloadPath}?download=true&originalName=${encodeURIComponent(originalName)}`;
  link.download = originalName;
  link.style.display = 'none';
  
  // Add to DOM, click, and remove immediately
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log(`📥 Direct download triggered: ${originalName}`);
};

// Download all files at once (simple and direct)
export const downloadAllFiles = (
  files: any[],
  onProgress?: (current: number, total: number) => void,
  orderStatus?: string
): void => {
  // Check if files are accessible before attempting to download
  if (orderStatus === 'completed') {
    console.warn('Cannot download files: Files deleted after order completion');
    throw new Error('Files no longer available - deleted after order completion');
  }

  // Simple sequential download with a small delay between files
  files.forEach((file, index) => {
    setTimeout(() => {
      downloadFile(file, orderStatus);
      if (onProgress) {
        onProgress(index + 1, files.length);
      }
    }, index * 500); // 500ms delay between downloads
  });
};

// Bulletproof bulk print function using window monitoring - handles 100s of files up to 500MB each
export const printAllFiles = async (
  files: any[],
  onProgress?: (current: number, total: number) => void,
  orderStatus?: string
): Promise<void> => {
  // Check if files are accessible before attempting to print
  if (orderStatus === 'completed') {
    throw new Error('Files no longer available');
  }

  console.log(`🖨️ Starting bulletproof batch print for ${files.length} files`);
  
  // Calculate total size for optimization decisions
  const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
  const isHeavyBatch = totalSize > 100 * 1024 * 1024 || files.length > 50; // Over 100MB total or 50+ files
  
  // Optimized delays since we're waiting for window close, not guessing
  const getDelay = (file: any) => {
    const fileSize = file.size || 0;
    if (fileSize > 100 * 1024 * 1024) return 1000; // 1s for files over 100MB
    if (fileSize > 50 * 1024 * 1024) return 750;   // 0.75s for files over 50MB
    return 250;                                     // 0.25s for smaller files
  };
  
  // Process files with bulletproof window monitoring
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`📄 Printing file ${i + 1}/${files.length}: ${file.originalName || file.filename || 'unnamed'}`);
    
    try {
      // This await is now tied to the user closing the window, not a timer
      await printFile(file, orderStatus); 
      if (onProgress) onProgress(i + 1, files.length);
    } catch (error) {
      console.error(`Failed to print file ${i + 1}:`, (error as Error).message);
      // Optional: Update UI to show this specific file failed
    }
    
    // Smart delay between prints
    if (i < files.length - 1) {
      const delay = getDelay(file);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Extra pause every 10 files for heavy batches to optimize browser performance
      if (isHeavyBatch && (i + 1) % 10 === 0) {
        console.log('⏸️ Smart pause to optimize browser performance...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  console.log(`✅ Batch print completed: ${files.length} files processed.`);
};