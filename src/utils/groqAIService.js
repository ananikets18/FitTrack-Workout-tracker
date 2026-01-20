// ============================================
// GROQ AI SERVICE - Enhanced Version
// ============================================
// Fully AI-powered workout predictions and explanations using Groq

const GROQ_API_BASE = 'https://api.groq.com/openai/v1';
const MODELS = {
    FAST: 'llama-3.1-8b-instant',     // Fast, good for quick responses
    BALANCED: 'llama-3.3-70b-versatile', // Balanced speed and quality (recommended)
    ADVANCED: 'llama-3.1-70b-versatile'  // Best quality
};

/**
 * Generate complete AI-powered workout prediction
 * @param {Object} context - Workout history and user data
 * @param {string} apiKey - Groq API key
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Complete prediction with exercises and explanation
 */
export const generateAIWorkoutPrediction = async (context, apiKey, options = {}) => {
    if (!apiKey) {
        return {
            success: false,
            error: 'API key not provided',
            fallback: true
        };
    }

    const {
        model = MODELS.BALANCED,
        temperature = 0.7,
        maxTokens = 1500
    } = options;

    try {
        const prompt = buildWorkoutPredictionPrompt(context);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert fitness coach and exercise scientist with deep knowledge of progressive overload, muscle recovery, and workout programming. You provide personalized, science-based workout recommendations.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature,
                max_tokens: maxTokens,
                top_p: 0.95
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('No response generated');
        }

        // Parse the AI response
        const parsed = parseAIResponse(content);

        return {
            success: true,
            prediction: parsed.workout,
            explanation: parsed.explanation,
            model: data.model || model,
            tokensUsed: data.usage?.total_tokens || 0
        };

    } catch (error) {
        console.error('Groq AI Error:', error);

        let errorMessage = error.message;
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out';
        }

        return {
            success: false,
            error: errorMessage,
            fallback: true
        };
    }
};

/**
 * Generate explanation for existing prediction
 * @param {Object} context - Prediction context
 * @param {string} apiKey - Groq API key
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Explanation
 */
export const generateWorkoutExplanation = async (context, apiKey, options = {}) => {
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

    const { model = MODELS.BALANCED } = options;

    try {
        const prompt = buildExplanationPrompt(context.context);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a motivating fitness coach who provides clear, science-based explanations for workout recommendations.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500,
                top_p: 0.95
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
        }

        const data = await response.json();
        const explanation = data.choices?.[0]?.message?.content;

        if (!explanation) {
            throw new Error('No explanation generated');
        }

        return {
            success: true,
            explanation: explanation.trim(),
            model: data.model || model,
            tokensUsed: data.usage?.total_tokens || 0
        };

    } catch (error) {
        console.error('AI API Error:', error);

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
 * Build comprehensive workout prediction prompt
 */
const buildWorkoutPredictionPrompt = (context) => {
    const { workoutHistory, muscleRecovery, userGoals, preferences } = context;

    const historyText = workoutHistory.slice(0, 7).map((w, i) => {
        const exercises = w.exercises?.slice(0, 4).map(ex =>
            `${ex.name}: ${ex.sets}×${ex.reps} @ ${ex.weight}kg`
        ).join(', ') || 'Rest day';
        return `${i + 1}. ${w.date} - ${w.name}: ${exercises}`;
    }).join('\n');

    const recoveryText = Object.entries(muscleRecovery)
        .filter(([, status]) => status.needsTraining)
        .map(([muscle, status]) => `${muscle} (${status.daysSince} days rest)`)
        .join(', ');

    return `Analyze this workout history and create a complete, optimized workout for tomorrow.

**WORKOUT HISTORY (Last 7 sessions):**
${historyText}

**MUSCLE RECOVERY STATUS:**
Ready to train: ${recoveryText || 'All muscles well-recovered'}

**USER PREFERENCES:**
- Analysis Period: ${preferences?.analyzeDays || 10} days
- Recovery Time: ${preferences?.recoveryDays || 2} days
- Goals: ${userGoals || 'General fitness and strength'}

**YOUR TASK:**
Generate a complete workout plan in the following JSON format:

{
  "workout": {
    "name": "Workout name (e.g., 'Chest & Triceps Power')",
    "targetMuscles": ["muscle1", "muscle2"],
    "exercises": [
      {
        "name": "Exercise name",
        "category": "strength/cardio",
        "sets": [
          {"reps": 10, "weight": 60, "restSeconds": 90}
        ],
        "notes": "Form cues or tips",
        "progressionReason": "Why this weight/rep scheme"
      }
    ]
  },
  "explanation": "A motivating 3-4 paragraph explanation covering: (1) Why this workout today, (2) Progressive overload strategy, (3) Recovery considerations, (4) Motivational closing"
}

**REQUIREMENTS:**
1. Include 6-9 exercises targeting the most recovered muscle groups
2. Apply progressive overload where appropriate (2.5-5kg increases or +1-2 reps)
3. Vary rep ranges based on exercise type (compound: 6-8, isolation: 10-12)
4. Include proper rest periods (compound: 120-180s, isolation: 60-90s)
5. Make the explanation personal, motivating, and science-based
6. Return ONLY valid JSON, no additional text

Generate the workout now:`;
};

/**
 * Build explanation prompt for existing prediction
 */
const buildExplanationPrompt = (context) => {
    const { last10Days, predictionSummary, targetMuscles, muscleRecoveryStatus } = context;

    const workoutHistory = last10Days.slice(0, 5).map((w, i) => {
        const exercises = w.exercises?.slice(0, 3).map(ex =>
            `${ex.name}: ${ex.sets} sets × ${ex.avgReps} reps @ ${ex.avgWeight}kg`
        ).join(', ') || 'No exercises';

        return `${i + 1}. ${w.date} - ${w.name}: ${exercises}`;
    }).join('\n');

    const prediction = predictionSummary.map(ex =>
        `• ${ex.exercise}: ${ex.sets} sets × ${ex.reps} reps @ ${ex.weight}kg (${ex.recommendation})`
    ).join('\n');

    const recoveryInfo = Object.entries(muscleRecoveryStatus)
        .filter(([, status]) => status.needsTraining)
        .map(([muscle, status]) => `${muscle} (${status.daysSince} days rest)`)
        .join(', ');

    return `You are an expert fitness coach. Provide a motivating explanation for this workout prediction.

**RECENT TRAINING (Last 5 sessions):**
${workoutHistory}

**PREDICTED WORKOUT:**
${prediction}

**TARGET MUSCLES:** ${targetMuscles.join(', ')}
**MUSCLES READY:** ${recoveryInfo || 'All muscles recovered'}

**Write a 3-4 paragraph explanation that includes:**
1. **Overview**: What workout and why (based on recovery patterns)
2. **Progressive Overload**: Explain weight/rep increases and rationale
3. **Recovery**: Why this timing is optimal
4. **Motivation**: Encouraging closing message

**Tone**: Friendly, motivating, knowledgeable (like a personal trainer)
**Length**: 150-200 words
**Format**: Plain text, conversational

Begin:`;
};

/**
 * Parse AI response (handles both JSON and text responses)
 */
const parseAIResponse = (content) => {
    try {
        // Try to extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                workout: parsed.workout,
                explanation: parsed.explanation
            };
        }
    } catch (e) {
        console.warn('Failed to parse JSON response, using text format');
    }

    // Fallback: treat entire response as explanation
    return {
        workout: null,
        explanation: content
    };
};

/**
 * Generate fallback explanation when API fails
 */
const generateFallbackExplanation = (context) => {
    if (context.status === 'error') {
        return `Unable to generate workout prediction: ${context.message}. Try logging more workouts to get personalized recommendations!`;
    }

    const { predictionSummary, targetMuscles, muscleRecoveryStatus } = context.context;

    const musclesReady = Object.entries(muscleRecoveryStatus)
        .filter(([, status]) => status.needsTraining)
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
 */
export const validateApiKey = (apiKey) => {
    if (!apiKey || typeof apiKey !== 'string') return false;
    return apiKey.startsWith('gsk_') && apiKey.length >= 40;
};

/**
 * Test API key
 */
export const testApiKey = async (apiKey) => {
    try {
        const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODELS.FAST,
                messages: [
                    {
                        role: 'user',
                        content: 'Say "Hello" if you can read this.'
                    }
                ],
                max_tokens: 10
            })
        });

        if (response.ok) {
            return { valid: true, message: 'API key is valid! ✅' };
        } else {
            const error = await response.json().catch(() => ({}));
            return {
                valid: false,
                message: error.error?.message || 'Invalid API key ❌'
            };
        }
    } catch (error) {
        return {
            valid: false,
            message: `Connection error: ${error.message}`
        };
    }
};

export { MODELS };
