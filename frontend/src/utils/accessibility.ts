/**
 * Accessibility Configuration and Utilities
 * Provides comprehensive accessibility features for universal access
 */

// Accessibility configuration
export const A11Y_CONFIG = {
  // Screen reader announcements
  announcements: {
    pageLoaded: 'Page loaded',
    formSubmitted: 'Form submitted successfully',
    errorOccurred: 'An error occurred',
    navigationChanged: 'Navigation changed',
    contentUpdated: 'Content updated',
    uploadStarted: 'File upload started',
    uploadCompleted: 'File upload completed',
    taskCreated: 'Task created successfully',
    searchCompleted: 'Search completed'
  },
  
  // Keyboard navigation
  keyboardShortcuts: {
    skipToMain: 'Alt+M',
    skipToNav: 'Alt+N',
    search: 'Ctrl+/',
    upload: 'Ctrl+U',
    createTask: 'Ctrl+T',
    help: 'F1',
    esc: 'Escape'
  },
  
  // ARIA labels and descriptions
  ariaLabels: {
    mainNavigation: 'Main navigation',
    breadcrumb: 'Breadcrumb navigation',
    searchForm: 'Search documents',
    uploadForm: 'Upload document',
    taskForm: 'Create new task',
    userMenu: 'User account menu',
    notifications: 'Notifications',
    dashboard: 'Dashboard overview',
    documentsList: 'Documents list',
    tasksList: 'Tasks list'
  },
  
  // Focus management
  focusTimeout: 100,
  focusRingColor: '#2196F3',
  
  // Language support
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'hi', 'zh'],
  
  // High contrast mode
  highContrast: {
    enabled: false,
    colors: {
      primary: '#000000',
      secondary: '#FFFFFF',
      background: '#FFFFFF',
      surface: '#F5F5F5',
      text: '#000000',
      textSecondary: '#333333'
    }
  }
};

// Screen reader announcer
export class ScreenReaderAnnouncer {
  private static instance: ScreenReaderAnnouncer;
  private announceElement: HTMLElement | null = null;

  static getInstance(): ScreenReaderAnnouncer {
    if (!ScreenReaderAnnouncer.instance) {
      ScreenReaderAnnouncer.instance = new ScreenReaderAnnouncer();
    }
    return ScreenReaderAnnouncer.instance;
  }

  constructor() {
    this.createAnnounceElement();
  }

  private createAnnounceElement() {
    // Create hidden element for screen reader announcements
    this.announceElement = document.createElement('div');
    this.announceElement.setAttribute('aria-live', 'polite');
    this.announceElement.setAttribute('aria-atomic', 'true');
    this.announceElement.className = 'sr-only';
    this.announceElement.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    document.body.appendChild(this.announceElement);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.announceElement) {
      this.createAnnounceElement();
    }

    if (this.announceElement) {
      // Clear previous announcement
      this.announceElement.textContent = '';
      this.announceElement.setAttribute('aria-live', priority);
      
      // Add new announcement after a brief delay
      setTimeout(() => {
        if (this.announceElement) {
          this.announceElement.textContent = message;
        }
      }, 100);
    }
  }

  announcePageChange(pageName: string) {
    this.announce(`Navigated to ${pageName} page`);
  }

  announceError(error: string) {
    this.announce(`Error: ${error}`, 'assertive');
  }

  announceSuccess(message: string) {
    this.announce(`Success: ${message}`);
  }
}

// Keyboard navigation manager
export class KeyboardNavigationManager {
  private static instance: KeyboardNavigationManager;
  private focusableElements: HTMLElement[] = [];
  private currentFocusIndex = -1;
  private shortcuts: Map<string, () => void> = new Map();

  static getInstance(): KeyboardNavigationManager {
    if (!KeyboardNavigationManager.instance) {
      KeyboardNavigationManager.instance = new KeyboardNavigationManager();
    }
    return KeyboardNavigationManager.instance;
  }

  constructor() {
    this.initializeKeyboardHandlers();
  }

  private initializeKeyboardHandlers() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent) {
    const key = this.getKeyCombo(event);
    
    // Handle registered shortcuts
    if (this.shortcuts.has(key)) {
      event.preventDefault();
      const handler = this.shortcuts.get(key);
      if (handler) handler();
      return;
    }

    // Handle tab navigation
    if (event.key === 'Tab') {
      this.handleTabNavigation(event);
    }

    // Handle escape key
    if (event.key === 'Escape') {
      this.handleEscape();
    }

    // Handle arrow key navigation in grids/lists
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      this.handleArrowNavigation(event);
    }
  }

  private handleFocusIn(event: FocusEvent) {
    const target = event.target as HTMLElement;
    if (target && this.isFocusable(target)) {
      this.currentFocusIndex = this.focusableElements.indexOf(target);
    }
  }

  private getKeyCombo(event: KeyboardEvent): string {
    const parts = [];
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');
    parts.push(event.key);
    return parts.join('+');
  }

  private handleTabNavigation(event: KeyboardEvent) {
    this.updateFocusableElements();
    
    if (this.focusableElements.length === 0) return;

    if (event.shiftKey) {
      // Shift+Tab - move backward
      this.currentFocusIndex = this.currentFocusIndex <= 0 
        ? this.focusableElements.length - 1 
        : this.currentFocusIndex - 1;
    } else {
      // Tab - move forward
      this.currentFocusIndex = this.currentFocusIndex >= this.focusableElements.length - 1 
        ? 0 
        : this.currentFocusIndex + 1;
    }

    event.preventDefault();
    this.focusElement(this.focusableElements[this.currentFocusIndex]);
  }

  private handleEscape() {
    // Close modals, dropdowns, etc.
    const activeModal = document.querySelector('[role="dialog"]:not([aria-hidden="true"])');
    if (activeModal) {
      const closeButton = activeModal.querySelector('[aria-label*="close"], [data-dismiss]');
      if (closeButton instanceof HTMLElement) {
        closeButton.click();
      }
    }
  }

  private handleArrowNavigation(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const container = target.closest('[role="grid"], [role="listbox"], [role="menu"]');
    
    if (!container) return;

    const items = Array.from(container.querySelectorAll('[role="gridcell"], [role="option"], [role="menuitem"]'));
    const currentIndex = items.indexOf(target);
    
    if (currentIndex === -1) return;

    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowUp':
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case 'ArrowDown':
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowLeft':
        // Handle grid navigation
        if (container.getAttribute('role') === 'grid') {
          const columns = parseInt(container.getAttribute('aria-colcount') || '1');
          newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        }
        break;
      case 'ArrowRight':
        // Handle grid navigation
        if (container.getAttribute('role') === 'grid') {
          const columns = parseInt(container.getAttribute('aria-colcount') || '1');
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        }
        break;
    }

    if (newIndex !== currentIndex) {
      event.preventDefault();
      this.focusElement(items[newIndex] as HTMLElement);
    }
  }

  private updateFocusableElements() {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    this.focusableElements = Array.from(document.querySelectorAll(selector))
      .filter(el => this.isVisible(el as HTMLElement) && this.isFocusable(el as HTMLElement)) as HTMLElement[];
  }

  private isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0
    );
  }

  private isFocusable(element: HTMLElement): boolean {
    return !element.hasAttribute('disabled') && !element.hasAttribute('aria-hidden');
  }

  private focusElement(element: HTMLElement) {
    if (element && typeof element.focus === 'function') {
      element.focus();
      
      // Ensure focus is visible
      if (element.scrollIntoView) {
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  registerShortcut(keyCombo: string, handler: () => void) {
    this.shortcuts.set(keyCombo, handler);
  }

  unregisterShortcut(keyCombo: string) {
    this.shortcuts.delete(keyCombo);
  }

  focusFirst() {
    this.updateFocusableElements();
    if (this.focusableElements.length > 0) {
      this.focusElement(this.focusableElements[0]);
    }
  }

  focusLast() {
    this.updateFocusableElements();
    if (this.focusableElements.length > 0) {
      this.focusElement(this.focusableElements[this.focusableElements.length - 1]);
    }
  }
}

// High contrast mode manager
export class HighContrastManager {
  private static instance: HighContrastManager;
  private enabled = false;
  private originalStyles: Map<string, string> = new Map();

  static getInstance(): HighContrastManager {
    if (!HighContrastManager.instance) {
      HighContrastManager.instance = new HighContrastManager();
    }
    return HighContrastManager.instance;
  }

  constructor() {
    this.loadSettings();
    this.initializeMediaQuery();
  }

  private loadSettings() {
    const saved = localStorage.getItem('metromind-high-contrast');
    this.enabled = saved === 'true';
    if (this.enabled) {
      this.enable();
    }
  }

  private initializeMediaQuery() {
    // Listen for system high contrast preference
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    mediaQuery.addListener((e) => {
      if (e.matches && !this.enabled) {
        this.enable();
      }
    });

    // Check initial state
    if (mediaQuery.matches && !this.enabled) {
      this.enable();
    }
  }

  enable() {
    if (this.enabled) return;

    this.enabled = true;
    localStorage.setItem('metromind-high-contrast', 'true');

    // Apply high contrast styles
    const style = document.createElement('style');
    style.id = 'metromind-high-contrast';
    style.textContent = this.getHighContrastCSS();
    document.head.appendChild(style);

    // Announce change
    ScreenReaderAnnouncer.getInstance().announce('High contrast mode enabled');
  }

  disable() {
    if (!this.enabled) return;

    this.enabled = false;
    localStorage.setItem('metromind-high-contrast', 'false');

    // Remove high contrast styles
    const style = document.getElementById('metromind-high-contrast');
    if (style) {
      style.remove();
    }

    // Announce change
    ScreenReaderAnnouncer.getInstance().announce('High contrast mode disabled');
  }

  toggle() {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private getHighContrastCSS(): string {
    return `
      /* High Contrast Mode Styles */
      * {
        background-color: white !important;
        color: black !important;
        border-color: black !important;
      }
      
      a, button, [role="button"] {
        background-color: yellow !important;
        color: black !important;
        border: 2px solid black !important;
      }
      
      a:hover, button:hover, [role="button"]:hover,
      a:focus, button:focus, [role="button"]:focus {
        background-color: black !important;
        color: white !important;
        outline: 3px solid yellow !important;
      }
      
      input, select, textarea {
        background-color: white !important;
        color: black !important;
        border: 2px solid black !important;
      }
      
      input:focus, select:focus, textarea:focus {
        outline: 3px solid blue !important;
      }
      
      .MuiCard-root {
        border: 2px solid black !important;
        box-shadow: none !important;
      }
      
      .MuiChip-root {
        background-color: white !important;
        color: black !important;
        border: 1px solid black !important;
      }
      
      .MuiLinearProgress-root {
        background-color: white !important;
        border: 1px solid black !important;
      }
      
      .MuiLinearProgress-bar {
        background-color: black !important;
      }
      
      svg, .MuiSvgIcon-root {
        color: black !important;
      }
      
      /* Ensure sufficient contrast for all text */
      h1, h2, h3, h4, h5, h6, p, span, div, li {
        color: black !important;
      }
      
      /* High contrast focus indicators */
      *:focus {
        outline: 3px solid blue !important;
        outline-offset: 2px !important;
      }
    `;
  }
}

// Internationalization manager
export class InternationalizationManager {
  private static instance: InternationalizationManager;
  private currentLanguage = A11Y_CONFIG.defaultLanguage;
  private translations: Map<string, Map<string, string>> = new Map();

  static getInstance(): InternationalizationManager {
    if (!InternationalizationManager.instance) {
      InternationalizationManager.instance = new InternationalizationManager();
    }
    return InternationalizationManager.instance;
  }

  constructor() {
    this.loadLanguageSettings();
    this.initializeTranslations();
  }

  private loadLanguageSettings() {
    const saved = localStorage.getItem('metromind-language');
    if (saved && A11Y_CONFIG.supportedLanguages.includes(saved)) {
      this.currentLanguage = saved;
    } else {
      // Detect browser language
      const browserLang = navigator.language.split('-')[0];
      if (A11Y_CONFIG.supportedLanguages.includes(browserLang)) {
        this.currentLanguage = browserLang;
      }
    }
  }

  private initializeTranslations() {
    // Basic translations for accessibility features
    const translations = {
      en: {
        'skipToMain': 'Skip to main content',
        'skipToNav': 'Skip to navigation',
        'loading': 'Loading',
        'error': 'Error',
        'success': 'Success',
        'close': 'Close',
        'menu': 'Menu',
        'search': 'Search',
        'upload': 'Upload',
        'download': 'Download',
        'delete': 'Delete',
        'edit': 'Edit',
        'save': 'Save',
        'cancel': 'Cancel',
        'previous': 'Previous',
        'next': 'Next',
        'page': 'Page',
        'of': 'of',
        'items': 'items',
        'selected': 'selected',
        'required': 'Required field',
        'optional': 'Optional field',
        'dashboard': 'Dashboard',
        'documents': 'Documents',
        'tasks': 'Tasks',
        'profile': 'Profile',
        'settings': 'Settings',
        'logout': 'Logout',
        'highContrast': 'High contrast mode',
        'normalContrast': 'Normal contrast mode'
      },
      es: {
        'skipToMain': 'Saltar al contenido principal',
        'skipToNav': 'Saltar a la navegación',
        'loading': 'Cargando',
        'error': 'Error',
        'success': 'Éxito',
        'close': 'Cerrar',
        'menu': 'Menú',
        'search': 'Buscar',
        'upload': 'Subir',
        'download': 'Descargar',
        'delete': 'Eliminar',
        'edit': 'Editar',
        'save': 'Guardar',
        'cancel': 'Cancelar',
        'previous': 'Anterior',
        'next': 'Siguiente',
        'page': 'Página',
        'of': 'de',
        'items': 'elementos',
        'selected': 'seleccionado',
        'required': 'Campo requerido',
        'optional': 'Campo opcional',
        'dashboard': 'Panel',
        'documents': 'Documentos',
        'tasks': 'Tareas',
        'profile': 'Perfil',
        'settings': 'Configuración',
        'logout': 'Cerrar sesión',
        'highContrast': 'Modo de alto contraste',
        'normalContrast': 'Modo de contraste normal'
      },
      fr: {
        'skipToMain': 'Aller au contenu principal',
        'skipToNav': 'Aller à la navigation',
        'loading': 'Chargement',
        'error': 'Erreur',
        'success': 'Succès',
        'close': 'Fermer',
        'menu': 'Menu',
        'search': 'Rechercher',
        'upload': 'Télécharger',
        'download': 'Télécharger',
        'delete': 'Supprimer',
        'edit': 'Modifier',
        'save': 'Enregistrer',
        'cancel': 'Annuler',
        'previous': 'Précédent',
        'next': 'Suivant',
        'page': 'Page',
        'of': 'de',
        'items': 'éléments',
        'selected': 'sélectionné',
        'required': 'Champ requis',
        'optional': 'Champ facultatif',
        'dashboard': 'Tableau de bord',
        'documents': 'Documents',
        'tasks': 'Tâches',
        'profile': 'Profil',
        'settings': 'Paramètres',
        'logout': 'Se déconnecter',
        'highContrast': 'Mode contraste élevé',
        'normalContrast': 'Mode contraste normal'
      }
    };

    Object.entries(translations).forEach(([lang, trans]) => {
      this.translations.set(lang, new Map(Object.entries(trans)));
    });
  }

  setLanguage(language: string) {
    if (!A11Y_CONFIG.supportedLanguages.includes(language)) {
      console.warn(`Language ${language} not supported`);
      return;
    }

    this.currentLanguage = language;
    localStorage.setItem('metromind-language', language);
    
    // Update document language
    document.documentElement.lang = language;
    
    // Announce change
    ScreenReaderAnnouncer.getInstance().announce(`Language changed to ${language}`);
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  translate(key: string, defaultValue?: string): string {
    const langTranslations = this.translations.get(this.currentLanguage);
    if (langTranslations && langTranslations.has(key)) {
      return langTranslations.get(key)!;
    }

    // Fallback to English
    const enTranslations = this.translations.get('en');
    if (enTranslations && enTranslations.has(key)) {
      return enTranslations.get(key)!;
    }

    return defaultValue || key;
  }

  getSupportedLanguages(): string[] {
    return [...A11Y_CONFIG.supportedLanguages];
  }
}

// Main accessibility manager
export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private screenReader: ScreenReaderAnnouncer;
  private keyboard: KeyboardNavigationManager;
  private highContrast: HighContrastManager;
  private i18n: InternationalizationManager;

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  constructor() {
    this.screenReader = ScreenReaderAnnouncer.getInstance();
    this.keyboard = KeyboardNavigationManager.getInstance();
    this.highContrast = HighContrastManager.getInstance();
    this.i18n = InternationalizationManager.getInstance();
    
    this.initializeAccessibility();
  }

  private initializeAccessibility() {
    // Set initial document properties
    document.documentElement.lang = this.i18n.getCurrentLanguage();
    
    // Register global keyboard shortcuts
    this.keyboard.registerShortcut('Alt+M', () => {
      const main = document.querySelector('main');
      if (main instanceof HTMLElement) {
        main.focus();
      }
    });

    this.keyboard.registerShortcut('Alt+N', () => {
      const nav = document.querySelector('nav');
      if (nav instanceof HTMLElement) {
        nav.focus();
      }
    });

    this.keyboard.registerShortcut('Ctrl+/', () => {
      const search = document.querySelector('[role="search"] input, [type="search"]');
      if (search instanceof HTMLElement) {
        search.focus();
      }
    });

    this.keyboard.registerShortcut('F1', () => {
      this.showAccessibilityHelp();
    });

    // Add skip links
    this.addSkipLinks();
    
    // Initialize focus management
    this.initializeFocusManagement();
  }

  private addSkipLinks() {
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main" class="skip-link">${this.i18n.translate('skipToMain')}</a>
      <a href="#navigation" class="skip-link">${this.i18n.translate('skipToNav')}</a>
    `;

    // Style skip links
    const style = document.createElement('style');
    style.textContent = `
      .skip-links {
        position: absolute;
        top: -40px;
        left: 6px;
        z-index: 10000;
      }
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        padding: 8px;
        background: #000;
        color: #fff;
        text-decoration: none;
        border-radius: 4px;
        font-size: 14px;
        font-weight: bold;
        z-index: 10001;
        transition: top 0.3s;
      }
      .skip-link:focus {
        top: 6px;
      }
    `;
    document.head.appendChild(style);
    document.body.insertBefore(skipLinks, document.body.firstChild);
  }

  private initializeFocusManagement() {
    // Ensure proper focus outline
    const focusStyle = document.createElement('style');
    focusStyle.textContent = `
      *:focus {
        outline: 2px solid ${A11Y_CONFIG.focusRingColor} !important;
        outline-offset: 2px !important;
      }
      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
    `;
    document.head.appendChild(focusStyle);
  }

  private showAccessibilityHelp() {
    const help = document.createElement('div');
    help.setAttribute('role', 'dialog');
    help.setAttribute('aria-modal', 'true');
    help.setAttribute('aria-labelledby', 'help-title');
    help.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 2px solid #333;
      border-radius: 8px;
      padding: 20px;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      z-index: 10000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;

    help.innerHTML = `
      <h2 id="help-title">Accessibility Help</h2>
      <h3>Keyboard Shortcuts:</h3>
      <ul>
        <li><kbd>Alt + M</kbd> - Skip to main content</li>
        <li><kbd>Alt + N</kbd> - Skip to navigation</li>
        <li><kbd>Ctrl + /</kbd> - Focus search</li>
        <li><kbd>Ctrl + U</kbd> - Upload document</li>
        <li><kbd>Ctrl + T</kbd> - Create task</li>
        <li><kbd>F1</kbd> - Show this help</li>
        <li><kbd>Escape</kbd> - Close dialogs</li>
        <li><kbd>Tab</kbd> - Navigate forward</li>
        <li><kbd>Shift + Tab</kbd> - Navigate backward</li>
      </ul>
      <h3>High Contrast:</h3>
      <p>Toggle high contrast mode for better visibility.</p>
      <button id="toggle-contrast" type="button">Toggle High Contrast</button>
      <br><br>
      <button id="close-help" type="button">Close Help</button>
    `;

    document.body.appendChild(help);

    // Add event listeners
    const toggleButton = help.querySelector('#toggle-contrast') as HTMLButtonElement;
    const closeButton = help.querySelector('#close-help') as HTMLButtonElement;

    toggleButton.onclick = () => {
      this.highContrast.toggle();
      toggleButton.textContent = this.highContrast.isEnabled() 
        ? 'Disable High Contrast' 
        : 'Enable High Contrast';
    };

    closeButton.onclick = () => {
      document.body.removeChild(help);
    };

    // Focus the close button
    closeButton.focus();

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.body.removeChild(help);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  // Public API
  announce(message: string, priority?: 'polite' | 'assertive') {
    this.screenReader.announce(message, priority);
  }

  announceError(error: string) {
    this.screenReader.announceError(error);
  }

  announceSuccess(message: string) {
    this.screenReader.announceSuccess(message);
  }

  registerShortcut(keyCombo: string, handler: () => void) {
    this.keyboard.registerShortcut(keyCombo, handler);
  }

  unregisterShortcut(keyCombo: string) {
    this.keyboard.unregisterShortcut(keyCombo);
  }

  toggleHighContrast() {
    this.highContrast.toggle();
  }

  setLanguage(language: string) {
    this.i18n.setLanguage(language);
  }

  translate(key: string, defaultValue?: string): string {
    return this.i18n.translate(key, defaultValue);
  }
}

// Export singleton instance
export const accessibilityManager = AccessibilityManager.getInstance();

// React hook for accessibility
export function useAccessibility() {
  return {
    announce: (message: string, priority?: 'polite' | 'assertive') => 
      accessibilityManager.announce(message, priority),
    announceError: (error: string) => 
      accessibilityManager.announceError(error),
    announceSuccess: (message: string) => 
      accessibilityManager.announceSuccess(message),
    registerShortcut: (keyCombo: string, handler: () => void) => 
      accessibilityManager.registerShortcut(keyCombo, handler),
    unregisterShortcut: (keyCombo: string) => 
      accessibilityManager.unregisterShortcut(keyCombo),
    toggleHighContrast: () => 
      accessibilityManager.toggleHighContrast(),
    setLanguage: (language: string) => 
      accessibilityManager.setLanguage(language),
    translate: (key: string, defaultValue?: string) => 
      accessibilityManager.translate(key, defaultValue)
  };
}