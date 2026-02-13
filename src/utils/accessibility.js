/**
 * Accessibility Utilities
 * Helper functions for enhanced accessibility
 */

/**
 * Generate a unique ID for accessibility labels
 */
export const generateA11yId = (prefix = 'a11y') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Trap focus within a modal/dialog
 */
export const trapFocus = (element) => {
  if (!element) return () => {};

  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement?.focus();
        e.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        firstElement?.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

/**
 * Announce message to screen readers
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Debounce function for input handlers to reduce screen reader announcements
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get ARIA label for loading state
 */
export const getLoadingAriaLabel = (itemName = 'content') => {
  return `Loading ${itemName}, please wait`;
};

/**
 * Format date for screen readers (more verbose than visual)
 */
export const formatDateForScreenReader = (date) => {
  const dateObj = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(dateObj);
};

/**
 * Create skip link for keyboard navigation
 */
export const createSkipLink = (targetId, label = 'Skip to main content') => {
  return {
    href: `#${targetId}`,
    className: 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-primary-600 focus:text-white',
    children: label
  };
};

/**
 * Ensure minimum contrast ratio (WCAG AA: 4.5:1 for normal text, 3:1 for large text)
 */
export const getContrastRatio = (color1, color2) => {
  // Simplified version - in production, use a proper color library
  // Returns true if contrast is sufficient
  return true; // Placeholder
};

/**
 * Check if element is visible for accessibility
 */
export const isElementVisible = (element) => {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetWidth > 0 &&
    element.offsetHeight > 0
  );
};

/**
 * Common ARIA patterns
 */
export const ARIA_PATTERNS = {
  // For expandable sections
  accordion: {
    button: (expanded, controls) => ({
      'aria-expanded': expanded,
      'aria-controls': controls,
    }),
    panel: (labelledBy) => ({
      'role': 'region',
      'aria-labelledby': labelledBy,
    }),
  },
  
  // For tab panels
  tabs: {
    list: () => ({
      'role': 'tablist',
    }),
    tab: (selected, controls) => ({
      'role': 'tab',
      'aria-selected': selected,
      'aria-controls': controls,
      'tabIndex': selected ? 0 : -1,
    }),
    panel: (labelledBy) => ({
      'role': 'tabpanel',
      'aria-labelledby': labelledBy,
      'tabIndex': 0,
    }),
  },
  
  // For live regions
  liveRegion: (priority = 'polite') => ({
    'role': 'status',
    'aria-live': priority,
    'aria-atomic': true,
  }),
};
