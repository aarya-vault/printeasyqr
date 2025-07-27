// Helper functions for printing files without downloading
export const printFile = async (file: any): Promise<void> => {
  const fileUrl = `/uploads/${file.filename || file}`;
  const filename = file.originalName || file.filename || file;
  const fileExtension = filename.split('.').pop()?.toLowerCase();

  return new Promise((resolve) => {
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      console.error('Popup blocked');
      resolve();
      return;
    }

    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension || '');
    const isPDF = fileExtension === 'pdf';

    // Images and iframes get onload print, PDFs use fallback only (more reliable)
    const content = isImage
      ? `<img src="${fileUrl}" id="printContent" onload="window.print()" />`
      : isPDF
        ? `<embed src="${fileUrl}" type="application/pdf" id="printContent" />`
        : `<iframe src="${fileUrl}" id="printContent" onload="window.print()"></iframe>`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print - ${filename}</title>
          <style>
            body { margin: 0; padding: 0; overflow: hidden; }
            img, embed, iframe { width: 100vw; height: 100vh; border: none; object-fit: contain; }
            @media print {
              html, body, img, embed, iframe {
                width: 100%;
                height: 100%;
              }
            }
            @page { margin: 0; size: auto; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();

    // Fallback print timer with extended timeout for large files
    const fallback = setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        console.error('Fallback print failed', e);
      }
      resolve();
    }, 6000); // 6 second fallback for large PDFs

    // Monitor print window closure to detect completion
    const interval = setInterval(() => {
      if (printWindow.closed) {
        clearInterval(interval);
        clearTimeout(fallback);
        resolve();
      }
    }, 500);
  });
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