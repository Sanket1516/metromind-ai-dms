/**
 * MetroMind Extension Options Script
 * Handles extension settings and configuration
 */

// Default settings
const DEFAULT_SETTINGS = {
  apiUrl: 'http://localhost:8010',
  authToken: '',
  autoScan: true,
  smartSuggestions: true,
  formAssistance: true,
  enableNotifications: true,
  soundNotifications: false,
  secureStorage: true,
  analytics: false
};

// DOM elements
let elements = {};

// Initialize options page
document.addEventListener('DOMContentLoaded', async () => {
  console.log('MetroMind options page initialized');
  
  // Get DOM elements
  initializeElements();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load current settings
  await loadSettings();
  
  // Test initial connection
  await testConnection();
});

// Initialize DOM elements
function initializeElements() {
  elements = {
    apiUrl: document.getElementById('api-url'),
    authToken: document.getElementById('auth-token'),
    autoScan: document.getElementById('auto-scan'),
    smartSuggestions: document.getElementById('smart-suggestions'),
    formAssistance: document.getElementById('form-assistance'),
    enableNotifications: document.getElementById('enable-notifications'),
    soundNotifications: document.getElementById('sound-notifications'),
    secureStorage: document.getElementById('secure-storage'),
    analytics: document.getElementById('analytics'),
    
    testConnection: document.getElementById('test-connection'),
    connectionStatus: document.getElementById('connection-status'),
    clearData: document.getElementById('clear-data'),
    customizeShortcuts: document.getElementById('customize-shortcuts'),
    saveSettings: document.getElementById('save-settings'),
    resetSettings: document.getElementById('reset-settings'),
    
    helpLink: document.getElementById('help-link'),
    feedbackLink: document.getElementById('feedback-link'),
    privacyLink: document.getElementById('privacy-link')
  };
}

// Set up event listeners
function setupEventListeners() {
  // Connection settings
  elements.testConnection.addEventListener('click', testConnection);
  elements.apiUrl.addEventListener('blur', autoTestConnection);
  elements.authToken.addEventListener('blur', autoTestConnection);
  
  // Data management
  elements.clearData.addEventListener('click', clearExtensionData);
  
  // Keyboard shortcuts
  elements.customizeShortcuts.addEventListener('click', openShortcutsPage);
  
  // Action buttons
  elements.saveSettings.addEventListener('click', saveSettings);
  elements.resetSettings.addEventListener('click', resetSettings);
  
  // Footer links
  elements.helpLink.addEventListener('click', openHelpPage);
  elements.feedbackLink.addEventListener('click', openFeedbackPage);
  elements.privacyLink.addEventListener('click', openPrivacyPage);
  
  // Auto-save on input changes
  Object.keys(elements).forEach(key => {
    const element = elements[key];
    if (element && (element.type === 'checkbox' || element.type === 'text' || element.type === 'url' || element.type === 'password')) {
      element.addEventListener('change', debounce(autoSaveSettings, 1000));
    }
  });
}

// Load current settings
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['metromind_settings']);
    const settings = { ...DEFAULT_SETTINGS, ...(result.metromind_settings || {}) };
    
    // Apply settings to UI
    elements.apiUrl.value = settings.apiUrl;
    elements.authToken.value = settings.authToken;
    elements.autoScan.checked = settings.autoScan;
    elements.smartSuggestions.checked = settings.smartSuggestions;
    elements.formAssistance.checked = settings.formAssistance;
    elements.enableNotifications.checked = settings.enableNotifications;
    elements.soundNotifications.checked = settings.soundNotifications;
    elements.secureStorage.checked = settings.secureStorage;
    elements.analytics.checked = settings.analytics;
    
    console.log('Settings loaded:', settings);
  } catch (error) {
    console.error('Failed to load settings:', error);
    showStatus('error', 'Failed to load settings');
  }
}

// Save settings
async function saveSettings() {
  try {
    setButtonLoading(elements.saveSettings, true);
    
    const settings = {
      apiUrl: elements.apiUrl.value.trim(),
      authToken: elements.authToken.value.trim(),
      autoScan: elements.autoScan.checked,
      smartSuggestions: elements.smartSuggestions.checked,
      formAssistance: elements.formAssistance.checked,
      enableNotifications: elements.enableNotifications.checked,
      soundNotifications: elements.soundNotifications.checked,
      secureStorage: elements.secureStorage.checked,
      analytics: elements.analytics.checked
    };
    
    // Validate settings
    if (!isValidUrl(settings.apiUrl)) {
      showStatus('error', 'Please enter a valid API URL');
      return;
    }
    
    // Save to storage
    await chrome.storage.sync.set({ metromind_settings: settings });
    
    // Store auth token securely if needed
    if (settings.authToken) {
      await chrome.storage.local.set({ metromind_token: settings.authToken });
    }
    
    // Notify all tabs about settings change
    await notifySettingsChange(settings);
    
    showStatus('success', 'Settings saved successfully!');
    console.log('Settings saved:', settings);
  } catch (error) {
    console.error('Failed to save settings:', error);
    showStatus('error', 'Failed to save settings');
  } finally {
    setButtonLoading(elements.saveSettings, false);
  }
}

// Auto-save settings (debounced)
async function autoSaveSettings() {
  await saveSettings();
}

// Reset settings to defaults
async function resetSettings() {
  if (!confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
    return;
  }
  
  try {
    setButtonLoading(elements.resetSettings, true);
    
    // Clear stored settings
    await chrome.storage.sync.remove(['metromind_settings']);
    await chrome.storage.local.remove(['metromind_token']);
    
    // Reload defaults
    await loadSettings();
    
    showStatus('success', 'Settings reset to defaults');
  } catch (error) {
    console.error('Failed to reset settings:', error);
    showStatus('error', 'Failed to reset settings');
  } finally {
    setButtonLoading(elements.resetSettings, false);
  }
}

// Test API connection
async function testConnection() {
  const apiUrl = elements.apiUrl.value.trim();
  const authToken = elements.authToken.value.trim();
  
  if (!apiUrl) {
    showConnectionStatus('error', 'Please enter an API URL');
    return;
  }
  
  if (!isValidUrl(apiUrl)) {
    showConnectionStatus('error', 'Please enter a valid URL');
    return;
  }
  
  setButtonLoading(elements.testConnection, true);
  showConnectionStatus('info', 'Testing connection...');
  
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: headers,
      timeout: 10000
    });
    
    if (response.ok) {
      const data = await response.json();
      showConnectionStatus('success', `Connected successfully! Server: ${data.server || 'MetroMind'}`);
    } else {
      showConnectionStatus('error', `Connection failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Connection test failed:', error);
    
    let errorMessage = 'Connection failed';
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'Cannot reach server - check URL and network connection';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Connection timeout - server may be slow or unreachable';
    }
    
    showConnectionStatus('error', errorMessage);
  } finally {
    setButtonLoading(elements.testConnection, false);
  }
}

// Auto-test connection when URL or token changes
const autoTestConnection = debounce(testConnection, 2000);

// Clear extension data
async function clearExtensionData() {
  if (!confirm('Are you sure you want to clear all extension data? This will remove all settings, activity history, and cached data. This action cannot be undone.')) {
    return;
  }
  
  try {
    setButtonLoading(elements.clearData, true);
    
    // Clear all storage
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
    
    // Reload page to reset UI
    showStatus('success', 'Extension data cleared. Reloading...');
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (error) {
    console.error('Failed to clear data:', error);
    showStatus('error', 'Failed to clear extension data');
  } finally {
    setButtonLoading(elements.clearData, false);
  }
}

// Notify all tabs about settings changes
async function notifySettingsChange(settings) {
  try {
    const tabs = await chrome.tabs.query({});
    
    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'updateSettings',
          settings: settings
        });
      } catch (error) {
        // Tab might not have content script, ignore
      }
    }
  } catch (error) {
    console.error('Failed to notify settings change:', error);
  }
}

// Open shortcuts customization page
async function openShortcutsPage() {
  try {
    await chrome.tabs.create({
      url: 'chrome://extensions/shortcuts'
    });
  } catch (error) {
    console.error('Failed to open shortcuts page:', error);
    showStatus('error', 'Failed to open shortcuts page');
  }
}

// Open help page
function openHelpPage() {
  chrome.tabs.create({
    url: 'https://github.com/metromind/browser-extension/wiki'
  });
}

// Open feedback page
function openFeedbackPage() {
  chrome.tabs.create({
    url: 'https://github.com/metromind/browser-extension/issues/new'
  });
}

// Open privacy page
function openPrivacyPage() {
  chrome.tabs.create({
    url: 'https://metromind.com/privacy'
  });
}

// Utility functions
function showStatus(type, message) {
  // Create or update status element at top of page
  let statusEl = document.querySelector('.global-status');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.className = 'global-status';
    statusEl.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      padding: 12px;
      text-align: center;
      z-index: 1000;
      font-size: 14px;
      font-weight: 500;
    `;
    document.body.appendChild(statusEl);
  }
  
  statusEl.className = `global-status ${type}`;
  statusEl.textContent = message;
  
  // Style based on type
  const colors = {
    success: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
    error: { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
    info: { bg: '#d1ecf1', color: '#0c5460', border: '#bee5eb' }
  };
  
  const style = colors[type] || colors.info;
  statusEl.style.backgroundColor = style.bg;
  statusEl.style.color = style.color;
  statusEl.style.border = `1px solid ${style.border}`;
  
  // Auto-hide after 4 seconds
  setTimeout(() => {
    if (statusEl && statusEl.parentNode) {
      statusEl.remove();
    }
  }, 4000);
}

function showConnectionStatus(type, message) {
  elements.connectionStatus.className = `status ${type}`;
  elements.connectionStatus.textContent = message;
  elements.connectionStatus.style.display = 'block';
}

function setButtonLoading(button, loading) {
  if (loading) {
    button.classList.add('loading');
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
  }
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

console.log('MetroMind options script loaded');