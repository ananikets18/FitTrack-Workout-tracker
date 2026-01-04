/**
 * Application Configuration
 * Centralized access to environment variables
 */

export const config = {
  app: {
    name: import.meta.env.VITE_APP_NAME || 'FitTrack',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    description: import.meta.env.VITE_APP_DESCRIPTION || 'Workout Tracker',
  },
  
  features: {
    pwa: import.meta.env.VITE_ENABLE_PWA === 'true',
    offline: import.meta.env.VITE_ENABLE_OFFLINE === 'true',
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  },
  
  analytics: {
    gaId: import.meta.env.VITE_GA_ID,
  },
  
  errorTracking: {
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  },
  
  api: {
    url: import.meta.env.VITE_API_URL,
  },
  
  env: {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    mode: import.meta.env.MODE,
  },
};

// Validate critical configuration
export const validateConfig = () => {
  const errors = [];
  
  if (!config.app.name) {
    errors.push('App name is missing');
  }
  
  if (!config.app.version) {
    errors.push('App version is missing');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Export environment check helpers
export const isDev = config.env.isDevelopment;
export const isProd = config.env.isProduction;

export default config;
