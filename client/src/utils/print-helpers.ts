// Print function - simplified approach that just opens the file in new tab
export const printFile = async (file: any, orderStatus?: string): Promise<void> => {
  // Check if order is completed - files are deleted after completion
  if (orderStatus === 'completed') {
    console.log('❌ Cannot print file from completed order - files have been deleted');
    throw new Error('Files are no longer available for completed orders');
  }
  
  // Handle both old format (filename) and new format (path)
  // Files are stored in object storage - use path directly if it starts with /objects/
  let fileUrl;
  if (file.path) {
    // If path already starts with /objects/, use it directly
    fileUrl = file.path.startsWith('/objects/') ? file.path : `/objects/.private/${file.path}`;
  } else {
    // Fallback for old filename format
    fileUrl = `/objects/.private/uploads/${file.filename || file}`;
  }
  
  console.log('🖨️ Opening file for printing:', fileUrl);
  
  return new Promise((resolve, reject) => {
    // Open file in new window - let the user handle printing manually
    const printWindow = window.open(fileUrl, '_blank');
    
    if (printWindow) {
      console.log('✅ File opened in new tab - user can print manually');
      // Resolve immediately since we can't control cross-origin print behavior
      resolve();
    } else {
      console.error('❌ Popup blocked or window failed to open');
      reject(new Error('Popup blocked - please allow popups and try again'));
    }
  });
};

// Simple, direct download function that downloads immediately  
export const downloadFile = (file: any, orderStatus?: string): void => {
  // Check if file is accessible before attempting to download
  if (orderStatus === 'completed') {
    console.warn('Cannot download file: File deleted after order completion');
    throw new Error('File no longer available - deleted after order completion');
  }

  // Handle both old format (filename) and new format (path)  
  // Files are stored in object storage - use path directly if it starts with /objects/
  let filePath;
  if (file.path) {
    // If path already starts with /objects/, use it directly
    filePath = file.path.startsWith('/objects/') ? file.path : `/objects/.private/${file.path}`;
  } else {
    // Fallback for old filename format
    filePath = `/objects/.private/uploads/${file.filename || file}`;
  }
  const originalName = file.originalName || file.filename || 'file';
  
  // Create download link and trigger download immediately
  const link = document.createElement('a');
  link.href = filePath;
  link.download = originalName;
  link.style.display = 'none';
  
  // Add to DOM, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log(`📥 Download started: ${originalName}`);
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

  const parsedFiles = typeof files === 'string' ? JSON.parse(files) : files;
  
  parsedFiles.forEach((file: any, index: number) => {
    try {
      downloadFile(file, orderStatus);
      if (onProgress) onProgress(index + 1, parsedFiles.length);
    } catch (error) {
      console.error(`Failed to download file ${index + 1}:`, error);
      // Continue with next file even if one fails
      if (onProgress) onProgress(index + 1, parsedFiles.length);
    }
  });
};

// Sequential printing - one file at a time for reliability (ORIGINAL ROBUST CODE)
export const printAllFiles = async (
  files: any[],
  onProgress?: (current: number, total: number) => void,
  orderStatus?: string
): Promise<void> => {
  // Check if files are accessible before attempting to print
  if (orderStatus === 'completed') {
    console.warn('Cannot print files: Files deleted after order completion');
    throw new Error('Files no longer available - deleted after order completion');
  }

  const parsedFiles = typeof files === 'string' ? JSON.parse(files) : files;

  for (let i = 0; i < parsedFiles.length; i++) {
    try {
      await printFile(parsedFiles[i], orderStatus); // Wait for each print to complete
      if (onProgress) onProgress(i + 1, parsedFiles.length);
      
      // Small delay between prints to prevent browser overwhelming
      if (i < parsedFiles.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`Failed to print file ${i + 1}:`, error);
      // Continue with next file even if one fails
      if (onProgress) onProgress(i + 1, parsedFiles.length);
    }
  }
};