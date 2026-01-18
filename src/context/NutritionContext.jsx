import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NutritionContext = createContext();

export const useNutrition = () => {
    const context = useContext(NutritionContext);
    if (!context) {
        throw new Error('useNutrition must be used within NutritionProvider');
    }
    return context;
};

export const NutritionProvider = ({ children }) => {
    const { user } = useAuth();
    const [nutritionLogs, setNutritionLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch nutrition logs
    const fetchNutritionLogs = async (days = 30) => {
        if (!user) {
            setNutritionLogs([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('nutrition_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(days * 5); // Approximate: 5 entries per day max

            if (error) {
                // Silently handle if table doesn't exist
                if (error.code === 'PGRST301' || error.code === '42P01' || error.message?.includes('does not exist')) {
                    console.warn('Nutrition tracking feature not available yet');
                    setNutritionLogs([]);
                    return;
                }
                throw error;
            }
            setNutritionLogs(data || []);
        } catch (error) {
            console.error('Error fetching nutrition logs:', error);
            setNutritionLogs([]);
            // Don't show error toast for missing table
        } finally {
            setLoading(false);
        }
    };

    // Add nutrition log
    const addNutritionLog = async (nutritionData) => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('nutrition_logs')
                .insert([{
                    user_id: user.id,
                    ...nutritionData
                }])
                .select()
                .single();

            if (error) {
                // Handle missing table
                if (error.code === 'PGRST301' || error.code === '42P01' || error.message?.includes('does not exist')) {
                    toast.error('Nutrition tracking is not available yet');
                    return null;
                }
                throw error;
            }

            setNutritionLogs(prev => [data, ...prev]);
            toast.success('Nutrition logged!');
            return data;
        } catch (error) {
            console.error('Error adding nutrition log:', error);
            toast.error('Failed to log nutrition');
            throw error;
        }
    };

    // Update nutrition log
    const updateNutritionLog = async (id, updates) => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('nutrition_logs')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;

            setNutritionLogs(prev => prev.map(log => log.id === id ? data : log));
            toast.success('Nutrition updated!');
            return data;
        } catch (error) {
            console.error('Error updating nutrition log:', error);
            toast.error('Failed to update nutrition');
            throw error;
        }
    };

    // Delete nutrition log
    const deleteNutritionLog = async (id) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('nutrition_logs')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            setNutritionLogs(prev => prev.filter(log => log.id !== id));
            toast.success('Nutrition log deleted');
        } catch (error) {
            console.error('Error deleting nutrition log:', error);
            toast.error('Failed to delete nutrition log');
            throw error;
        }
    };

    // Get nutrition for specific date
    const getNutritionForDate = (date) => {
        const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
        return nutritionLogs.filter(log => log.date === dateStr);
    };

    // Get daily totals for a date
    const getDailyTotals = (date) => {
        const logs = getNutritionForDate(date);
        if (logs.length === 0) return null;

        return {
            calories: logs.reduce((sum, log) => sum + (log.calories || 0), 0),
            protein: logs.reduce((sum, log) => sum + (parseFloat(log.protein) || 0), 0),
            carbs: logs.reduce((sum, log) => sum + (parseFloat(log.carbs) || 0), 0),
            fats: logs.reduce((sum, log) => sum + (parseFloat(log.fats) || 0), 0),
            meals: logs.length
        };
    };

    // Get average nutrition (last N days)
    const getAverageNutrition = (days = 7) => {
        const dates = [...new Set(nutritionLogs.map(log => log.date))].slice(0, days);
        if (dates.length === 0) return null;

        const dailyTotals = dates.map(date => getDailyTotals(date)).filter(Boolean);
        if (dailyTotals.length === 0) return null;

        return {
            calories: Math.round(dailyTotals.reduce((sum, day) => sum + day.calories, 0) / dailyTotals.length),
            protein: (dailyTotals.reduce((sum, day) => sum + day.protein, 0) / dailyTotals.length).toFixed(1),
            carbs: (dailyTotals.reduce((sum, day) => sum + day.carbs, 0) / dailyTotals.length).toFixed(1),
            fats: (dailyTotals.reduce((sum, day) => sum + day.fats, 0) / dailyTotals.length).toFixed(1),
            daysLogged: dailyTotals.length
        };
    };

    // Check if nutrition goals are met
    const checkNutritionGoals = (date, targets) => {
        const totals = getDailyTotals(date);
        if (!totals || !targets) return null;

        return {
            calories: {
                current: totals.calories,
                target: targets.calories,
                percentage: targets.calories ? Math.round((totals.calories / targets.calories) * 100) : 0,
                met: totals.calories >= targets.calories * 0.95 && totals.calories <= targets.calories * 1.05
            },
            protein: {
                current: totals.protein,
                target: targets.protein,
                percentage: targets.protein ? Math.round((totals.protein / targets.protein) * 100) : 0,
                met: totals.protein >= targets.protein * 0.9
            }
        };
    };

    useEffect(() => {
        fetchNutritionLogs();
    }, [user]);

    const value = {
        nutritionLogs,
        loading,
        addNutritionLog,
        updateNutritionLog,
        deleteNutritionLog,
        getNutritionForDate,
        getDailyTotals,
        getAverageNutrition,
        checkNutritionGoals,
        refreshNutritionLogs: fetchNutritionLogs
    };

    return <NutritionContext.Provider value={value}>{children}</NutritionContext.Provider>;
};
