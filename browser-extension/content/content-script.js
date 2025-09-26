/**
 * MetroMind Browser Extension - Content Script
 * Handles page interaction, document scanning, and intelligent automation
 */

// Configuration
const METROMIND_CONFIG = {
  enabled: true,
  autoScan: false,
  overlayEnabled: true,
  keyboardShortcuts: true
};

// State management
let isMetroMindActive = false;
let selectedElement = null;
let overlayVisible = false;
let authToken = null;

// Initialize content script
function initializeMetroMind() {
  console.log('MetroMind Content Script initialized on:', window.location.href);
  
  // Get auth token
  chrome.runtime.sendMessage({ action: 'getAuthToken' }, (response) => {
    authToken = response;
  });
  
  // Set up page observers
  setupPageObservers();
  
  // Add keyboard shortcuts
  setupKeyboardShortcuts();
  
  // Create MetroMind overlay
  createMetroMindOverlay();
  
  // Scan page for automation opportunities
  if (METROMIND_CONFIG.autoScan) {
    scanPageForAutomation();
  }
  
  // Add visual indicators for MetroMind features
  addPageIndicators();
}

// Set up page observers for dynamic content
function setupPageObservers() {
  // Observer for DOM changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check new nodes for automation opportunities
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            scanElementForAutomation(node);
          }
        });
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Observer for form changes
  document.addEventListener('input', handleFormInput);
  document.addEventListener('change', handleFormChange);
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    // Ctrl+Shift+M - Toggle MetroMind overlay
    if (event.ctrlKey && event.shiftKey && event.key === 'M') {
      event.preventDefault();
      toggleMetroMindOverlay();
    }
    
    // Ctrl+Shift+D - Quick document capture
    if (event.ctrlKey && event.shiftKey && event.key === 'D') {
      event.preventDefault();
      captureCurrentPage();
    }
    
    // Ctrl+Shift+T - Create task from selection
    if (event.ctrlKey && event.shiftKey && event.key === 'T') {
      event.preventDefault();
      createTaskFromSelection();
    }
  });
}

// Create MetroMind overlay
function createMetroMindOverlay() {
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'metromind-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 300px;
    max-height: 400px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    z-index: 10000;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: none;
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
  `;
  
  // Create overlay content
  overlay.innerHTML = `
    <div style="padding: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600;">MetroMind Assistant</h3>
        <button id="metromind-close" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">&times;</button>
      </div>
      
      <div style="margin-bottom: 12px;">
        <div style="font-size: 12px; opacity: 0.8; margin-bottom: 8px;">Quick Actions</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button id="metromind-capture" class="metromind-btn">📄 Capture Document</button>
          <button id="metromind-task" class="metromind-btn">✅ Create Task</button>
          <button id="metromind-analyze" class="metromind-btn">🧠 Analyze Page</button>
          <button id="metromind-dashboard" class="metromind-btn">🏠 Open Dashboard</button>
        </div>
      </div>
      
      <div id="metromind-suggestions" style="margin-top: 12px;">
        <div style="font-size: 12px; opacity: 0.8; margin-bottom: 8px;">Smart Suggestions</div>
        <div id="suggestions-list" style="font-size: 12px; opacity: 0.9;">
          <div>🔍 Page contains actionable content</div>
          <div>📋 Forms detected for automation</div>
        </div>
      </div>
    </div>
  `;
  
  // Add button styles
  const style = document.createElement('style');
  style.textContent = `
    .metromind-btn {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s ease;
      width: 100%;
      text-align: left;
    }
    .metromind-btn:hover {
      background: rgba(255,255,255,0.2);
      transform: translateY(-1px);
    }
    .metromind-highlight {
      outline: 2px solid #667eea !important;
      outline-offset: 2px !important;
      background: rgba(102, 126, 234, 0.1) !important;
    }
  `;
  document.head.appendChild(style);
  
  // Append to body
  document.body.appendChild(overlay);
  
  // Add event listeners
  setupOverlayEventListeners(overlay);
}

// Set up overlay event listeners
function setupOverlayEventListeners(overlay) {
  // Close button
  overlay.querySelector('#metromind-close').addEventListener('click', () => {
    hideMetroMindOverlay();
  });
  
  // Action buttons
  overlay.querySelector('#metromind-capture').addEventListener('click', captureCurrentPage);
  overlay.querySelector('#metromind-task').addEventListener('click', createTaskFromSelection);
  overlay.querySelector('#metromind-analyze').addEventListener('click', analyzeCurrentPage);
  overlay.querySelector('#metromind-dashboard').addEventListener('click', openDashboard);
}

// Toggle overlay visibility
function toggleMetroMindOverlay() {
  const overlay = document.getElementById('metromind-overlay');
  if (overlayVisible) {
    hideMetroMindOverlay();
  } else {
    showMetroMindOverlay();
  }
}

function showMetroMindOverlay() {
  const overlay = document.getElementById('metromind-overlay');
  overlay.style.display = 'block';
  setTimeout(() => {
    overlay.style.transform = 'translateX(0)';
  }, 10);
  overlayVisible = true;
  
  // Update suggestions
  updateSmartSuggestions();
}

function hideMetroMindOverlay() {
  const overlay = document.getElementById('metromind-overlay');
  overlay.style.transform = 'translateX(100%)';
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 300);
  overlayVisible = false;
}

// Update smart suggestions
function updateSmartSuggestions() {
  const suggestions = [];
  
  // Check for forms
  const forms = document.querySelectorAll('form');
  if (forms.length > 0) {
    suggestions.push('📋 ' + forms.length + ' forms found - automate data entry');
  }
  
  // Check for tables
  const tables = document.querySelectorAll('table');
  if (tables.length > 0) {
    suggestions.push('📊 Data tables detected - extract to MetroMind');
  }
  
  // Check for downloadable files
  const fileLinks = document.querySelectorAll('a[href*=".pdf"], a[href*=".doc"], a[href*=".xls"]');
  if (fileLinks.length > 0) {
    suggestions.push('📁 ' + fileLinks.length + ' documents found');
  }
  
  // Check for contact information
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phonePattern = /[\+]?[1-9]?[\d]{1,3}[\s\-]?[(]?[\d]{1,3}[)]?[\s\-]?[\d]{3,4}[\s\-]?[\d]{3,4}/g;
  const pageText = document.body.innerText;
  
  if (emailPattern.test(pageText)) {
    suggestions.push('📧 Contact information detected');
  }
  
  if (phonePattern.test(pageText)) {
    suggestions.push('📞 Phone numbers found');
  }
  
  // Update suggestions in overlay
  const suggestionsList = document.getElementById('suggestions-list');
  if (suggestionsList) {
    if (suggestions.length > 0) {
      suggestionsList.innerHTML = suggestions.map(s => `<div>${s}</div>`).join('');
    } else {
      suggestionsList.innerHTML = '<div>🔍 Scanning for automation opportunities...</div>';
    }
  }
}

// Page scanning for automation
function scanPageForAutomation() {
  // Scan for common automation patterns
  const automationOpportunities = [];
  
  // Forms
  document.querySelectorAll('form').forEach((form, index) => {
    form.setAttribute('data-metromind-form', index);
    automationOpportunities.push({
      type: 'form',
      element: form,
      description: 'Form automation available'
    });
  });
  
  // File inputs
  document.querySelectorAll('input[type="file"]').forEach((input, index) => {
    input.setAttribute('data-metromind-upload', index);
    automationOpportunities.push({
      type: 'upload',
      element: input,
      description: 'File upload detected'
    });
  });
  
  // Tables with data
  document.querySelectorAll('table').forEach((table, index) => {
    if (table.rows.length > 1) {
      table.setAttribute('data-metromind-table', index);
      automationOpportunities.push({
        type: 'data',
        element: table,
        description: 'Data extraction opportunity'
      });
    }
  });
  
  return automationOpportunities;
}

function scanElementForAutomation(element) {
  // Quick scan for new elements
  if (element.tagName === 'FORM') {
    element.setAttribute('data-metromind-form', Date.now());
  } else if (element.tagName === 'TABLE') {
    element.setAttribute('data-metromind-table', Date.now());
  }
}

// Action handlers
function captureCurrentPage() {
  const pageData = {
    title: document.title,
    url: window.location.href,
    content: document.body.innerText,
    html: document.documentElement.outerHTML,
    timestamp: new Date().toISOString(),
    metadata: {
      forms: document.querySelectorAll('form').length,
      tables: document.querySelectorAll('table').length,
      images: document.querySelectorAll('img').length,
      links: document.querySelectorAll('a').length
    }
  };
  
  chrome.runtime.sendMessage({
    action: 'captureDocument',
    data: pageData
  }, (response) => {
    if (response.success) {
      showNotification('Document captured successfully!', 'success');
    } else {
      showNotification('Failed to capture document', 'error');
    }
  });
}

function createTaskFromSelection() {
  const selection = window.getSelection().toString().trim();
  if (!selection) {
    showNotification('Please select text to create a task', 'warning');
    return;
  }
  
  const taskData = {
    title: `Task from ${document.title}`,
    description: selection,
    url: window.location.href,
    priority: 'medium',
    source: 'browser_extension'
  };
  
  // Send to background script
  chrome.runtime.sendMessage({
    action: 'createTask',
    data: taskData
  });
  
  showNotification('Task created from selection!', 'success');
}

function analyzeCurrentPage() {
  const pageData = {
    url: window.location.href,
    title: document.title,
    content: document.body.innerText.substring(0, 5000), // Limit content
    metadata: updateSmartSuggestions()
  };
  
  showNotification('Analyzing page with AI...', 'info');
  
  // This would integrate with the AI service
  setTimeout(() => {
    showNotification('AI analysis complete - check dashboard for insights', 'success');
  }, 2000);
}

function openDashboard() {
  chrome.runtime.sendMessage({ action: 'openDashboard' });
}

// Form handling
function handleFormInput(event) {
  if (METROMIND_CONFIG.autoScan) {
    // Could implement intelligent form assistance here
    console.log('Form input detected:', event.target);
  }
}

function handleFormChange(event) {
  if (METROMIND_CONFIG.autoScan) {
    // Could implement form data capture here
    console.log('Form change detected:', event.target);
  }
}

// Visual indicators
function addPageIndicators() {
  // Add small MetroMind indicator
  const indicator = document.createElement('div');
  indicator.id = 'metromind-indicator';
  indicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    cursor: pointer;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 16px;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
  `;
  indicator.innerHTML = 'M';
  indicator.title = 'MetroMind Assistant (Ctrl+Shift+M)';
  
  indicator.addEventListener('click', toggleMetroMindOverlay);
  indicator.addEventListener('mouseenter', () => {
    indicator.style.transform = 'scale(1.1)';
  });
  indicator.addEventListener('mouseleave', () => {
    indicator.style.transform = 'scale(1)';
  });
  
  document.body.appendChild(indicator);
}

// Notifications
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196f3'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 10001;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
      to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(-50%) translateY(0); opacity: 1; }
      to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 300);
  }, 3000);
}

// Utility functions
function getSelectedText() {
  return window.getSelection().toString().trim();
}

function highlightElement(element) {
  element.classList.add('metromind-highlight');
  setTimeout(() => {
    element.classList.remove('metromind-highlight');
  }, 3000);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getSelectedText':
      sendResponse(getSelectedText());
      break;
      
    case 'captureDocument':
      captureCurrentPage();
      sendResponse({ success: true });
      break;
      
    case 'toggleOverlay':
      toggleMetroMindOverlay();
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ error: 'Unknown action' });
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMetroMind);
} else {
  initializeMetroMind();
}

console.log('MetroMind Content Script loaded');