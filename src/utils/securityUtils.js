/**
 * Additional Security Utilities
 * Helpers for secure data handling
 */

// Detect potential XSS patterns
export const containsXSS = (input) => {
  const xssPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

// Sanitize HTML - remove all tags
export const stripHTML = (input) => {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '');
};

// Validate UUID format
export const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Validate date format
export const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

// Check if date is in reasonable range (not in far past/future)
export const isReasonableDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
  const oneYearAhead = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  
  return date >= fiveYearsAgo && date <= oneYearAhead;
};

// Sanitize file name (for exports)
export const sanitizeFileName = (fileName) => {
  if (typeof fileName !== 'string') return 'export';
  
  return fileName
    .replace(/[^a-z0-9_-]/gi, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 50);
};

// Rate limit checker for client-side operations
export const checkOperationRate = (operationKey, maxPerMinute = 10) => {
  const key = `rate_${operationKey}`;
  const now = Date.now();
  const minute = 60 * 1000;
  
  try {
    const stored = localStorage.getItem(key);
    const data = stored ? JSON.parse(stored) : { count: 0, resetAt: now + minute };
    
    // Reset if expired
    if (now > data.resetAt) {
      data.count = 0;
      data.resetAt = now + minute;
    }
    
    // Check limit
    if (data.count >= maxPerMinute) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: Math.ceil((data.resetAt - now) / 1000),
      };
    }
    
    // Increment and save
    data.count++;
    localStorage.setItem(key, JSON.stringify(data));
    
    return {
      allowed: true,
      remaining: maxPerMinute - data.count,
      resetIn: Math.ceil((data.resetAt - now) / 1000),
    };
  } catch {
    // If localStorage fails, allow operation
    return { allowed: true, remaining: maxPerMinute };
  }
};

// Secure random string generator
export const generateSecureToken = (length = 32) => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Check if running in secure context
export const isSecureContext = () => {
  return window.isSecureContext || window.location.protocol === 'https:';
};

// Validate email format (more comprehensive)
export const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Validate password strength
export const getPasswordStrength = (password) => {
  let strength = 0;
  const checks = {
    length: password.length >= 8,
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    isLong: password.length >= 12,
  };
  
  strength += checks.length ? 1 : 0;
  strength += checks.hasLower ? 1 : 0;
  strength += checks.hasUpper ? 1 : 0;
  strength += checks.hasNumber ? 1 : 0;
  strength += checks.hasSpecial ? 1 : 0;
  strength += checks.isLong ? 1 : 0;
  
  return {
    score: strength,
    checks,
    level: strength < 3 ? 'weak' : strength < 5 ? 'medium' : 'strong',
  };
};

// Check for common weak passwords
const COMMON_PASSWORDS = [
  'password', '12345678', 'qwerty', 'abc123', 'monkey',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou',
  'master', 'sunshine', 'ashley', 'bailey', 'passw0rd',
  'shadow', '123123', '654321', 'superman', 'qazwsx',
];

export const isCommonPassword = (password) => {
  const lower = password.toLowerCase();
  return COMMON_PASSWORDS.some(common => lower.includes(common));
};

// Prevent timing attacks on string comparison
export const secureCompare = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};

