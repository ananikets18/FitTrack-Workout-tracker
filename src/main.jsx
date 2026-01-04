import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './utils/polyfills' // Load polyfills first
import './utils/errorHandler' // Initialize global error handling
import './index.css'
import App from './App.jsx'

// Clean up old error logs from localStorage (deprecated feature)
try {
  localStorage.removeItem('app-errors');
  // eslint-disable-next-line no-empty
} catch {
  // Silently fail if localStorage is not available
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
