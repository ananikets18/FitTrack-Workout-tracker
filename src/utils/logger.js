/**
 * Logger Utility
 * Provides controlled logging based on environment
 */

const isDevelopment = import.meta.env.MODE === 'development';
const isDebugEnabled = import.meta.env.VITE_ENABLE_DEBUG === 'true';

class Logger {
  constructor(context = '') {
    this.context = context;
  }

  _formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = this.context ? `[${this.context}]` : '';
    return [`${timestamp} ${prefix}`, message, ...args];
  }

  log(message, ...args) {
    if (isDevelopment || isDebugEnabled) {
      console.log(...this._formatMessage('LOG', message, ...args));
    }
  }

  info(message, ...args) {
    if (isDevelopment || isDebugEnabled) {
      console.info(...this._formatMessage('INFO', message, ...args));
    }
  }

  warn(message, ...args) {
    console.warn(...this._formatMessage('WARN', message, ...args));
  }

  error(message, ...args) {
    console.error(...this._formatMessage('ERROR', message, ...args));
  }

  debug(message, ...args) {
    if (isDevelopment || isDebugEnabled) {
      console.debug(...this._formatMessage('DEBUG', message, ...args));
    }
  }

  group(label) {
    if (isDevelopment || isDebugEnabled) {
      console.group(label);
    }
  }

  groupEnd() {
    if (isDevelopment || isDebugEnabled) {
      console.groupEnd();
    }
  }

  table(data) {
    if (isDevelopment || isDebugEnabled) {
      console.table(data);
    }
  }
}

// Create default logger instance
export const logger = new Logger();

// Create logger with specific context
export const createLogger = (context) => new Logger(context);

export default logger;
