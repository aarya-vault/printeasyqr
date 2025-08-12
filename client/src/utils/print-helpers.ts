// Helper functions for printing files without downloading
export const printFile = async (file: any): Promise<void> => {
  const fileUrl = `/uploads/${file.filename || file}`;
  const filename = file.originalName || file.filename || file;
  const fileExtension = filename.split('.').pop()?.toLowerCase();

  return new Promise((resolve, reject) => {
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension || '');
    const isPDF = fileExtension === 'pdf';

    if (isPDF) {
      // For PDFs, open in a new window for printing to avoid iframe issues
      const printWindow = window.open(fileUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          // Small delay to ensure PDF loads completely
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
            resolve();
          }, 1500);
        };
        
        // Fallback timeout in case onload doesn't fire
        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.print();
            printWindow.close();
          }
          resolve();
        }, 3000);
      } else {
        reject(new Error('Unable to open print window. Please allow popups.'));
      }
    } else {
      // For images and other files, use iframe method
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'absolute';
      printFrame.style.top = '-9999px';
      printFrame.style.left = '-9999px';
      printFrame.style.width = '0px';
      printFrame.style.height = '0px';
      printFrame.style.border = 'none';
      
      document.body.appendChild(printFrame);
      
      const content = isImage
        ? `<img src="${fileUrl}" onload="window.print()" style="width: 100%; height: auto;" />`
        : `<iframe src="${fileUrl}" onload="window.print()" style="width: 100%; height: 100%; border: none;"></iframe>`;

      const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
      if (!frameDoc) {
        document.body.removeChild(printFrame);
        reject(new Error('Unable to access frame document'));
        return;
      }

      frameDoc.open();
      frameDoc.write(`
        <html>
          <head>
            <title>Print - ${filename}</title>
            <style>
              body { margin: 0; padding: 0; }
              img { max-width: 100%; height: auto; }
              @media print {
                html, body { margin: 0; padding: 0; }
                img, iframe { page-break-inside: avoid; }
              }
              @page { margin: 0.5in; }
            </style>
          </head>
          <body>${content}</body>
        </html>
      `);
      frameDoc.close();

      // Wait for content to load, then print
      setTimeout(() => {
        try {
          if (printFrame.contentWindow) {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
          }
        } catch (e) {
          console.error('Print failed', e);
        }
        
        // Clean up after a delay
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
          resolve();
        }, 1000);
      }, 2000);
    }
  });
};

// Download a single file
export const downloadFile = (file: any): void => {
  try {
    const filePath = `/uploads/${file.filename || file}`;
    const originalName = file.originalName || file.filename || 'file';
    
    // Create download link
    const link = document.createElement('a');
    link.href = filePath;
    link.download = originalName;
    link.style.display = 'none';
    
    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`📥 Download initiated: ${originalName}`);
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Download all files as individual downloads
export const downloadAllFiles = async (
  files: any[],
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  const parsedFiles = typeof files === 'string' ? JSON.parse(files) : files;

  for (let i = 0; i < parsedFiles.length; i++) {
    try {
      downloadFile(parsedFiles[i]);
      if (onProgress) onProgress(i + 1, parsedFiles.length);
      
      // Small delay between downloads to prevent browser overwhelming
      if (i < parsedFiles.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Failed to download file ${i + 1}:`, error);
      // Continue with next file even if one fails
      if (onProgress) onProgress(i + 1, parsedFiles.length);
    }
  }
};

// Sequential printing - one file at a time for reliability
export const printAllFiles = async (
  files: any[],
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  const parsedFiles = typeof files === 'string' ? JSON.parse(files) : files;

  for (let i = 0; i < parsedFiles.length; i++) {
    try {
      await printFile(parsedFiles[i]); // Wait for each print to complete
      if (onProgress) onProgress(i + 1, parsedFiles.length);
      
      // Small delay between prints to prevent browser overwhelming
      if (i < parsedFiles.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Failed to print file ${i + 1}:`, error);
      // Continue with next file even if one fails
      if (onProgress) onProgress(i + 1, parsedFiles.length);
    }
  }
};