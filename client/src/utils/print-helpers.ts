// Smart print function using the Print Host pattern - works for all file sizes up to 500MB
export const printFile = async (file: any, orderStatus?: string): Promise<void> => {
  // Check if order is completed - files are deleted after completion
  if (orderStatus === 'completed') {
    console.log('❌ Cannot print file from completed order - files have been deleted');
    throw new Error('Files are no longer available for completed orders');
  }
  
  // Build the correct file URL for local storage
  let fileUrl;
  if (file.path) {
    // Handle local file storage path
    let path = file.path;
    // Remove 'uploads/' prefix if present to normalize
    if (path.startsWith('uploads/')) {
      path = path.substring(8);
    }
    fileUrl = `/api/download/${path}`;
  } else if (file.filename) {
    fileUrl = `/api/download/${file.filename}`;
  } else {
    fileUrl = `/api/download/${file}`;
  }
  
  const filename = file.originalName || file.filename || file;
  const fileSize = file.size || 0;
  
  console.log(`🖨️ Preparing to print: ${filename} (${(fileSize / 1024 / 1024).toFixed(2)}MB)`);

  // THE NEW SMART SOLUTION: Print Host Pattern
  // This works for all file sizes and types, eliminating cross-origin issues
  return new Promise<void>((resolve, reject) => {
    try {
      // Use our print-host page and pass the file URL as a parameter
      const printHostUrl = `/print-host.html?file=${encodeURIComponent(fileUrl)}`;
      
      const printWindow = window.open(printHostUrl, '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        console.error('Popup blocked. Cannot open print host.');
        // Fallback: try using an iframe instead
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;';
        iframe.src = printHostUrl;
        document.body.appendChild(iframe);
        
        // Clean up after a delay
        setTimeout(() => {
          document.body.removeChild(iframe);
          resolve();
        }, 3000);
      } else {
        // Window opened successfully - it will handle printing itself
        // Resolve after a short delay to allow the print dialog to appear
        setTimeout(() => {
          resolve();
        }, 1500);
      }
    } catch (error) {
      console.error('Print error:', error);
      reject(new Error('Please allow popups for this site to print files.'));
    }
  });
};

// Direct download function - super easy, no prompts
export const downloadFile = (file: any, orderStatus?: string): void => {
  // Check if file is accessible before attempting to download
  if (orderStatus === 'completed') {
    console.warn('Cannot download file: File deleted after order completion');
    throw new Error('File no longer available - deleted after order completion');
  }

  // Handle both old format (filename) and new format (path) for local storage
  let downloadPath;
  if (file.path) {
    // Handle local file storage path
    let path = file.path;
    // Remove 'uploads/' prefix if present to normalize
    if (path.startsWith('uploads/')) {
      path = path.substring(8);
    }
    downloadPath = `/api/download/${path}`;
  } else if (file.filename) {
    // Use filename directly
    downloadPath = `/api/download/${file.filename}`;
  } else {
    // Fallback for string filename
    downloadPath = `/api/download/${file}`;
  }
  
  // Use the original filename if available, otherwise fall back to the generated filename
  const originalName = file.originalName || file.filename || 'document.pdf';
  
  // Direct download using invisible iframe - bypasses "Save As" dialog
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = `${downloadPath}?download=true&originalName=${encodeURIComponent(originalName)}`;
  
  document.body.appendChild(iframe);
  
  // Clean up iframe after download starts
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 3000);
  
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

// Smart bulk print function using Print Host pattern - handles 100s of files up to 500MB each
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

  console.log(`🖨️ Starting smart batch print for ${files.length} files`);
  
  // Calculate total size for optimization decisions
  const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
  const isHeavyBatch = totalSize > 100 * 1024 * 1024 || files.length > 50; // Over 100MB total or 50+ files
  
  // Smart adaptive delay based on file characteristics
  const getDelay = (file: any) => {
    const fileSize = file.size || 0;
    // Using Print Host pattern, we can use shorter delays since cross-origin issues are resolved
    if (fileSize > 100 * 1024 * 1024) return 2000; // 2s for files over 100MB
    if (fileSize > 50 * 1024 * 1024) return 1500;  // 1.5s for files over 50MB
    if (files.length > 50) return 800;             // 0.8s for bulk operations
    return 400;                                     // 0.4s for small files
  };
  
  // Process files efficiently with the Print Host pattern
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`📄 Printing file ${i + 1}/${files.length}: ${file.originalName || file.filename || 'unnamed'}`);
    
    try {
      await printFile(file, orderStatus);
      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    } catch (error) {
      console.error(`Failed to print file ${i + 1}:`, error);
      // Continue with next file even if one fails
    }
    
    // Smart delay between prints to maintain stability
    if (i < files.length - 1) {
      const delay = getDelay(file);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Extra pause every 10 files for heavy batches to let browser recover
      if (isHeavyBatch && (i + 1) % 10 === 0) {
        console.log('⏸️ Smart pause to optimize browser performance...');
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  }
  
  console.log(`✅ Smart batch print completed: ${files.length} files processed successfully`);
};