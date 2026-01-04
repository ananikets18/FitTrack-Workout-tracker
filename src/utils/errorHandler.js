/**
 * Global Error Handler
 * Provides centralized error handling and logging
 */

class ErrorHandler {
  constructor() {
    this.errors = [];
    this.maxErrors = 50;
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'UnhandledPromiseRejection',
        message: event.reason?.message || 'Promise rejection',
        error: event.reason,
        timestamp: new Date().toISOString()
      });
      
      // Prevent default browser console error
      event.preventDefault();
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'GlobalError',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        timestamp: new Date().toISOString()
      });
    });
  }

  handleError(errorDetails) {
    // Add to error queue
    this.errors.push(errorDetails);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log in development
    if (import.meta.env.DEV) {
      console.error('🔴 Error Handler:', errorDetails);
    }

    // In production, send to monitoring service
    // this.reportToMonitoring(errorDetails);
  }

  // Report to external monitoring service (placeholder)
  reportToMonitoring() {
    // Example: Send to Sentry, LogRocket, etc.
    // Sentry.captureException(errorDetails.error, { extra: errorDetails });
  }

  getErrors() {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

export default errorHandler;

// Utility function to handle async operations with error handling
export const withErrorHandling = async (fn, fallback = null, errorMessage = 'Operation failed') => {
  try {
    return await fn();
  } catch (error) {
    errorHandler.handleError({
      type: 'OperationError',
      message: errorMessage,
      error: error.message || error,
      timestamp: new Date().toISOString()
    });
    
    if (import.meta.env.DEV) {
      console.error(`${errorMessage}:`, error);
    }
    
    return fallback;
  }
};

// Retry mechanism for failed operations
export const retryOperation = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  // All retries failed
  errorHandler.handleError({
    type: 'RetryExhausted',
    message: 'Operation failed after retries',
    error: lastError,
    attempts: maxRetries,
    timestamp: new Date().toISOString()
  });
  
  throw lastError;
};
