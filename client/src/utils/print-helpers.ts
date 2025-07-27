// Helper functions for printing files
export const printFile = async (file: any): Promise<void> => {
  const fileUrl = `/uploads/${file.filename || file}`;
  
  return new Promise((resolve) => {
    // Open file in new window and trigger print
    const win = window.open(fileUrl, '_blank');
    
    if (!win) {
      console.error('Failed to open print window - popup blocker may be active');
      resolve();
      return;
    }
    
    // Wait for window to load then print
    win.onload = function() {
      win.focus();
      win.print();
      resolve();
    };
    
    // Fallback timeout in case onload doesn't fire
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch (e) {
        console.error('Print error:', e);
      }
      resolve();
    }, 1500);
  });
};



export const printAllFiles = async (files: any[], onProgress?: (current: number, total: number) => void): Promise<void> => {
  const parsedFiles = typeof files === 'string' ? JSON.parse(files) : files;
  let delay = 0;
  
  // Open print dialogs with delays to prevent browser blocking
  parsedFiles.forEach((file, index) => {
    setTimeout(() => {
      const fileUrl = `/uploads/${file.filename || file}`;
      const win = window.open(fileUrl, '_blank');
      
      if (win) {
        win.onload = function() {
          win.focus();
          win.print();
        };
        
        // Fallback print after timeout
        setTimeout(() => {
          try {
            win.focus();
            win.print();
          } catch (e) {
            console.error('Print error:', e);
          }
        }, 1500);
      }
      
      if (onProgress) {
        onProgress(index + 1, parsedFiles.length);
      }
    }, delay);
    
    // Add 3 second delay between each file
    delay += 3000;
  });
};