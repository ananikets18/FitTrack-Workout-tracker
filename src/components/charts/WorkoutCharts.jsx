import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { calculateTotalVolume, calculateTotalActivity } from '../../utils/calculations';

// Custom tooltip styling
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lifted border border-gray-200 ">
        <p className="text-sm font-semibold text-gray-900 ">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-gray-600 ">
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Volume Over Time Chart (Last 30 Days) - Enhanced with Activity Points
export const VolumeChart = ({ workouts }) => {
  // Filter out rest days
  const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');

  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  // Detect if we have cardio/bodyweight exercises
  const hasCardioOrBodyweight = regularWorkouts.some(w =>
    w.exercises?.some(ex => {
      const maxWeight = Math.max(...ex.sets.map(s => s.weight || 0));
      return ex.category === 'cardio' || maxWeight === 0;
    })
  );

  // Use Activity Points if cardio/bodyweight present, otherwise use Volume
  const useActivityPoints = hasCardioOrBodyweight;

  const data = last30Days.map((day) => {
    const dayWorkouts = regularWorkouts.filter((w) => {
      const workoutDate = new Date(w.date);
      return format(workoutDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    });

    const totalVolume = dayWorkouts.reduce((sum, w) => sum + calculateTotalVolume(w), 0);
    const totalActivity = dayWorkouts.reduce((sum, w) => sum + calculateTotalActivity(w), 0);

    return {
      date: format(day, 'MMM d'),
      volume: Math.round(totalVolume),
      activity: Math.round(totalActivity),
    };
  });

  const metricKey = useActivityPoints ? 'activity' : 'volume';
  const metricLabel = useActivityPoints ? 'Activity Points' : 'Volume (kg)';
  const metricColor = useActivityPoints ? '#06b6d4' : '#0284c7'; // cyan for activity, blue for volume

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          label={{ value: metricLabel, angle: -90, position: 'insideLeft', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey={metricKey}
          stroke={metricColor}
          strokeWidth={2}
          dot={{ fill: metricColor, r: 4 }}
          activeDot={{ r: 6 }}
          name={metricLabel}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Training Intelligence Dashboard (Tabbed Interface)
export const TrainingIntelligenceChart = ({ workouts }) => {
  const [activeTab, setActiveTab] = React.useState('muscles');

  // Filter out rest days and get last 7 days data
  const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const last7DaysWorkouts = regularWorkouts.filter(w => {
    const workoutDate = new Date(w.date);
    return last7Days.some(day => format(workoutDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
  });

  // 1. MUSCLE GROUP DISTRIBUTION
  const muscleGroups = {
    Chest: ['bench press', 'chest press', 'push up', 'dumbbell press', 'incline press', 'decline press', 'chest fly', 'cable fly'],
    Back: ['pull up', 'lat pulldown', 'row', 'deadlift', 'back extension', 't-bar row', 'cable row'],
    Legs: ['squat', 'leg press', 'lunge', 'leg curl', 'leg extension', 'calf raise', 'hack squat'],
    Shoulders: ['shoulder press', 'lateral raise', 'front raise', 'rear delt', 'overhead press', 'arnold press', 'shrug'],
    Arms: ['curl', 'tricep', 'bicep', 'hammer curl', 'preacher curl', 'skull crusher', 'dip'],
    Core: ['crunch', 'plank', 'ab', 'sit up', 'russian twist', 'leg raise', 'mountain climber']
  };

  const muscleGroupData = {};
  last7DaysWorkouts.forEach(workout => {
    workout.exercises?.forEach(exercise => {
      const exerciseName = exercise.name.toLowerCase();
      let assigned = false;

      for (const [group, keywords] of Object.entries(muscleGroups)) {
        if (keywords.some(keyword => exerciseName.includes(keyword))) {
          muscleGroupData[group] = (muscleGroupData[group] || 0) + exercise.sets.length;
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        muscleGroupData['Other'] = (muscleGroupData['Other'] || 0) + exercise.sets.length;
      }
    });
  });

  const muscleChartData = Object.entries(muscleGroupData).map(([name, value]) => ({ name, value }));
  const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

  // 2. PROGRESSIVE OVERLOAD TRACKER
  const getProgressiveOverloadData = () => {
    const exerciseProgress = {};

    const sortedWorkouts = [...regularWorkouts].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedWorkouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        const maxWeight = Math.max(...exercise.sets.map(s => s.weight || 0));
        if (!exerciseProgress[exercise.name]) {
          exerciseProgress[exercise.name] = [];
        }
        exerciseProgress[exercise.name].push({ weight: maxWeight, date: workout.date });
      });
    });

    const trends = [];
    Object.entries(exerciseProgress).forEach(([name, records]) => {
      if (records.length >= 2) {
        const recent = records.slice(-2);
        const change = recent[1].weight - recent[0].weight;
        const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
        trends.push({ name, change, trend, currentWeight: recent[1].weight });
      }
    });

    return trends.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 5);
  };

  const progressData = getProgressiveOverloadData();

  // 3. ENERGY ZONES (Light/Moderate/Heavy sets)
  const energyZonesData = last7Days.map(day => {
    const dayWorkouts = last7DaysWorkouts.filter(w =>
      format(new Date(w.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    );

    let light = 0, moderate = 0, heavy = 0;

    dayWorkouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        const maxWeight = Math.max(...exercise.sets.map(s => s.weight || 0));
        exercise.sets.forEach(set => {
          const intensity = maxWeight > 0 ? (set.weight / maxWeight) : 0;
          if (intensity < 0.6) light++;
          else if (intensity < 0.85) moderate++;
          else heavy++;
        });
      });
    });

    return {
      day: format(day, 'EEE'),
      Light: light,
      Moderate: moderate,
      Heavy: heavy
    };
  });

  // 4. PR MILESTONES
  const getPRMilestones = () => {
    const prs = [];
    const exerciseMaxes = {};

    const sortedWorkouts = [...regularWorkouts].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedWorkouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        const maxWeight = Math.max(...exercise.sets.map(s => s.weight || 0));
        if (!exerciseMaxes[exercise.name] || maxWeight > exerciseMaxes[exercise.name]) {
          exerciseMaxes[exercise.name] = maxWeight;
          prs.push({
            exercise: exercise.name,
            weight: maxWeight,
            date: new Date(workout.date)
          });
        }
      });
    });

    return prs.filter(pr =>
      last7Days.some(day => format(pr.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
    );
  };

  const prMilestones = getPRMilestones();

  const tabs = [
    { id: 'muscles', label: 'Muscles', icon: '💪' },
    { id: 'progress', label: 'Progress', icon: '📈' },
    { id: 'zones', label: 'Intensity', icon: '⚡' },
    { id: 'prs', label: 'PRs', icon: '🏆' }
  ];

  return (
    <div className="space-y-4">
      {/* Modern Tab Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[80px] px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
              ? 'bg-white text-primary-600 shadow-md'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[280px]">
        {/* MUSCLE GROUP DISTRIBUTION */}
        {activeTab === 'muscles' && (
          <div className="space-y-4">
            {muscleChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={muscleChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {muscleChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2">
                  {muscleChartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-gray-700">{entry.name}</span>
                      <span className="text-gray-500 ml-auto">{entry.value} sets</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>No muscle group data for the last 7 days</p>
              </div>
            )}
          </div>
        )}

        {/* PROGRESSIVE OVERLOAD TRACKER */}
        {activeTab === 'progress' && (
          <div className="space-y-3">
            {progressData.length > 0 ? (
              progressData.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${item.trend === 'up' ? 'bg-green-100' :
                      item.trend === 'down' ? 'bg-red-100' : 'bg-gray-200'
                      }`}>
                      {item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.currentWeight} kg</p>
                    </div>
                  </div>
                  <div className={`font-bold ${item.trend === 'up' ? 'text-green-600' :
                    item.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                    {item.change > 0 ? '+' : ''}{item.change} kg
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>Need at least 2 workouts per exercise to track progress</p>
              </div>
            )}
          </div>
        )}

        {/* ENERGY ZONES */}
        {activeTab === 'zones' && (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={energyZonesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Light" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Moderate" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Heavy" stackId="a" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* PR MILESTONES */}
        {activeTab === 'prs' && (
          <div className="space-y-3">
            {prMilestones.length > 0 ? (
              <>
                <div className="relative py-8">
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 rounded-full" />
                  <div className="relative flex justify-between">
                    {last7Days.map((day, index) => {
                      const dayPRs = prMilestones.filter(pr =>
                        format(pr.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                      );
                      return (
                        <div key={index} className="flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full ${dayPRs.length > 0 ? 'bg-yellow-500 ring-4 ring-yellow-200' : 'bg-gray-300'
                            }`} />
                          <span className="text-xs text-gray-500 mt-2">{format(day, 'EEE')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  {prMilestones.map((pr, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🏆</span>
                        <div>
                          <p className="font-medium text-gray-900">{pr.exercise}</p>
                          <p className="text-xs text-gray-500">{format(pr.date, 'MMM d')}</p>
                        </div>
                      </div>
                      <span className="font-bold text-yellow-600">{pr.weight} kg</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <p className="text-4xl mb-2">🎯</p>
                  <p>No new PRs in the last 7 days</p>
                  <p className="text-sm mt-1">Keep pushing to hit new records!</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// PR Progression Chart (Top 5 Exercises)
export const PRProgressionChart = ({ workouts }) => {
  // Filter out rest days
  const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');

  // Get all exercises with their max weights over time
  const exercisePRs = {};

  regularWorkouts.forEach((workout) => {
    const date = format(new Date(workout.date), 'MMM d');
    workout.exercises?.forEach((exercise) => {
      const maxWeight = Math.max(...exercise.sets.map((set) => set.weight), 0);
      if (maxWeight > 0) {
        if (!exercisePRs[exercise.name]) {
          exercisePRs[exercise.name] = [];
        }
        exercisePRs[exercise.name].push({
          date,
          weight: maxWeight,
          timestamp: new Date(workout.date).getTime(),
        });
      }
    });
  });

  // Get top 5 exercises by max weight
  const topExercises = Object.entries(exercisePRs)
    .map(([name, records]) => ({
      name,
      maxWeight: Math.max(...records.map((r) => r.weight)),
    }))
    .sort((a, b) => b.maxWeight - a.maxWeight)
    .slice(0, 5)
    .map((ex) => ex.name);

  if (topExercises.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 ">
        <p>No PR data available yet</p>
      </div>
    );
  }

  // Prepare data for chart (last 10 entries per exercise)
  const chartData = topExercises.map((exerciseName) => {
    const records = exercisePRs[exerciseName]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10);

    return {
      name: exerciseName,
      data: records.map((r) => ({
        date: r.date,
        weight: r.weight,
      })),
    };
  });

  const colors = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          type="category"
          allowDuplicatedCategory={false}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        {chartData.map((exercise, index) => (
          <Line
            key={exercise.name}
            data={exercise.data}
            dataKey="weight"
            name={exercise.name}
            stroke={colors[index]}
            strokeWidth={2}
            dot={{ r: 3 }}
            type="monotone"
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

