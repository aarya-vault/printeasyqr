// Helper functions for printing files without downloading
export const printFile = async (file: any): Promise<void> => {
  const fileUrl = `/uploads/${file.filename || file}`;
  const filename = file.originalName || file.filename || file;
  
  return new Promise((resolve) => {
    // Open file in new window and trigger print
    const printWindow = window.open(fileUrl, '_blank');
    
    if (!printWindow) {
      console.error('Failed to open print window - popup may be blocked');
      // Fallback: use hidden iframe
      printWithIframe(file).then(resolve);
      return;
    }
    
    // Set up print handling
    let printed = false;
    const printHandler = () => {
      if (!printed) {
        printed = true;
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          resolve();
        }, 1000);
      }
    };
    
    // Try multiple ways to detect when window is ready
    printWindow.addEventListener('load', printHandler);
    
    // Fallback: try printing after timeout
    setTimeout(() => {
      if (!printed) {
        printed = true;
        try {
          printWindow.focus();
          printWindow.print();
        } catch (e) {
          console.error('Print failed:', e);
        }
        resolve();
      }
    }, 2000);
  });
};

// Fallback iframe printing method
const printWithIframe = async (file: any): Promise<void> => {
  const fileUrl = `/uploads/${file.filename || file}`;
  const filename = file.originalName || file.filename || file;
  const fileExtension = filename.split('.').pop()?.toLowerCase();
  
  return new Promise((resolve) => {
    // Create hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-99999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.visibility = 'hidden';
    
    // For PDFs and images, create printable HTML
    if (['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension || '')) {
      const isImage = fileExtension !== 'pdf';
      iframe.srcdoc = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print - ${filename}</title>
          <style>
            body { margin: 0; padding: 0; }
            ${isImage ? `
              img { width: 100%; height: auto; display: block; }
              @media print { 
                body { margin: 0; }
                img { max-width: 100%; height: auto; }
              }
            ` : `
              embed { width: 100%; height: 100vh; }
            `}
          </style>
        </head>
        <body>
          ${isImage 
            ? `<img src="${fileUrl}" alt="${filename}" onload="window.print();" />` 
            : `<embed src="${fileUrl}" type="application/pdf" />`
          }
        </body>
        </html>
      `;
    } else {
      iframe.src = fileUrl;
    }
    
    document.body.appendChild(iframe);
    
    // Print after load
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Iframe print failed:', e);
        }
        
        // Cleanup
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
      console.error('Failed to load file in iframe');
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      resolve();
    };
    
    // Timeout fallback
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      resolve();
    }, 5000);
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