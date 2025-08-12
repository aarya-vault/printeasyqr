// Working print function - opens new window and prints immediately
export const printFile = async (file: any): Promise<void> => {
  const fileUrl = `/uploads/${file.filename || file}`;
  
  return new Promise((resolve) => {
    // Open file in new window
    const printWindow = window.open(fileUrl, '_blank');
    
    if (printWindow) {
      // Wait for window to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
          resolve();
        }, 1000);
      };
      
      // Fallback if onload doesn't fire
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          printWindow.print();
          printWindow.close();
        }
        resolve();
      }, 3000);
    } else {
      // If popup blocked, use iframe approach
      const printFrame = document.createElement('iframe');
      printFrame.style.display = 'none';
      document.body.appendChild(printFrame);
      
      printFrame.src = fileUrl;
      printFrame.onload = () => {
        setTimeout(() => {
          try {
            printFrame.contentWindow?.print();
          } catch (e) {
            console.error('Print failed', e);
          }
          document.body.removeChild(printFrame);
          resolve();
        }, 1000);
      };
    }
  });
};

// Simple, direct download function that downloads immediately  
export const downloadFile = (file: any): void => {
  const filePath = `/uploads/${file.filename || file}`;
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
  
  parsedFiles.forEach((file, index) => {
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