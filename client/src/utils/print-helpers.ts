// Robust print function optimized for large files (up to 500MB) and bulk printing
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
  const isPDF = filename.toLowerCase().endsWith('.pdf') || file.mimetype === 'application/pdf';
  const fileSize = file.size || 0;
  const isLargeFile = fileSize > 50 * 1024 * 1024; // Files over 50MB
  
  console.log(`🖨️ Printing file: ${filename} (${(fileSize / 1024 / 1024).toFixed(2)}MB)`);

  // Optimized print solution for large files and bulk printing
  return new Promise<void>((resolve, reject) => {
    try {
      if (isPDF) {
        if (isLargeFile) {
          // For large files, open in new tab and trigger print
          // This prevents memory issues with iframes for huge files
          const printWindow = window.open(fileUrl, '_blank');
          
          if (printWindow) {
            // Give large file time to load before printing
            const loadTime = Math.min(5000, fileSize / 100000); // Dynamic load time based on size
            
            setTimeout(() => {
              try {
                printWindow.print();
                // Don't close immediately for large files
                setTimeout(() => {
                  resolve();
                }, 500);
              } catch (e) {
                console.log('Print dialog triggered for large file');
                resolve();
              }
            }, loadTime);
          } else {
            // Popup blocked - use direct navigation
            window.location.href = fileUrl;
            resolve();
          }
        } else {
          // For smaller PDFs, use efficient iframe method
          const iframe = document.createElement('iframe');
          iframe.style.cssText = 'position:absolute;width:1px;height:1px;left:-9999px;border:0;';
          iframe.src = fileUrl;
          
          document.body.appendChild(iframe);
          
          iframe.onload = () => {
            // Small delay for rendering
            setTimeout(() => {
              try {
                if (iframe.contentWindow) {
                  iframe.contentWindow.focus();
                  iframe.contentWindow.print();
                }
                
                // Quick cleanup for small files
                setTimeout(() => {
                  if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                  }
                  resolve();
                }, 200);
              } catch (e) {
                // Silent fallback
                window.open(fileUrl, '_blank');
                document.body.removeChild(iframe);
                resolve();
              }
            }, 500);
          };
          
          iframe.onerror = () => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            window.open(fileUrl, '_blank');
            resolve();
          };
          
          // Shorter timeout for small files
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            resolve();
          }, 3000);
        }
      } else {
        // For non-PDF files, use object/embed approach
        const printContainer = document.createElement('div');
        printContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;background:white;';
        
        const embed = document.createElement('embed');
        embed.src = fileUrl;
        embed.style.cssText = 'width:100%;height:100%;';
        embed.type = file.mimetype || 'application/octet-stream';
        
        printContainer.appendChild(embed);
        document.body.appendChild(printContainer);
        
        // Wait for load and print
        setTimeout(() => {
          window.print();
          setTimeout(() => {
            document.body.removeChild(printContainer);
            resolve();
          }, 1000);
        }, 1500);
      }
    } catch (error) {
      console.error('Print error:', error);
      reject(error);
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

// Optimized bulk print function for handling 100s of files efficiently (up to 500MB each)
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

  console.log(`🖨️ Starting batch print for ${files.length} files`);
  
  // Calculate total size for optimization decisions
  const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
  const isHeavyBatch = totalSize > 100 * 1024 * 1024 || files.length > 50; // Over 100MB total or 50+ files
  
  // Adaptive delay based on file characteristics
  const getDelay = (file: any) => {
    const fileSize = file.size || 0;
    if (fileSize > 100 * 1024 * 1024) return 3000; // 3s for files over 100MB
    if (fileSize > 50 * 1024 * 1024) return 2000;  // 2s for files over 50MB
    if (files.length > 50) return 1000;            // 1s for bulk operations
    return 500;                                     // 0.5s for small files
  };
  
  // Process files with proper delays
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`📄 Printing file ${i + 1}/${files.length}: ${file.originalName || file.filename || 'unnamed'}`);
    
    await printFile(file, orderStatus);
    if (onProgress) {
      onProgress(i + 1, files.length);
    }
    
    // Adaptive delay between prints to avoid overwhelming browser
    if (i < files.length - 1) {
      const delay = getDelay(file);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Extra pause every 10 files for heavy batches to let browser recover
      if (isHeavyBatch && (i + 1) % 10 === 0) {
        console.log('⏸️ Pausing to prevent browser overload...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  console.log(`✅ Batch print completed: ${files.length} files processed`);
};