// Simple, direct print function that opens print dialog immediately
export const printFile = (file: any): void => {
  const fileUrl = `/uploads/${file.filename || file}`;
  
  // Create a hidden iframe for printing
  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'absolute';
  printFrame.style.top = '-9999px';
  printFrame.style.left = '-9999px';
  printFrame.style.width = '0px';
  printFrame.style.height = '0px';
  printFrame.style.border = 'none';
  
  document.body.appendChild(printFrame);
  
  // Set the source and trigger print
  printFrame.src = fileUrl;
  
  printFrame.onload = () => {
    try {
      printFrame.contentWindow?.print();
    } catch (e) {
      console.error('Print failed', e);
    }
    
    // Clean up after printing
    setTimeout(() => {
      if (document.body.contains(printFrame)) {
        document.body.removeChild(printFrame);
      }
    }, 1000);
  };
};

// Simple, direct download function that downloads immediately  
export const downloadFile = (file: any): void => {
  const filePath = `/uploads/${file.filename || file}`;
  const originalName = file.originalName || file.filename || 'file';
  
  // Create download link and trigger download immediately
  const link = document.createElement('a');
  link.href = filePath;
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
  onProgress?: (current: number, total: number) => void
): void => {
  const parsedFiles = typeof files === 'string' ? JSON.parse(files) : files;
  
  parsedFiles.forEach((file, index) => {
    downloadFile(file);
    if (onProgress) onProgress(index + 1, parsedFiles.length);
  });
};

// Print all files at once (simple and direct)
export const printAllFiles = (
  files: any[],
  onProgress?: (current: number, total: number) => void
): void => {
  const parsedFiles = typeof files === 'string' ? JSON.parse(files) : files;
  
  parsedFiles.forEach((file, index) => {
    printFile(file);
    if (onProgress) onProgress(index + 1, parsedFiles.length);
  });
};