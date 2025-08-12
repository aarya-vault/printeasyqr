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
      // Set up error handling for both load and security errors
      let hasHandledError = false;
      
      const handleError = (errorMessage: string) => {
        if (hasHandledError) return;
        hasHandledError = true;
        
        try {
          if (!printWindow.closed) {
            printWindow.close();
          }
        } catch (e) {
          // Ignore errors when closing cross-origin windows
        }
        
        console.log(`❌ ${errorMessage}`);
        reject(new Error(errorMessage));
      };

      // Handle window load
      printWindow.onload = () => {
        setTimeout(() => {
          try {
            printWindow.print();
            console.log('🖨️ Print dialog opened');
            
            // Check if window is closed by user every 2 seconds
            const checkInterval = setInterval(() => {
              try {
                if (printWindow.closed) {
                  clearInterval(checkInterval);
                  console.log('✅ Print window closed by user');
                  resolve();
                }
              } catch (e) {
                // Cross-origin access blocked - assume print completed
                clearInterval(checkInterval);
                console.log('✅ Print completed (cross-origin)');
                resolve();
              }
            }, 2000);
            
            // Auto-resolve after 30 seconds
            setTimeout(() => {
              clearInterval(checkInterval);
              try {
                if (!printWindow.closed) {
                  printWindow.close();
                }
              } catch (e) {
                // Ignore cross-origin errors
              }
              console.log('⏰ Print auto-completed after timeout');
              resolve();
            }, 30000);
          } catch (error) {
            handleError('Cross-origin access blocked during print');
          }
        }, 2000);
      };
      
      // Handle load errors
      printWindow.onerror = () => {
        handleError('Failed to load file for printing');
      };
      
      // Fallback timeout for files that don't trigger onload
      setTimeout(() => {
        if (!hasHandledError) {
          try {
            printWindow.print();
            console.log('🖨️ Print initiated (fallback)');
            
            // Simplified resolution for fallback case
            setTimeout(() => {
              try {
                if (!printWindow.closed) {
                  printWindow.close();
                }
              } catch (e) {
                // Ignore cross-origin errors
              }
              resolve();
            }, 10000);
          } catch (error) {
            handleError('File may not be available for printing');
          }
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