# 🚀 Quick Reference Guide

## FitTrack Data Persistence - Quick Start

---

## 📦 What You Have

✅ **IndexedDB** - 50MB+ storage with 7 tables  
✅ **Offline Support** - Full offline functionality  
✅ **Sync System** - Bi-directional cloud sync  
✅ **Conflict Resolution** - 5 strategies  
✅ **Background Sync** - Service Worker  
✅ **Error Recovery** - Automatic diagnosis & recovery  
✅ **UI Components** - Production-ready dashboard  

---

## 🎯 Common Tasks

### **1. Add Sync Dashboard to Your App**

```jsx
// In your Settings or Profile page
import SyncDashboard from './components/SyncDashboard';

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <SyncDashboard />
    </div>
  );
}
```

### **2. Enable Notifications**

```jsx
// In App.jsx
import SyncNotifications from './components/SyncNotifications';

function App() {
  return (
    <>
      <SyncNotifications />
      {/* Rest of your app */}
    </>
  );
}
```

### **3. Add Mini Sync Indicator to Header**

```jsx
// In Header/Navbar
import { MiniSyncIndicator } from './components/SyncProgress';
import { useSyncStatus } from './hooks/useSyncStatus';

function Header() {
  const { isSyncing, errorWorkouts, pendingWorkouts } = useSyncStatus();
  
  return (
    <header>
      <nav>
        {/* Your nav items */}
        <MiniSyncIndicator
          isSyncing={isSyncing}
          hasErrors={errorWorkouts > 0}
          pendingCount={pendingWorkouts}
        />
      </nav>
    </header>
  );
}
```

### **4. Manual Sync Trigger**

```jsx
import { useWorkouts } from './context/WorkoutContext';

function MyComponent() {
  const { forceSync } = useWorkouts();
  
  const handleSync = async () => {
    await forceSync();
  };
  
  return <button onClick={handleSync}>Sync Now</button>;
}
```

### **5. Export Data**

```jsx
import { exportIndexedDBData } from './utils/migrateToIndexedDB';

async function handleExport() {
  const data = await exportIndexedDBData();
  
  // Download as JSON
  const blob = new Blob([JSON.stringify(data, null, 2)], { 
    type: 'application/json' 
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fittrack-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
}
```

### **6. Import Data**

```jsx
import { useState } from 'react';
import DataImport from './components/DataImport';

function MyComponent() {
  const [showImport, setShowImport] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowImport(true)}>
        Import Data
      </button>
      
      {showImport && (
        <DataImport
          onClose={() => setShowImport(false)}
          onImportComplete={() => {
            // Refresh your data
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
```

### **7. Check Sync Status**

```jsx
import { useSyncStatus } from './hooks/useSyncStatus';

function MyComponent() {
  const {
    lastSync,
    isSyncing,
    pendingWorkouts,
    errorWorkouts,
    isOnline
  } = useSyncStatus();
  
  return (
    <div>
      <p>Online: {isOnline ? 'Yes' : 'No'}</p>
      <p>Syncing: {isSyncing ? 'Yes' : 'No'}</p>
      <p>Pending: {pendingWorkouts}</p>
      <p>Errors: {errorWorkouts}</p>
      <p>Last Sync: {lastSync || 'Never'}</p>
    </div>
  );
}
```

### **8. Error Recovery**

```jsx
import { diagnoseErrors, attemptAutoRecovery } from './utils/errorRecovery';

async function handleRecovery() {
  // Diagnose issues
  const diagnosis = await diagnoseErrors();
  console.log('Diagnosis:', diagnosis);
  
  // Attempt auto-recovery
  if (diagnosis.errors.length > 0) {
    const result = await attemptAutoRecovery();
    console.log('Recovery:', result);
  }
}
```

---

## 🔧 Configuration

### **Change Sync Interval**

```javascript
// In src/lib/syncManager.js or at runtime
import { syncManager } from './lib/syncManager';

// Change to 10 minutes
syncManager.enableAutoSync(10 * 60 * 1000);

// Disable auto-sync
syncManager.disableAutoSync();
```

### **Change Conflict Strategy**

```javascript
import { syncManager } from './lib/syncManager';
import { ConflictStrategy } from './lib/conflictResolution';

// Set strategy
syncManager.conflictStrategy = ConflictStrategy.MERGE;

// Available strategies:
// - LAST_WRITE_WINS (default)
// - LOCAL_WINS
// - REMOTE_WINS
// - MERGE
// - MANUAL
```

### **Configure Retry Logic**

```javascript
// In src/lib/offlineQueue.js
class OfflineQueue {
  constructor() {
    this.maxRetries = 5; // Change max retries
    this.retryDelays = [1000, 2000, 5000, 10000, 30000]; // Change delays (ms)
  }
}
```

---

## 🧪 Testing

### **Test in Browser Console**

```javascript
// Import test utilities
import tests from './src/utils/indexedDBTests.js';

// Run all tests
await tests.runAllTests();

// Run specific test
await tests.testMigrationStatus();
await tests.testAddWorkout();
await tests.testGetWorkouts();
```

### **Test Offline Mode**

1. Open DevTools (F12)
2. Go to **Network** tab
3. Check **Offline** checkbox
4. Add/edit a workout
5. Check **Application** → **IndexedDB** → **FitTrackDB** → **syncQueue**
6. Uncheck **Offline**
7. Watch sync happen automatically

### **Test Error Recovery**

```javascript
import { diagnoseErrors } from './src/utils/errorRecovery.js';

const diagnosis = await diagnoseErrors();
console.log(diagnosis);
```

---

## 📊 Monitoring

### **Check Database Stats**

```javascript
import { indexedDBStorage } from './src/utils/indexedDBStorage.js';

const stats = await indexedDBStorage.getStats();
console.log(stats);
// {
//   workouts: 150,
//   exercises: 600,
//   sets: 2400,
//   templates: 5,
//   pendingSync: 0,
//   estimatedSizeMB: '2.34'
// }
```

### **Check Sync Queue**

```javascript
import { offlineQueue } from './src/lib/offlineQueue.js';

const queueStats = await offlineQueue.getStats();
console.log(queueStats);
// { pending: 0, failed: 0, total: 0 }

const pending = await offlineQueue.getPending();
console.log('Pending operations:', pending);
```

### **Check Network Status**

```javascript
import { networkDetector } from './src/utils/networkDetector.js';

const isOnline = networkDetector.getStatus();
console.log('Online:', isOnline);
```

---

## 🐛 Troubleshooting

### **Migration Not Running**

```javascript
// Check migration status
import { getMigrationStatus } from './src/utils/migrateToIndexedDB.js';

const status = await getMigrationStatus();
console.log(status);

// Reset migration (for testing)
import { resetMigration } from './src/utils/migrateToIndexedDB.js';
await resetMigration();
// Then refresh page
```

### **Sync Not Working**

```javascript
// Check sync status
import { syncManager } from './src/lib/syncManager.js';

const status = await syncManager.getSyncStatus();
console.log(status);

// Force sync
await syncManager.forceSyncNow(userId);
```

### **Data Not Showing**

```javascript
// Check IndexedDB
import { indexedDBStorage } from './src/utils/indexedDBStorage.js';

const { workouts } = await indexedDBStorage.get();
console.log('Workouts:', workouts);

// Check if IndexedDB is available
const available = await indexedDBStorage.isAvailable();
console.log('IndexedDB available:', available);
```

### **Errors in Queue**

```javascript
// Get failed operations
import { offlineQueue } from './src/lib/offlineQueue.js';

const failed = await offlineQueue.getFailed();
console.log('Failed operations:', failed);

// Retry all
for (const item of failed) {
  await offlineQueue.retryOperation(item.id);
}

// Or clear all
await offlineQueue.clearFailed();
```

---

## 📱 Service Worker

### **Register Service Worker**

```javascript
// Automatically registered in production
// Or manually:
import { serviceWorkerManager } from './src/utils/serviceWorkerManager.js';

await serviceWorkerManager.register();
```

### **Check Service Worker Status**

```javascript
import { serviceWorkerManager } from './src/utils/serviceWorkerManager.js';

const status = serviceWorkerManager.getStatus();
console.log(status);
// {
//   isSupported: true,
//   isSyncSupported: true,
//   isRegistered: true,
//   isActive: true,
//   hasUpdate: false
// }
```

### **Trigger Background Sync**

```javascript
import { serviceWorkerManager } from './src/utils/serviceWorkerManager.js';

await serviceWorkerManager.registerSync('fittrack-sync');
```

---

## 💾 Backup & Restore

### **Create Backup**

```javascript
import { createRecoveryBackup } from './src/utils/errorRecovery.js';

const backup = await createRecoveryBackup();
console.log('Backup created:', backup);
```

### **Restore from Backup**

```javascript
import { restoreFromRecoveryBackup } from './src/utils/errorRecovery.js';

const result = await restoreFromRecoveryBackup();
console.log('Restored:', result);
```

---

## 🎨 Custom Notifications

```javascript
import { showSyncToast } from './src/components/SyncNotifications.jsx';

// Sync started
showSyncToast.started();

// Sync completed
showSyncToast.completed(15);

// Sync failed
showSyncToast.failed('Network error');

// Data saved
showSyncToast.saved();

// Export completed
showSyncToast.exported();

// Import completed
showSyncToast.imported(25);

// Conflicts detected
showSyncToast.conflicts(3);
```

---

## 📖 Documentation

- **Week 1:** `.agent/week1-summary.md`
- **Week 2:** `.agent/week2-complete.md`
- **Week 3:** `.agent/week3-complete.md`
- **Week 4:** `.agent/week4-complete.md`
- **Summary:** `.agent/implementation-summary.md`
- **Quick Start:** `.agent/quick-reference.md` (this file)

---

## 🎯 Key Files

### **Core**
- `src/lib/indexedDB.js` - Database schema
- `src/lib/syncManager.js` - Sync logic
- `src/lib/offlineQueue.js` - Queue system
- `src/lib/conflictResolution.js` - Conflict handling

### **Utilities**
- `src/utils/indexedDBStorage.js` - Storage API
- `src/utils/networkDetector.js` - Network monitoring
- `src/utils/errorRecovery.js` - Error recovery
- `src/utils/migrateToIndexedDB.js` - Migration

### **Components**
- `src/components/SyncDashboard.jsx` - Main dashboard
- `src/components/SyncNotifications.jsx` - Notifications
- `src/components/SyncProgress.jsx` - Progress indicators
- `src/components/DataImport.jsx` - Import modal

### **Hooks**
- `src/hooks/useSyncStatus.js` - Sync status hook

---

## ✅ Quick Checklist

- [ ] Add `<SyncNotifications />` to App.jsx
- [ ] Add `<SyncDashboard />` to Settings page
- [ ] Add `<MiniSyncIndicator />` to Header
- [ ] Test offline mode
- [ ] Test sync functionality
- [ ] Test error recovery
- [ ] Export/import data
- [ ] Review documentation

---

**Need help?** Check the full documentation in `.agent/` folder!

🚀 **Happy coding!**
