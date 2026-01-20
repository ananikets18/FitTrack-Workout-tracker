import { useState, useEffect } from 'react';
import { useWorkouts } from '../context/WorkoutContext';
import { useAICoach } from '../context/AICoachContext';
import { predictNextWorkout, prepareLLMContext } from '../utils/workoutPredictionEngine';
import { generateWorkoutExplanation, validateApiKey, testApiKey } from '../utils/groqAIService';
import Card from './common/Card';
import Button from './common/Button';
import { FiSettings, FiStar, FiDownload, FiClock, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';

const AIWorkoutCoachEnhanced = () => {
    const { workouts, addWorkout } = useWorkouts();
    const aiCoachContext = useAICoach();

    // Default settings if context is not available
    const defaultSettings = {
        analyzeDays: 10,
        recoveryDays: 2,
        autoGenerate: false,
        useGroqAI: true,
        model: 'llama-3.3-70b-versatile'
    };

    const settings = aiCoachContext?.settings || defaultSettings;
    const savePrediction = aiCoachContext?.savePrediction || (async () => ({ success: false }));
    const toggleFavorite = aiCoachContext?.toggleFavorite || (async () => ({ success: false }));
    const updateSettings = aiCoachContext?.updateSettings || (async () => ({ success: false }));

    const [prediction, setPrediction] = useState(null);
    const [explanation, setExplanation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [apiKeyStatus, setApiKeyStatus] = useState(null);

    const apiKey = import.meta.env.VITE_GROQ_API_KEY || '';

    // Validate API key on mount
    useEffect(() => {
        if (apiKey) {
            const isValid = validateApiKey(apiKey);
            setApiKeyStatus(isValid ? 'valid' : 'invalid');
        } else {
            setApiKeyStatus('missing');
        }
    }, [apiKey]);

    // Generate prediction
    const generatePrediction = async () => {
        setLoading(true);
        setError(null);

        try {
            // Step 1: Predict next workout using rule-based AI
            const predictionResult = predictNextWorkout(workouts, settings.analyzeDays);

            if (!predictionResult.success) {
                setError(predictionResult.reason);
                setLoading(false);
                return;
            }

            setPrediction(predictionResult);

            // Step 2: Prepare context for LLM
            const context = prepareLLMContext(predictionResult, workouts);

            // Step 3: Generate explanation with Groq AI
            if (settings.useGroqAI && apiKey) {
                const explanationResult = await generateWorkoutExplanation(context, apiKey, {
                    model: settings.model
                });

                if (explanationResult.success) {
                    setExplanation(explanationResult.explanation);
                } else {
                    setExplanation(explanationResult.fallbackExplanation);
                    if (!apiKey) {
                        setError('⚙️ Configure VITE_GROQ_API_KEY to enable AI explanations');
                    }
                }
            } else {
                // Use fallback explanation
                setExplanation(generateFallbackExplanation(context));
            }

            // Step 4: Save to history
            await savePrediction({
                prediction: predictionResult.prediction,
                explanation: explanation,
                analysis: predictionResult.analysis
            });

        } catch (err) {
            console.error('Prediction error:', err);
            setError('Failed to generate prediction. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Export prediction to workout log
    const exportToWorkout = async () => {
        if (!prediction) return;

        try {
            const newWorkout = {
                name: prediction.prediction.name,
                date: new Date().toISOString().split('T')[0],
                type: 'strength',
                exercises: prediction.prediction.exercises.map(ex => ({
                    name: ex.name,
                    category: ex.category,
                    sets: ex.sets.map(set => ({
                        reps: set.reps,
                        weight: set.weight,
                        completed: false
                    }))
                })),
                notes: `AI Generated: ${explanation?.substring(0, 200)}...`
            };

            await addWorkout(newWorkout);
            alert('✅ Workout exported to your log!');
        } catch (err) {
            console.error('Export error:', err);
            alert('❌ Failed to export workout');
        }
    };

    // Test API key
    const handleTestApiKey = async () => {
        if (!apiKey) {
            alert('❌ No API key configured');
            return;
        }

        setLoading(true);
        const result = await testApiKey(apiKey);
        setLoading(false);

        alert(result.message);
        setApiKeyStatus(result.valid ? 'valid' : 'invalid');
    };

    // Fallback explanation generator
    const generateFallbackExplanation = (context) => {
        if (context.status === 'error') {
            return `Unable to generate prediction: ${context.message}`;
        }

        const { predictionSummary, targetMuscles, muscleRecoveryStatus } = context.context;
        const musclesReady = Object.entries(muscleRecoveryStatus)
            .filter(([, status]) => status.needsTraining)
            .map(([muscle]) => muscle);

        return `Based on your recent training, I recommend a ${targetMuscles.join(' and ')} workout. Your ${musclesReady.join(', ')} ${musclesReady.length === 1 ? 'is' : 'are'} well-recovered and ready for training. The workout includes ${predictionSummary.length} exercises with progressive overload applied where appropriate. Keep up the consistency! 💪`;
    };

    return (
        <Card className="ai-workout-coach-enhanced bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border-2 border-indigo-200 dark:border-indigo-700 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl">🤖</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            AI Workout Coach
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Powered by Groq AI {apiKeyStatus === 'valid' && '✅'}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => setShowSettings(!showSettings)}
                    variant="secondary"
                    className="flex items-center gap-2"
                >
                    <FiSettings /> Settings
                </Button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="mb-6 p-5 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 space-y-4">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                        ⚙️ AI Coach Settings
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Analysis Period (days)
                            </label>
                            <input
                                type="number"
                                min="5"
                                max="30"
                                value={settings.analyzeDays}
                                onChange={(e) => updateSettings({ analyzeDays: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Recovery Time (days)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="7"
                                value={settings.recoveryDays}
                                onChange={(e) => updateSettings({ recoveryDays: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="useGroqAI"
                            checked={settings.useGroqAI}
                            onChange={(e) => updateSettings({ useGroqAI: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-300"
                        />
                        <label htmlFor="useGroqAI" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Use Groq AI for enhanced explanations
                        </label>
                    </div>

                    <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            API Key Status: {' '}
                            <span className={`font-bold ${apiKeyStatus === 'valid' ? 'text-green-600' : 'text-red-600'}`}>
                                {apiKeyStatus === 'valid' ? '✅ Valid' : apiKeyStatus === 'invalid' ? '❌ Invalid' : '⚠️ Missing'}
                            </span>
                        </p>
                        <Button onClick={handleTestApiKey} disabled={loading} variant="secondary" className="text-sm">
                            Test API Key
                        </Button>
                    </div>
                </div>
            )}

            {/* API Key Warning */}
            {apiKeyStatus !== 'valid' && !showSettings && (
                <div className="mb-5 p-4 bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-400 dark:border-yellow-600 rounded-xl">
                    <p className="text-yellow-900 dark:text-yellow-100 font-semibold">
                        ⚠️ Configure VITE_GROQ_API_KEY in your .env file to enable AI-powered explanations
                    </p>
                </div>
            )}

            {/* Generate Button */}
            {!prediction && (
                <div className="text-center py-12">
                    <div className="mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-4xl">🎯</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-2 text-lg font-medium">
                            Get AI-powered workout predictions
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Analyzing your last {settings.analyzeDays} days of training
                        </p>
                    </div>
                    <Button
                        onClick={generatePrediction}
                        disabled={loading || workouts.length < 2}
                        className="text-lg px-10 py-4 shadow-lg hover:shadow-xl transition-shadow"
                    >
                        {loading ? '🔮 Analyzing...' : '🚀 Predict My Next Workout'}
                    </Button>
                    {workouts.length < 2 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 font-medium">
                            Need at least 2 workouts to generate predictions
                        </p>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-600 rounded-xl">
                    <p className="text-red-900 dark:text-red-100 font-semibold">{error}</p>
                </div>
            )}

            {/* Prediction Results */}
            {prediction && (
                <div className="space-y-5">
                    {/* AI Explanation */}
                    {explanation && (
                        <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-2xl">
                            <div className="flex items-start gap-4">
                                <span className="text-4xl">💬</span>
                                <div className="flex-1">
                                    <h4 className="font-bold mb-3 text-white text-xl flex items-center gap-3">
                                        AI Coach Says:
                                        <span className="text-xs bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                                            Powered by Groq
                                        </span>
                                    </h4>
                                    <p className="text-white/95 whitespace-pre-line leading-relaxed text-base">
                                        {explanation}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <Button
                            onClick={exportToWorkout}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                            <FiDownload /> Export to Workout Log
                        </Button>
                        <Button
                            onClick={() => toggleFavorite(prediction.id)}
                            variant="secondary"
                            className="flex items-center gap-2"
                        >
                            <FiStar /> Save as Favorite
                        </Button>
                    </div>

                    {/* Predicted Workout */}
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-lg">
                        <div className="flex items-center justify-between mb-5">
                            <h4 className="font-bold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                                <FiCheckCircle className="text-green-500" />
                                Predicted Workout
                            </h4>
                            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-full">
                                {prediction.prediction.targetMuscles.join(', ')}
                            </span>
                        </div>

                        <div className="space-y-4">
                            {prediction.prediction.exercises.map((exercise, index) => (
                                <div
                                    key={index}
                                    className="p-5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all hover:shadow-md"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <h5 className="font-bold text-lg text-gray-900 dark:text-white">
                                            {index + 1}. {exercise.name}
                                        </h5>
                                        {exercise.overloadRecommendation && (
                                            <span
                                                className={`text-xs font-bold px-3 py-1.5 rounded-full ${exercise.overloadRecommendation.action === 'increase_weight'
                                                    ? 'bg-green-500 text-white'
                                                    : exercise.overloadRecommendation.action === 'increase_reps'
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-gray-500 text-white'
                                                    }`}
                                            >
                                                <FiTrendingUp className="inline mr-1" />
                                                {exercise.overloadRecommendation.action.replace('_', ' ').toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-center">
                                            <span className="text-gray-600 dark:text-gray-400 text-xs block mb-1 font-semibold">Sets</span>
                                            <span className="font-bold text-gray-900 dark:text-white text-2xl">{exercise.sets.length}</span>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-center">
                                            <span className="text-gray-600 dark:text-gray-400 text-xs block mb-1 font-semibold">Reps</span>
                                            <span className="font-bold text-gray-900 dark:text-white text-2xl">{exercise.sets[0]?.reps || 0}</span>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-center">
                                            <span className="text-gray-600 dark:text-gray-400 text-xs block mb-1 font-semibold">Weight</span>
                                            <span className="font-bold text-gray-900 dark:text-white text-2xl">{exercise.sets[0]?.weight || 0} <span className="text-sm">kg</span></span>
                                        </div>
                                    </div>

                                    {exercise.overloadRecommendation?.message && (
                                        <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
                                            💡 {exercise.overloadRecommendation.message}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Analysis Summary */}
                    <div className="p-5 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-gray-300 dark:border-gray-600">
                        <h5 className="font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                            📊 Analysis Summary
                        </h5>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-center">
                                <FiClock className="text-indigo-500 text-2xl mx-auto mb-2" />
                                <span className="text-gray-600 dark:text-gray-400 text-xs block mb-1 font-semibold">Workouts Analyzed</span>
                                <span className="font-bold text-gray-900 dark:text-white text-3xl">{prediction.analysis.totalWorkoutsAnalyzed}</span>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-center">
                                <FiTrendingUp className="text-purple-500 text-2xl mx-auto mb-2" />
                                <span className="text-gray-600 dark:text-gray-400 text-xs block mb-1 font-semibold">Days Covered</span>
                                <span className="font-bold text-gray-900 dark:text-white text-3xl">{prediction.analysis.daysCovered}</span>
                            </div>
                        </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex gap-3">
                        <Button
                            onClick={generatePrediction}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2"
                        >
                            {loading ? '🔄 Regenerating...' : '🔄 Regenerate Prediction'}
                        </Button>
                        <Button
                            onClick={() => {
                                setPrediction(null);
                                setExplanation(null);
                                setError(null);
                            }}
                            variant="secondary"
                        >
                            Clear
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default AIWorkoutCoachEnhanced;
