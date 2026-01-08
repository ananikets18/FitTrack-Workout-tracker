import { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_VOLUME_TARGETS } from '../utils/smartRecommendations';

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
    const [preferences, setPreferences] = useState(() => {
        // Load from localStorage
        const saved = localStorage.getItem('userPreferences');
        if (saved) {
            try {
                return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
            } catch (error) {
                console.error('Error loading preferences:', error);
                return DEFAULT_PREFERENCES;
            }
        }
        return DEFAULT_PREFERENCES;
    });

    // Save to localStorage whenever preferences change
    useEffect(() => {
        localStorage.setItem('userPreferences', JSON.stringify(preferences));
    }, [preferences]);

    const updatePreferences = (updates) => {
        setPreferences(prev => ({
            ...prev,
            ...updates
        }));
    };

    const updateVolumeTarget = (muscle, min, max) => {
        setPreferences(prev => ({
            ...prev,
            volumeTargets: {
                ...prev.volumeTargets,
                [muscle]: { min, max }
            }
        }));
    };

    const completeSetup = () => {
        setPreferences(prev => ({
            ...prev,
            hasCompletedSetup: true,
            setupCompletedAt: new Date().toISOString()
        }));
    };

    const resetPreferences = () => {
        setPreferences(DEFAULT_PREFERENCES);
        localStorage.removeItem('userPreferences');
    };

    const value = {
        preferences,
        updatePreferences,
        updateVolumeTarget,
        completeSetup,
        resetPreferences
    };

    return (
        <PreferencesContext.Provider value={value}>
            {children}
        </PreferencesContext.Provider>
    );
};
