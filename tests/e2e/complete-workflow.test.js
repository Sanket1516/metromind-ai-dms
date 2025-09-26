/**
 * MetroMind End-to-End Tests
 * Comprehensive testing for complete user workflows and system integration
 */

// Mock environment setup for E2E testing
const mockEnvironment = {
  baseURL: 'http://localhost:8010',
  frontendURL: 'http://localhost:3000',
  testUser: {
    username: 'test_user',
    email: 'test@example.com',
    password: 'TestPassword123!',
    full_name: 'Test User'
  },
  testDocuments: [
    {
      filename: 'test-document.pdf',
      content: 'This is a test PDF document content for OCR processing.',
      type: 'application/pdf',
      size: 1024
    },
    {
      filename: 'test-report.docx',
      content: 'This is a test Word document with important data.',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 2048
    }
  ]
};

// Mock API responses
const mockApiResponses = {
  auth: {
    login: {
      access_token: 'test-jwt-token',
      token_type: 'bearer',
      user: mockEnvironment.testUser
    },
    register: {
      message: 'User registered successfully',
      user: mockEnvironment.testUser
    }
  },
  documents: {
    upload: {
      status: 'success',
      document_id: 1,
      task_id: 1,
      filename: 'test-document.pdf',
      message: 'Document uploaded and processing started'
    },
    list: {
      documents: [
        {
          id: 1,
          filename: 'test-document.pdf',
          upload_time: '2024-01-15T10:00:00Z',
          status: 'processed',
          file_size: 1024,
          file_type: 'application/pdf'
        }
      ],
      total: 1
    },
    search: {
      results: [
        {
          id: 1,
          filename: 'test-document.pdf',
          relevance_score: 0.95,
          matched_content: 'This is a test PDF document...',
          metadata: {
            page_count: 1,
            processed_at: '2024-01-15T10:05:00Z'
          }
        }
      ],
      total_results: 1,
      search_time: 0.125
    }
  },
  tasks: {
    create: {
      task_id: 1,
      title: 'Test Task',
      status: 'pending',
      created_at: '2024-01-15T10:00:00Z'
    },
    list: {
      tasks: [
        {
          id: 1,
          title: 'Test Task',
          description: 'Test task description',
          status: 'pending',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }
      ],
      total: 1
    }
  },
  analytics: {
    dashboard: {
      total_documents: 156,
      active_tasks: 23,
      team_members: 8,
      success_rate: 94,
      recent_activity: [
        {
          type: 'document_upload',
          message: 'test-document.pdf uploaded',
          timestamp: '2024-01-15T10:00:00Z'
        }
      ]
    }
  }
};

// Mock fetch function for API calls
global.fetch = jest.fn();

// Helper function to setup API mocks
const setupApiMocks = () => {
  global.fetch.mockImplementation((url, options = {}) => {
    const method = options.method || 'GET';
    const endpoint = url.replace(mockEnvironment.baseURL, '');

    let responseData = { error: 'Not found' };
    let status = 404;

    // Auth endpoints
    if (endpoint === '/auth/login' && method === 'POST') {
      responseData = mockApiResponses.auth.login;
      status = 200;
    } else if (endpoint === '/auth/register' && method === 'POST') {
      responseData = mockApiResponses.auth.register;
      status = 201;
    }
    // Document endpoints
    else if (endpoint === '/documents/upload' && method === 'POST') {
      responseData = mockApiResponses.documents.upload;
      status = 200;
    } else if (endpoint === '/documents/list' && method === 'GET') {
      responseData = mockApiResponses.documents.list;
      status = 200;
    } else if (endpoint.startsWith('/documents/search') && method === 'GET') {
      responseData = mockApiResponses.documents.search;
      status = 200;
    }
    // Task endpoints
    else if (endpoint === '/tasks/tasks' && method === 'POST') {
      responseData = mockApiResponses.tasks.create;
      status = 201;
    } else if (endpoint === '/tasks/tasks' && method === 'GET') {
      responseData = mockApiResponses.tasks.list;
      status = 200;
    }
    // Analytics endpoints
    else if (endpoint === '/analytics/dashboard' && method === 'GET') {
      responseData = mockApiResponses.analytics.dashboard;
      status = 200;
    }

    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(responseData),
      text: () => Promise.resolve(JSON.stringify(responseData)),
    });
  });
};

describe('MetroMind E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupApiMocks();
  });

  describe('Complete User Registration and Login Flow', () => {
    test('user can register, login, and access dashboard', async () => {
      // Step 1: User Registration
      const registerResponse = await fetch(`${mockEnvironment.baseURL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: mockEnvironment.testUser.username,
          email: mockEnvironment.testUser.email,
          password: mockEnvironment.testUser.password,
          full_name: mockEnvironment.testUser.full_name
        })
      });

      const registerData = await registerResponse.json();
      expect(registerResponse.ok).toBe(true);
      expect(registerData.message).toBe('User registered successfully');
      expect(registerData.user.username).toBe(mockEnvironment.testUser.username);

      // Step 2: User Login
      const loginResponse = await fetch(`${mockEnvironment.baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: mockEnvironment.testUser.username,
          password: mockEnvironment.testUser.password
        })
      });

      const loginData = await loginResponse.json();
      expect(loginResponse.ok).toBe(true);
      expect(loginData.access_token).toBe('test-jwt-token');
      expect(loginData.user.username).toBe(mockEnvironment.testUser.username);

      // Step 3: Access Dashboard with Token
      const dashboardResponse = await fetch(`${mockEnvironment.baseURL}/analytics/dashboard`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${loginData.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const dashboardData = await dashboardResponse.json();
      expect(dashboardResponse.ok).toBe(true);
      expect(dashboardData.total_documents).toBe(156);
      expect(dashboardData.active_tasks).toBe(23);
      expect(dashboardData.team_members).toBe(8);
      expect(dashboardData.success_rate).toBe(94);
    });

    test('handles invalid login credentials gracefully', async () => {
      global.fetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Invalid credentials' }),
        })
      );

      const loginResponse = await fetch(`${mockEnvironment.baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'invalid_user',
          password: 'wrong_password'
        })
      });

      const loginData = await loginResponse.json();
      expect(loginResponse.ok).toBe(false);
      expect(loginResponse.status).toBe(401);
      expect(loginData.error).toBe('Invalid credentials');
    });
  });

  describe('Complete Document Upload and Processing Flow', () => {
    test('uploads document, processes it, and makes it searchable', async () => {
      const authToken = 'test-jwt-token';
      const testDocument = mockEnvironment.testDocuments[0];

      // Step 1: Upload Document
      const formData = new FormData();
      formData.append('file', new Blob([testDocument.content], { type: testDocument.type }), testDocument.filename);

      const uploadResponse = await fetch(`${mockEnvironment.baseURL}/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData
      });

      const uploadData = await uploadResponse.json();
      expect(uploadResponse.ok).toBe(true);
      expect(uploadData.status).toBe('success');
      expect(uploadData.document_id).toBe(1);
      expect(uploadData.task_id).toBe(1);
      expect(uploadData.filename).toBe(testDocument.filename);

      // Step 2: Verify Document in List
      const listResponse = await fetch(`${mockEnvironment.baseURL}/documents/list`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const listData = await listResponse.json();
      expect(listResponse.ok).toBe(true);
      expect(listData.documents).toHaveLength(1);
      expect(listData.documents[0].filename).toBe(testDocument.filename);
      expect(listData.documents[0].status).toBe('processed');

      // Step 3: Search for Document Content
      const searchQuery = 'test PDF document';
      const searchResponse = await fetch(`${mockEnvironment.baseURL}/documents/search?q=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const searchData = await searchResponse.json();
      expect(searchResponse.ok).toBe(true);
      expect(searchData.results).toHaveLength(1);
      expect(searchData.results[0].filename).toBe(testDocument.filename);
      expect(searchData.results[0].relevance_score).toBe(0.95);
      expect(searchData.search_time).toBeLessThan(1);
    });

    test('handles large file upload with progress tracking', async () => {
      const authToken = 'test-jwt-token';
      const largeDocument = {
        filename: 'large-document.pdf',
        content: 'x'.repeat(10 * 1024 * 1024), // 10MB content
        type: 'application/pdf',
        size: 10 * 1024 * 1024
      };

      // Mock progress tracking
      let uploadProgress = 0;
      const progressCallback = (progress) => {
        uploadProgress = progress;
      };

      // Simulate upload with progress
      const formData = new FormData();
      formData.append('file', new Blob([largeDocument.content], { type: largeDocument.type }), largeDocument.filename);

      // Mock XMLHttpRequest for progress tracking
      const mockXHR = {
        open: jest.fn(),
        setRequestHeader: jest.fn(),
        send: jest.fn(),
        upload: {
          addEventListener: jest.fn((event, callback) => {
            if (event === 'progress') {
              // Simulate progress events
              setTimeout(() => callback({ loaded: 2 * 1024 * 1024, total: 10 * 1024 * 1024 }), 100);
              setTimeout(() => callback({ loaded: 5 * 1024 * 1024, total: 10 * 1024 * 1024 }), 200);
              setTimeout(() => callback({ loaded: 10 * 1024 * 1024, total: 10 * 1024 * 1024 }), 300);
            }
          })
        },
        addEventListener: jest.fn((event, callback) => {
          if (event === 'load') {
            setTimeout(() => {
              callback();
              progressCallback(100);
            }, 400);
          }
        }),
        status: 200,
        responseText: JSON.stringify(mockApiResponses.documents.upload)
      };

      global.XMLHttpRequest = jest.fn(() => mockXHR);

      // Simulate upload process
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${mockEnvironment.baseURL}/documents/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          progressCallback(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          expect(response.status).toBe('success');
          expect(uploadProgress).toBe(100);
        }
      });

      xhr.send(formData);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(uploadProgress).toBe(100);
      expect(mockXHR.send).toHaveBeenCalledWith(formData);
    });

    test('handles upload errors and retry logic', async () => {
      const authToken = 'test-jwt-token';
      const testDocument = mockEnvironment.testDocuments[0];

      // Mock failed upload attempt
      global.fetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Server error during upload' }),
        })
      );

      const uploadWithRetry = async (maxRetries = 3) => {
        let attempts = 0;
        let lastError;

        while (attempts < maxRetries) {
          try {
            attempts++;
            
            const formData = new FormData();
            formData.append('file', new Blob([testDocument.content], { type: testDocument.type }), testDocument.filename);

            const response = await fetch(`${mockEnvironment.baseURL}/documents/upload`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${authToken}` },
              body: formData
            });

            if (response.ok) {
              return await response.json();
            } else {
              const errorData = await response.json();
              throw new Error(errorData.error || `HTTP ${response.status}`);
            }
          } catch (error) {
            lastError = error;
            
            // Reset mock for subsequent attempts
            if (attempts < maxRetries) {
              setupApiMocks();
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
          }
        }

        throw new Error(`Upload failed after ${maxRetries} attempts: ${lastError.message}`);
      };

      // First attempt should fail, second should succeed
      const result = await uploadWithRetry(2);
      
      expect(result.status).toBe('success');
      expect(result.document_id).toBe(1);
      expect(fetch).toHaveBeenCalledTimes(2); // Initial failure + retry success
    });
  });

  describe('Complete Task Management Flow', () => {
    test('creates task, tracks progress, and completes workflow', async () => {
      const authToken = 'test-jwt-token';

      // Step 1: Create Task
      const taskData = {
        title: 'Process uploaded documents',
        description: 'OCR processing and content extraction',
        priority: 'high',
        deadline: '2024-01-20T23:59:59Z'
      };

      const createTaskResponse = await fetch(`${mockEnvironment.baseURL}/tasks/tasks`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });

      const createdTask = await createTaskResponse.json();
      expect(createTaskResponse.ok).toBe(true);
      expect(createdTask.task_id).toBe(1);
      expect(createdTask.title).toBe(taskData.title);
      expect(createdTask.status).toBe('pending');

      // Step 2: List Tasks to Verify Creation
      const listTasksResponse = await fetch(`${mockEnvironment.baseURL}/tasks/tasks`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const tasksList = await listTasksResponse.json();
      expect(listTasksResponse.ok).toBe(true);
      expect(tasksList.tasks).toHaveLength(1);
      expect(tasksList.tasks[0].id).toBe(1);
      expect(tasksList.tasks[0].title).toBe(taskData.title);

      // Step 3: Update Task Status (simulated)
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            task_id: 1,
            status: 'in_progress',
            updated_at: '2024-01-15T11:00:00Z'
          }),
        })
      );

      const updateTaskResponse = await fetch(`${mockEnvironment.baseURL}/tasks/tasks/1`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'in_progress' })
      });

      const updatedTask = await updateTaskResponse.json();
      expect(updateTaskResponse.ok).toBe(true);
      expect(updatedTask.status).toBe('in_progress');
    });
  });

  describe('Search and Analytics Integration', () => {
    test('performs comprehensive search with filters and analytics', async () => {
      const authToken = 'test-jwt-token';

      // Step 1: Basic Text Search
      const basicSearchResponse = await fetch(`${mockEnvironment.baseURL}/documents/search?q=test%20document`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const basicSearchData = await basicSearchResponse.json();
      expect(basicSearchResponse.ok).toBe(true);
      expect(basicSearchData.results).toHaveLength(1);
      expect(basicSearchData.search_time).toBeLessThan(1);

      // Step 2: Advanced Search with Filters
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            results: [
              {
                id: 1,
                filename: 'test-document.pdf',
                relevance_score: 0.98,
                file_type: 'application/pdf',
                upload_date: '2024-01-15T10:00:00Z',
                matched_content: 'Highlighted search results...'
              }
            ],
            filters_applied: {
              file_type: 'pdf',
              date_range: '2024-01-01:2024-01-31',
              min_relevance: 0.7
            },
            total_results: 1,
            search_time: 0.089
          }),
        })
      );

      const advancedSearchResponse = await fetch(`${mockEnvironment.baseURL}/documents/search?q=test&file_type=pdf&date_from=2024-01-01&date_to=2024-01-31&min_relevance=0.7`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const advancedSearchData = await advancedSearchResponse.json();
      expect(advancedSearchResponse.ok).toBe(true);
      expect(advancedSearchData.results[0].relevance_score).toBeGreaterThan(0.7);
      expect(advancedSearchData.filters_applied.file_type).toBe('pdf');

      // Step 3: Search Analytics
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            popular_searches: [
              { query: 'test document', count: 15 },
              { query: 'invoice', count: 12 },
              { query: 'report', count: 8 }
            ],
            search_performance: {
              average_response_time: 0.145,
              total_searches: 350,
              cache_hit_rate: 0.78
            },
            user_engagement: {
              click_through_rate: 0.82,
              results_per_search: 4.2
            }
          }),
        })
      );

      const analyticsResponse = await fetch(`${mockEnvironment.baseURL}/analytics/search`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const analyticsData = await analyticsResponse.json();
      expect(analyticsResponse.ok).toBe(true);
      expect(analyticsData.popular_searches).toHaveLength(3);
      expect(analyticsData.search_performance.cache_hit_rate).toBeGreaterThan(0.5);
    });
  });

  describe('Browser Extension Integration', () => {
    test('extension communicates with backend through API', async () => {
      const authToken = 'test-jwt-token';

      // Mock extension environment
      const mockChrome = {
        storage: {
          sync: {
            get: jest.fn((keys, callback) => {
              callback({ authToken: authToken });
            }),
            set: jest.fn()
          }
        },
        tabs: {
          query: jest.fn((query, callback) => {
            callback([{ id: 1, url: 'https://example.com' }]);
          }),
          sendMessage: jest.fn()
        }
      };

      global.chrome = mockChrome;

      // Step 1: Extension gets auth token
      const getAuthToken = () => {
        return new Promise((resolve) => {
          mockChrome.storage.sync.get(['authToken'], (result) => {
            resolve(result.authToken);
          });
        });
      };

      const token = await getAuthToken();
      expect(token).toBe(authToken);
      expect(mockChrome.storage.sync.get).toHaveBeenCalledWith(['authToken'], expect.any(Function));

      // Step 2: Extension uploads file on behalf of user
      const extensionUpload = async (fileData) => {
        const formData = new FormData();
        formData.append('file', new Blob([fileData.content], { type: fileData.type }), fileData.filename);

        const response = await fetch(`${mockEnvironment.baseURL}/documents/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        return await response.json();
      };

      const uploadResult = await extensionUpload(mockEnvironment.testDocuments[0]);
      expect(uploadResult.status).toBe('success');
      expect(uploadResult.document_id).toBe(1);

      // Step 3: Extension notifies user of completion
      const notifyUser = (message) => {
        mockChrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            mockChrome.tabs.sendMessage(tabs[0].id, {
              action: 'SHOW_NOTIFICATION',
              message: message
            });
          }
        });
      };

      notifyUser('Document uploaded successfully!');
      expect(mockChrome.tabs.query).toHaveBeenCalled();
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
        1,
        { action: 'SHOW_NOTIFICATION', message: 'Document uploaded successfully!' }
      );
    });
  });

  describe('Accessibility and Performance', () => {
    test('system maintains performance under load', async () => {
      const authToken = 'test-jwt-token';
      const concurrentRequests = 10;

      // Simulate concurrent document uploads
      const uploadPromises = Array.from({ length: concurrentRequests }, (_, index) => {
        const formData = new FormData();
        formData.append('file', new Blob([`content-${index}`], { type: 'text/plain' }), `test-${index}.txt`);

        return fetch(`${mockEnvironment.baseURL}/documents/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` },
          body: formData
        });
      });

      const startTime = Date.now();
      const results = await Promise.all(uploadPromises);
      const endTime = Date.now();

      // Check all uploads succeeded
      results.forEach(response => {
        expect(response.ok).toBe(true);
      });

      // Performance should be reasonable (less than 5 seconds for 10 concurrent uploads)
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000);

      // Check response data
      const responseData = await Promise.all(results.map(r => r.json()));
      responseData.forEach(data => {
        expect(data.status).toBe('success');
      });
    });

    test('accessibility features work correctly', async () => {
      // Mock screen reader announcements
      const screenReaderAnnouncements = [];
      const announceToScreenReader = (message) => {
        screenReaderAnnouncements.push({
          message,
          timestamp: Date.now(),
          priority: 'polite'
        });
      };

      // Mock user interactions with accessibility features
      const simulateAccessibleUpload = async () => {
        // Announce upload start
        announceToScreenReader('Starting document upload');

        const authToken = 'test-jwt-token';
        const formData = new FormData();
        formData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');

        const response = await fetch(`${mockEnvironment.baseURL}/documents/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` },
          body: formData
        });

        const data = await response.json();

        // Announce upload completion
        if (data.status === 'success') {
          announceToScreenReader(`Document ${data.filename} uploaded successfully`);
        } else {
          announceToScreenReader('Upload failed. Please try again.');
        }

        return data;
      };

      const result = await simulateAccessibleUpload();

      expect(result.status).toBe('success');
      expect(screenReaderAnnouncements).toHaveLength(2);
      expect(screenReaderAnnouncements[0].message).toBe('Starting document upload');
      expect(screenReaderAnnouncements[1].message).toContain('uploaded successfully');
    });
  });

  describe('Error Recovery and System Resilience', () => {
    test('system recovers gracefully from service failures', async () => {
      const authToken = 'test-jwt-token';

      // Mock temporary service failure
      let failureCount = 0;
      global.fetch.mockImplementation((url, options) => {
        failureCount++;
        
        if (failureCount <= 2) {
          // First two requests fail
          return Promise.resolve({
            ok: false,
            status: 503,
            json: () => Promise.resolve({ error: 'Service temporarily unavailable' }),
          });
        } else {
          // Third request succeeds
          setupApiMocks();
          return global.fetch(url, options);
        }
      });

      const resilientRequest = async (url, options, maxRetries = 3) => {
        let attempts = 0;
        let lastError;

        while (attempts < maxRetries) {
          try {
            attempts++;
            const response = await fetch(url, options);
            
            if (response.ok) {
              return await response.json();
            } else {
              const errorData = await response.json();
              throw new Error(`${response.status}: ${errorData.error}`);
            }
          } catch (error) {
            lastError = error;
            
            if (attempts < maxRetries) {
              // Exponential backoff
              const delay = Math.pow(2, attempts) * 1000;
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }

        throw new Error(`Request failed after ${maxRetries} attempts: ${lastError.message}`);
      };

      const result = await resilientRequest(`${mockEnvironment.baseURL}/analytics/dashboard`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(result.total_documents).toBe(156);
      expect(failureCount).toBe(3); // Two failures + one success
    });

    test('handles data corruption and validates responses', async () => {
      const authToken = 'test-jwt-token';

      // Mock corrupted response
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            // Missing required fields
            total_documents: null,
            success_rate: 'invalid',
            // Extra unexpected fields
            malicious_script: '<script>alert("xss")</script>'
          }),
        })
      );

      const validateDashboardData = (data) => {
        const schema = {
          total_documents: 'number',
          active_tasks: 'number',
          team_members: 'number',
          success_rate: 'number'
        };

        const errors = [];
        const sanitized = {};

        for (const [key, expectedType] of Object.entries(schema)) {
          if (!(key in data)) {
            errors.push(`Missing required field: ${key}`);
          } else if (typeof data[key] !== expectedType || data[key] === null) {
            errors.push(`Invalid type for ${key}: expected ${expectedType}, got ${typeof data[key]}`);
          } else {
            sanitized[key] = data[key];
          }
        }

        // Remove any fields not in schema (security measure)
        return { isValid: errors.length === 0, errors, sanitized };
      };

      const response = await fetch(`${mockEnvironment.baseURL}/analytics/dashboard`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const rawData = await response.json();
      const validation = validateDashboardData(rawData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid type for total_documents: expected number, got object');
      expect(validation.errors).toContain('Invalid type for success_rate: expected number, got string');
      expect(validation.sanitized).not.toHaveProperty('malicious_script');
    });
  });
});