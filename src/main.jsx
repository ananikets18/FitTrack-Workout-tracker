import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global error handlers to prevent initialization errors from breaking the app
window.addEventListener('unhandledrejection', (event) => {
  // Check if it's a non-critical error (like IndexedDB initialization)
  const errorMessage = event.reason?.message || event.reason?.toString() || '';

  // Suppress IndexedDB and storage-related errors that don't affect functionality
  if (
    errorMessage.includes('IDBDatabase') ||
    errorMessage.includes('IndexedDB') ||
    errorMessage.includes('payload') ||
    errorMessage.includes('idbSuper')
  ) {
    console.warn('Non-critical storage initialization warning:', errorMessage);
    event.preventDefault(); // Prevent the error from appearing in console
    return;
  }

  // Log other unhandled rejections for debugging
  console.error('Unhandled promise rejection:', event.reason);
});

// Catch any other global errors
window.addEventListener('error', (event) => {
  const errorMessage = event.message || '';

  // Suppress non-critical errors
  if (
    errorMessage.includes('IDBDatabase') ||
    errorMessage.includes('IndexedDB') ||
    errorMessage.includes('idbSuper')
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


