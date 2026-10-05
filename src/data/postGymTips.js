// ============================================
// POST-GYM GAMEPLAN TIPS (DIET, HYGIENE, RECOVERY, MOTIVATION)
// ============================================

export const POST_GYM_TIPS = {
  diet: [
    {
      id: 'diet-protein-window',
      title: 'Hit Your 30–40g Protein Refuel',
      body: 'Aim for 30–40g of fast-digesting protein (whey shake, eggs, chicken, or Greek yogurt) within 45–60 mins to kickstart muscle protein synthesis.',
      tags: ['any'],
    },
    {
      id: 'diet-morning-fuel',
      title: 'Morning Post-Lift Carbs + Protein',
      body: 'After an early session, pair your protein with complex carbs (oats, banana, toast, or poha/idli) to replenish muscle glycogen for the rest of your workday.',
      tags: ['morning'],
    },
    {
      id: 'diet-evening-digestion',
      title: 'Smart Evening Dinner — Keep Fats Moderate',
      body: 'After an evening workout, prioritize lean protein and easily digestible carbs (rice, sweet potato, dal) so heavy fats do not slow digestion before sleep.',
      tags: ['evening'],
    },
    {
      id: 'diet-electrolytes',
      title: 'Replenish Sodium & Potassium',
      body: 'A full ~1h 45m gym session depletes electrolytes through sweat. Add a pinch of pink salt + lemon to your water or grab coconut water on the way home.',
      tags: ['long', 'any'],
    },
    {
      id: 'diet-hydration-catchup',
      title: 'Drink 500ml Water Before Leaving the Gym',
      body: 'Even 2% dehydration drops recovery speed and strength. Finish 500ml of water right now before you step out of the gym doors.',
      tags: ['low_water', 'any'],
    },
    {
      id: 'diet-creatine-reminder',
      title: 'Post-Workout Creatine Check',
      body: 'If you take daily creatine (3–5g), mixing it with your post-workout meal or shake improves uptake alongside insulin from your carbs and protein.',
      tags: ['any'],
    },
  ],

  hygiene: [
    {
      id: 'hygiene-shower-window',
      title: 'Shower Within 30 Mins of Leaving',
      body: 'Sweat + gym bench bacteria can clog pores and cause body acne. Rinse off with a gentle cleanser as soon as you get home.',
      tags: ['any'],
    },
    {
      id: 'hygiene-air-out-bag',
      title: 'Unzip & Air Out Your Gym Bag Immediately',
      body: 'Never leave damp wrist wraps, knee sleeves, or lifting straps zipped inside your bag — hang them out to dry as soon as you reach home.',
      tags: ['any'],
    },
    {
      id: 'hygiene-phone-sanitize',
      title: 'Wipe Down Your Phone & Earbuds',
      body: 'Your phone touches gym floors, benches, andchalky hands between sets. Give your screen and earbuds a quick alcohol wipe when you get home.',
      tags: ['any'],
    },
    {
      id: 'hygiene-shaker-rinse',
      title: 'Rinse Your Shaker Bottle Right Away',
      body: 'If you drank a protein shake or pre-workout, rinse the shaker with warm water immediately so leftover residue never builds odor.',
      tags: ['any'],
    },
    {
      id: 'hygiene-hands-face',
      title: 'Wash Hands Before Touching Your Face',
      body: 'Dumbbells and cable handles carry thousands of germs. Wash your hands thoroughly with soap before leaving the gym locker room.',
      tags: ['any'],
    },
  ],

  recovery: [
    {
      id: 'recovery-decompression',
      title: '2-Minute Nasal Breathing Downshift',
      body: 'Switch from "fight-or-flight" gym mode to recovery mode: take 5 slow 4-second nasal inhales and 6-second exhales on your walk out.',
      tags: ['any'],
    },
    {
      id: 'recovery-evening-sleep',
      title: 'Protect Tonight’s 7.5–8h Growth Window',
      body: 'Muscle isn’t built during the 1h 45m in the gym — it repairs during deep sleep tonight. Dim screens 45 mins before bed for peak HGH release.',
      tags: ['evening', 'any'],
    },
    {
      id: 'recovery-hip-chest-stretch',
      title: 'Loosen Tight Pecs & Hip Flexors',
      body: 'Before sitting in a car or at a desk after lifting, spend 60 seconds opening your chest and hip flexors so your posture stays tall and pain-free.',
      tags: ['any'],
    },
    {
      id: 'recovery-post-walk',
      title: '5-Minute Easy Cool-Down Walk',
      body: 'Walking home or taking a slow 5-minute stroll flushes lactate from working muscles and prevents stiffness tomorrow morning.',
      tags: ['long', 'any'],
    },
    {
      id: 'recovery-warm-contrast',
      title: 'Warm Shower for Muscle Relaxation',
      body: 'Let warm water hit the muscle groups you trained today for 2–3 minutes to boost local blood flow and ease central nervous system tension.',
      tags: ['any'],
    },
  ],

  motivation: [
    {
      id: 'motivation-strict-105',
      title: '1 hr 45 min Discipline = Elite Focus',
      body: 'Respecting a strict time boundary forces higher intensity, less phone scrolling, and sharper focus on every single set. You earned today’s checkmark!',
      tags: ['strict_goal', 'any'],
    },
    {
      id: 'motivation-log-accuracy',
      title: 'What Gets Measured Gets Mastered',
      body: 'Log your exercises accurately right now while the weights and reps are fresh in your mind — next week’s progressive overload depends on today’s data.',
      tags: ['any'],
    },
    {
      id: 'motivation-consistency',
      title: 'Another Brick Laid in Your Physique',
      body: 'No single workout transforms you, but stacking disciplined 1h 45m sessions week after week makes your progress unstoppable.',
      tags: ['any'],
    },
    {
      id: 'motivation-mental-win',
      title: 'Carry This Momentum Into Your Day',
      body: 'The hardest part of your day is already conquered. Take that same disciplined energy from the gym floor into your work and goals today.',
      tags: ['morning', 'any'],
    },
    {
      id: 'motivation-rest-earned',
      title: 'Leave the Effort in the Gym, Take Pride Home',
      body: 'You showed up, respected the clock, and put in the work. Now switch off the stress, refuel well, and let your body grow stronger.',
      tags: ['evening', 'any'],
    },
  ],
};

/**
 * Selects 1 smart tip from each of the 4 categories tailored to time of day,
 * session duration, and water intake, rotating cleanly when `seed` increments.
 */
export const getSmartPostGymGameplan = ({
  hour = new Date().getHours(),
  durationMinutes = 105,
  waterAmountMl = 0,
  seed = 0,
} = {}) => {
  const timeTag = hour < 12 ? 'morning' : hour >= 17 ? 'evening' : 'afternoon';
  const isStrictGoalMet = durationMinutes <= 105;
  const isLongSession = durationMinutes >= 90;
  const isLowWater = waterAmountMl < 2000;

  const pickFromPool = (pool, categoryOffset) => {
    // Score tips so context-matching tips appear first, then rotate via seed
    const scored = pool.map((tip, idx) => {
      let score = 0;
      if (tip.tags.includes(timeTag)) score += 3;
      if (isStrictGoalMet && tip.tags.includes('strict_goal')) score += 3;
      if (isLongSession && tip.tags.includes('long')) score += 2;
      if (isLowWater && tip.tags.includes('low_water')) score += 4;
      return { tip, score, idx };
    });

    scored.sort((a, b) => b.score - a.score || a.idx - b.idx);
    const chosenIndex = (seed + categoryOffset) % scored.length;
    return scored[chosenIndex].tip;
  };

  return [
    {
      category: 'diet',
      label: 'Diet & Hydration',
      emoji: '🥗',
      accent: 'emerald',
      ...pickFromPool(POST_GYM_TIPS.diet, 0),
    },
    {
      category: 'hygiene',
      label: 'Hygiene & Gear Care',
      emoji: '🧼',
      accent: 'sky',
      ...pickFromPool(POST_GYM_TIPS.hygiene, 1),
    },
    {
      category: 'recovery',
      label: 'Muscle Recovery',
      emoji: '🧘',
      accent: 'purple',
      ...pickFromPool(POST_GYM_TIPS.recovery, 2),
    },
    {
      category: 'motivation',
      label: 'Mindset & Discipline',
      emoji: '🔥',
      accent: 'amber',
      ...pickFromPool(POST_GYM_TIPS.motivation, 3),
    },
  ];
};

export default POST_GYM_TIPS;
