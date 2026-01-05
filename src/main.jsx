import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './utils/polyfills' // Load polyfills first
import './utils/errorHandler' // Initialize global error handling
import './index.css'
import App from './App.jsx'
import { migrateToIndexedDB } from './utils/migrateToIndexedDB'

// Clean up old error logs from localStorage (deprecated feature)
try {
  localStorage.removeItem('app-errors');
} catch {
  // Silently fail if localStorage is not available
}

// Run migration from localStorage to IndexedDB before rendering app
migrateToIndexedDB()
  .then((result) => {
    if (result.success) {
      if (result.alreadyMigrated) {
        console.log('✅ IndexedDB ready (already migrated)');
      } else {
        console.log(`✅ Migration complete: ${result.workoutsMigrated || 0} workouts migrated`);
      }
    } else {
      console.error('⚠️ Migration failed, app will continue with fallback:', result.error);
    }

    // Render app regardless of migration result
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch((error) => {
    console.error('❌ Critical error during migration:', error);

    // Still render app even if migration fails completely
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });

