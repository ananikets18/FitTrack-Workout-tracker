import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './utils/polyfills' // Load polyfills first
import './utils/errorHandler' // Initialize global error handling
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
