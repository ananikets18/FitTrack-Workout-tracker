/**
 * Polyfills for Browser Compatibility
 * Ensures compatibility with older browsers
 */

// Polyfill for crypto.randomUUID (not available in older browsers)
if (!crypto.randomUUID) {
  crypto.randomUUID = function() {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  };
}

// Polyfill for CanvasRenderingContext2D.roundRect (for icon generator)
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radii) {
    const radius = typeof radii === 'number' ? radii : radii[0] || 0;
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
  };
}

// Polyfill for Array.prototype.at (not in older browsers)
if (!Array.prototype.at) {
  Array.prototype.at = function(index) {
    const i = Math.trunc(index) || 0;
    if (i < 0) return this[this.length + i];
    return this[i];
  };
}

// Polyfill for Object.hasOwn (not in older browsers)
if (!Object.hasOwn) {
  Object.hasOwn = function(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  };
}

// Detect and warn about missing features
export const checkBrowserCompatibility = () => {
  const warnings = [];
  
  if (!('serviceWorker' in navigator)) {
    warnings.push('Service Workers not supported - offline features unavailable');
  }
  
  if (!window.localStorage) {
    warnings.push('localStorage not supported - data persistence unavailable');
  }
  
  if (!window.crypto || !window.crypto.getRandomValues) {
    warnings.push('Crypto API not available - some features may not work');
  }
  
  if (warnings.length > 0) {
    console.warn('Browser compatibility issues:', warnings);
  }
  
  return {
    compatible: warnings.length === 0,
    warnings,
  };
};

export default {
  checkBrowserCompatibility,
};
