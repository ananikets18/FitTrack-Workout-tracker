/**
 * Network Detection Utility
 * 
 * Provides network status detection and monitoring with event listeners.
 * Handles online/offline state changes and notifies subscribers.
 */

class NetworkDetector {
    constructor() {
        this.isOnline = navigator.onLine;
        this.listeners = new Set();
        this.checkInterval = null;

        // Bind methods
        this.handleOnline = this.handleOnline.bind(this);
        this.handleOffline = this.handleOffline.bind(this);

        // Initialize
        this.init();
    }

    /**
     * Initialize network detection
     */
    init() {
        // Listen to browser online/offline events
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);

        // Periodic connectivity check (every 30 seconds)
        // This catches cases where browser events don't fire
        this.checkInterval = setInterval(() => {
            this.checkConnectivity();
        }, 30000);

        // Initial check
        this.checkConnectivity();
    }

    /**
     * Handle online event
     */
    handleOnline() {
        console.log('🌐 Network: Online');
        this.isOnline = true;
        this.notifyListeners(true);
    }

    /**
     * Handle offline event
     */
    handleOffline() {
        console.log('📴 Network: Offline');
        this.isOnline = false;
        this.notifyListeners(false);
    }

    /**
     * Check actual connectivity by making a request
     * This is more reliable than just checking navigator.onLine
     */
    async checkConnectivity() {
        try {
            // Try to fetch a small resource
            // Using a timestamp to prevent caching
            const response = await fetch('/favicon.ico?t=' + Date.now(), {
                method: 'HEAD',
                cache: 'no-cache',
                mode: 'no-cors'
            });

            const wasOnline = this.isOnline;
            this.isOnline = true;

            // Notify if status changed
            if (!wasOnline) {
                console.log('🌐 Network: Connectivity restored');
                this.notifyListeners(true);
            }

            return true;
        } catch (error) {
            const wasOnline = this.isOnline;
            this.isOnline = false;

            // Notify if status changed
            if (wasOnline) {
                console.log('📴 Network: Connectivity lost');
                this.notifyListeners(false);
            }

            return false;
        }
    }

    /**
     * Get current network status
     * @returns {boolean} - True if online
     */
    getStatus() {
        return this.isOnline;
    }

    /**
     * Subscribe to network status changes
     * @param {Function} callback - Callback function (receives boolean)
     * @returns {Function} - Unsubscribe function
     */
    subscribe(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }

        this.listeners.add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.delete(callback);
        };
    }

    /**
     * Notify all listeners of status change
     * @param {boolean} isOnline - Current online status
     */
    notifyListeners(isOnline) {
        this.listeners.forEach(callback => {
            try {
                callback(isOnline);
            } catch (error) {
                console.error('Error in network status listener:', error);
            }
        });
    }

    /**
     * Wait for network to be online
     * @param {number} timeout - Max wait time in ms (default: 30000)
     * @returns {Promise<boolean>} - Resolves when online or timeout
     */
    async waitForOnline(timeout = 30000) {
        if (this.isOnline) {
            return true;
        }

        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                unsubscribe();
                resolve(false);
            }, timeout);

            const unsubscribe = this.subscribe((isOnline) => {
                if (isOnline) {
                    clearTimeout(timeoutId);
                    unsubscribe();
                    resolve(true);
                }
            });
        });
    }

    /**
     * Cleanup - remove event listeners
     */
    destroy() {
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);

        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        this.listeners.clear();
    }
}

// Create singleton instance
export const networkDetector = new NetworkDetector();

// Export class for testing
export { NetworkDetector };

// Export utility functions
export const isOnline = () => networkDetector.getStatus();
export const waitForOnline = (timeout) => networkDetector.waitForOnline(timeout);
export const onNetworkChange = (callback) => networkDetector.subscribe(callback);

