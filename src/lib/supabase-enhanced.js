import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    if (import.meta.env.MODE === 'production') {
        throw new Error('Missing Supabase configuration. Please contact support.');
    } else {
        console.error('⚠️ Missing Supabase environment variables. Check your .env file.');
    }
}

// Validate URL format
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    throw new Error('Invalid Supabase URL format');
}

// Enhanced storage wrapper with better error handling
class EnhancedLocalStorage {
    constructor() {
        this.storage = window.localStorage;
        this.prefix = 'sb-';
    }

    getItem(key) {
        try {
            const item = this.storage.getItem(key);
            if (import.meta.env.MODE !== 'production') {
                console.log(`[Storage] GET ${key}:`, item ? 'exists' : 'null');
            }
            return item;
        } catch (error) {
            console.error('[Storage] Error getting item:', key, error);
            return null;
        }
    }

    setItem(key, value) {
        try {
            this.storage.setItem(key, value);
            if (import.meta.env.MODE !== 'production') {
                console.log(`[Storage] SET ${key}`);
            }
        } catch (error) {
            console.error('[Storage] Error setting item:', key, error);
            // Try to clear some space if quota exceeded
            if (error.name === 'QuotaExceededError') {
                console.warn('[Storage] Quota exceeded, attempting to clear old data');
                this.clearOldData();
                // Retry
                try {
                    this.storage.setItem(key, value);
                } catch (retryError) {
                    console.error('[Storage] Retry failed:', retryError);
                }
            }
        }
    }

    removeItem(key) {
        try {
            this.storage.removeItem(key);
            if (import.meta.env.MODE !== 'production') {
                console.log(`[Storage] REMOVE ${key}`);
            }
        } catch (error) {
            console.error('[Storage] Error removing item:', key, error);
        }
    }

    clearOldData() {
        try {
            // Clear old workout data backups
            const keysToRemove = [];
            for (let i = 0; i < this.storage.length; i++) {
                const key = this.storage.key(i);
                if (key && (key.includes('backup') || key.includes('migrated'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => this.storage.removeItem(key));
            console.log(`[Storage] Cleared ${keysToRemove.length} old items`);
        } catch (error) {
            console.error('[Storage] Error clearing old data:', error);
        }
    }
}

// Create enhanced storage instance
const enhancedStorage = new EnhancedLocalStorage();

// Create Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: enhancedStorage,
        // Add these for better session management
        storageKey: 'sb-auth-token',
        flowType: 'pkce', // More secure auth flow
        debug: import.meta.env.MODE !== 'production',
    },
    global: {
        headers: {
            'X-Client-Info': 'fittrack-web-app',
        },
    },
    // Add retry logic for failed requests
    db: {
        schema: 'public',
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});

// Add session recovery mechanism
export const recoverSession = async () => {
    try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.error('[Session Recovery] Error:', error);
            return null;
        }

        if (data.session) {
            console.log('[Session Recovery] Session recovered successfully');
            return data.session;
        }

        console.log('[Session Recovery] No session to recover');
        return null;
    } catch (error) {
        console.error('[Session Recovery] Unexpected error:', error);
        return null;
    }
};

// Add session validation
export const validateSession = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            console.error('[Session Validation] Error:', error);
            return false;
        }

        if (user) {
            console.log('[Session Validation] Valid session for user:', user.email);
            return true;
        }

        console.log('[Session Validation] No valid session');
        return false;
    } catch (error) {
        console.error('[Session Validation] Unexpected error:', error);
        return false;
    }
};

// Export storage for debugging
export { enhancedStorage };
