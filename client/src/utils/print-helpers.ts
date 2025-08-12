// Print function - simple and effective for PDFs
export const printFile = async (file: any, orderStatus?: string): Promise<void> => {
  // Check if order is completed - files are deleted after completion
  if (orderStatus === 'completed') {
    console.log('❌ Cannot print file from completed order - files have been deleted');
    throw new Error('Files are no longer available for completed orders');
  }
  
  // Handle both old format (filename) and new format (path)
  let fileUrl;
  if (file.path) {
    fileUrl = file.path; // Use path as-is, object routes handle redirection
  } else {
    fileUrl = `/objects/.private/uploads/${file.filename || file}`;
  }
  
  console.log('🖨️ Opening PDF for printing:', file.originalName || file.filename);
  
  return new Promise((resolve) => {
    // Simple approach: Open PDF in new window
    // Browser will display PDF with print button available
    const printWindow = window.open(fileUrl, '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
    
    if (!printWindow) {
      console.error('❌ Popup blocked - please allow popups and try again');
      throw new Error('Popup blocked - please allow popups and try again');
    }
    
    // Add message to help user
    console.log('🖨️ PDF opened in new window. Use Ctrl+P or browser print button to print.');
    
    // Attempt to trigger print after PDF loads
    printWindow.addEventListener('load', () => {
      setTimeout(() => {
        try {
          printWindow.focus();
          // Try to trigger print - may work depending on browser settings
          printWindow.print();
          console.log('🖨️ Print command sent');
        } catch (error) {
          console.log('🖨️ Print command blocked by browser - use Ctrl+P in the PDF window');
        }
      }, 2000);
    });
    
    resolve();
  });
};

// Download function using server proxy to bypass CORS restrictions
export const downloadFile = (file: any, orderStatus?: string): void => {
  // Check if file is accessible before attempting to download
  if (orderStatus === 'completed') {
    console.warn('Cannot download file: File deleted after order completion');
    throw new Error('File no longer available - deleted after order completion');
  }

  // Handle both old format (filename) and new format (path)  
  // Use download proxy to bypass CORS restrictions
  let downloadPath;
  if (file.path) {
    // Remove /objects/ prefix and use download proxy
    const objectPath = file.path.startsWith('/objects/') ? file.path.substring(9) : file.path;
    downloadPath = `/api/download/${objectPath}`;
  } else {
    // Fallback for old filename format
    downloadPath = `/api/download/.private/uploads/${file.filename || file}`;
  }
  
  // Use the original filename if available, otherwise fall back to the generated filename
  const originalName = file.originalName || file.filename || 'document.pdf';
  
  // Add original filename as query parameter to help server set correct filename
  const downloadUrl = `${downloadPath}?originalName=${encodeURIComponent(originalName)}`;
  
  // Create download link and trigger download immediately
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = originalName; // Browser hint for filename
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