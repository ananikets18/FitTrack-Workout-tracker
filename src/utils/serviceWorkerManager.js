/**
 * Service Worker Registration and Management
 * 
 * Handles registration, updates, and communication with the service worker.
 */

class ServiceWorkerManager {
    constructor() {
        this.registration = null;
        this.isSupported = 'serviceWorker' in navigator;
        this.isSyncSupported = 'sync' in (self.registration || {});
        this.listeners = new Set();
    }

    /**
     * Register service worker
     * @returns {Promise<ServiceWorkerRegistration>}
     */
    async register() {
        if (!this.isSupported) {
            console.warn('⚠️ Service Workers not supported');
            return null;
        }

        try {
            this.registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            console.log('✅ Service Worker registered:', this.registration.scope);

            // Handle updates
            this.registration.addEventListener('updatefound', () => {
                const newWorker = this.registration.installing;

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New service worker available
                        this.notifyListeners({
                            type: 'UPDATE_AVAILABLE',
                            worker: newWorker
                        });
                    }
                });
            });

            // Listen for messages from service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                this.handleMessage(event.data);
            });

            // Check for updates periodically (every hour)
            setInterval(() => {
                this.checkForUpdates();
            }, 60 * 60 * 1000);

            return this.registration;
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
            return null;
        }
    }

    /**
     * Check for service worker updates
     */
    async checkForUpdates() {
        if (!this.registration) return;

        try {
            await this.registration.update();
            console.log('🔄 Checked for service worker updates');
        } catch (error) {
            console.error('Error checking for updates:', error);
        }
    }

    /**
     * Activate waiting service worker
     */
    async activateUpdate() {
        if (!this.registration || !this.registration.waiting) {
            return false;
        }

        // Send skip waiting message
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Reload page when new worker takes control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });

        return true;
    }

    /**
     * Register background sync
     * @param {string} tag - Sync tag
     * @returns {Promise<void>}
     */
    async registerSync(tag = 'fittrack-sync') {
        if (!this.isSyncSupported) {
            console.warn('⚠️ Background Sync not supported');
            return false;
        }

        if (!this.registration) {
            console.warn('⚠️ Service Worker not registered');
            return false;
        }

        try {
            await this.registration.sync.register(tag);
            console.log('✅ Background sync registered:', tag);
            return true;
        } catch (error) {
            console.error('❌ Background sync registration failed:', error);
            return false;
        }
    }

    /**
     * Trigger manual sync
     * @returns {Promise<Object>}
     */
    async triggerSync() {
        if (!this.registration || !this.registration.active) {
            console.warn('⚠️ No active service worker');
            return { success: false, error: 'No active service worker' };
        }

        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();

            messageChannel.port1.onmessage = (event) => {
                resolve(event.data);
            };

            this.registration.active.postMessage(
                { type: 'TRIGGER_SYNC' },
                [messageChannel.port2]
            );
        });
    }

    /**
     * Handle messages from service worker
     * @param {Object} data - Message data
     */
    handleMessage(data) {
        console.log('📨 Message from service worker:', data);

        switch (data.type) {
            case 'SYNC_COMPLETE':
                this.notifyListeners({
                    type: 'SYNC_COMPLETE',
                    timestamp: data.timestamp
                });
                break;

            case 'SYNC_FAILED':
                this.notifyListeners({
                    type: 'SYNC_FAILED',
                    error: data.error,
                    timestamp: data.timestamp
                });
                break;

            default:
                this.notifyListeners(data);
        }
    }

    /**
     * Subscribe to service worker events
     * @param {Function} callback - Event callback
     * @returns {Function} - Unsubscribe function
     */
    subscribe(callback) {
        this.listeners.add(callback);

        return () => {
            this.listeners.delete(callback);
        };
    }

    /**
     * Notify all listeners
     * @param {Object} event - Event data
     */
    notifyListeners(event) {
        this.listeners.forEach((callback) => {
            try {
                callback(event);
            } catch (error) {
                console.error('Error in service worker listener:', error);
            }
        });
    }

    /**
     * Unregister service worker
     */
    async unregister() {
        if (!this.registration) return false;

        try {
            const success = await this.registration.unregister();
            console.log('✅ Service Worker unregistered');
            this.registration = null;
            return success;
        } catch (error) {
            console.error('❌ Service Worker unregister failed:', error);
            return false;
        }
    }

    /**
     * Get service worker status
     * @returns {Object}
     */
    getStatus() {
        return {
            isSupported: this.isSupported,
            isSyncSupported: this.isSyncSupported,
            isRegistered: !!this.registration,
            isActive: !!(this.registration && this.registration.active),
            hasUpdate: !!(this.registration && this.registration.waiting),
            scope: this.registration?.scope || null
        };
    }
}

// Create singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Export class for testing
export { ServiceWorkerManager };

// Auto-register on load (in production)
if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
        serviceWorkerManager.register();
    });
}
