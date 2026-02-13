/**
 * useErrorHandler Hook
 * Centralized error handling with user-friendly messages
 */

import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { createLogger } from '../utils/logger';

const logger = createLogger('ErrorHandler');

// Error message mappings for common errors
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection lost. Please check your internet connection.',
  AUTH_ERROR: 'Authentication failed. Please log in again.',
  PERMISSION_ERROR: 'You don\'t have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

const ERROR_TYPES = {
  '401': 'AUTH_ERROR',
  '403': 'PERMISSION_ERROR',
  '404': 'NOT_FOUND',
  '500': 'SERVER_ERROR',
  '503': 'SERVER_ERROR',
};

export const useErrorHandler = () => {
  const handleError = useCallback((error, customMessage = null) => {
    // Log error for debugging
    logger.error('Error occurred:', error);

    let message = customMessage;

    // Determine error type and message
    if (!message) {
      if (error.response) {
        // HTTP error
        const status = error.response.status.toString();
        const errorType = ERROR_TYPES[status] || 'UNKNOWN_ERROR';
        message = ERROR_MESSAGES[errorType];
      } else if (error.request) {
        // Network error
        message = ERROR_MESSAGES.NETWORK_ERROR;
      } else if (error.message) {
        // Check for common error patterns
        if (error.message.toLowerCase().includes('network')) {
          message = ERROR_MESSAGES.NETWORK_ERROR;
        } else if (error.message.toLowerCase().includes('validation')) {
          message = ERROR_MESSAGES.VALIDATION_ERROR;
        } else {
          message = error.message;
        }
      } else {
        message = ERROR_MESSAGES.UNKNOWN_ERROR;
      }
    }

    // Show toast notification
    toast.error(message, {
      duration: 4000,
      position: 'top-center',
    });

    return message;
  }, []);

  const handleSuccess = useCallback((message) => {
    toast.success(message, {
      duration: 2000,
      position: 'top-center',
    });
  }, []);

  const handleWarning = useCallback((message) => {
    toast(message, {
      duration: 3000,
      position: 'top-center',
      icon: '⚠️',
    });
  }, []);

  const handleInfo = useCallback((message) => {
    toast(message, {
      duration: 2500,
      position: 'top-center',
      icon: 'ℹ️',
    });
  }, []);

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo,
  };
};

export default useErrorHandler;
