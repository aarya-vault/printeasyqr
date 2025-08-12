// Print function - opens window, waits for user to complete printing
export const printFile = async (file: any, orderStatus?: string): Promise<void> => {
  // Check if order is completed - files are deleted after completion
  if (orderStatus === 'completed') {
    console.log('❌ Cannot print file from completed order - files have been deleted');
    throw new Error('Files are no longer available for completed orders');
  }
  
  // Handle both old format (filename) and new format (path)
  // Files are stored in object storage with .private prefix
  const fileUrl = file.path ? `/objects/.private/${file.path}` : `/objects/.private/uploads/${file.filename || file}`;
  
  console.log('🖨️ Attempting to print file:', fileUrl);
  
  return new Promise((resolve, reject) => {
    // Open file in new window
    const printWindow = window.open(fileUrl, '_blank');
    
    if (printWindow) {
      // Wait for window to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          console.log('🖨️ Print dialog opened');
          // DON'T close immediately - let user complete printing
          // Check if window is closed by user every 2 seconds
          const checkInterval = setInterval(() => {
            if (printWindow.closed) {
              clearInterval(checkInterval);
              console.log('✅ Print window closed by user');
              resolve();
            }
          }, 2000);
          
          // Auto-close after 30 seconds if user hasn't closed it
          setTimeout(() => {
            if (!printWindow.closed) {
              printWindow.close();
              clearInterval(checkInterval);
              console.log('⏰ Print window auto-closed after timeout');
              resolve();
            }
          }, 30000);
        }, 2000); // Give PDF more time to load
      };
      
      // Handle load errors (file not found, etc.)
      printWindow.onerror = () => {
        printWindow.close();
        console.log('❌ Error loading file for printing');
        reject(new Error('Failed to load file for printing'));
      };
      
      // Fallback if onload doesn't fire
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          printWindow.print();
          console.log('🖨️ Print initiated (fallback)');
          
          // Same logic - wait for user to close or auto-close
          const checkInterval = setInterval(() => {
            if (printWindow.closed) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 2000);
          
          setTimeout(() => {
            if (!printWindow.closed) {
              printWindow.close();
              clearInterval(checkInterval);
              resolve();
            }
          }, 30000);
        }
      }, 5000);
    } else {
      reject(new Error('Popup blocked or window failed to open'));
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
  // Files are stored in object storage with .private prefix
  const filePath = file.path ? `/objects/.private/${file.path}` : `/objects/.private/uploads/${file.filename || file}`;
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