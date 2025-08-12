// Print function - opens window, waits for user to complete printing
export const printFile = async (file: any): Promise<void> => {
  // Handle both old format (filename) and new format (path)
  // Files are stored in object storage with their path directly
  const fileUrl = file.path ? `/objects/${file.path}` : `/objects/uploads/${file.filename || file}`;
  
  return new Promise((resolve) => {
    // Open file in new window
    const printWindow = window.open(fileUrl, '_blank');
    
    if (printWindow) {
      // Wait for window to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // DON'T close immediately - let user complete printing
          // Check if window is closed by user every 2 seconds
          const checkInterval = setInterval(() => {
            if (printWindow.closed) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 2000);
          
          // Auto-close after 30 seconds if user hasn't closed it
          setTimeout(() => {
            if (!printWindow.closed) {
              printWindow.close();
              clearInterval(checkInterval);
              resolve();
            }
          }, 30000);
        }, 2000); // Give PDF more time to load
      };
      
      // Fallback if onload doesn't fire
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          printWindow.print();
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
      resolve(); // Popup blocked - just resolve
    }
  });
};

// Simple, direct download function that downloads immediately  
export const downloadFile = (file: any): void => {
  // Handle both old format (filename) and new format (path)  
  // Files are stored in object storage with their path directly
  const filePath = file.path ? `/objects/${file.path}` : `/objects/uploads/${file.filename || file}`;
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
  onProgress?: (current: number, total: number) => void
): void => {
  const parsedFiles = typeof files === 'string' ? JSON.parse(files) : files;
  
  parsedFiles.forEach((file: any, index: number) => {
    downloadFile(file);
    if (onProgress) onProgress(index + 1, parsedFiles.length);
  });
};

// Sequential printing - one file at a time for reliability (ORIGINAL ROBUST CODE)
export const printAllFiles = async (
  files: any[],
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  const parsedFiles = typeof files === 'string' ? JSON.parse(files) : files;

  for (let i = 0; i < parsedFiles.length; i++) {
    try {
      await printFile(parsedFiles[i]); // Wait for each print to complete
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