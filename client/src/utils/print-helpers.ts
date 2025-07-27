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
    
    // NO onload print triggers - JS control only
    const content = isImage
      ? `<img src="${fileUrl}" id="printContent" />`
      : isPDF
        ? `<embed src="${fileUrl}" type="application/pdf" id="printContent" />`
        : `<iframe src="${fileUrl}" id="printContent"></iframe>`;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print - ${filename}</title>
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              overflow: hidden;
            }
            
            img, embed, iframe { 
              width: 100vw; 
              height: 100vh; 
              border: none; 
              object-fit: contain;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
                overflow: visible;
              }
              
              img, embed, iframe {
                width: 100vw;
                height: 100vh;
                page-break-inside: avoid;
                break-inside: avoid;
                object-fit: contain;
              }
              
              html, body {
                width: 100%;
                height: 100%;
              }
            }
            
            @page {
              margin: 0;
              size: auto;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
    
    // Wait for content to load, then print
    const tryPrint = () => {
      try {
        printWindow.focus();
        printWindow.print();
        resolve();
      } catch (e) {
        console.error('Print failed:', e);
        resolve();
      }
    };
    
    // For images and PDFs, wait for load event
    if (isImage || isPDF) {
      const element = printWindow.document.getElementById('printContent');
      if (element) {
        element.onload = tryPrint;
        element.onerror = tryPrint;
        // Fallback after 3 seconds if load doesn't trigger
        setTimeout(tryPrint, 3000);
      } else {
        setTimeout(tryPrint, 2000);
      }
    } else {
      // For other files, shorter wait
      setTimeout(tryPrint, 2000);
    }
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