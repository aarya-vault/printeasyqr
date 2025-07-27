// Helper functions for printing files
export const printFile = async (file: any): Promise<void> => {
  const fileUrl = `/uploads/${file.filename || file}`;
  const fileExtension = (file.originalName || file.filename || file).split('.').pop()?.toLowerCase();
  
  return new Promise((resolve) => {
    // For PDFs and images, we can use iframe printing
    if (['pdf', 'jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '')) {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = fileUrl;
      
      // Add to DOM
      document.body.appendChild(iframe);
      
      // Wait for iframe to load
      iframe.onload = () => {
        setTimeout(() => {
          try {
            // Focus and print
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            
            // Clean up after a delay
            setTimeout(() => {
              document.body.removeChild(iframe);
              resolve();
            }, 100);
          } catch (error) {
            console.error('Iframe print error:', error);
            // Fallback to window.open
            openPrintWindow(fileUrl, resolve);
            document.body.removeChild(iframe);
          }
        }, 500); // Give the document time to render
      };
      
      // Fallback if iframe fails to load
      iframe.onerror = () => {
        document.body.removeChild(iframe);
        openPrintWindow(fileUrl, resolve);
      };
    } else {
      // For other file types, use window.open
      openPrintWindow(fileUrl, resolve);
    }
  });
};

const openPrintWindow = (fileUrl: string, resolve: () => void) => {
  const printWindow = window.open(fileUrl, '_blank', 'width=800,height=600');
  
  if (printWindow) {
    // Poll to check if window is loaded
    const checkLoaded = setInterval(() => {
      try {
        if (printWindow.document.readyState === 'complete') {
          clearInterval(checkLoaded);
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            resolve();
          }, 500);
        }
      } catch (e) {
        // Cross-origin, just wait and print
        clearInterval(checkLoaded);
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          resolve();
        }, 2000);
      }
    }, 100);
    
    // Timeout fallback
    setTimeout(() => {
      clearInterval(checkLoaded);
      resolve();
    }, 5000);
  } else {
    resolve();
  }
};

export const printAllFiles = async (files: any[], onProgress?: (current: number, total: number) => void): Promise<void> => {
  const parsedFiles = typeof files === 'string' ? JSON.parse(files) : files;
  
  for (let i = 0; i < parsedFiles.length; i++) {
    if (onProgress) {
      onProgress(i + 1, parsedFiles.length);
    }
    await printFile(parsedFiles[i]);
    
    // Wait between prints to avoid overwhelming the browser
    if (i < parsedFiles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
};