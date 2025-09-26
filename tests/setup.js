/**
 * MetroMind Test Suite Setup
 * Global configuration and utilities for all tests
 */

// Suppress console warnings during tests
const originalWarn = console.warn;
const originalError = console.error;

global.beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

global.afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Global test utilities
global.TestUtils = {
  // Mock user data
  createMockUser: (overrides = {}) => ({
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    full_name: 'Test User',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides
  }),

  // Mock document data
  createMockDocument: (overrides = {}) => ({
    id: 1,
    filename: 'test-document.pdf',
    file_type: 'application/pdf',
    file_size: 1024,
    upload_time: '2024-01-15T10:00:00Z',
    status: 'processed',
    ...overrides
  }),

  // Mock task data
  createMockTask: (overrides = {}) => ({
    id: 1,
    title: 'Test Task',
    description: 'Test task description',
    status: 'pending',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    ...overrides
  }),

  // Mock API response
  createMockApiResponse: (data, status = 200, ok = true) => ({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Map([['content-type', 'application/json']]),
  }),

  // Create FormData for file uploads
  createMockFormData: (filename = 'test.pdf', content = 'test content', type = 'application/pdf') => {
    const formData = new FormData();
    const file = new Blob([content], { type });
    formData.append('file', file, filename);
    return formData;
  },

  // Wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Create mock event
  createMockEvent: (type, properties = {}) => ({
    type,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    target: { value: '' },
    ...properties
  }),

  // Mock fetch responses
  setupFetchMock: (responses = {}) => {
    global.fetch = jest.fn((url, options = {}) => {
      const method = options.method || 'GET';
      const key = `${method} ${url}`;
      
      if (responses[key]) {
        return Promise.resolve(responses[key]);
      }
      
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      });
    });
  },

  // Clean up after tests
  cleanup: () => {
    jest.clearAllMocks();
    localStorage.clear?.();
    sessionStorage.clear?.();
  }
};

// Mock localStorage and sessionStorage for all tests
const createMockStorage = () => {
  const storage = {};
  return {
    getItem: jest.fn((key) => storage[key] || null),
    setItem: jest.fn((key, value) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
    get length() {
      return Object.keys(storage).length;
    },
    key: jest.fn((index) => Object.keys(storage)[index] || null)
  };
};

if (typeof global !== 'undefined') {
  global.localStorage = createMockStorage();
  global.sessionStorage = createMockStorage();
}

// Mock window.location
global.mockLocation = {
  href: 'http://localhost:3000/',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};

Object.defineProperty(global, 'location', {
  value: global.mockLocation,
  writable: true,
});

// Mock window.history
global.mockHistory = {
  length: 1,
  state: null,
  pushState: jest.fn(),
  replaceState: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  go: jest.fn(),
};

Object.defineProperty(global, 'history', {
  value: global.mockHistory,
  writable: true,
});

// Environment variables for testing
process.env.NODE_ENV = 'test';
process.env.API_BASE_URL = 'http://localhost:8010';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Global test constants
global.TEST_CONSTANTS = {
  API_BASE_URL: 'http://localhost:8010',
  FRONTEND_URL: 'http://localhost:3000',
  TEST_USER_TOKEN: 'test-jwt-token',
  TEST_FILES: {
    PDF: {
      name: 'test.pdf',
      type: 'application/pdf',
      content: 'Test PDF content',
      size: 1024
    },
    DOC: {
      name: 'test.doc',
      type: 'application/msword',
      content: 'Test DOC content',
      size: 2048
    },
    TXT: {
      name: 'test.txt',
      type: 'text/plain',
      content: 'Test text content',
      size: 512
    }
  }
};

// Setup Jest matchers
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset mock implementations
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear();
  }
  
  // Clear storage
  global.localStorage.clear();
  global.sessionStorage.clear();
  
  // Reset location and history
  global.mockLocation.href = 'http://localhost:3000/';
  global.mockLocation.pathname = '/';
  global.mockLocation.search = '';
  global.mockLocation.hash = '';
});

afterEach(() => {
  // Additional cleanup
  TestUtils.cleanup();
});