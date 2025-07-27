// Helper functions for printing files
export const printFile = async (file: any): Promise<void> => {
  const fileUrl = `/uploads/${file.filename || file}`;
  const filename = file.originalName || file.filename || file;
  const fileExtension = filename.split('.').pop()?.toLowerCase();
  
  return new Promise((resolve) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      console.error('Failed to open print window');
      resolve();
      return;
    }

    // For PDFs, embed directly
    if (fileExtension === 'pdf') {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print - ${filename}</title>
          <style>
            body { margin: 0; padding: 0; }
            embed { width: 100%; height: 100vh; }
          </style>
        </head>
        <body>
          <embed src="${fileUrl}" type="application/pdf" />
        </body>
        </html>
      `);
      printWindow.document.close();
      
      // Wait for PDF to load
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        resolve();
      }, 1000);
    } 
    // For images, display in an img tag
    else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension || '')) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print - ${filename}</title>
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
          <img src="${fileUrl}" alt="${filename}" onload="window.print();" />
        </body>
        </html>
      `);
      printWindow.document.close();
    }
    // For text files
    else if (['txt', 'log', 'md'].includes(fileExtension || '')) {
      // Fetch and display text content
      fetch(fileUrl)
        .then(response => response.text())
        .then(text => {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Print - ${filename}</title>
              <style>
                body { 
                  font-family: monospace; 
                  white-space: pre-wrap; 
                  padding: 20px;
                  line-height: 1.5;
                }
                @media print {
                  body { padding: 10px; font-size: 12px; }
                }
              </style>
            </head>
            <body>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
            </html>
          `);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
            resolve();
          }, 500);
        })
        .catch(error => {
          console.error('Error loading text file:', error);
          printWindow.close();
          resolve();
        });
    }
    // For other files, try to display in iframe
    else {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print - ${filename}</title>
          <style>
            body { margin: 0; padding: 0; }
            iframe { width: 100%; height: 100vh; border: none; }
          </style>
        </head>
        <body>
          <iframe src="${fileUrl}" onload="setTimeout(() => window.print(), 1000);"></iframe>
        </body>
        </html>
      `);
      printWindow.document.close();
      
      setTimeout(() => {
        resolve();
      }, 2000);
    }
  });
};



export const printAllFiles = async (files: any[], onProgress?: (current: number, total: number) => void): Promise<void> => {
  const parsedFiles = typeof files === 'string' ? JSON.parse(files) : files;
  
  // Process all files sequentially
  for (let i = 0; i < parsedFiles.length; i++) {
    await printFile(parsedFiles[i]);
    
    if (onProgress) {
      onProgress(i + 1, parsedFiles.length);
    }
    
    // Wait between prints to avoid overwhelming the browser
    if (i < parsedFiles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};