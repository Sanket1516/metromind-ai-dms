/**
 * MetroMind Extension Popup Script
 * Handles popup UI interactions and communication with background script
 */

// Configuration
const METROMIND_API_BASE = 'http://localhost:8010';

// DOM elements
let statusIndicator, captureBtn, taskBtn, analyzeBtn, dashboardBtn;
let formsCount, tablesCount, filesCount, activityList;
let autoScanToggle, settingsBtn;

// State
let currentTab = null;
let pageInsights = {
  forms: 0,
  tables: 0,
  files: 0
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('MetroMind popup initialized');
  
  // Get DOM elements
  initializeElements();
  
  // Set up event listeners
  setupEventListeners();
  
  // Get current tab
  await getCurrentTab();
  
  // Load page insights
  await loadPageInsights();
  
  // Load recent activity
  await loadRecentActivity();
  
  // Load settings
  await loadSettings();
  
  // Check connection status
  await checkConnectionStatus();
});

// Initialize DOM elements
function initializeElements() {
  statusIndicator = document.getElementById('status-indicator');
  captureBtn = document.getElementById('capture-document');
  taskBtn = document.getElementById('create-task');
  analyzeBtn = document.getElementById('analyze-page');
  dashboardBtn = document.getElementById('open-dashboard');
  
  formsCount = document.getElementById('forms-count');
  tablesCount = document.getElementById('tables-count');
  filesCount = document.getElementById('files-count');
  activityList = document.getElementById('activity-list');
  
  autoScanToggle = document.getElementById('auto-scan-toggle');
  settingsBtn = document.getElementById('open-settings');
}

// Set up event listeners
function setupEventListeners() {
  // Action buttons
  captureBtn.addEventListener('click', handleDocumentCapture);
  taskBtn.addEventListener('click', handleTaskCreation);
  analyzeBtn.addEventListener('click', handlePageAnalysis);
  dashboardBtn.addEventListener('click', handleDashboardOpen);
  
  // Settings
  autoScanToggle.addEventListener('change', handleAutoScanToggle);
  settingsBtn.addEventListener('click', handleSettingsOpen);
}

// Get current active tab
async function getCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    console.log('Current tab:', tab.url);
  } catch (error) {
    console.error('Failed to get current tab:', error);
    showError('Failed to access current tab');
  }
}

// Load page insights
async function loadPageInsights() {
  if (!currentTab) return;
  
  try {
    // Send message to content script to scan page
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      action: 'scanPage'
    });
    
    if (response && response.insights) {
      pageInsights = response.insights;
      updateInsightsDisplay();
    } else {
      // Fallback: analyze page content
      await analyzePageContent();
    }
  } catch (error) {
    console.error('Failed to load page insights:', error);
    // Try to inject content script if not already present
    await injectContentScript();
  }
}

// Analyze page content as fallback
async function analyzePageContent() {
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      function: scanPageElements
    });
    
    pageInsights = result;
    updateInsightsDisplay();
  } catch (error) {
    console.error('Failed to analyze page content:', error);
    updateInsightsDisplay(); // Show default values
  }
}

// Function to be injected into the page
function scanPageElements() {
  return {
    forms: document.querySelectorAll('form').length,
    tables: document.querySelectorAll('table').length,
    files: document.querySelectorAll('a[href*=".pdf"], a[href*=".doc"], a[href*=".xls"], a[href*=".csv"]').length
  };
}

// Update insights display
function updateInsightsDisplay() {
  formsCount.textContent = pageInsights.forms === 0 ? 'None found' : 
    pageInsights.forms === 1 ? '1 form detected' : `${pageInsights.forms} forms detected`;
  
  tablesCount.textContent = pageInsights.tables === 0 ? 'None found' : 
    pageInsights.tables === 1 ? '1 table detected' : `${pageInsights.tables} tables detected`;
  
  filesCount.textContent = pageInsights.files === 0 ? 'None found' : 
    pageInsights.files === 1 ? '1 file link' : `${pageInsights.files} file links`;
}

// Load recent activity
async function loadRecentActivity() {
  try {
    // Get recent activity from storage
    const result = await chrome.storage.local.get(['metromind_activity']);
    const activities = result.metromind_activity || [];
    
    if (activities.length === 0) {
      activityList.innerHTML = `
        <div class="activity-item">
          <div class="activity-icon">📝</div>
          <div class="activity-text">
            <div class="activity-title">No recent activity</div>
            <div class="activity-time">Start using MetroMind</div>
          </div>
        </div>
      `;
      return;
    }
    
    // Display recent activities
    activityList.innerHTML = activities
      .slice(0, 3) // Show only last 3 activities
      .map(activity => `
        <div class="activity-item">
          <div class="activity-icon">${getActivityIcon(activity.type)}</div>
          <div class="activity-text">
            <div class="activity-title">${activity.title}</div>
            <div class="activity-time">${formatTimeAgo(activity.timestamp)}</div>
          </div>
        </div>
      `).join('');
      
  } catch (error) {
    console.error('Failed to load recent activity:', error);
  }
}

// Load settings
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['metromind_settings']);
    const settings = result.metromind_settings || { autoCapture: false };
    
    autoScanToggle.checked = settings.autoCapture;
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

// Check connection status
async function checkConnectionStatus() {
  try {
    const response = await fetch(`${METROMIND_API_BASE}/health`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      updateConnectionStatus(true, 'Connected');
    } else {
      updateConnectionStatus(false, 'API Error');
    }
  } catch (error) {
    console.error('Connection check failed:', error);
    updateConnectionStatus(false, 'Disconnected');
  }
}

// Update connection status display
function updateConnectionStatus(connected, message) {
  const statusDot = statusIndicator.querySelector('.status-dot');
  const statusText = statusIndicator.querySelector('.status-text');
  
  statusDot.style.background = connected ? '#4caf50' : '#f44336';
  statusText.textContent = message;
  
  if (!connected) {
    statusDot.style.animation = 'none';
  }
}

// Action handlers
async function handleDocumentCapture() {
  if (!currentTab) return;
  
  setButtonLoading(captureBtn, true);
  
  try {
    // Send message to background script
    await chrome.runtime.sendMessage({
      action: 'captureDocument',
      tabId: currentTab.id,
      url: currentTab.url,
      title: currentTab.title
    });
    
    // Add to activity log
    await addActivity({
      type: 'capture',
      title: 'Document captured',
      timestamp: Date.now()
    });
    
    // Update recent activity
    await loadRecentActivity();
    
    showSuccess('Document captured successfully!');
  } catch (error) {
    console.error('Document capture failed:', error);
    showError('Failed to capture document');
  } finally {
    setButtonLoading(captureBtn, false);
  }
}

async function handleTaskCreation() {
  if (!currentTab) return;
  
  setButtonLoading(taskBtn, true);
  
  try {
    // Get selected text from page
    const [{ result: selection }] = await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      function: () => window.getSelection().toString().trim()
    });
    
    if (!selection) {
      showError('Please select text on the page to create a task');
      return;
    }
    
    // Create task via background script
    await chrome.runtime.sendMessage({
      action: 'createTask',
      data: {
        title: `Task from ${currentTab.title}`,
        description: selection,
        url: currentTab.url
      }
    });
    
    // Add to activity log
    await addActivity({
      type: 'task',
      title: 'Task created',
      timestamp: Date.now()
    });
    
    await loadRecentActivity();
    showSuccess('Task created from selection!');
  } catch (error) {
    console.error('Task creation failed:', error);
    showError('Failed to create task');
  } finally {
    setButtonLoading(taskBtn, false);
  }
}

async function handlePageAnalysis() {
  if (!currentTab) return;
  
  setButtonLoading(analyzeBtn, true);
  
  try {
    // Analyze page with AI
    await chrome.runtime.sendMessage({
      action: 'analyzePage',
      tabId: currentTab.id,
      url: currentTab.url,
      title: currentTab.title
    });
    
    await addActivity({
      type: 'analyze',
      title: 'Page analyzed',
      timestamp: Date.now()
    });
    
    await loadRecentActivity();
    showSuccess('AI analysis started - check dashboard for results');
  } catch (error) {
    console.error('Page analysis failed:', error);
    showError('Failed to analyze page');
  } finally {
    setButtonLoading(analyzeBtn, false);
  }
}

async function handleDashboardOpen() {
  try {
    const dashboardUrl = METROMIND_API_BASE.replace(':8010', ':3000') + '/dashboard';
    await chrome.tabs.create({ url: dashboardUrl });
    window.close(); // Close popup
  } catch (error) {
    console.error('Failed to open dashboard:', error);
    showError('Failed to open dashboard');
  }
}

async function handleAutoScanToggle() {
  try {
    const settings = await chrome.storage.sync.get(['metromind_settings']);
    const currentSettings = settings.metromind_settings || {};
    
    currentSettings.autoCapture = autoScanToggle.checked;
    
    await chrome.storage.sync.set({ metromind_settings: currentSettings });
    
    // Notify content scripts of setting change
    if (currentTab) {
      chrome.tabs.sendMessage(currentTab.id, {
        action: 'updateSettings',
        settings: currentSettings
      }).catch(() => {
        // Content script might not be injected
      });
    }
  } catch (error) {
    console.error('Failed to update settings:', error);
  }
}

async function handleSettingsOpen() {
  try {
    await chrome.runtime.openOptionsPage();
  } catch (error) {
    console.error('Failed to open settings:', error);
    showError('Failed to open settings');
  }
}

// Utility functions
async function injectContentScript() {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      files: ['content/content-script.js']
    });
    
    await chrome.scripting.insertCSS({
      target: { tabId: currentTab.id },
      files: ['content/content-styles.css']
    });
  } catch (error) {
    console.error('Failed to inject content script:', error);
  }
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

async function addActivity(activity) {
  try {
    const result = await chrome.storage.local.get(['metromind_activity']);
    const activities = result.metromind_activity || [];
    
    activities.unshift(activity);
    
    // Keep only last 10 activities
    if (activities.length > 10) {
      activities.splice(10);
    }
    
    await chrome.storage.local.set({ metromind_activity: activities });
  } catch (error) {
    console.error('Failed to add activity:', error);
  }
}

function getActivityIcon(type) {
  switch (type) {
    case 'capture': return '📄';
    case 'task': return '✅';
    case 'analyze': return '🧠';
    case 'upload': return '📎';
    default: return '📝';
  }
}

function formatTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function showSuccess(message) {
  showNotification(message, 'success');
}

function showError(message) {
  showNotification(message, 'error');
}

function showNotification(message, type = 'info') {
  // Create temporary notification in popup
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    right: 10px;
    background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 11px;
    z-index: 1000;
    text-align: center;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

console.log('MetroMind popup script loaded');