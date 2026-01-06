import { useState } from 'react';
import Modal from './Modal';
import { TrendingUp, Award, Calendar, Weight, Target } from 'lucide-react';
import { formatDate, kgToTons } from '../../utils/calculations';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ExerciseHistoryModal = ({ isOpen, onClose, exerciseName, workouts }) => {
    const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'list'

    // Filter workouts that contain this exercise
    const exerciseHistory = workouts
        .filter(workout => workout.type !== 'rest_day')
        .map(workout => {
            const exercise = workout.exercises?.find(ex => ex.name === exerciseName);
            if (!exercise) return null;

            const maxWeight = Math.max(...exercise.sets.map(s => s.weight || 0));
            const totalVolume = exercise.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
            const totalReps = exercise.sets.reduce((sum, set) => sum + set.reps, 0);

            return {
                date: workout.date,
                workoutName: workout.name,
                maxWeight,
                totalVolume,
                totalReps,
                sets: exercise.sets,
                setCount: exercise.sets.length,
            };
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (exerciseHistory.length === 0) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title={exerciseName}>
                <div className="text-center py-8">
                    <p className="text-gray-500">No history found for this exercise</p>
                </div>
            </Modal>
        );
    }

    // Calculate stats
    const personalRecord = Math.max(...exerciseHistory.map(h => h.maxWeight));
    const totalVolume = exerciseHistory.reduce((sum, h) => sum + h.totalVolume, 0);
    const totalSessions = exerciseHistory.length;
    const avgWeight = (exerciseHistory.reduce((sum, h) => sum + h.maxWeight, 0) / totalSessions).toFixed(1);

    // Prepare chart data (reverse for chronological order)
    const chartData = [...exerciseHistory]
        .reverse()
        .map(h => ({
            date: formatDate(h.date),
            weight: h.maxWeight,
            volume: h.totalVolume,
        }));

    // Find improvement
    const firstSession = exerciseHistory[exerciseHistory.length - 1];
    const latestSession = exerciseHistory[0];
    const improvement = latestSession.maxWeight - firstSession.maxWeight;
    const improvementPercent = ((improvement / firstSession.maxWeight) * 100).toFixed(1);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={exerciseName} size="lg">
            <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-yellow-50 rounded-lg p-3 text-center">
                        <Award className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                        <div className="text-xl font-bold text-gray-900">{personalRecord}kg</div>
                        <div className="text-xs text-gray-600">Personal Record</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <Weight className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <div className="text-xl font-bold text-gray-900">{kgToTons(totalVolume)}T</div>
                        <div className="text-xs text-gray-600">Total Volume</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                        <Target className="w-5 h-5 text-green-600 mx-auto mb-1" />
                        <div className="text-xl font-bold text-gray-900">{totalSessions}</div>
                        <div className="text-xs text-gray-600">Sessions</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <TrendingUp className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                        <div className="text-xl font-bold text-gray-900">{avgWeight}kg</div>
                        <div className="text-xs text-gray-600">Avg Weight</div>
                    </div>
                </div>

                {/* Improvement Badge */}
                {improvement > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-center space-x-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-semibold text-green-900">
                                Improved by {improvement}kg ({improvementPercent}%) since first session!
                            </span>
                        </div>
                    </div>
                )}

                {/* View Toggle */}
                <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('chart')}
                        className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${viewMode === 'chart'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Chart View
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${viewMode === 'list'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        List View
                    </button>
                </div>

                {/* Chart View */}
                {viewMode === 'chart' && (
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Weight Progression</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12 }}
                                    stroke="#9ca3af"
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    stroke="#9ca3af"
                                    label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="#0ea5e9"
                                    strokeWidth={3}
                                    dot={{ fill: '#0ea5e9', r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {exerciseHistory.map((session, index) => (
                            <div
                                key={index}
                                className={`border rounded-lg p-4 ${session.maxWeight === personalRecord
                                        ? 'border-yellow-400 bg-yellow-50'
                                        : 'border-gray-200 bg-white'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-900">{formatDate(session.date)}</span>
                                            {session.maxWeight === personalRecord && (
                                                <span className="px-2 py-0.5 text-xs font-bold bg-yellow-400 text-yellow-900 rounded-full">
                                                    PR
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{session.workoutName}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-gray-900">{session.maxWeight}kg</div>
                                        <div className="text-xs text-gray-500">Max Weight</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mt-3 pt-3 border-t">
                                    <div>
                                        <span className="font-medium">{session.setCount}</span> sets
                                    </div>
                                    <div>
                                        <span className="font-medium">{session.totalReps}</span> reps
                                    </div>
                                    <div>
                                        <span className="font-medium">{session.totalVolume}kg</span> volume
                                    </div>
                                </div>

                                {/* Sets breakdown */}
                                <div className="mt-3 pt-3 border-t">
                                    <div className="text-xs font-semibold text-gray-700 mb-2">Sets:</div>
                                    <div className="flex flex-wrap gap-2">
                                        {session.sets.map((set, setIdx) => (
                                            <span
                                                key={setIdx}
                                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                                            >
                                                {set.weight}kg × {set.reps}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ExerciseHistoryModal;
