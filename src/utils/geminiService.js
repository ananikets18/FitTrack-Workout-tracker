// ============================================
// GOOGLE GEMINI AI SERVICE
// ============================================
// Generates natural language explanations for workout predictions

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/**
 * Generate workout explanation using Google Gemini
 * @param {Object} context - Structured context from prepareLLMContext
 * @param {string} apiKey - Google Gemini API key
 * @returns {Promise<Object>} Generated explanation
 */
export const generateWorkoutExplanation = async (context, apiKey) => {
    if (!apiKey) {
        return {
            success: false,
            error: 'API key not provided',
            fallbackExplanation: generateFallbackExplanation(context)
        };
    }

    if (context.status === 'error') {
        return {
            success: false,
            error: context.message,
            fallbackExplanation: `Unable to generate prediction: ${context.message}`
        };
    }

    try {
        const prompt = buildPrompt(context.context);

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 500,
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
        }

        const data = await response.json();
        const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!explanation) {
            throw new Error('No explanation generated');
        }

        return {
            success: true,
            explanation: explanation.trim(),
            model: 'gemini-pro',
            tokensUsed: data.usageMetadata?.totalTokenCount || 0
        };

    } catch (error) {
        console.error('Gemini API Error:', error);

        // Provide user-friendly error messages
        let errorMessage = error.message;
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out - using fallback explanation';
        }

        return {
            success: false,
            error: errorMessage,
            fallbackExplanation: generateFallbackExplanation(context)
        };
    }
};

/**
 * Build prompt for Gemini
 * @param {Object} context - Workout context
 * @returns {string} Formatted prompt
 */
const buildPrompt = (context) => {
    const { last10Days, predictionSummary, targetMuscles, muscleRecoveryStatus } = context;

    // Format last 10 days summary
    const workoutHistory = last10Days.slice(0, 5).map((w, i) => {
        const exercises = w.exercises?.slice(0, 3).map(ex =>
            `${ex.name}: ${ex.sets} sets × ${ex.avgReps} reps @ ${ex.avgWeight}kg`
        ).join(', ') || 'No exercises';

        return `${i + 1}. ${w.date} - ${w.name}: ${exercises}`;
    }).join('\n');

    // Format prediction
    const prediction = predictionSummary.map(ex =>
        `• ${ex.exercise}: ${ex.sets} sets × ${ex.reps} reps @ ${ex.weight}kg (${ex.recommendation})`
    ).join('\n');

    // Format muscle recovery
    const recoveryInfo = Object.entries(muscleRecoveryStatus)
        .filter(([_, status]) => status.needsTraining)
        .map(([muscle, status]) => `${muscle} (${status.daysSince} days rest)`)
        .join(', ');

    return `You are an expert fitness coach analyzing workout data. Based on the user's last 10 days of training, provide a motivating and insightful explanation for tomorrow's workout prediction.

**Recent Workout History (Last 5 sessions):**
${workoutHistory}

**Predicted Workout for Tomorrow:**
${prediction}

**Target Muscles:** ${targetMuscles.join(', ')}
**Muscles Ready to Train:** ${recoveryInfo || 'All muscles recovered'}

**Your Task:**
Write a friendly, motivating 3-4 paragraph explanation that includes:

1. **Overview**: What workout is recommended and why (based on recovery and patterns)
2. **Progressive Overload**: Explain any weight/rep increases and why they're appropriate
3. **Recovery Status**: Comment on muscle recovery and why this timing makes sense
4. **Motivation**: End with an encouraging message

**Tone**: Friendly, motivating, and knowledgeable (like a personal trainer)
**Length**: 150-200 words
**Format**: Plain text, no markdown or special formatting

Begin your explanation now:`;
};

/**
 * Generate fallback explanation when API fails
 * @param {Object} context - Workout context
 * @returns {string} Simple rule-based explanation
 */
const generateFallbackExplanation = (context) => {
    if (context.status === 'error') {
        return `Unable to generate workout prediction: ${context.message}. Try logging more workouts to get personalized recommendations!`;
    }

    const { predictionSummary, targetMuscles, muscleRecoveryStatus } = context.context;

    const musclesReady = Object.entries(muscleRecoveryStatus)
        .filter(([_, status]) => status.needsTraining)
        .map(([muscle]) => muscle);

    const totalExercises = predictionSummary.length;
    const avgConfidence = Math.round(
        predictionSummary.reduce((sum, ex) => sum + ex.confidence, 0) / totalExercises
    );

    let explanation = `Based on your recent training, I recommend a ${targetMuscles.join(' and ')} workout. `;

    if (musclesReady.length > 0) {
        explanation += `Your ${musclesReady.join(', ')} ${musclesReady.length === 1 ? 'is' : 'are'} well-recovered and ready for training. `;
    }

    explanation += `The workout includes ${totalExercises} exercises with progressive overload applied where appropriate. `;

    if (avgConfidence >= 80) {
        explanation += `I'm ${avgConfidence}% confident this workout will help you progress. Let's crush it! 💪`;
    } else {
        explanation += `Keep up the consistency and your progress will accelerate!`;
    }

    return explanation;
};

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} True if valid format
 */
export const validateApiKey = (apiKey) => {
    if (!apiKey || typeof apiKey !== 'string') return false;

    // Gemini API keys typically start with "AIza" and are 39 characters
    return apiKey.startsWith('AIza') && apiKey.length === 39;
};

/**
 * Test API key by making a simple request
 * @param {string} apiKey - API key to test
 * @returns {Promise<Object>} Test result
 */
export const testApiKey = async (apiKey) => {
    try {
        const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Say "Hello" if you can read this.'
                    }]
                }]
            })
        });

        if (response.ok) {
            return { valid: true, message: 'API key is valid!' };
        } else {
            const error = await response.json().catch(() => ({}));
            return {
                valid: false,
                message: error.error?.message || 'Invalid API key'
            };
        }
    } catch (error) {
        return {
            valid: false,
            message: `Connection error: ${error.message}`
        };
    }
};
