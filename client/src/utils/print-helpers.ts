// Robust print function with enhanced browser compatibility and error handling
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
  
  const filename = file.originalName || file.filename || file;
  const fileExtension = filename.split('.').pop()?.toLowerCase();
  
  console.log(`🖨️ Printing file: ${filename}`);

  return new Promise((resolve, reject) => {
    let cleanup: (() => void) | undefined;
    let timeoutId: NodeJS.Timeout | undefined;
    
    const performCleanup = () => {
      if (cleanup) cleanup();
      if (timeoutId) clearTimeout(timeoutId);
    };

    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension || '');
    const isPDF = fileExtension === 'pdf';

    try {
      if (isPDF) {
        // For PDFs: Use a more reliable approach with a new window
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
          reject(new Error('Popup blocked. Please allow popups and try again.'));
          return;
        }

        cleanup = () => {
          if (printWindow && !printWindow.closed) {
            printWindow.close();
          }
        };

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print - ${filename}</title>
              <style>
                body { margin: 0; padding: 0; overflow: hidden; }
                iframe { width: 100%; height: 100vh; border: none; }
              </style>
            </head>
            <body>
              <iframe src="${fileUrl}" onload="setTimeout(() => { window.focus(); window.print(); }, 1000)"></iframe>
            </body>
          </html>
        `);
        printWindow.document.close();

        // Auto-resolve after print dialog appears
        setTimeout(() => {
          performCleanup();
          resolve();
        }, 3000);

      } else if (isImage) {
        // For images: Use hidden iframe with enhanced loading detection
        const printFrame = document.createElement('iframe');
        printFrame.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;border:none;';
        
        document.body.appendChild(printFrame);
        
        cleanup = () => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        };

        const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
        if (!frameDoc) {
          performCleanup();
          reject(new Error('Unable to access frame document'));
          return;
        }

        frameDoc.open();
        frameDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print - ${filename}</title>
              <style>
                body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                img { max-width: 100%; height: auto; }
                @media print {
                  body { margin: 0; }
                  img { max-width: 100%; height: auto; page-break-inside: avoid; }
                }
                @page { margin: 0.5in; }
              </style>
            </head>
            <body>
              <img src="${fileUrl}" onload="this.loaded=true" onerror="this.error=true" />
              <script>
                function checkAndPrint() {
                  const img = document.querySelector('img');
                  if (img.loaded) {
                    window.focus();
                    window.print();
                  } else if (img.error) {
                    console.error('Failed to load image');
                  } else {
                    setTimeout(checkAndPrint, 100);
                  }
                }
                setTimeout(checkAndPrint, 500);
              </script>
            </body>
          </html>
        `);
        frameDoc.close();

        // Auto-resolve after reasonable time
        timeoutId = setTimeout(() => {
          performCleanup();
          resolve();
        }, 5000);

      } else {
        // For other files: Try direct approach first, fallback to new window
        try {
          const printWindow = window.open(fileUrl, '_blank', 'width=800,height=600');
          if (!printWindow) {
            reject(new Error('Popup blocked. Please allow popups and try again.'));
            return;
          }

          cleanup = () => {
            if (printWindow && !printWindow.closed) {
              printWindow.close();
            }
          };

          // Wait for load then attempt print
          printWindow.addEventListener('load', () => {
            setTimeout(() => {
              try {
                printWindow.focus();
                printWindow.print();
              } catch (e) {
                console.log('Auto-print failed, user can manually print');
              }
            }, 1000);
          });

          setTimeout(() => {
            performCleanup();
            resolve();
          }, 3000);

        } catch (error) {
          reject(error);
        }
      }

    } catch (error) {
      performCleanup();
      reject(error);
    }

    // Safety timeout
    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        performCleanup();
        resolve();
      }, 10000);
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