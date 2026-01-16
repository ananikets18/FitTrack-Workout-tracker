import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const BodyMeasurementsContext = createContext();

export const useBodyMeasurements = () => {
    const context = useContext(BodyMeasurementsContext);
    if (!context) {
        throw new Error('useBodyMeasurements must be used within BodyMeasurementsProvider');
    }
    return context;
};

export const BodyMeasurementsProvider = ({ children }) => {
    const { user } = useAuth();
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch body measurements
    const fetchMeasurements = async () => {
        if (!user) {
            setMeasurements([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('body_measurements')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (error) throw error;
            setMeasurements(data || []);
        } catch (error) {
            console.error('Error fetching body measurements:', error);
            toast.error('Failed to load body measurements');
        } finally {
            setLoading(false);
        }
    };

    // Add body measurement
    const addMeasurement = async (measurementData) => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('body_measurements')
                .insert([{
                    user_id: user.id,
                    ...measurementData
                }])
                .select()
                .single();

            if (error) throw error;

            setMeasurements(prev => [data, ...prev]);
            toast.success('Measurement logged!');
            return data;
        } catch (error) {
            console.error('Error adding measurement:', error);
            if (error.code === '23505') {
                toast.error('Measurement already logged for this date');
            } else {
                toast.error('Failed to log measurement');
            }
            throw error;
        }
    };

    // Update body measurement
    const updateMeasurement = async (id, updates) => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('body_measurements')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;

            setMeasurements(prev => prev.map(m => m.id === id ? data : m));
            toast.success('Measurement updated!');
            return data;
        } catch (error) {
            console.error('Error updating measurement:', error);
            toast.error('Failed to update measurement');
            throw error;
        }
    };

    // Delete body measurement
    const deleteMeasurement = async (id) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('body_measurements')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            setMeasurements(prev => prev.filter(m => m.id !== id));
            toast.success('Measurement deleted');
        } catch (error) {
            console.error('Error deleting measurement:', error);
            toast.error('Failed to delete measurement');
            throw error;
        }
    };

    // Get measurement for specific date
    const getMeasurementForDate = (date) => {
        const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
        return measurements.find(m => m.date === dateStr);
    };

    // Get latest measurement
    const getLatestMeasurement = () => {
        return measurements.length > 0 ? measurements[0] : null;
    };

    // Get weight trend
    const getWeightTrend = (days = 30) => {
        const recent = measurements
            .filter(m => m.weight)
            .slice(0, days)
            .reverse();

        if (recent.length < 2) return { trend: 'stable', change: 0 };

        const firstWeight = parseFloat(recent[0].weight);
        const lastWeight = parseFloat(recent[recent.length - 1].weight);
        const change = lastWeight - firstWeight;

        return {
            trend: change > 0.5 ? 'gaining' : change < -0.5 ? 'losing' : 'stable',
            change: change.toFixed(1),
            percentage: ((change / firstWeight) * 100).toFixed(1),
            startWeight: firstWeight.toFixed(1),
            currentWeight: lastWeight.toFixed(1),
            days: recent.length
        };
    };

    // Calculate BMI
    const calculateBMI = (weight, height) => {
        if (!weight || !height) return null;
        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);

        let category = 'Normal';
        if (bmi < 18.5) category = 'Underweight';
        else if (bmi >= 25 && bmi < 30) category = 'Overweight';
        else if (bmi >= 30) category = 'Obese';

        return {
            value: bmi.toFixed(1),
            category
        };
    };

    // Get measurement changes (compare first vs latest)
    const getMeasurementChanges = () => {
        if (measurements.length < 2) return null;

        const latest = measurements[0];
        const oldest = measurements[measurements.length - 1];

        const calculateChange = (field) => {
            const latestVal = parseFloat(latest[field]);
            const oldestVal = parseFloat(oldest[field]);
            if (!latestVal || !oldestVal) return null;
            return (latestVal - oldestVal).toFixed(1);
        };

        return {
            weight: calculateChange('weight'),
            chest: calculateChange('chest'),
            waist: calculateChange('waist'),
            hips: calculateChange('hips'),
            left_arm: calculateChange('left_arm'),
            right_arm: calculateChange('right_arm'),
            left_thigh: calculateChange('left_thigh'),
            right_thigh: calculateChange('right_thigh'),
            body_fat_percentage: calculateChange('body_fat_percentage'),
            timespan: measurements.length
        };
    };

    // Predict weight change rate (kg per week)
    const predictWeightChangeRate = (weeks = 4) => {
        const recent = measurements
            .filter(m => m.weight)
            .slice(0, weeks * 7)
            .reverse();

        if (recent.length < 2) return null;

        const firstWeight = parseFloat(recent[0].weight);
        const lastWeight = parseFloat(recent[recent.length - 1].weight);
        const daysBetween = (new Date(recent[recent.length - 1].date) - new Date(recent[0].date)) / (1000 * 60 * 60 * 24);
        const weeksBetween = daysBetween / 7;

        if (weeksBetween === 0) return null;

        const changePerWeek = (lastWeight - firstWeight) / weeksBetween;

        return {
            changePerWeek: changePerWeek.toFixed(2),
            totalChange: (lastWeight - firstWeight).toFixed(1),
            weeks: weeksBetween.toFixed(1)
        };
    };

    useEffect(() => {
        fetchMeasurements();
    }, [user]);

    const value = {
        measurements,
        loading,
        addMeasurement,
        updateMeasurement,
        deleteMeasurement,
        getMeasurementForDate,
        getLatestMeasurement,
        getWeightTrend,
        calculateBMI,
        getMeasurementChanges,
        predictWeightChangeRate,
        refreshMeasurements: fetchMeasurements
    };

    return <BodyMeasurementsContext.Provider value={value}>{children}</BodyMeasurementsContext.Provider>;
};
