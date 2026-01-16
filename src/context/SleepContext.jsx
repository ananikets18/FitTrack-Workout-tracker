import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SleepContext = createContext();

export const useSleep = () => {
    const context = useContext(SleepContext);
    if (!context) {
        throw new Error('useSleep must be used within SleepProvider');
    }
    return context;
};

export const SleepProvider = ({ children }) => {
    const { user } = useAuth();
    const [sleepLogs, setSleepLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch sleep logs
    const fetchSleepLogs = async () => {
        if (!user) {
            setSleepLogs([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('sleep_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (error) throw error;
            setSleepLogs(data || []);
        } catch (error) {
            console.error('Error fetching sleep logs:', error);
            toast.error('Failed to load sleep data');
        } finally {
            setLoading(false);
        }
    };

    // Add sleep log
    const addSleepLog = async (sleepData) => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('sleep_logs')
                .insert([{
                    user_id: user.id,
                    ...sleepData
                }])
                .select()
                .single();

            if (error) throw error;

            setSleepLogs(prev => [data, ...prev]);
            toast.success('Sleep logged!');
            return data;
        } catch (error) {
            console.error('Error adding sleep log:', error);
            if (error.code === '23505') {
                toast.error('Sleep already logged for this date');
            } else {
                toast.error('Failed to log sleep');
            }
            throw error;
        }
    };

    // Update sleep log
    const updateSleepLog = async (id, updates) => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('sleep_logs')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;

            setSleepLogs(prev => prev.map(log => log.id === id ? data : log));
            toast.success('Sleep updated!');
            return data;
        } catch (error) {
            console.error('Error updating sleep log:', error);
            toast.error('Failed to update sleep');
            throw error;
        }
    };

    // Delete sleep log
    const deleteSleepLog = async (id) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('sleep_logs')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            setSleepLogs(prev => prev.filter(log => log.id !== id));
            toast.success('Sleep log deleted');
        } catch (error) {
            console.error('Error deleting sleep log:', error);
            toast.error('Failed to delete sleep log');
            throw error;
        }
    };

    // Get sleep log for specific date
    const getSleepForDate = (date) => {
        const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
        return sleepLogs.find(log => log.date === dateStr);
    };

    // Get average sleep (last 7 days)
    const getAverageSleep = (days = 7) => {
        const recent = sleepLogs.slice(0, days);
        if (recent.length === 0) return null;

        const avgHours = recent.reduce((sum, log) => sum + parseFloat(log.hours_slept), 0) / recent.length;
        const avgQuality = recent.reduce((sum, log) => sum + log.quality, 0) / recent.length;

        return {
            hours: avgHours.toFixed(1),
            quality: avgQuality.toFixed(1),
            count: recent.length
        };
    };

    // Get sleep quality trend
    const getSleepTrend = (days = 7) => {
        const recent = sleepLogs.slice(0, days);
        if (recent.length < 2) return 'stable';

        const firstHalf = recent.slice(Math.floor(recent.length / 2));
        const secondHalf = recent.slice(0, Math.floor(recent.length / 2));

        const firstAvg = firstHalf.reduce((sum, log) => sum + log.quality, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, log) => sum + log.quality, 0) / secondHalf.length;

        if (secondAvg > firstAvg + 0.5) return 'improving';
        if (secondAvg < firstAvg - 0.5) return 'declining';
        return 'stable';
    };

    useEffect(() => {
        fetchSleepLogs();
    }, [user]);

    const value = {
        sleepLogs,
        loading,
        addSleepLog,
        updateSleepLog,
        deleteSleepLog,
        getSleepForDate,
        getAverageSleep,
        getSleepTrend,
        refreshSleepLogs: fetchSleepLogs
    };

    return <SleepContext.Provider value={value}>{children}</SleepContext.Provider>;
};
