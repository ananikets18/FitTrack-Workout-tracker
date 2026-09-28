import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import performanceMonitor from './utils/performanceMonitor'

// Initialize performance monitoring
performanceMonitor.init();

// Global error handlers to prevent initialization errors from breaking the app
// Note: Dexie/IndexedDB was removed — offline is localStorage + service-worker cache only.
// Keep generic storage guards for SafeStorage fallback in lib/supabase.js.
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message || event.reason?.toString() || '';

  // Suppress local-storage quota / unavailable errors that don't affect core render
  if (
    errorMessage.includes('QuotaExceededError') ||
    errorMessage.includes('localStorage') ||
    errorMessage.includes('payload')
  ) {
    console.warn('Non-critical storage warning:', errorMessage);
    event.preventDefault(); // Prevent the error from appearing in console
    return;
  }

  // Log other unhandled rejections for debugging
  console.error('Unhandled promise rejection:', event.reason);
});

// Catch any other global errors
window.addEventListener('error', (event) => {
  const errorMessage = event.message || '';

  // Suppress non-critical storage errors
  if (
    errorMessage.includes('QuotaExceededError') ||
    errorMessage.includes('localStorage')
  ) {
    console.warn('Non-critical error suppressed:', errorMessage);
    event.preventDefault();
    return;
  }
});

// Render the app
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


