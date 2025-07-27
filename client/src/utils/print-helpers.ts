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
    
    const content = isImage
      ? `<img src="${fileUrl}" style="width:100%;height:auto;" onload="window.print();" />`
      : isPDF
        ? `<embed src="${fileUrl}" type="application/pdf" width="100%" height="100%" onload="window.print();" />`
        : `<iframe src="${fileUrl}" width="100%" height="100%" onload="this.contentWindow.print();"></iframe>`;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print - ${filename}</title>
          <style>
            body { margin: 0; padding: 0; }
            img, embed, iframe { width: 100%; height: 100vh; border: none; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
    
    // Fallback timeout in case onload fails
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        console.error('Fallback print failed:', e);
      }
      resolve();
    }, 4000);
  });
};

export const printAllFiles = async (
  files: any[],
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  const parsedFiles = typeof files === 'string' ? JSON.parse(files) : files;
  
  for (let i = 0; i < parsedFiles.length; i++) {
    await printFile(parsedFiles[i]);
    
    if (onProgress) {
      onProgress(i + 1, parsedFiles.length);
    }
    
    if (i < parsedFiles.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // 3s gap between prints
    }
  }
};