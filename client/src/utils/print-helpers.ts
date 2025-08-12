// Print function - opens file and attempts to trigger print dialog
export const printFile = async (file: any, orderStatus?: string): Promise<void> => {
  // Check if order is completed - files are deleted after completion
  if (orderStatus === 'completed') {
    console.log('❌ Cannot print file from completed order - files have been deleted');
    throw new Error('Files are no longer available for completed orders');
  }
  
  // Handle both old format (filename) and new format (path)
  // Files are stored in object storage - use path directly if it starts with /objects/
  let fileUrl;
  if (file.path) {
    // If path already starts with /objects/, use it directly
    fileUrl = file.path.startsWith('/objects/') ? file.path : `/objects/.private/${file.path}`;
  } else {
    // Fallback for old filename format
    fileUrl = `/objects/.private/uploads/${file.filename || file}`;
  }
  
  console.log('🖨️ Opening file for printing:', fileUrl);
  
  return new Promise((resolve, reject) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      console.error('❌ Popup blocked or window failed to open');
      reject(new Error('Popup blocked - please allow popups and try again'));
      return;
    }

    // Write a simple HTML page that loads the PDF and triggers print
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Printing: ${file.originalName || file.filename || 'Document'}</title>
          <style>
            body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
            iframe { width: 100%; height: 100%; border: none; }
            .loading { 
              position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
              font-family: Arial, sans-serif; color: #333; text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="loading" id="loading">
            <p>Loading document for printing...</p>
            <p><small>Print dialog should appear shortly</small></p>
          </div>
          <iframe id="printFrame" src="${fileUrl}" style="display: none;"></iframe>
          <script>
            const iframe = document.getElementById('printFrame');
            const loading = document.getElementById('loading');
            
            // Show iframe and hide loading when loaded
            iframe.onload = function() {
              loading.style.display = 'none';
              iframe.style.display = 'block';
              
              // Try to trigger print after a short delay
              setTimeout(() => {
                try {
                  window.print();
                  console.log('🖨️ Print dialog triggered');
                } catch (e) {
                  console.log('Print triggered via window.print()');
                  // Fallback: try to print the iframe content
                  try {
                    iframe.contentWindow.print();
                  } catch (e2) {
                    console.log('Manual print required - use Ctrl+P or browser print button');
                  }
                }
              }, 1000);
            };
            
            // Error handling
            iframe.onerror = function() {
              loading.innerHTML = '<p>Document loaded. Use Ctrl+P or browser print button to print.</p>';
              setTimeout(() => window.print(), 1000);
            };
            
            // Also trigger print on window focus (in case iframe doesn't load properly)
            let printTriggered = false;
            window.onfocus = function() {
              if (!printTriggered) {
                printTriggered = true;
                setTimeout(() => {
                  try {
                    window.print();
                  } catch (e) {
                    console.log('Print via focus trigger');
                  }
                }, 500);
              }
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    console.log('✅ Print window created with auto-print functionality');
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
  const originalName = file.originalName || file.filename || 'file';
  
  // Create download link and trigger download immediately
  const link = document.createElement('a');
  link.href = downloadPath;
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