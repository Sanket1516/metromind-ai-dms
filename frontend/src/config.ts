export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8010';
// Note: WebSocket URLs are now configured in services/api.ts

export const APP_CONFIG = {
  auth: {
    tokenKey: 'metromind_token',
    refreshTokenKey: 'metromind_refresh_token',
    tokenExpiryKey: 'metromind_token_expiry',
  },
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 25, 50],
  },
  fileUpload: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/tiff',
    ],
  },
  toast: {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  },
  timeouts: {
    searchDebounce: 300,
    autoSave: 1000 * 60, // 1 minute
  },
};
