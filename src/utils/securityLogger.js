/**
 * Security-aware logging utility
 * Only logs in development, sanitizes sensitive data
 */

const isDev = import.meta.env.MODE !== 'production';

// Sanitize error messages to avoid exposing sensitive data
const sanitizeError = (error) => {
  if (!error) return 'Unknown error';
  
  // Don't expose database errors in production
  if (error.message?.includes('violates') || error.message?.includes('constraint')) {
    return 'Database operation failed';
  }
  
  // Don't expose auth errors with sensitive details
  if (error.message?.includes('password') || error.message?.includes('credentials')) {
    return 'Authentication failed';
  }
  
  // Return generic message for other errors
  return error.message || 'An error occurred';
};

export const secureLog = {
  // Development-only logging
  dev: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },
  
  devError: (message, error) => {
    if (isDev) {
      console.error(message, error);
    }
  },
  
  devWarn: (...args) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  
  // User-friendly error for production
  userError: (error) => {
    const sanitized = sanitizeError(error);
    
    // In production, log to error tracking service
    if (!isDev && window.gtag) {
      window.gtag('event', 'exception', {
        description: sanitized,
        fatal: false,
      });
    }
    
    return sanitized;
  },
  
  // Security event logging (for audit trail)
  security: (event, details = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event,
      ...details,
    };
    
    if (isDev) {
      console.log('🔒 Security Event:', logEntry);
    }
    
    // In production, send to security monitoring service
    // Example: Sentry, LogRocket, etc.
  },
};
