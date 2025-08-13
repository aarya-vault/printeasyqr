// Simple print function using basic iframe - the working solution
export const printFile = async (file: any, orderStatus?: string): Promise<void> => {
  // Check if order is completed - files are deleted after completion
  if (orderStatus === 'completed') {
    console.log('❌ Cannot print file from completed order - files have been deleted');
    throw new Error('Files are no longer available for completed orders');
  }
  
  // Build the correct file URL
  let fileUrl;
  if (file.path) {
    // File path is already in /objects/.private format
    let path = file.path;
    // Remove /objects/ prefix if present
    if (path.startsWith('/objects/')) {
      path = path.substring(9);
    }
    fileUrl = `/api/download/${path}`;
  } else {
    fileUrl = `/api/download/.private/uploads/${file.filename || file}`;
  }
  
  const filename = file.originalName || file.filename || file;
  
  console.log(`🖨️ Printing file: ${filename}`);

  // Simple iframe print solution that works
  return new Promise<void>((resolve, reject) => {
    try {
      // Create a hidden iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;border:none;';
      iframe.src = fileUrl;
      
      // Add to document
      document.body.appendChild(iframe);
      
      // Wait for iframe to load then print
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            console.log('Print initiated');
          }
          // Clean up after a delay
          setTimeout(() => {
            document.body.removeChild(iframe);
            resolve();
          }, 1000);
        }, 500);
      };
      
      // Handle errors
      iframe.onerror = () => {
        document.body.removeChild(iframe);
        reject(new Error('Failed to load file for printing'));
      };
      
      // Timeout fallback
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        resolve();
      }, 5000);
    } catch (error) {
      reject(error);
    }
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
  let downloadPath;
  if (file.path) {
    // File path is already in /objects/.private format
    let path = file.path;
    // Remove /objects/ prefix if present
    if (path.startsWith('/objects/')) {
      path = path.substring(9);
    }
    downloadPath = `/api/download/${path}`;
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

// Print all files (simple and direct)
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

  // Simple sequential print with proper delays
  for (let i = 0; i < files.length; i++) {
    await printFile(files[i], orderStatus);
    if (onProgress) {
      onProgress(i + 1, files.length);
    }
    // Small delay between prints to avoid overwhelming the browser
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};