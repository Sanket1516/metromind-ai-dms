/**
 * MetroMind Browser Extension - Background Service Worker
 * Handles automation workflows, API communication, and background tasks
 */

// Configuration
const METROMIND_API_BASE = 'http://localhost:8010';
const CONTEXT_MENU_IDS = {
  CAPTURE_DOCUMENT: 'capture-document',
  CREATE_TASK: 'create-task',
  ANALYZE_TEXT: 'analyze-text',
  OPEN_DASHBOARD: 'open-dashboard'
};

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('MetroMind Extension installed:', details);
  
  // Set up context menus
  setupContextMenus();
  
  // Initialize storage with default settings
  await initializeStorage();
  
  // Show welcome notification
  if (details.reason === 'install') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'MetroMind Assistant',
      message: 'Extension installed successfully! Right-click on any page to get started.'
    });
  }
});

// Set up context menus
function setupContextMenus() {
  // Remove existing menus
  chrome.contextMenus.removeAll(() => {
    // Document capture menu
    chrome.contextMenus.create({
      id: CONTEXT_MENU_IDS.CAPTURE_DOCUMENT,
      title: 'Capture Document with MetroMind',
      contexts: ['page', 'selection', 'link', 'image']
    });
    
    // Task creation menu
    chrome.contextMenus.create({
      id: CONTEXT_MENU_IDS.CREATE_TASK,
      title: 'Create Task from Selection',
      contexts: ['selection']
    });
    
    // Text analysis menu
    chrome.contextMenus.create({
      id: CONTEXT_MENU_IDS.ANALYZE_TEXT,
      title: 'Analyze with AI',
      contexts: ['selection']
    });
    
    // Separator
    chrome.contextMenus.create({
      type: 'separator',
      contexts: ['page', 'selection']
    });
    
    // Dashboard access
    chrome.contextMenus.create({
      id: CONTEXT_MENU_IDS.OPEN_DASHBOARD,
      title: 'Open MetroMind Dashboard',
      contexts: ['page', 'selection']
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('Context menu clicked:', info.menuItemId);
  
  try {
    switch (info.menuItemId) {
      case CONTEXT_MENU_IDS.CAPTURE_DOCUMENT:
        await handleDocumentCapture(info, tab);
        break;
        
      case CONTEXT_MENU_IDS.CREATE_TASK:
        await handleTaskCreation(info, tab);
        break;
        
      case CONTEXT_MENU_IDS.ANALYZE_TEXT:
        await handleTextAnalysis(info, tab);
        break;
        
      case CONTEXT_MENU_IDS.OPEN_DASHBOARD:
        await openDashboard();
        break;
    }
  } catch (error) {
    console.error('Context menu action failed:', error);
    showErrorNotification('Action failed. Please try again.');
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command, tab) => {
  console.log('Command triggered:', command);
  
  try {
    switch (command) {
      case 'quick_document_capture':
        await handleDocumentCapture({ pageUrl: tab.url }, tab);
        break;
        
      case 'create_task_from_selection':
        await executeContentScript(tab.id, 'getSelectedText', (selection) => {
          if (selection) {
            handleTaskCreation({ selectionText: selection }, tab);
          }
        });
        break;
        
      case 'open_metromind_dashboard':
        await openDashboard();
        break;
    }
  } catch (error) {
    console.error('Command execution failed:', error);
  }
});

// Document capture handler
async function handleDocumentCapture(info, tab) {
  console.log('Capturing document from:', tab.url);
  
  try {
    // Get page content
    const [{ result: pageData }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractPageContent
    });
    
    // Prepare document data
    const documentData = {
      title: pageData.title || tab.title,
      url: tab.url,
      content: pageData.content,
      selectedText: info.selectionText,
      timestamp: new Date().toISOString(),
      source: 'browser_extension'
    };
    
    // Send to MetroMind API
    const response = await sendToMetroMindAPI('/documents/capture', documentData);
    
    if (response.success) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'Document Captured',
        message: `Successfully captured: ${documentData.title}`
      });
    }
  } catch (error) {
    console.error('Document capture failed:', error);
    showErrorNotification('Failed to capture document');
  }
}

// Task creation handler
async function handleTaskCreation(info, tab) {
  console.log('Creating task from selection:', info.selectionText);
  
  try {
    const taskData = {
      title: `Task from ${tab.title}`,
      description: info.selectionText || 'Task created from browser extension',
      source_url: tab.url,
      priority: 'medium',
      category: 'web_capture',
      created_via: 'browser_extension'
    };
    
    const response = await sendToMetroMindAPI('/tasks/create', taskData);
    
    if (response.success) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'Task Created',
        message: 'New task added to MetroMind'
      });
    }
  } catch (error) {
    console.error('Task creation failed:', error);
    showErrorNotification('Failed to create task');
  }
}

// Text analysis handler
async function handleTextAnalysis(info, tab) {
  console.log('Analyzing text:', info.selectionText);
  
  try {
    const analysisData = {
      text: info.selectionText,
      context: {
        url: tab.url,
        title: tab.title
      }
    };
    
    const response = await sendToMetroMindAPI('/ai/analyze', analysisData);
    
    if (response.success) {
      // Show analysis results in a popup or notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'AI Analysis Complete',
        message: response.summary || 'Text analysis completed'
      });
    }
  } catch (error) {
    console.error('Text analysis failed:', error);
    showErrorNotification('Failed to analyze text');
  }
}

// Open MetroMind dashboard
async function openDashboard() {
  const dashboardUrl = `${METROMIND_API_BASE.replace(':8010', ':3000')}/dashboard`;
  chrome.tabs.create({ url: dashboardUrl });
}

// Extract page content (injected function)
function extractPageContent() {
  return {
    title: document.title,
    content: document.body.innerText,
    html: document.documentElement.outerHTML,
    url: window.location.href,
    meta: {
      description: document.querySelector('meta[name="description"]')?.content,
      keywords: document.querySelector('meta[name="keywords"]')?.content,
      author: document.querySelector('meta[name="author"]')?.content
    }
  };
}

// API communication
async function sendToMetroMindAPI(endpoint, data) {
  try {
    const token = await getStoredAuthToken();
    
    const response = await fetch(`${METROMIND_API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Storage helpers
async function initializeStorage() {
  const defaultSettings = {
    autoCapture: false,
    apiUrl: METROMIND_API_BASE,
    notifications: true,
    quickActions: true
  };
  
  const stored = await chrome.storage.sync.get(['metromind_settings']);
  if (!stored.metromind_settings) {
    await chrome.storage.sync.set({ metromind_settings: defaultSettings });
  }
}

async function getStoredAuthToken() {
  const result = await chrome.storage.local.get(['metromind_token']);
  return result.metromind_token;
}

// Utility functions
function showErrorNotification(message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon-48.png',
    title: 'MetroMind Error',
    message: message
  });
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  switch (request.action) {
    case 'getAuthToken':
      getStoredAuthToken().then(sendResponse);
      return true; // Async response
      
    case 'setAuthToken':
      chrome.storage.local.set({ metromind_token: request.token });
      sendResponse({ success: true });
      break;
      
    case 'captureDocument':
      handleDocumentCapture(request.data, sender.tab);
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ error: 'Unknown action' });
  }
});

console.log('MetroMind Background Service Worker loaded');