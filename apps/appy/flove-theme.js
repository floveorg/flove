/* flove-theme.js — shared dark/light theme toggle for app launchers */
/* Usage: include <script src="flove-theme.js"></script> in launcher HTML */
/* Then add class="theme-toggle" to your toggle button */

(function() {
  'use strict';
  
  const STORAGE_KEY = 'flove-theme';
  const DARK_CLASS = 'dark';
  const DARK_MODE = 1;
  const LIGHT_MODE = 0;
  
  // Get stored preference or follow system
  function getStoredPreference() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return parseInt(stored, 10);
    }
    // Follow system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK_MODE : LIGHT_MODE;
  }
  
  // Apply theme
  function applyTheme(mode) {
    if (mode === DARK_MODE) {
      document.documentElement.classList.add(DARK_CLASS);
    } else {
      document.documentElement.classList.remove(DARK_CLASS);
    }
  }
  
  // Toggle theme
  function toggleTheme() {
    const current = document.documentElement.classList.contains(DARK_CLASS) ? DARK_MODE : LIGHT_MODE;
    const next = current === DARK_MODE ? LIGHT_MODE : DARK_MODE;
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next.toString());
  }
  
  // Initialize on load
  function init() {
    applyTheme(getStoredPreference());
    
    // Add click handlers to all theme toggle buttons
    const toggleButtons = document.querySelectorAll('.theme-toggle');
    toggleButtons.forEach(button => {
      button.addEventListener('click', toggleTheme);
    });
    
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only follow system if no stored preference
      if (localStorage.getItem(STORAGE_KEY) === null) {
        applyTheme(e.matches ? DARK_MODE : LIGHT_MODE);
      }
    });
  }
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();