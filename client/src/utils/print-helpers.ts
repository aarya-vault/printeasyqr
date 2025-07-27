// Helper functions for printing files without downloading
export const printFile = async (file: any): Promise<void> => {
  const fileUrl = `/uploads/${file.filename || file}`;
  const filename = file.originalName || file.filename || file;
  
  return new Promise((resolve) => {
    // Simple approach: just open the file in a new window
    const printWindow = window.open(fileUrl, '_blank');
    
    if (!printWindow) {
      console.error('Failed to open print window - popup may be blocked');
      resolve();
      return;
    }
    
    // Give the window time to load, then trigger print
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        console.error('Print failed:', e);
      }
      resolve();
    }, 1500);
  });
};



export const printAllFiles = async (files: any[], onProgress?: (current: number, total: number) => void): Promise<void> => {
  const parsedFiles = typeof files === 'string' ? JSON.parse(files) : files;
  
  // Open all print windows with delays as per reference implementation
  let delay = 0;
  
  parsedFiles.forEach((file, index) => {
    setTimeout(() => {
      const fileUrl = `/uploads/${file.filename || file}`;
      const win = window.open(fileUrl, '_blank');
      
      if (win) {
        // Wait for window to load then print
        setTimeout(() => {
          try {
            win.focus();
            win.print();
          } catch (e) {
            console.error('Print error:', e);
          }
        }, 1000);
      }
      
      if (onProgress) {
        onProgress(index + 1, parsedFiles.length);
      }
    }, delay);
    
    // Add 3 second delay between each file as per reference
    delay += 3000;
  });
};