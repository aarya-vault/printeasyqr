// PrintEasy Connect Protocol Helper Utilities

export interface ProtocolFile {
  name: string;
  url: string;
  type?: string;
  size?: number;
}

// Generate protocol URL for single order with complete file data
export const generateProtocolUrl = (orderId: string, files?: any[]): string => {
  // 🔧 CRITICAL FIX: Desktop app expects complete file data, not just jobId
  if (files && files.length > 0) {
    const filesParam = encodeURIComponent(JSON.stringify(files.map(file => ({
      name: file.originalName || file.filename || 'document',
      url: file.downloadUrl || file.r2Url || `/api/download/${file.path || file.filename}`,
      type: file.mimetype || 'unknown',
      size: file.size || 0
    }))));
    return `printeasy-connect://?files=${filesParam}&orderId=${orderId}`;
  }
  
  // Fallback to jobId approach for compatibility
  return `printeasy-connect://?jobId=${orderId}`;
};

// Generate protocol URL for multiple orders (batch)
export const generateBatchProtocolUrl = async (orderIds: number[]): Promise<string> => {
  try {
    // Call backend to create batch job
    const authToken = localStorage.getItem('authToken');
    const response = await fetch('/api/desktop/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ orderIds })
    });

    if (!response.ok) {
      throw new Error('Failed to create batch job');
    }

    const { batchId, protocolUrl } = await response.json();
    return protocolUrl || generateProtocolUrl(batchId);
  } catch (error) {
    console.error('Error creating batch job:', error);
    // Fallback to comma-separated IDs
    return generateProtocolUrl(`BATCH-${orderIds.join(',')}`);
  }
};

// Detect if desktop app is installed by monitoring window focus
export const detectDesktopApp = async (protocolUrl: string): Promise<boolean> => {
  return new Promise((resolve) => {
    let hasFocus = true;
    let checkTimeout: NodeJS.Timeout;
    
    // Listen for window blur (app launched successfully)
    const handleBlur = () => {
      hasFocus = false;
    };
    
    // Listen for visibility change as backup
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hasFocus = false;
      }
    };
    
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Try to open the protocol URL
    window.open(protocolUrl, '_self');
    
    // Check after 3 seconds if window lost focus
    checkTimeout = setTimeout(() => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (hasFocus) {
        // Window never lost focus, app probably not installed
        resolve(false);
      } else {
        // Window lost focus, app launched successfully
        resolve(true);
      }
    }, 3000);
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      clearTimeout(checkTimeout);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    });
  });
};

// Launch PrintEasy Connect with fallback handling
export const launchPrintEasyConnect = async (
  orderId: string | number[],
  onFallback?: () => void
): Promise<void> => {
  try {
    // Generate appropriate protocol URL
    let protocolUrl: string;
    
    if (Array.isArray(orderId)) {
      // Multiple orders - create batch
      protocolUrl = await generateBatchProtocolUrl(orderId);
    } else {
      // Single order
      protocolUrl = generateProtocolUrl(orderId.toString());
    }
    
    console.log('🚀 Launching PrintEasy Connect:', protocolUrl);
    
    // Detect if app is installed
    const isInstalled = await detectDesktopApp(protocolUrl);
    
    if (!isInstalled) {
      console.log('❌ PrintEasy Connect not detected, showing fallback');
      if (onFallback) {
        onFallback();
      }
    } else {
      console.log('✅ PrintEasy Connect launched successfully');
    }
  } catch (error) {
    console.error('Error launching PrintEasy Connect:', error);
    if (onFallback) {
      onFallback();
    }
  }
};

// Get download links for desktop app
export const getDesktopAppLinks = () => {
  return {
    windows: 'https://printeasyqr.com/download/windows',
    mac: 'https://printeasyqr.com/download/mac',
    linux: 'https://printeasyqr.com/download/linux'
  };
};

// Check if current platform supports desktop app
export const isPlatformSupported = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check if it's a mobile device
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  // Desktop app only works on desktop platforms
  return !isMobile;
};

// Format files array for protocol (if needed for future direct file passing)
export const formatFilesForProtocol = (files: any[]): string => {
  const filesArray: ProtocolFile[] = files.map(file => ({
    name: file.originalName || file.filename || 'document',
    url: '', // URL will be generated by backend
    type: file.mimetype ? file.mimetype.split('/')[1] : 'unknown',
    size: file.size || 0
  }));
  
  return encodeURIComponent(JSON.stringify(filesArray));
};