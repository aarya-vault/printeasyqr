// Helper functions for printing files without downloading
export const printFile = async (file: any): Promise<void> => {
  const fileUrl = `/uploads/${file.filename || file}`;
  const filename = file.originalName || file.filename || file;
  const fileExtension = filename.split('.').pop()?.toLowerCase();
  
  return new Promise((resolve) => {
    // Create hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-99999px';
    iframe.style.top = '-99999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.visibility = 'hidden';
    iframe.style.opacity = '0';
    
    // Add iframe to DOM
    document.body.appendChild(iframe);
    
    // Handle different file types
    if (fileExtension === 'pdf') {
      // For PDFs, create a printable HTML page
      iframe.srcdoc = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print ${filename}</title>
          <style>
            body { margin: 0; padding: 0; }
            embed { width: 100%; height: 100vh; }
          </style>
        </head>
        <body>
          <embed src="${fileUrl}" type="application/pdf" />
        </body>
        </html>
      `;
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension || '')) {
      // For images, create a printable HTML page
      iframe.srcdoc = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print ${filename}</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh;
            }
            img { 
              max-width: 100%; 
              max-height: 100vh; 
              object-fit: contain; 
            }
            @media print {
              body { padding: 0; }
              img { max-width: 100%; max-height: 100%; }
            }
          </style>
        </head>
        <body>
          <img src="${fileUrl}" alt="${filename}" />
        </body>
        </html>
      `;
    } else {
      // For other files, just load directly
      iframe.src = fileUrl;
    }
    
    // Wait for iframe to load, then print
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (error) {
          console.error('Print error:', error);
          // Fallback: try to open in new tab
          const printTab = window.open(fileUrl, '_blank');
          if (printTab) {
            printTab.onload = () => {
              printTab.focus();
              printTab.print();
            };
          }
        }
        
        // Clean up iframe after printing
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          resolve();
        }, 1000);
      }, 1000);
    };
    
    // Error handling
    iframe.onerror = () => {
      console.error('Failed to load file for printing');
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      resolve();
    };
  });
};

export const printAllFiles = async (files: any[], onProgress?: (current: number, total: number) => void): Promise<void> => {
  const parsedFiles = typeof files === 'string' ? JSON.parse(files) : files;
  
  // Print files sequentially with delays
  for (let i = 0; i < parsedFiles.length; i++) {
    await printFile(parsedFiles[i]);
    
    if (onProgress) {
      onProgress(i + 1, parsedFiles.length);
    }
    
    // Wait 2 seconds between prints to avoid overwhelming browser
    if (i < parsedFiles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};