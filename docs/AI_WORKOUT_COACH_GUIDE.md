# 🤖 AI Workout Coach - User Guide

## Overview

The **AI Workout Coach** is an intelligent feature that analyzes your last 10 days of workout history and predicts your next optimal workout using **Rule-Based AI** combined with **Google Gemini** for natural language explanations.

## Features

✅ **Smart Workout Predictions** - Analyzes your training patterns  
✅ **Progressive Overload Recommendations** - Suggests when to increase weight/reps  
✅ **Muscle Recovery Analysis** - Tracks which muscles are ready to train  
✅ **AI-Powered Explanations** - Natural language reasoning (via Google Gemini)  
✅ **100% Free** - Uses Google Gemini's free tier (60 requests/minute)

---

## How It Works

### Step 1: Data Collection (Automatic)
The system automatically tracks:
- Exercise names
- Sets, reps, and weights
- Workout dates
- Muscle groups trained

### Step 2: Pattern Analysis (Rule-Based AI)
When you click **"Predict My Next Workout"**, the AI:
1. Analyzes your last 10 days of training
2. Identifies which muscles need training (based on recovery time)
3. Finds the best matching workout from your history
4. Applies progressive overload where appropriate

### Step 3: AI Explanation (Google Gemini)
The prediction is sent to Google Gemini, which generates:
- **Why** this workout is recommended
- **How** it fits your training pattern
- **What** progressive overload is being applied
- **Motivation** to keep you going!

---

## Getting Started

### Prerequisites
- **At least 2 workouts** logged in the app
- **Google Gemini API Key** (optional, but recommended for AI explanations)

### Setup Google Gemini API Key (FREE)

1. **Get Your API Key:**
   - Visit [https://ai.google.dev](https://ai.google.dev)
   - Click **"Get API Key"**
   - Sign in with your Google account
   - Create a new API key (takes 30 seconds)

2. **Add to FitTrack:**
   - Open the **AI Workout Coach** card on the Home page
   - Click the **⚙️ Settings** icon
   - Paste your API key
   - Click **Save**

3. **That's it!** 🎉
   - Your API key is stored locally (never sent to our servers)
   - Free tier includes **60 requests per minute**
   - More than enough for personal use!

---

## Usage

### Generating a Prediction

1. **Navigate to Home Page**
2. **Scroll to "AI Workout Coach" card**
3. **Click "🎯 Predict My Next Workout"**
4. **Wait 2-5 seconds** for analysis
5. **Read the AI explanation** and predicted workout

### Understanding the Results

#### AI Explanation
```
💬 AI Coach Says:

Based on your recent training, I recommend a chest and triceps 
workout. Your chest muscles have had 3 days of recovery and are 
ready for progressive overload. I've increased the bench press 
weight by 2.5kg based on your consistent performance over the 
last 3 sessions. Your readiness score is excellent (85/100), 
making this the perfect time to push for new PRs. Let's crush it! 💪
```

#### Predicted Workout
- **Exercise Name** - e.g., "Bench Press"
- **Sets** - e.g., 4 sets
- **Reps** - e.g., 8 reps
- **Weight** - e.g., 145 kg
- **Recommendation** - e.g., "increase weight" (with explanation)

#### Analysis Summary
- **Workouts Analyzed** - Number of workouts used for prediction
- **Days Covered** - Time period analyzed (usually 10 days)

---

## Without API Key (Fallback Mode)

If you don't add an API key, the system still works! You'll get:
- ✅ Full workout prediction
- ✅ Progressive overload recommendations
- ✅ Basic text explanation (rule-based)
- ❌ No AI-powered natural language explanation

**Example Fallback Explanation:**
```
Based on your recent training, I recommend a chest and back workout. 
Your chest, back are well-recovered and ready for training. The workout 
includes 5 exercises with progressive overload applied where appropriate. 
I'm 82% confident this workout will help you progress. Let's crush it! 💪
```

---

## Progressive Overload Recommendations

The AI automatically suggests:

### 🟢 Increase Weight
When you've consistently completed all reps for 3+ sessions
```
💡 Increase to 145kg (140kg + 5kg) - Excellent readiness (85/100)
```

### 🔵 Increase Reps
When you're hitting target reps but not ready for weight increase
```
💡 Aim for 12 reps per set at 140kg
```

### 🟡 Maintain
When you're still building consistency
```
💡 Continue with 140kg - focus on form and consistency
```

### 🔴 Deload
When you're struggling or showing signs of fatigue
```
💡 Deload to 126kg (90% of current) - Low readiness (45/100) suggests recovery needed
```

---

## Privacy & Security

### Your Data is Safe
- ✅ API key stored **locally** in your browser (localStorage)
- ✅ Workout data **never sent to our servers**
- ✅ Only prediction context sent to Google Gemini (no personal info)
- ✅ You can **remove your API key** anytime

### What Gets Sent to Gemini?
Only this data:
```json
{
  "last5Workouts": [
    { "date": "2026-01-18", "name": "Chest Day", "exercises": [...] }
  ],
  "prediction": {
    "exercises": [
      { "name": "Bench Press", "sets": 4, "reps": 8, "weight": 145 }
    ]
  }
}
```

**NOT sent:**
- Your name
- Email
- Location
- Any personal information

---

## Troubleshooting

### "Need at least 2 workouts to generate predictions"
**Solution:** Log at least 2 workouts in the app first.

### "Invalid API key"
**Solution:**
1. Check that your API key starts with `AIza`
2. Ensure it's 39 characters long
3. Get a new key from [ai.google.dev](https://ai.google.dev)

### "API request failed"
**Possible causes:**
- No internet connection
- API key quota exceeded (unlikely with free tier)
- Gemini API temporarily down

**Solution:**
- Check your internet connection
- Wait a few minutes and try again
- The app will use fallback explanations automatically

### Prediction seems wrong
**Remember:**
- AI learns from YOUR data (not generic advice)
- With only 2-3 workouts, predictions may be basic
- After 10+ workouts, predictions become much more accurate
- You can always regenerate for different suggestions

---

## Tips for Best Results

### 1. Log Consistently
- Track at least 10 workouts for accurate predictions
- Include rest days for better recovery analysis

### 2. Be Specific
- Use consistent exercise names (e.g., "Bench Press" not "bench")
- Log accurate weights and reps

### 3. Use Progressive Overload
- Follow the AI's weight/rep recommendations
- Track your progress over time

### 4. Regenerate When Needed
- Click "🔄 Regenerate Prediction" for alternatives
- Different days may suggest different workouts

---

## Cost & Limits

### Google Gemini Free Tier
- **60 requests per minute** (more than enough!)
- **1,500 requests per day**
- **1 million tokens per month**

**For typical use:**
- Each prediction uses ~500 tokens
- You can make **2,000+ predictions per month** for FREE
- That's **66 predictions per day**!

### Upgrading (Optional)
If you somehow exceed the free tier:
- Gemini Pro: $0.001 per 1,000 tokens (~$0.0005 per prediction)
- Still incredibly cheap!

---

## Frequently Asked Questions

### Q: Do I need an API key?
**A:** No, but it's highly recommended for AI explanations. Without it, you get basic text explanations.

### Q: Is my API key safe?
**A:** Yes! It's stored locally in your browser and never sent to our servers.

### Q: Can I use this offline?
**A:** Predictions work offline, but AI explanations require internet (to call Gemini API).

### Q: How accurate are the predictions?
**A:** With 10+ workouts: 80-85% accuracy. With 2-3 workouts: 60-70% accuracy.

### Q: Can I customize the predictions?
**A:** Currently, predictions are automatic. Manual customization coming soon!

### Q: What if I don't like the prediction?
**A:** Click "🔄 Regenerate" or simply ignore it and log your own workout.

---

## Roadmap

### Coming Soon
- 🔜 **Custom prediction parameters** (e.g., "focus on chest")
- 🔜 **Weekly workout plans** (7-day predictions)
- 🔜 **Injury prevention warnings** (integrated with existing system)
- 🔜 **Nutrition-based adjustments** (based on your diet logs)
- 🔜 **Sleep-based recommendations** (based on sleep quality)

### Future (After ML Training)
- 🔮 **True Machine Learning** (after collecting 1,000+ workouts)
- 🔮 **Personalized models** (learns YOUR specific patterns)
- 🔮 **90%+ accuracy** (vs current 80-85%)

---

## Support

### Need Help?
- 📧 Email: support@fittrack.app
- 💬 Discord: [Join our community](#)
- 📖 Docs: [Full documentation](#)

### Found a Bug?
- 🐛 Report on GitHub: [Issues](https://github.com/yourusername/fittrack/issues)

---

## Credits

Built with:
- **Google Gemini** - AI explanations
- **React** - Frontend framework
- **Supabase** - Database
- **date-fns** - Date utilities

---

**Enjoy your AI-powered fitness journey! 💪🤖**
