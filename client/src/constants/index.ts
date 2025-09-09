// Application constants for better maintainability

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    PHONE_LOGIN: '/api/auth/phone-login',
    EMAIL_LOGIN: '/api/auth/email-login',
    LOGOUT: '/api/auth/logout',
    SESSION: '/api/auth/session'
  },
  SHOPS: {
    BASE: '/api/shops',
    APPLICATIONS: '/api/shop-applications',
    VISITED: (customerId: number) => `/api/shops/customer/${customerId}/visited`,
    SETTINGS: '/api/shops/settings'
  },
  ORDERS: {
    BASE: '/api/orders',
    SHOP: (shopId: number) => `/api/orders/shop/${shopId}`,
    CUSTOMER: (customerId: number) => `/api/orders/customer/${customerId}`,
    UPLOAD: '/api/orders/upload',
    WALKIN: '/api/orders/walkin'
  },
  FILES: {
    UPLOAD: '/api/upload',
    SERVE: (filename: string) => `/uploads/${filename}`
  },
  MESSAGES: {
    BASE: '/api/messages',
    ORDER: (orderId: number) => `/api/messages/order/${orderId}`
  },
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    USER: (userId: number) => `/api/notifications/user/${userId}`,
    READ_ALL: (userId: number) => `/api/notifications/user/${userId}/read-all`
  }
} as const;

// File upload constraints - UPDATED: Allow ALL file types
export const FILE_UPLOAD = {
  ALLOWED_TYPES: [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/rtf',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation',
    // Images
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    'image/tiff',
    'image/svg+xml',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip',
    // Other common formats
    'application/json',
    'application/xml',
    'text/xml',
    'text/html',
    'application/javascript',
    'text/css',
    // Allow any file type (fallback)
    '*/*'
  ],
  ALLOWED_EXTENSIONS: [
    // Documents
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf', 'odt', 'ods', 'odp',
    // Images  
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif', 'svg',
    // Archives
    'zip', 'rar', '7z', 'tar', 'gz',
    // Other formats
    'json', 'xml', 'html', 'js', 'css', 'md',
    // Allow any extension (removed specific restrictions)
  ]
} as const;

// UI constants
export const UI_CONSTANTS = {
  COLORS: {
    BRAND_YELLOW: '#FFBF00',
    RICH_BLACK: '#000000',
    PURE_WHITE: '#FFFFFF',
    SUCCESS_GREEN: '#22c55e',
    WARNING_AMBER: '#f59e0b',
    ERROR_RED: '#ef4444'
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px', 
    LG: '1024px',
    XL: '1280px'
  },
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
  }
} as const;

// Print settings
export const PRINT_SETTINGS = {
  FALLBACK_TIMEOUT: 6000, // 6 seconds
  WINDOW_CHECK_INTERVAL: 500, // 0.5 seconds
  BATCH_DELAY: 1000, // 1 second between prints
  IMAGE_LOAD_DELAY: 200 // 200ms after image load
} as const;

// WebSocket events
export const WS_EVENTS = {
  ORDER_UPDATED: 'order_updated',
  NEW_MESSAGE: 'new_message',
  SHOP_STATUS_CHANGED: 'shop_status_changed',
  NOTIFICATION_RECEIVED: 'notification_received'
} as const;

// Form validation patterns
export const VALIDATION_PATTERNS = {
  INDIAN_PHONE: /^[6-9]\d{9}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  SHOP_SLUG: /^[a-z0-9-]+$/
} as const;

// Default values
export const DEFAULTS = {
  WORKING_HOURS: {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '18:00', closed: false },
    sunday: { open: '09:00', close: '18:00', closed: true }
  },
  PAGINATION: {
    PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100
  },
  TIMEOUTS: {
    API_REQUEST: 30000, // 30 seconds
    WEBSOCKET_RECONNECT: 5000 // 5 seconds
  }
} as const;