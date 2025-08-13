// Enhanced print function that opens files directly in print dialog without download
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
  
  console.log(`🖨️ Printing file: ${filename}`);

  // Enhanced print solution for PDFs and other files
  return new Promise<void>((resolve, reject) => {
    try {
      if (isPDF) {
        // For PDFs, open in a new window with print dialog
        const printWindow = window.open(fileUrl, '_blank');
        
        if (printWindow) {
          // Set up the print action
          const checkLoaded = setInterval(() => {
            try {
              // Check if the PDF is loaded
              if (printWindow.document.readyState === 'complete') {
                clearInterval(checkLoaded);
                
                // Trigger print after a short delay
                setTimeout(() => {
                  printWindow.print();
                  
                  // Listen for afterprint event to close window
                  printWindow.addEventListener('afterprint', () => {
                    printWindow.close();
                    resolve();
                  });
                  
                  // Fallback resolution
                  setTimeout(() => {
                    resolve();
                  }, 2000);
                }, 1000);
              }
            } catch (e) {
              // Cross-origin or other errors - use alternative method
              clearInterval(checkLoaded);
              
              // Alternative: Create hidden iframe with PDF embed
              const iframe = document.createElement('iframe');
              iframe.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;background:white;';
              iframe.src = fileUrl;
              
              document.body.appendChild(iframe);
              
              iframe.onload = () => {
                setTimeout(() => {
                  try {
                    // Try to focus and print
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                    
                    // Remove after print
                    setTimeout(() => {
                      document.body.removeChild(iframe);
                      resolve();
                    }, 2000);
                  } catch (printError) {
                    // Fallback: use window.print on the iframe
                    iframe.contentWindow?.print();
                    setTimeout(() => {
                      document.body.removeChild(iframe);
                      resolve();
                    }, 2000);
                  }
                }, 1000);
              };
            }
          }, 500);
          
          // Timeout safety
          setTimeout(() => {
            clearInterval(checkLoaded);
            resolve();
          }, 10000);
        } else {
          // Popup blocked - use iframe method
          const iframe = document.createElement('iframe');
          iframe.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;background:white;';
          iframe.src = fileUrl;
          
          document.body.appendChild(iframe);
          
          iframe.onload = () => {
            setTimeout(() => {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
              
              setTimeout(() => {
                document.body.removeChild(iframe);
                resolve();
              }, 2000);
            }, 1000);
          };
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