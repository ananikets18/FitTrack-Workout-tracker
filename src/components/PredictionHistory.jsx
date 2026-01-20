import { useState, useEffect } from 'react';
import { useAICoach } from '../context/AICoachContext';
import Card from './common/Card';
import Button from './common/Button';
import { FiStar, FiTrash2, FiClock, FiTrendingUp, FiFilter } from 'react-icons/fi';
import { format } from 'date-fns';

const PredictionHistory = () => {
    const {
        predictions,
        favorites,
        loading,
        toggleFavorite,
        deletePrediction,
        clearHistory,
        refreshPredictions
    } = useAICoach();

    const [filter, setFilter] = useState('all'); // all, favorites
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        refreshPredictions();
    }, []);

    const displayPredictions = filter === 'favorites' ? favorites : predictions;

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this prediction?')) {
            await deletePrediction(id);
        }
    };

    const handleClearAll = async () => {
        if (confirm('Clear all non-favorite predictions? This cannot be undone.')) {
            await clearHistory();
        }
    };

    return (
        <Card className="prediction-history">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FiClock className="text-indigo-500" />
                    Prediction History
                </h3>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setFilter('all')}
                        variant={filter === 'all' ? 'primary' : 'secondary'}
                        className="text-sm"
                    >
                        All ({predictions.length})
                    </Button>
                    <Button
                        onClick={() => setFilter('favorites')}
                        variant={filter === 'favorites' ? 'primary' : 'secondary'}
                        className="text-sm flex items-center gap-1"
                    >
                        <FiStar /> Favorites ({favorites.length})
                    </Button>
                </div>
            </div>

            {loading && (
                <div className="text-center py-12">
                    <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading predictions...</p>
                </div>
            )}

            {!loading && displayPredictions.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">📊</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                        {filter === 'favorites' ? 'No favorite predictions yet' : 'No predictions yet'}
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm">
                        Generate your first AI workout prediction to see it here
                    </p>
                </div>
            )}

            {!loading && displayPredictions.length > 0 && (
                <>
                    <div className="space-y-4 mb-6">
                        {displayPredictions.map((pred) => (
                            <div
                                key={pred.id}
                                className="p-5 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                                            {pred.prediction?.name || 'Predicted Workout'}
                                        </h4>
                                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <FiClock />
                                                {format(new Date(pred.created_at), 'MMM d, yyyy h:mm a')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FiTrendingUp />
                                                {pred.prediction?.exercises?.length || 0} exercises
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleFavorite(pred.id)}
                                            className={`p-2 rounded-lg transition-colors ${pred.is_favorite
                                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                }`}
                                        >
                                            <FiStar className={pred.is_favorite ? 'fill-current' : ''} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(pred.id)}
                                            className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </div>

                                {pred.prediction?.targetMuscles && (
                                    <div className="mb-3">
                                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                                            {pred.prediction.targetMuscles.join(', ')}
                                        </span>
                                    </div>
                                )}

                                {pred.explanation && (
                                    <div className="mb-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                                            {pred.explanation}
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={() => setExpandedId(expandedId === pred.id ? null : pred.id)}
                                    className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                                >
                                    {expandedId === pred.id ? 'Show Less' : 'Show Details'}
                                </button>

                                {expandedId === pred.id && (
                                    <div className="mt-4 pt-4 border-t-2 border-gray-200 dark:border-gray-700 space-y-3">
                                        {pred.prediction?.exercises?.map((exercise, idx) => (
                                            <div
                                                key={idx}
                                                className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                                            >
                                                <h5 className="font-bold text-gray-900 dark:text-white mb-2">
                                                    {exercise.name}
                                                </h5>
                                                <div className="grid grid-cols-3 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400 text-xs">Sets:</span>
                                                        <span className="font-bold text-gray-900 dark:text-white ml-1">
                                                            {exercise.sets?.length || 0}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400 text-xs">Reps:</span>
                                                        <span className="font-bold text-gray-900 dark:text-white ml-1">
                                                            {exercise.sets?.[0]?.reps || 0}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400 text-xs">Weight:</span>
                                                        <span className="font-bold text-gray-900 dark:text-white ml-1">
                                                            {exercise.sets?.[0]?.weight || 0} kg
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {filter === 'all' && predictions.length > 0 && (
                        <div className="text-center">
                            <Button
                                onClick={handleClearAll}
                                variant="secondary"
                                className="text-sm text-red-600 dark:text-red-400"
                            >
                                <FiTrash2 className="inline mr-1" />
                                Clear All Non-Favorites
                            </Button>
                        </div>
                    )}
                </>
            )}
        </Card>
    );
};

export default PredictionHistory;
