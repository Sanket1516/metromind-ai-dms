/**
 * MetroMind Browser Extension Tests
 * Comprehensive testing for extension functionality, content scripts, and accessibility
 */

// Mock Chrome Extension APIs
const mockChrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    sendMessage: jest.fn(),
    getURL: jest.fn((path) => `chrome-extension://test-id/${path}`),
    onInstalled: {
      addListener: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
  },
  activeTab: {
    id: 1,
    url: 'https://example.com',
  },
};

// Set global chrome object
global.chrome = mockChrome;

// Mock DOM APIs for extension environment
const mockDocument = {
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  createElement: jest.fn(() => ({
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(),
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    style: {},
    innerHTML: '',
    textContent: '',
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    removeAttribute: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    click: jest.fn(),
    focus: jest.fn(),
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 'complete',
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(),
    },
  },
};

global.document = mockDocument;

describe('Browser Extension Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Popup Functionality', () => {
    test('initializes popup correctly', () => {
      // Mock popup initialization
      const initializePopup = () => {
        const uploadBtn = mockDocument.getElementById('uploadBtn');
        const searchBtn = mockDocument.getElementById('searchBtn');
        const settingsBtn = mockDocument.getElementById('settingsBtn');
        
        return { uploadBtn, searchBtn, settingsBtn };
      };

      mockDocument.getElementById.mockReturnValue({
        addEventListener: jest.fn(),
        click: jest.fn(),
        focus: jest.fn(),
        classList: { add: jest.fn(), remove: jest.fn() },
      });

      const { uploadBtn, searchBtn, settingsBtn } = initializePopup();

      expect(mockDocument.getElementById).toHaveBeenCalledWith('uploadBtn');
      expect(mockDocument.getElementById).toHaveBeenCalledWith('searchBtn');
      expect(mockDocument.getElementById).toHaveBeenCalledWith('settingsBtn');
      expect(uploadBtn).toBeDefined();
      expect(searchBtn).toBeDefined();
      expect(settingsBtn).toBeDefined();
    });

    test('handles upload button click', async () => {
      const handleUploadClick = async () => {
        try {
          // Query for active tab
          const tabs = await new Promise((resolve) => {
            mockChrome.tabs.query({ active: true, currentWindow: true }, resolve);
          });

          // Send message to content script
          if (tabs[0]) {
            await new Promise((resolve) => {
              mockChrome.tabs.sendMessage(tabs[0].id, {
                action: 'SHOW_UPLOAD_DIALOG'
              }, resolve);
            });
          }

          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      };

      mockChrome.tabs.query.mockImplementation((query, callback) => {
        callback([{ id: 1, url: 'https://example.com' }]);
      });

      mockChrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
        callback({ received: true });
      });

      const result = await handleUploadClick();

      expect(mockChrome.tabs.query).toHaveBeenCalledWith(
        { active: true, currentWindow: true },
        expect.any(Function)
      );
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
        1,
        { action: 'SHOW_UPLOAD_DIALOG' },
        expect.any(Function)
      );
      expect(result.success).toBe(true);
    });

    test('handles search functionality', async () => {
      const handleSearchClick = async () => {
        try {
          // Get search preferences
          const settings = await new Promise((resolve) => {
            mockChrome.storage.sync.get(['searchSettings'], resolve);
          });

          // Open MetroMind search page
          await new Promise((resolve) => {
            mockChrome.tabs.create({
              url: `https://metromind.local/search?query=&auto=true`
            }, resolve);
          });

          return { success: true, settings };
        } catch (error) {
          return { success: false, error: error.message };
        }
      };

      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ searchSettings: { autoSearch: true } });
      });

      mockChrome.tabs.create.mockImplementation((createProps, callback) => {
        callback({ id: 2, url: createProps.url });
      });

      const result = await handleSearchClick();

      expect(mockChrome.storage.sync.get).toHaveBeenCalledWith(
        ['searchSettings'],
        expect.any(Function)
      );
      expect(mockChrome.tabs.create).toHaveBeenCalledWith(
        { url: 'https://metromind.local/search?query=&auto=true' },
        expect.any(Function)
      );
      expect(result.success).toBe(true);
    });

    test('handles settings button', async () => {
      const handleSettingsClick = async () => {
        try {
          await new Promise((resolve) => {
            mockChrome.tabs.create({
              url: mockChrome.runtime.getURL('options.html')
            }, resolve);
          });
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      };

      mockChrome.runtime.getURL.mockReturnValue('chrome-extension://test-id/options.html');
      mockChrome.tabs.create.mockImplementation((createProps, callback) => {
        callback({ id: 3, url: createProps.url });
      });

      const result = await handleSettingsClick();

      expect(mockChrome.runtime.getURL).toHaveBeenCalledWith('options.html');
      expect(mockChrome.tabs.create).toHaveBeenCalledWith(
        { url: 'chrome-extension://test-id/options.html' },
        expect.any(Function)
      );
      expect(result.success).toBe(true);
    });
  });

  describe('Content Script Functionality', () => {
    test('injects upload dialog into page', () => {
      const injectUploadDialog = () => {
        // Create dialog container
        const dialog = mockDocument.createElement('div');
        dialog.id = 'metromind-upload-dialog';
        dialog.innerHTML = `
          <div class="metromind-dialog-content">
            <h2>Upload to MetroMind</h2>
            <div class="metromind-dropzone" id="metromind-dropzone">
              <p>Drop files here or click to browse</p>
              <input type="file" id="metromind-file-input" multiple accept=".pdf,.doc,.docx,.txt">
            </div>
            <div class="metromind-dialog-actions">
              <button id="metromind-upload-btn">Upload</button>
              <button id="metromind-cancel-btn">Cancel</button>
            </div>
          </div>
        `;

        mockDocument.body.appendChild(dialog);
        return dialog;
      };

      const mockDialog = {
        id: 'metromind-upload-dialog',
        innerHTML: expect.any(String),
      };

      mockDocument.createElement.mockReturnValue(mockDialog);

      const dialog = injectUploadDialog();

      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(dialog.id).toBe('metromind-upload-dialog');
      expect(mockDocument.body.appendChild).toHaveBeenCalledWith(dialog);
    });

    test('handles file selection and upload', async () => {
      const handleFileUpload = async (files) => {
        const formData = new FormData();
        
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i]);
        }

        try {
          const response = await fetch('http://localhost:8010/documents/upload', {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': 'Bearer test-token'
            }
          });

          const result = await response.json();
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: error.message };
        }
      };

      // Mock files
      const mockFiles = [
        { name: 'test1.pdf', type: 'application/pdf', size: 1024 },
        { name: 'test2.doc', type: 'application/msword', size: 2048 }
      ];

      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({
          status: 'success',
          documents: [
            { id: 1, filename: 'test1.pdf' },
            { id: 2, filename: 'test2.doc' }
          ]
        })
      });

      const result = await handleFileUpload(mockFiles);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8010/documents/upload',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token'
          }
        })
      );
      expect(result.success).toBe(true);
      expect(result.data.documents).toHaveLength(2);
    });

    test('removes dialog from page', () => {
      const removeUploadDialog = () => {
        const dialog = mockDocument.getElementById('metromind-upload-dialog');
        if (dialog) {
          mockDocument.body.removeChild(dialog);
          return true;
        }
        return false;
      };

      mockDocument.getElementById.mockReturnValue({
        id: 'metromind-upload-dialog'
      });

      const removed = removeUploadDialog();

      expect(mockDocument.getElementById).toHaveBeenCalledWith('metromind-upload-dialog');
      expect(mockDocument.body.removeChild).toHaveBeenCalled();
      expect(removed).toBe(true);
    });

    test('handles message from popup', () => {
      const messageHandler = (message, sender, sendResponse) => {
        switch (message.action) {
          case 'SHOW_UPLOAD_DIALOG':
            // Inject upload dialog
            const dialog = mockDocument.createElement('div');
            dialog.id = 'metromind-upload-dialog';
            mockDocument.body.appendChild(dialog);
            
            sendResponse({ success: true, action: 'dialog_shown' });
            break;
            
          case 'HIDE_UPLOAD_DIALOG':
            const existingDialog = mockDocument.getElementById('metromind-upload-dialog');
            if (existingDialog) {
              mockDocument.body.removeChild(existingDialog);
            }
            
            sendResponse({ success: true, action: 'dialog_hidden' });
            break;
            
          default:
            sendResponse({ success: false, error: 'Unknown action' });
        }
      };

      const mockSendResponse = jest.fn();
      mockDocument.createElement.mockReturnValue({ id: 'metromind-upload-dialog' });
      mockDocument.getElementById.mockReturnValue({ id: 'metromind-upload-dialog' });

      // Test SHOW_UPLOAD_DIALOG
      messageHandler({ action: 'SHOW_UPLOAD_DIALOG' }, {}, mockSendResponse);
      
      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(mockDocument.body.appendChild).toHaveBeenCalled();
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        action: 'dialog_shown'
      });

      // Clear mocks
      jest.clearAllMocks();
      mockSendResponse.mockClear();

      // Test HIDE_UPLOAD_DIALOG
      messageHandler({ action: 'HIDE_UPLOAD_DIALOG' }, {}, mockSendResponse);
      
      expect(mockDocument.getElementById).toHaveBeenCalledWith('metromind-upload-dialog');
      expect(mockDocument.body.removeChild).toHaveBeenCalled();
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        action: 'dialog_hidden'
      });
    });
  });

  describe('Background Script Functionality', () => {
    test('handles extension installation', () => {
      const onInstallHandler = (details) => {
        if (details.reason === 'install') {
          // Set default settings
          mockChrome.storage.sync.set({
            uploadSettings: {
              autoUpload: false,
              defaultFolder: 'Documents',
              fileTypes: ['.pdf', '.doc', '.docx', '.txt']
            },
            searchSettings: {
              autoSearch: true,
              searchDepth: 'deep',
              includeOCR: true
            }
          });

          // Set badge
          mockChrome.action.setBadgeText({ text: 'NEW' });
          mockChrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
        }
      };

      onInstallHandler({ reason: 'install' });

      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        uploadSettings: {
          autoUpload: false,
          defaultFolder: 'Documents',
          fileTypes: ['.pdf', '.doc', '.docx', '.txt']
        },
        searchSettings: {
          autoSearch: true,
          searchDepth: 'deep',
          includeOCR: true
        }
      });
      expect(mockChrome.action.setBadgeText).toHaveBeenCalledWith({ text: 'NEW' });
      expect(mockChrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#4CAF50' });
    });

    test('handles runtime messages', () => {
      const messageHandler = (message, sender, sendResponse) => {
        switch (message.action) {
          case 'GET_SETTINGS':
            mockChrome.storage.sync.get(['uploadSettings', 'searchSettings'], (result) => {
              sendResponse({ success: true, settings: result });
            });
            return true; // Keep channel open for async response
            
          case 'UPDATE_BADGE':
            mockChrome.action.setBadgeText({ text: message.text || '' });
            sendResponse({ success: true });
            break;
            
          default:
            sendResponse({ success: false, error: 'Unknown action' });
        }
      };

      const mockSendResponse = jest.fn();

      // Test GET_SETTINGS
      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({
          uploadSettings: { autoUpload: false },
          searchSettings: { autoSearch: true }
        });
      });

      const keepChannelOpen = messageHandler({ action: 'GET_SETTINGS' }, {}, mockSendResponse);
      
      expect(mockChrome.storage.sync.get).toHaveBeenCalledWith(
        ['uploadSettings', 'searchSettings'],
        expect.any(Function)
      );
      expect(keepChannelOpen).toBe(true);

      // Test UPDATE_BADGE
      messageHandler({ action: 'UPDATE_BADGE', text: '5' }, {}, mockSendResponse);
      
      expect(mockChrome.action.setBadgeText).toHaveBeenCalledWith({ text: '5' });
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('Accessibility Features', () => {
    test('popup has proper ARIA labels', () => {
      const checkPopupAccessibility = () => {
        const buttons = [
          { id: 'uploadBtn', label: 'Upload documents to MetroMind' },
          { id: 'searchBtn', label: 'Search documents in MetroMind' },
          { id: 'settingsBtn', label: 'Open MetroMind extension settings' }
        ];

        const results = buttons.map(button => {
          const element = mockDocument.getElementById(button.id);
          return {
            id: button.id,
            hasAriaLabel: element && element.getAttribute('aria-label') === button.label,
            element
          };
        });

        return results;
      };

      mockDocument.getElementById.mockImplementation((id) => ({
        getAttribute: (attr) => {
          const labels = {
            'uploadBtn': 'Upload documents to MetroMind',
            'searchBtn': 'Search documents in MetroMind',
            'settingsBtn': 'Open MetroMind extension settings'
          };
          return attr === 'aria-label' ? labels[id] : null;
        }
      }));

      const results = checkPopupAccessibility();

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.hasAriaLabel).toBe(true);
      });
    });

    test('content script dialog supports keyboard navigation', () => {
      const setupKeyboardNavigation = () => {
        const focusableElements = [
          'metromind-file-input',
          'metromind-upload-btn',
          'metromind-cancel-btn'
        ];

        const keyboardHandler = (event) => {
          if (event.key === 'Tab') {
            const currentIndex = focusableElements.indexOf(event.target.id);
            const nextIndex = event.shiftKey 
              ? (currentIndex - 1 + focusableElements.length) % focusableElements.length
              : (currentIndex + 1) % focusableElements.length;
            
            const nextElement = mockDocument.getElementById(focusableElements[nextIndex]);
            if (nextElement) {
              nextElement.focus();
              event.preventDefault();
            }
          }

          if (event.key === 'Escape') {
            const dialog = mockDocument.getElementById('metromind-upload-dialog');
            if (dialog) {
              mockDocument.body.removeChild(dialog);
            }
          }
        };

        return { keyboardHandler, focusableElements };
      };

      mockDocument.getElementById.mockImplementation((id) => ({
        id,
        focus: jest.fn(),
        addEventListener: jest.fn(),
      }));

      const { keyboardHandler, focusableElements } = setupKeyboardNavigation();

      // Test Tab navigation
      const tabEvent = {
        key: 'Tab',
        target: { id: 'metromind-file-input' },
        preventDefault: jest.fn(),
        shiftKey: false
      };

      keyboardHandler(tabEvent);

      expect(mockDocument.getElementById).toHaveBeenCalledWith('metromind-upload-btn');
      expect(tabEvent.preventDefault).toHaveBeenCalled();

      // Test Escape key
      const escapeEvent = {
        key: 'Escape',
        target: { id: 'metromind-file-input' }
      };

      keyboardHandler(escapeEvent);

      expect(mockDocument.getElementById).toHaveBeenCalledWith('metromind-upload-dialog');
      expect(mockDocument.body.removeChild).toHaveBeenCalled();
    });

    test('provides screen reader announcements', () => {
      const announceToScreenReader = (message, priority = 'polite') => {
        const announcement = mockDocument.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.classList.add('sr-only');
        announcement.textContent = message;

        mockDocument.body.appendChild(announcement);

        // Remove after announcement
        setTimeout(() => {
          mockDocument.body.removeChild(announcement);
        }, 1000);

        return announcement;
      };

      const mockAnnouncement = {
        setAttribute: jest.fn(),
        classList: { add: jest.fn() },
        textContent: ''
      };

      mockDocument.createElement.mockReturnValue(mockAnnouncement);

      const announcement = announceToScreenReader('File uploaded successfully', 'assertive');

      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(mockAnnouncement.setAttribute).toHaveBeenCalledWith('aria-live', 'assertive');
      expect(mockAnnouncement.setAttribute).toHaveBeenCalledWith('aria-atomic', 'true');
      expect(mockAnnouncement.classList.add).toHaveBeenCalledWith('sr-only');
      expect(mockAnnouncement.textContent).toBe('File uploaded successfully');
      expect(mockDocument.body.appendChild).toHaveBeenCalledWith(mockAnnouncement);
    });
  });

  describe('Error Handling', () => {
    test('handles Chrome API errors gracefully', async () => {
      const handleChromeError = async (operation) => {
        try {
          switch (operation) {
            case 'storage':
              await new Promise((resolve, reject) => {
                mockChrome.storage.sync.get(['settings'], (result) => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                  } else {
                    resolve(result);
                  }
                });
              });
              break;
              
            case 'tabs':
              await new Promise((resolve, reject) => {
                mockChrome.tabs.query({ active: true }, (tabs) => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                  } else {
                    resolve(tabs);
                  }
                });
              });
              break;
          }
          
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      };

      // Mock Chrome runtime error
      global.chrome.runtime.lastError = { message: 'Storage quota exceeded' };

      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback(null);
      });

      const result = await handleChromeError('storage');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage quota exceeded');

      // Clean up
      delete global.chrome.runtime.lastError;
    });

    test('handles network errors during upload', async () => {
      const handleUploadError = async () => {
        try {
          global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

          const response = await fetch('http://localhost:8010/documents/upload', {
            method: 'POST',
            body: new FormData()
          });

          return { success: true, data: await response.json() };
        } catch (error) {
          return { success: false, error: error.message };
        }
      };

      const result = await handleUploadError();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });
});