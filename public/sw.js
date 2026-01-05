/**
 * Background Sync Worker
 * 
 * Service Worker for background synchronization.
 * Handles sync events when the app is offline or closed.
 */

/* eslint-env serviceworker */

const CACHE_NAME = 'fittrack-v1';
const SYNC_TAG = 'fittrack-sync';

// Assets to cache
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json'
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Service worker installed');
                return self.skipWaiting();
            })
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service worker activated');
                return self.clients.claim();
            })
    );
});

/**
 * Fetch event - serve from cache, fallback to network
 */
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http requests
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached response and update cache in background
                    event.waitUntil(
                        fetch(event.request)
                            .then((networkResponse) => {
                                return caches.open(CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(event.request, networkResponse.clone());
                                        return networkResponse;
                                    });
                            })
                            .catch(() => {
                                // Network failed, cached version is still valid
                            })
                    );

                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Cache successful responses
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();

                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }

                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[SW] Fetch failed:', error);

                        // Return offline page if available
                        return caches.match('/offline.html')
                            .then((offlineResponse) => offlineResponse || new Response('Offline'));
                    });
            })
    );
});

/**
 * Background Sync event - sync data when connection is restored
 */
self.addEventListener('sync', (event) => {
    console.log('[SW] Sync event triggered:', event.tag);

    if (event.tag === SYNC_TAG) {
        event.waitUntil(
            performBackgroundSync()
                .then(() => {
                    console.log('[SW] Background sync completed');

                    // Notify all clients
                    return self.clients.matchAll()
                        .then((clients) => {
                            clients.forEach((client) => {
                                client.postMessage({
                                    type: 'SYNC_COMPLETE',
                                    timestamp: Date.now()
                                });
                            });
                        });
                })
                .catch((error) => {
                    console.error('[SW] Background sync failed:', error);

                    // Notify clients of failure
                    return self.clients.matchAll()
                        .then((clients) => {
                            clients.forEach((client) => {
                                client.postMessage({
                                    type: 'SYNC_FAILED',
                                    error: error.message,
                                    timestamp: Date.now()
                                });
                            });
                        });
                })
        );
    }
});

/**
 * Perform background sync
 * Opens IndexedDB and processes pending operations
 */
async function performBackgroundSync() {
    try {
        // Open IndexedDB
        const db = await openIndexedDB();

        // Get pending operations from sync queue
        const pendingOps = await getPendingOperations(db);

        if (pendingOps.length === 0) {
            console.log('[SW] No pending operations');
            return;
        }

        console.log(`[SW] Processing ${pendingOps.length} pending operations`);

        // Process each operation
        for (const op of pendingOps) {
            try {
                await processOperation(op);

                // Remove from queue on success
                await removeFromQueue(db, op.id);

            } catch (error) {
                console.error('[SW] Operation failed:', op.operation, error);

                // Update retry count
                await updateRetryCount(db, op.id);
            }
        }

    } catch (error) {
        console.error('[SW] Background sync error:', error);
        throw error;
    }
}

/**
 * Open IndexedDB
 */
function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('FitTrackDB', 1);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get pending operations from sync queue
 */
function getPendingOperations(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['syncQueue'], 'readonly');
        const store = transaction.objectStore('syncQueue');
        const index = store.index('status');
        const request = index.getAll('pending');

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Process a single operation
 */
async function processOperation(op) {
    // This would normally call your API
    // For now, we'll just simulate the operation

    const apiUrl = self.registration.scope + 'api/sync';

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            operation: op.operation,
            data: op.data,
            userId: op.userId
        })
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    return response.json();
}

/**
 * Remove operation from queue
 */
function removeFromQueue(db, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['syncQueue'], 'readwrite');
        const store = transaction.objectStore('syncQueue');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Update retry count for failed operation
 */
function updateRetryCount(db, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['syncQueue'], 'readwrite');
        const store = transaction.objectStore('syncQueue');
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const op = getRequest.result;

            if (op) {
                op.retryCount = (op.retryCount || 0) + 1;

                if (op.retryCount >= 5) {
                    op.status = 'failed';
                }

                const putRequest = store.put(op);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);
            } else {
                resolve();
            }
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
}

/**
 * Message event - handle messages from clients
 */
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data.type === 'TRIGGER_SYNC') {
        // Manually trigger sync
        performBackgroundSync()
            .then(() => {
                event.ports[0].postMessage({ success: true });
            })
            .catch((error) => {
                event.ports[0].postMessage({ success: false, error: error.message });
            });
    }
});

/**
 * Push event - handle push notifications
 */
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    const data = event.data ? event.data.json() : {};

    const title = data.title || 'FitTrack';
    const options = {
        body: data.body || 'New notification',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        data: data.data || {}
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked');

    event.notification.close();

    event.waitUntil(
        self.clients.matchAll({ type: 'window' })
            .then((clients) => {
                // Focus existing window if available
                for (const client of clients) {
                    if (client.url === self.registration.scope && 'focus' in client) {
                        return client.focus();
                    }
                }

                // Open new window
                if (self.clients.openWindow) {
                    return self.clients.openWindow('/');
                }
            })
    );
});

console.log('[SW] Service worker script loaded');
