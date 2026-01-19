import { useState, useEffect } from 'react';
import { useWorkouts } from '../context/WorkoutContext';
import { predictNextWorkout, prepareLLMContext } from '../utils/workoutPredictionEngine';
import { generateWorkoutExplanation } from '../utils/geminiService';
import Card from './common/Card';
import Button from './common/Button';

const AIWorkoutCoach = () => {
    const { workouts } = useWorkouts();
    const [prediction, setPrediction] = useState(null);
    const [explanation, setExplanation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showApiKeyInput, setShowApiKeyInput] = useState(false);
    const [apiKey, setApiKey] = useState('');

    // Load API key from localStorage
    useEffect(() => {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            setApiKey(savedKey);
        }
    }, []);

    // Generate prediction
    const generatePrediction = async () => {
        setLoading(true);
        setError(null);

        try {
            // Step 1: Predict next workout using rule-based AI
            const predictionResult = predictNextWorkout(workouts, 10);

            if (!predictionResult.success) {
                setError(predictionResult.reason);
                setLoading(false);
                return;
            }

            setPrediction(predictionResult);

            // Step 2: Prepare context for LLM
            const context = prepareLLMContext(predictionResult, workouts);

            // Step 3: Generate explanation with Gemini
            const explanationResult = await generateWorkoutExplanation(context, apiKey);

            if (explanationResult.success) {
                setExplanation(explanationResult.explanation);
            } else {
                // Use fallback explanation
                setExplanation(explanationResult.fallbackExplanation);

                if (!apiKey) {
                    setError('💡 Tip: Add your Google Gemini API key for AI-powered explanations!');
                }
            }

        } catch (err) {
            console.error('Prediction error:', err);
            setError('Failed to generate prediction. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Save API key
    const saveApiKey = () => {
        localStorage.setItem('gemini_api_key', apiKey);
        setShowApiKeyInput(false);
        generatePrediction();
    };

    // Remove API key
    const removeApiKey = () => {
        localStorage.removeItem('gemini_api_key');
        setApiKey('');
        setShowApiKeyInput(false);
    };

    return (
        <Card className="ai-workout-coach">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    🤖 AI Workout Coach
                </h3>
                <button
                    onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                    className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Configure API Key"
                >
                    ⚙️
                </button>
            </div>

            {/* API Key Configuration */}
            {showApiKeyInput && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold mb-2">Google Gemini API Key</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Get your free API key from{' '}
                        <a
                            href="https://ai.google.dev"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                        >
                            ai.google.dev
                        </a>
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="AIza..."
                            className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        />
                        <Button onClick={saveApiKey} disabled={!apiKey}>
                            Save
                        </Button>
                        {apiKey && (
                            <Button onClick={removeApiKey} variant="secondary">
                                Remove
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Generate Button */}
            {!prediction && (
                <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Get AI-powered workout predictions based on your last 10 days of training
                    </p>
                    <Button
                        onClick={generatePrediction}
                        disabled={loading || workouts.length < 2}
                    >
                        {loading ? '🔮 Analyzing...' : '🎯 Predict My Next Workout'}
                    </Button>
                    {workouts.length < 2 && (
                        <p className="text-sm text-gray-500 mt-2">
                            Need at least 2 workouts to generate predictions
                        </p>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-yellow-800 dark:text-yellow-200">{error}</p>
                </div>
            )}

            {/* Prediction Results */}
            {prediction && (
                <div className="space-y-4">
                    {/* AI Explanation */}
                    {explanation && (
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">💬</span>
                                <div className="flex-1">
                                    <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                                        AI Coach Says:
                                    </h4>
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                                        {explanation}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Predicted Workout */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-lg">📋 Predicted Workout</h4>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Target: {prediction.prediction.targetMuscles.join(', ')}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {prediction.prediction.exercises.map((exercise, index) => (
                                <div
                                    key={index}
                                    className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h5 className="font-semibold">{exercise.name}</h5>
                                        {exercise.overloadRecommendation && (
                                            <span
                                                className={`text-xs px-2 py-1 rounded-full ${exercise.overloadRecommendation.action === 'increase_weight'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                        : exercise.overloadRecommendation.action === 'increase_reps'
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}
                                            >
                                                {exercise.overloadRecommendation.action.replace('_', ' ')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Sets:</span>
                                            <span className="ml-1 font-semibold">{exercise.sets.length}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Reps:</span>
                                            <span className="ml-1 font-semibold">{exercise.sets[0]?.reps || 0}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Weight:</span>
                                            <span className="ml-1 font-semibold">{exercise.sets[0]?.weight || 0} kg</span>
                                        </div>
                                    </div>

                                    {exercise.overloadRecommendation?.message && (
                                        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                            💡 {exercise.overloadRecommendation.message}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Analysis Summary */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h5 className="font-semibold mb-2 text-sm">📊 Analysis Summary</h5>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">Workouts Analyzed:</span>
                                <span className="ml-1 font-semibold">{prediction.analysis.totalWorkoutsAnalyzed}</span>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">Days Covered:</span>
                                <span className="ml-1 font-semibold">{prediction.analysis.daysCovered}</span>
                            </div>
                        </div>
                    </div>

                    {/* Regenerate Button */}
                    <div className="flex gap-2">
                        <Button onClick={generatePrediction} disabled={loading} className="flex-1">
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

export default AIWorkoutCoach;
