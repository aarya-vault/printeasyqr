// Helper functions for printing files without downloading
export const printFile = async (file: any): Promise<void> => {
  const fileUrl = `/uploads/${file.filename || file}`;
  const filename = file.originalName || file.filename || file;
  const fileExtension = filename.split('.').pop()?.toLowerCase();

  return new Promise((resolve, reject) => {
    // Create a hidden iframe for printing to avoid popup blockers
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-9999px';
    printFrame.style.left = '-9999px';
    printFrame.style.width = '0px';
    printFrame.style.height = '0px';
    printFrame.style.border = 'none';
    
    document.body.appendChild(printFrame);
    
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension || '');
    const isPDF = fileExtension === 'pdf';

    // Different content for different file types
    const content = isImage
      ? `<img src="${fileUrl}" onload="window.print()" style="width: 100%; height: auto;" />`
      : isPDF
        ? `<embed src="${fileUrl}" type="application/pdf" width="100%" height="100%" />`
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
              img, embed, iframe { page-break-inside: avoid; }
            }
            @page { margin: 0.5in; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    frameDoc.close();

    // Wait for content to load, then print
    const timer = setTimeout(() => {
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
  });
};

// Download a single file
export const downloadFile = (file: any): void => {
  const filePath = `/uploads/${file.filename || file}`;
  const link = document.createElement('a');
  link.href = filePath;
  link.download = file.originalName || file.filename || 'file';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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