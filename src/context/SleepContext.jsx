import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { getLocalDateInputValue } from '../utils/date';
import { computeSleepDuration } from '../utils/sleep';

const SleepContext = createContext();

const isMissingTableError = (error) => {
    if (!error) return false;
    return (
        error.code === 'PGRST205' || // table not in schema cache (most common when migration not run)
        error.code === 'PGRST301' ||
        error.code === '42P01' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('schema cache')
    );
};

const normalizeTimeField = (value) => {
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return null;
    // Accept HH:MM or HH:MM:SS from <input type="time">
    const match = trimmed.match(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/);
    if (!match) {
        const err = new Error(`Invalid time "${value}". Use HH:MM format.`);
        err.code = 'SLEEP_VALIDATION';
        throw err;
    }
    // Postgres TIME accepts HH:MM, but normalize to HH:MM:SS for consistency
    return match[3] ? trimmed : `${trimmed}:00`;
};

// Validate + sanitize client payload before hitting Supabase.
// Bedtime + wake are the source of truth; hours auto-fills from them
// unless the user explicitly overrides. This prevents PostgREST 400s
// and contradictory rows (e.g. 23:00->07:00 with hours=5).
const sanitizeSleepPayload = (input = {}) => {
    const date = typeof input.date === 'string' ? input.date.trim() : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const err = new Error('A valid date (YYYY-MM-DD) is required.');
        err.code = 'SLEEP_VALIDATION';
        throw err;
    }
    const parsedDate = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
        const err = new Error('A valid date is required.');
        err.code = 'SLEEP_VALIDATION';
        throw err;
    }
    const todayStr = getLocalDateInputValue();
    if (date > todayStr) {
        const err = new Error('Sleep date cannot be in the future.');
        err.code = 'SLEEP_VALIDATION';
        throw err;
    }

    const rawHours = typeof input.hours_slept === 'string' ? input.hours_slept.trim() : input.hours_slept;
    let hours = typeof rawHours === 'string' && rawHours === '' ? NaN : Number(rawHours);

    const sleep_start_time = normalizeTimeField(input.sleep_start_time);
    const sleep_end_time = normalizeTimeField(input.sleep_end_time);
    const duration = sleep_start_time && sleep_end_time
        ? computeSleepDuration(sleep_start_time, sleep_end_time)
        : null;

    if (sleep_start_time && sleep_end_time && !duration) {
        const err = new Error('Bedtime and wake time must be different valid times.');
        err.code = 'SLEEP_VALIDATION';
        throw err;
    }

    // Auto-fill from bedtime/wake when hours missing (new smart flow).
    if (!Number.isFinite(hours) && duration) {
        hours = duration.totalHours;
    }
    if (!Number.isFinite(hours)) {
        const err = new Error('Add bedtime and wake time, or enter hours slept.');
        err.code = 'SLEEP_VALIDATION';
        throw err;
    }
    if (hours <= 0 || hours > 24) {
        const err = new Error('Hours slept must be between 0 and 24.');
        err.code = 'SLEEP_VALIDATION';
        throw err;
    }
    // Cross-check manual override against computed duration (tolerance 1h for rounding/naps).
    if (duration && Math.abs(hours - duration.totalHours) > 1) {
        const err = new Error(
            `Hours (${hours}h) doesn't match bedtime → wake (${duration.totalHours}h). Adjust the times or hours.`
        );
        err.code = 'SLEEP_VALIDATION';
        throw err;
    }
    // Match NUMERIC(3,1): round to 1 decimal
    const hours_slept = Math.round(hours * 10) / 10;

    const quality = Number(input.quality);
    if (!Number.isInteger(quality) || quality < 1 || quality > 5) {
        const err = new Error('Sleep quality must be between 1 and 5.');
        err.code = 'SLEEP_VALIDATION';
        throw err;
    }

    const notesRaw = typeof input.notes === 'string' ? input.notes.trim() : input.notes;
    const notes = notesRaw ? String(notesRaw) : null;

    return {
        date,
        hours_slept,
        quality,
        sleep_start_time,
        sleep_end_time,
        notes,
    };
};

const sortByDateDesc = (logs) => [...logs].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

const getFriendlySleepError = (error) => {
    if (error?.code === 'SLEEP_VALIDATION') return error.message;
    if (error?.code === '23505') return 'Sleep already logged for this date. Edit the existing entry instead.';
    if (error?.code === '23502') return 'Missing required field. Please fill in date and hours slept.';
    if (error?.code === '23514' || error?.code === '23513') return 'One of the values is out of range (quality 1-5, hours 0-24).';
    if (error?.code === '22P02' || error?.code === '22007') return 'Invalid date or time format.';
    if (error?.code === '42501') return 'Not authorized to save sleep. Please sign in again.';
    return null;
};

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
    const fetchSleepLogs = useCallback(async () => {
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

            if (error) {
                // Silently handle if table doesn't exist (migration not run yet)
                if (isMissingTableError(error)) {
                    console.warn('Sleep tracking feature not available yet (missing sleep_logs table)');
                    setSleepLogs([]);
                    return;
                }
                throw error;
            }
            setSleepLogs(data || []);
        } catch (error) {
            console.error('Error fetching sleep logs:', error);
            setSleepLogs([]);
            // Don't show error toast for missing table
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Add sleep log
    const addSleepLog = async (sleepData) => {
        if (!user) return;

        try {
            const payload = sanitizeSleepPayload(sleepData);

            // Friendly pre-check to avoid a 409/400 round-trip on duplicate date
            if (sleepLogs.some((log) => log.date === payload.date)) {
                const dupError = new Error('Sleep already logged for this date. Edit the existing entry instead.');
                dupError.code = '23505';
                throw dupError;
            }

            const { data, error } = await supabase
                .from('sleep_logs')
                .insert([{
                    user_id: user.id,
                    ...payload
                }])
                .select()
                .single();

            if (error) {
                // Handle missing table
                if (isMissingTableError(error)) {
                    toast.error('Sleep tracking is not available yet (database table missing)');
                    return null;
                }
                throw error;
            }

            setSleepLogs(prev => sortByDateDesc([data, ...prev]));
            toast.success('Sleep logged!');
            return data;
        } catch (error) {
            console.error('Error adding sleep log:', error);
            toast.error(getFriendlySleepError(error) || 'Failed to log sleep');
            throw error;
        }
    };

    // Update sleep log
    const updateSleepLog = async (id, updates) => {
        if (!user) return;

        try {
            const payload = sanitizeSleepPayload({ ...sleepLogs.find((l) => l.id === id), ...updates });

            // Prevent moving an entry onto a date that already has a log
            const clash = sleepLogs.find((log) => log.date === payload.date && log.id !== id);
            if (clash) {
                const dupError = new Error('Another sleep log already exists for this date.');
                dupError.code = '23505';
                throw dupError;
            }

            const { data, error } = await supabase
                .from('sleep_logs')
                .update(payload)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;

            setSleepLogs(prev => sortByDateDesc(prev.map(log => log.id === id ? data : log)));
            toast.success('Sleep updated!');
            return data;
        } catch (error) {
            console.error('Error updating sleep log:', error);
            toast.error(getFriendlySleepError(error) || 'Failed to update sleep');
            throw error;
        }
    };

    // Delete sleep log — returns the removed row so callers can offer Undo.
    const deleteSleepLog = async (id) => {
        if (!user) return null;

        const removed = sleepLogs.find((log) => log.id === id) || null;
        try {
            const { error } = await supabase
                .from('sleep_logs')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            setSleepLogs(prev => prev.filter(log => log.id !== id));
            return removed;
        } catch (error) {
            console.error('Error deleting sleep log:', error);
            toast.error('Failed to delete sleep log');
            throw error;
        }
    };

    // Restore a previously deleted log (Undo). Re-inserts same date/values with a new id.
    const restoreSleepLog = async (log) => {
        if (!user || !log) return null;
        const payload = sanitizeSleepPayload({
            date: log.date,
            hours_slept: log.hours_slept,
            quality: log.quality,
            sleep_start_time: log.sleep_start_time,
            sleep_end_time: log.sleep_end_time,
            notes: log.notes,
        });
        const { data, error } = await supabase
            .from('sleep_logs')
            .insert([{ user_id: user.id, ...payload }])
            .select()
            .single();
        if (error) throw error;
        setSleepLogs(prev => sortByDateDesc([data, ...prev.filter((l) => l.date !== data.date)]));
        return data;
    };

    // Get sleep log for specific date
    const getSleepForDate = (date) => {
        const dateStr = typeof date === 'string' ? date : getLocalDateInputValue(date);
        return sleepLogs.find(log => log.date === dateStr);
    };

    // Get average sleep (last 7 days)
    const getAverageSleep = (days = 7) => {
        const recent = sleepLogs.slice(0, days).filter((log) => Number.isFinite(parseFloat(log.hours_slept)));
        if (recent.length === 0) return null;

        const avgHours = recent.reduce((sum, log) => sum + parseFloat(log.hours_slept), 0) / recent.length;
        const qualityValues = recent.map((log) => Number(log.quality)).filter((q) => Number.isFinite(q));
        const avgQuality = qualityValues.length > 0
            ? qualityValues.reduce((sum, q) => sum + q, 0) / qualityValues.length
            : 0;

        return {
            hours: avgHours.toFixed(1),
            quality: avgQuality.toFixed(1),
            count: recent.length
        };
    };

    // Get sleep quality trend
    const getSleepTrend = (days = 7) => {
        const recent = sleepLogs.slice(0, days).filter((log) => Number.isFinite(Number(log.quality)));
        if (recent.length < 2) return 'stable';

        const firstHalf = recent.slice(Math.floor(recent.length / 2));
        const secondHalf = recent.slice(0, Math.floor(recent.length / 2));

        const firstAvg = firstHalf.reduce((sum, log) => sum + Number(log.quality), 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, log) => sum + Number(log.quality), 0) / secondHalf.length;

        if (secondAvg > firstAvg + 0.5) return 'improving';
        if (secondAvg < firstAvg - 0.5) return 'declining';
        return 'stable';
    };

    useEffect(() => {
        fetchSleepLogs();
    }, [fetchSleepLogs]);

    const value = {
        sleepLogs,
        loading,
        addSleepLog,
        updateSleepLog,
        deleteSleepLog,
        restoreSleepLog,
        getSleepForDate,
        getAverageSleep,
        getSleepTrend,
        refreshSleepLogs: fetchSleepLogs
    };

    return <SleepContext.Provider value={value}>{children}</SleepContext.Provider>;
};
