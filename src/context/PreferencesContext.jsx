import { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_VOLUME_TARGETS } from '../utils/smartRecommendations';
import { db } from '../lib/supabase';
import { useAuth } from './AuthContext';

const PreferencesContext = createContext();

export const usePreferences = () => {
    const context = useContext(PreferencesContext);
    if (!context) {
        throw new Error('usePreferences must be used within PreferencesProvider');
    }
    return context;
};

const DEFAULT_PREFERENCES = {
    // Training preferences
    split: 'custom', // ppl, upperLower, broSplit, fullBody, custom
    weeklyFrequency: 4, // How many days per week
    volumeTargets: DEFAULT_VOLUME_TARGETS,

    // Setup status
    hasCompletedSetup: false,
    setupCompletedAt: null,
};

export const PreferencesProvider = ({ children }) => {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
    const [isLoading, setIsLoading] = useState(true);

    // Load preferences from Supabase when user logs in
    useEffect(() => {
        const loadPreferences = async () => {
            if (!user) {
                // Not logged in - load from localStorage
                const saved = localStorage.getItem('userPreferences');
                if (saved) {
                    try {
                        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(saved) });
                    } catch (error) {
                        console.error('Error loading preferences from localStorage:', error);
                    }
                }
                setIsLoading(false);
                return;
            }

            try {
                // Logged in - load from Supabase
                const dbPreferences = await db.getUserPreferences(user.id);

                if (dbPreferences) {
                    // Transform DB format to app format
                    const loadedPreferences = {
                        split: dbPreferences.split || 'custom',
                        weeklyFrequency: dbPreferences.weekly_frequency || 4,
                        volumeTargets: dbPreferences.volume_targets || DEFAULT_VOLUME_TARGETS,
                        hasCompletedSetup: dbPreferences.has_completed_setup === true,
                        setupCompletedAt: dbPreferences.setup_completed_at,
                    };
                    setPreferences(loadedPreferences);
                    // Also save to localStorage as backup
                    localStorage.setItem('userPreferences', JSON.stringify(loadedPreferences));
                } else {
                    // No preferences in DB yet - check localStorage
                    const saved = localStorage.getItem('userPreferences');
                    if (saved) {
                        try {
                            const localPrefs = JSON.parse(saved);
                            setPreferences({ ...DEFAULT_PREFERENCES, ...localPrefs });
                            // Sync to DB
                            await db.upsertUserPreferences(user.id, { ...DEFAULT_PREFERENCES, ...localPrefs });
                        } catch (error) {
                            console.error('Error syncing preferences to DB:', error);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading preferences from Supabase:', error);
                // Fallback to localStorage
                const saved = localStorage.getItem('userPreferences');
                if (saved) {
                    try {
                        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(saved) });
                    } catch (e) {
                        console.error('Error loading preferences from localStorage:', e);
                    }
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadPreferences();
    }, [user]);

    const updatePreferences = async (updates) => {
        const newPreferences = {
            ...preferences,
            ...updates
        };

        setPreferences(newPreferences);
        localStorage.setItem('userPreferences', JSON.stringify(newPreferences));

        // Sync to Supabase if logged in
        if (user) {
            try {
                await db.upsertUserPreferences(user.id, newPreferences);
            } catch (error) {
                console.error('Error saving preferences to Supabase:', error);
            }
        }
    };

    const updateVolumeTarget = async (muscle, min, max) => {
        const newPreferences = {
            ...preferences,
            volumeTargets: {
                ...preferences.volumeTargets,
                [muscle]: { min, max }
            }
        };

        setPreferences(newPreferences);
        localStorage.setItem('userPreferences', JSON.stringify(newPreferences));

        // Sync to Supabase if logged in
        if (user) {
            try {
                await db.upsertUserPreferences(user.id, newPreferences);
            } catch (error) {
                console.error('Error saving volume target to Supabase:', error);
            }
        }
    };

    const completeSetup = async () => {
        const newPreferences = {
            ...preferences,
            hasCompletedSetup: true,
            setupCompletedAt: new Date().toISOString()
        };

        setPreferences(newPreferences);
        localStorage.setItem('userPreferences', JSON.stringify(newPreferences));

        // Sync to Supabase if logged in
        if (user) {
            try {
                await db.upsertUserPreferences(user.id, newPreferences);
            } catch (error) {
                console.error('Error saving setup completion to Supabase:', error);
            }
        }
    };

    const resetPreferences = async () => {
        setPreferences(DEFAULT_PREFERENCES);
        localStorage.removeItem('userPreferences');

        // Clear from Supabase if logged in
        if (user) {
            try {
                await db.upsertUserPreferences(user.id, DEFAULT_PREFERENCES);
            } catch (error) {
                console.error('Error resetting preferences in Supabase:', error);
            }
        }
    };

    const value = {
        preferences,
        updatePreferences,
        updateVolumeTarget,
        completeSetup,
        resetPreferences,
        isLoading,
    };

    return (
        <PreferencesContext.Provider value={value}>
            {children}
        </PreferencesContext.Provider>
    );
};
