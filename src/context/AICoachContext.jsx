import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const AICoachContext = createContext();

export const useAICoach = () => {
    const context = useContext(AICoachContext);
    if (!context) {
        throw new Error('useAICoach must be used within AICoachProvider');
    }
    return context;
};

export const AICoachProvider = ({ children }) => {
    const { user } = useAuth();
    const [predictions, setPredictions] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [settings, setSettings] = useState({
        analyzeDays: 10,
        recoveryDays: 2,
        autoGenerate: false,
        useGroqAI: true,
        model: 'llama3-70b-8192'
    });
    const [loading, setLoading] = useState(false);

    // Load predictions history from Supabase
    useEffect(() => {
        if (user) {
            loadPredictions();
            loadFavorites();
            loadSettings();
        }
    }, [user]);

    const loadPredictions = async () => {
        try {
            const { data, error } = await supabase
                .from('ai_predictions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setPredictions(data || []);
        } catch (error) {
            console.error('Error loading predictions:', error);
        }
    };

    const loadFavorites = async () => {
        try {
            const { data, error } = await supabase
                .from('ai_predictions')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_favorite', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setFavorites(data || []);
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    };

    const loadSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('user_preferences')
                .select('ai_coach_settings')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            
            if (data?.ai_coach_settings) {
                setSettings(prev => ({ ...prev, ...data.ai_coach_settings }));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const savePrediction = async (predictionData) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('ai_predictions')
                .insert([{
                    user_id: user.id,
                    prediction: predictionData.prediction,
                    explanation: predictionData.explanation,
                    analysis: predictionData.analysis,
                    settings_used: settings,
                    is_favorite: false
                }])
                .select()
                .single();

            if (error) throw error;

            setPredictions(prev => [data, ...prev]);
            return { success: true, data };
        } catch (error) {
            console.error('Error saving prediction:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = async (predictionId) => {
        try {
            const prediction = predictions.find(p => p.id === predictionId);
            const newFavoriteStatus = !prediction.is_favorite;

            const { error } = await supabase
                .from('ai_predictions')
                .update({ is_favorite: newFavoriteStatus })
                .eq('id', predictionId);

            if (error) throw error;

            setPredictions(prev =>
                prev.map(p =>
                    p.id === predictionId
                        ? { ...p, is_favorite: newFavoriteStatus }
                        : p
                )
            );

            await loadFavorites();
            return { success: true };
        } catch (error) {
            console.error('Error toggling favorite:', error);
            return { success: false, error: error.message };
        }
    };

    const deletePrediction = async (predictionId) => {
        try {
            const { error } = await supabase
                .from('ai_predictions')
                .delete()
                .eq('id', predictionId);

            if (error) throw error;

            setPredictions(prev => prev.filter(p => p.id !== predictionId));
            await loadFavorites();
            return { success: true };
        } catch (error) {
            console.error('Error deleting prediction:', error);
            return { success: false, error: error.message };
        }
    };

    const updateSettings = async (newSettings) => {
        try {
            const updatedSettings = { ...settings, ...newSettings };

            const { error } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    ai_coach_settings: updatedSettings
                });

            if (error) throw error;

            setSettings(updatedSettings);
            return { success: true };
        } catch (error) {
            console.error('Error updating settings:', error);
            return { success: false, error: error.message };
        }
    };

    const clearHistory = async () => {
        try {
            const { error } = await supabase
                .from('ai_predictions')
                .delete()
                .eq('user_id', user.id)
                .eq('is_favorite', false);

            if (error) throw error;

            await loadPredictions();
            return { success: true };
        } catch (error) {
            console.error('Error clearing history:', error);
            return { success: false, error: error.message };
        }
    };

    const value = {
        predictions,
        favorites,
        settings,
        loading,
        savePrediction,
        toggleFavorite,
        deletePrediction,
        updateSettings,
        clearHistory,
        refreshPredictions: loadPredictions,
        refreshFavorites: loadFavorites
    };

    return (
        <AICoachContext.Provider value={value}>
            {children}
        </AICoachContext.Provider>
    );
};
