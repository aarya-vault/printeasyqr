// Bulletproof print function using Print Host pattern with window monitoring
export const printFile = async (file: any, orderStatus?: string): Promise<void> => {
  // Check if order is completed - files are deleted after completion
  if (orderStatus === 'completed') {
    throw new Error('Files are no longer available for completed orders');
  }
  
  // Build the correct file URL based on storage type
  let fileUrl;
  const storageType = file.storageType || 'local';
  
  if (storageType === 'r2' && file.r2Key) {
    // For R2 files, use the key and indicate it's from R2 - ADD print=true parameter
    fileUrl = `/api/download/${file.r2Key}?print=true&storageType=r2&originalName=${encodeURIComponent(file.originalName || file.filename || 'file')}`;
  } else if (file.path) {
    // Keep full path with uploads/ prefix for local storage - ADD print=true parameter
    fileUrl = `/api/download/${file.path}?print=true&storageType=local`;
  } else {
    fileUrl = `/api/download/${file.filename || file}?print=true&storageType=local`;
  }
  
  const filename = file.originalName || file.filename || file;
  console.log(`🖨️ Preparing to print: ${filename}`);

  // Detect file type for smart printing
  const getFileType = (file: any) => {
    const mimetype = file.mimetype || '';
    const filename = file.originalName || file.filename || '';
    
    if (mimetype.startsWith('image/') || filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
      return 'image';
    }
    if (mimetype === 'application/pdf' || filename.match(/\.pdf$/i)) {
      return 'pdf';
    }
    return 'document'; // Other document types
  };
  
  const fileType = getFileType(file);
  
  // EXECUTIVE DECISION: Use PDF.js for all PDF files
  let printWindow: Window | null;
  if (fileType === 'pdf') {
    // Use PDF.js viewer for consistent PDF rendering
    const pdfViewerUrl = `/pdf-viewer.html?file=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(filename)}&autoprint=true`;
    printWindow = window.open(pdfViewerUrl, '_blank', 'width=900,height=700');
  } else {
    // Use existing print-host for images and other files
    const printHostUrl = `/api/print-host?file=${encodeURIComponent(fileUrl)}&type=${fileType}`;
    printWindow = window.open(printHostUrl, '_blank', 'width=800,height=600');
  }

  if (!printWindow) {
    // This is the ONLY correct fallback. Inform the user.
    console.error('Popup blocked. Cannot open print host.');
    throw new Error('Please allow popups for this site to print files.');
  }

  // BULLETPROOF FIX: Monitor the window instead of using setTimeout
  // Wait until the user closes the print window before continuing
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      // When the user closes the window, printWindow.closed becomes true
      if (printWindow.closed) {
        clearInterval(checkInterval); // Stop checking
        console.log(`✅ Window for ${filename} closed. Continuing...`);
        resolve();
      }
    }, 500); // Check every half-second
  });
};

// Direct download function - super easy, no prompts
export const downloadFile = (file: any, orderStatus?: string): void => {
  // Check if file is accessible before attempting to download
  if (orderStatus === 'completed') {
    console.warn('Cannot download file: File deleted after order completion');
    throw new Error('File no longer available - deleted after order completion');
  }

  // Handle both R2 and local storage
  let downloadPath;
  const storageType = file.storageType || 'local';
  
  if (storageType === 'r2' && file.r2Key) {
    // For R2 files, use the key and force download
    downloadPath = `/api/download/${file.r2Key}?download=true&storageType=r2&originalName=${encodeURIComponent(file.originalName || file.filename || 'download')}`;
  } else if (file.path) {
    // Keep full path with uploads/ prefix for local storage
    downloadPath = `/api/download/${file.path}?download=true&storageType=local`;
  } else if (file.filename) {
    // Use filename directly
    downloadPath = `/api/download/${file.filename}?download=true&storageType=local`;
  } else {
    // Fallback for string filename
    downloadPath = `/api/download/${file}?download=true&storageType=local`;
  }
  
  // Use the original filename if available, otherwise fall back to the generated filename
  const originalName = file.originalName || file.filename || 'document.pdf';
  
  // Force direct download without "Save As" dialog using programmatic approach
  const link = document.createElement('a');
  link.href = `${downloadPath}?download=true&originalName=${encodeURIComponent(originalName)}`;
  link.download = originalName;
  link.style.display = 'none';
  
  // Add to DOM, click, and remove immediately
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log(`📥 Direct download triggered: ${originalName}`);
};

// Download all files at once (simple and direct)
export const downloadAllFiles = (
  files: any[],
  onProgress?: (current: number, total: number) => void,
  orderStatus?: string
): void => {
  // Check if files are accessible before attempting to download
  if (orderStatus === 'completed') {
    console.warn('Cannot download files: Files deleted after order completion');
    throw new Error('Files no longer available - deleted after order completion');
  }

  // Simple sequential download with a small delay between files
  files.forEach((file, index) => {
    setTimeout(() => {
      downloadFile(file, orderStatus);
      if (onProgress) {
        onProgress(index + 1, files.length);
      }
    }, index * 500); // 500ms delay between downloads
  });
};

// EXECUTIVE DECISION: Enhanced Cancellation Dialog
type PrintCancellationChoice = 'skip' | 'continue' | 'cancel';

const showCancellationDialog = (): Promise<PrintCancellationChoice> => {
  return new Promise((resolve) => {
    // Create custom dialog with three options
    const dialogHTML = `
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                  background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); 
                  z-index: 10000; min-width: 300px;">
        <h3 style="margin-top: 0;">Print Job Cancelled</h3>
        <p>What would you like to do with the remaining files?</p>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button id="print-skip" style="flex: 1; padding: 10px; cursor: pointer;">Skip this file</button>
          <button id="print-continue" style="flex: 1; padding: 10px; cursor: pointer;">Continue printing</button>
          <button id="print-cancel" style="flex: 1; padding: 10px; cursor: pointer;">Cancel remaining</button>
        </div>
      </div>
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                  background: rgba(0,0,0,0.5); z-index: 9999;"></div>
    `;
    
    const dialogContainer = document.createElement('div');
    dialogContainer.innerHTML = dialogHTML;
    document.body.appendChild(dialogContainer);
    
    const handleChoice = (choice: PrintCancellationChoice) => {
      document.body.removeChild(dialogContainer);
      resolve(choice);
    };
    
    document.getElementById('print-skip')?.addEventListener('click', () => handleChoice('skip'));
    document.getElementById('print-continue')?.addEventListener('click', () => handleChoice('continue'));
    document.getElementById('print-cancel')?.addEventListener('click', () => handleChoice('cancel'));
  });
};

// Bulletproof bulk print function using window monitoring - handles 100s of files up to 500MB each
export const printAllFiles = async (
  files: any[],
  onProgress?: (current: number, total: number) => void,
  orderStatus?: string
): Promise<void> => {
  // Check if files are accessible before attempting to print
  if (orderStatus === 'completed') {
    throw new Error('Files no longer available');
  }

  console.log(`🖨️ Starting bulletproof batch print for ${files.length} files`);
  
  // Calculate total size for optimization decisions
  const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
  const isHeavyBatch = totalSize > 100 * 1024 * 1024 || files.length > 50; // Over 100MB total or 50+ files
  
  // Optimized delays since we're waiting for window close, not guessing
  const getDelay = (file: any) => {
    const fileSize = file.size || 0;
    if (fileSize > 100 * 1024 * 1024) return 1000; // 1s for files over 100MB
    if (fileSize > 50 * 1024 * 1024) return 750;   // 0.75s for files over 50MB
    return 250;                                     // 0.25s for smaller files
  };
  
  // Process files with bulletproof window monitoring and enhanced cancellation handling
  let skipNextFile = false;
  
  for (let i = 0; i < files.length; i++) {
    if (skipNextFile) {
      skipNextFile = false;
      continue;
    }
    
    const file = files[i];
    console.log(`📄 Printing file ${i + 1}/${files.length}: ${file.originalName || file.filename || 'unnamed'}`);
    
    try {
      // This await is now tied to the user closing the window, not a timer
      await printFile(file, orderStatus); 
      if (onProgress) onProgress(i + 1, files.length);
    } catch (error) {
      console.error(`Failed to print file ${i + 1}:`, (error as Error).message);
      
      // EXECUTIVE DECISION: Check if user cancelled the print
      if ((error as Error).message.includes('cancelled')) {
        const choice = await showCancellationDialog();
        
        switch (choice) {
          case 'skip':
            console.log('⏭️ Skipping this file, continuing with remaining files');
            skipNextFile = false;
            continue;
          case 'continue':
            console.log('▶️ Continuing with all remaining files');
            break;
          case 'cancel':
            console.log('🛑 Cancelling remaining print jobs');
            return;
        }
      }
    }
    
    // Smart delay between prints
    if (i < files.length - 1) {
      const delay = getDelay(file);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Extra pause every 10 files for heavy batches to optimize browser performance
      if (isHeavyBatch && (i + 1) % 10 === 0) {
        console.log('⏸️ Smart pause to optimize browser performance...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  console.log(`✅ Batch print completed: ${files.length} files processed.`);
};