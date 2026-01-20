import { useState, useEffect } from 'react';
import { useWorkouts } from '../context/WorkoutContext';
import { predictNextWorkout, prepareLLMContext } from '../utils/workoutPredictionEngine';
import { generateWorkoutExplanation } from '../utils/geminiService'; // Now using Groq API
import Card from './common/Card';
import Button from './common/Button';

const AIWorkoutCoach = () => {
    const { workouts } = useWorkouts();
    const [prediction, setPrediction] = useState(null);
    const [explanation, setExplanation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const apiKey = import.meta.env.VITE_GROQ_API_KEY || '';

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

            // Step 3: Generate explanation with Groq AI
            const explanationResult = await generateWorkoutExplanation(context, apiKey);

            if (explanationResult.success) {
                setExplanation(explanationResult.explanation);
            } else {
                // Use fallback explanation
                setExplanation(explanationResult.fallbackExplanation);

                if (!apiKey) {
                    setError('⚙️ Configure VITE_GROQ_API_KEY in your environment to enable AI explanations');
                }
            }

        } catch (err) {
            console.error('Prediction error:', err);
            setError('Failed to generate prediction. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="ai-workout-coach bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    🤖 AI Workout Coach
                </h3>
            </div>

            {/* Generate Button */}
            {!prediction && (
                <div className="text-center py-10">
                    <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg font-medium">
                        Get AI-powered workout predictions based on your last 10 days of training
                    </p>
                    <Button
                        onClick={generatePrediction}
                        disabled={loading || workouts.length < 2}
                        className="text-lg px-8 py-3"
                    >
                        {loading ? '🔮 Analyzing...' : '🎯 Predict My Next Workout'}
                    </Button>
                    {workouts.length < 2 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 font-medium">
                            Need at least 2 workouts to generate predictions
                        </p>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-5 p-4 bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-400 dark:border-yellow-600 rounded-xl">
                    <p className="text-yellow-900 dark:text-yellow-100 font-semibold">{error}</p>
                </div>
            )}

            {/* Prediction Results */}
            {prediction && (
                <div className="space-y-4">
                    {/* AI Explanation */}
                    {explanation && (
                        <div className="p-5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                            <div className="flex items-start gap-3">
                                <span className="text-3xl">💬</span>
                                <div className="flex-1">
                                    <h4 className="font-bold mb-3 text-white text-lg flex items-center gap-2">
                                        AI Coach Says:
                                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Powered by Groq</span>
                                    </h4>
                                    <p className="text-white/95 whitespace-pre-line leading-relaxed text-base">
                                        {explanation}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Predicted Workout */}
                    <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-lg text-gray-900 dark:text-white">📋 Predicted Workout</h4>
                            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                                {prediction.prediction.targetMuscles.join(', ')}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {prediction.prediction.exercises.map((exercise, index) => (
                                <div
                                    key={index}
                                    className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h5 className="font-bold text-gray-900 dark:text-white">{exercise.name}</h5>
                                        {exercise.overloadRecommendation && (
                                            <span
                                                className={`text-xs font-semibold px-3 py-1 rounded-full ${exercise.overloadRecommendation.action === 'increase_weight'
                                                    ? 'bg-green-500 text-white'
                                                    : exercise.overloadRecommendation.action === 'increase_reps'
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-gray-500 text-white'
                                                    }`}
                                            >
                                                {exercise.overloadRecommendation.action.replace('_', ' ').toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 text-sm">
                                        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <span className="text-gray-600 dark:text-gray-400 text-xs block mb-1">Sets</span>
                                            <span className="font-bold text-gray-900 dark:text-white text-lg">{exercise.sets.length}</span>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <span className="text-gray-600 dark:text-gray-400 text-xs block mb-1">Reps</span>
                                            <span className="font-bold text-gray-900 dark:text-white text-lg">{exercise.sets[0]?.reps || 0}</span>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <span className="text-gray-600 dark:text-gray-400 text-xs block mb-1">Weight</span>
                                            <span className="font-bold text-gray-900 dark:text-white text-lg">{exercise.sets[0]?.weight || 0} kg</span>
                                        </div>
                                    </div>

                                    {exercise.overloadRecommendation?.message && (
                                        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border-l-4 border-blue-500">
                                            💡 {exercise.overloadRecommendation.message}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Analysis Summary */}
                    <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-gray-300 dark:border-gray-600">
                        <h5 className="font-bold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                            📊 Analysis Summary
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400 text-xs block mb-1">Workouts Analyzed</span>
                                <span className="font-bold text-gray-900 dark:text-white text-2xl">{prediction.analysis.totalWorkoutsAnalyzed}</span>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400 text-xs block mb-1">Days Covered</span>
                                <span className="font-bold text-gray-900 dark:text-white text-2xl">{prediction.analysis.daysCovered}</span>
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
