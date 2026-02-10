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

  // 2. PROGRESSIVE OVERLOAD TRACKER (Enhanced for Cardio)
  const getProgressiveOverloadData = () => {
    const exerciseProgress = {};

    const sortedWorkouts = [...regularWorkouts].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedWorkouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        const isCardio = exercise.category === 'cardio';

        // For cardio: track duration, for weights: track max weight
        const metric = isCardio
          ? exercise.sets.reduce((sum, s) => sum + (s.duration || 0), 0) // Total duration
          : Math.max(...exercise.sets.map(s => s.weight || 0), 0); // Max weight (0 prevents -Infinity)

        if (!exerciseProgress[exercise.name]) {
          exerciseProgress[exercise.name] = { records: [], isCardio };
        }
        exerciseProgress[exercise.name].records.push({ metric, date: workout.date });
      });
    });

    const trends = [];
    Object.entries(exerciseProgress).forEach(([name, data]) => {
      if (data.records.length >= 2) {
        const recent = data.records.slice(-2);
        const change = recent[1].metric - recent[0].metric;
        const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
        trends.push({
          name,
          change,
          trend,
          currentMetric: recent[1].metric,
          isCardio: data.isCardio
        });
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
            className={`flex-1 flex items-center justify-center px-3 md:px-4 py-2.5 rounded-lg font-medium text-xs md:text-sm transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
              ? 'bg-white text-primary-600 shadow-md'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <span className="md:mr-1">{tab.icon}</span>
            <span className="hidden md:inline">{tab.label}</span>
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
                      <p className="text-sm text-gray-500">
                        {item.isCardio ? `${item.currentMetric} mins` : `${item.currentMetric} kg`}
                      </p>
                    </div>
                  </div>
                  <div className={`font-bold ${item.trend === 'up' ? 'text-green-600' :
                    item.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                    {item.change > 0 ? '+' : ''}{item.change} {item.isCardio ? 'mins' : 'kg'}
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

// Weekly/Monthly Activity Trends Chart (NEW - Activity Points System)
export const WeeklyMonthlyActivityChart = ({ workouts }) => {
  const [viewMode, setViewMode] = React.useState('weekly'); // 'weekly' or 'monthly'

  const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');

  // Helper to get week number
  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `W${weekNo}`;
  };

  // Helper to get month
  const getMonth = (date) => {
    return format(new Date(date), 'MMM yyyy');
  };

  // Group workouts by week or month
  const groupedData = {};

  regularWorkouts.forEach(workout => {
    const key = viewMode === 'weekly' ? getWeekNumber(workout.date) : getMonth(workout.date);

    if (!groupedData[key]) {
      groupedData[key] = {
        weighted: 0,
        cardio: 0,
        bodyweight: 0,
        total: 0
      };
    }

    workout.exercises?.forEach(exercise => {
      const isCardio = exercise.category === 'cardio';
      const maxWeight = Math.max(...exercise.sets.map(s => s.weight || 0));
      const isBodyweight = maxWeight === 0 && !isCardio;

      const points = exercise.sets.reduce((sum, set) => {
        if (isCardio) {
          return sum + ((set.duration || 0) * 10);
        } else if (isBodyweight) {
          return sum + ((set.reps || 0) * 2);
        } else {
          return sum + ((set.reps || 0) * (set.weight || 0));
        }
      }, 0);

      if (isCardio) {
        groupedData[key].cardio += points;
      } else if (isBodyweight) {
        groupedData[key].bodyweight += points;
      } else {
        groupedData[key].weighted += points;
      }
      groupedData[key].total += points;
    });
  });

  // Convert to array and sort
  const chartData = Object.entries(groupedData)
    .map(([period, data]) => ({
      period,
      Weights: Math.round(data.weighted),
      Cardio: Math.round(data.cardio),
      Bodyweight: Math.round(data.bodyweight),
      Total: Math.round(data.total)
    }))
    .slice(-8); // Last 8 weeks or months

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No activity data available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setViewMode('weekly')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${viewMode === 'weekly'
            ? 'bg-primary-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          Weekly
        </button>
        <button
          onClick={() => setViewMode('monthly')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${viewMode === 'monthly'
            ? 'bg-primary-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          Monthly
        </button>
      </div>

      {/* Stacked Bar Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            label={{ value: 'Activity Points', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="Weights" stackId="a" fill="#0284c7" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Cardio" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Bodyweight" stackId="a" fill="#10b981" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-xs text-blue-600 font-semibold mb-1">Weights</div>
          <div className="text-lg font-bold text-blue-700">
            {Math.round(chartData.reduce((sum, d) => sum + d.Weights, 0)).toLocaleString()}
          </div>
        </div>
        <div className="bg-cyan-50 rounded-lg p-3 text-center">
          <div className="text-xs text-cyan-600 font-semibold mb-1">Cardio</div>
          <div className="text-lg font-bold text-cyan-700">
            {Math.round(chartData.reduce((sum, d) => sum + d.Cardio, 0)).toLocaleString()}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-xs text-green-600 font-semibold mb-1">Bodyweight</div>
          <div className="text-lg font-bold text-green-700">
            {Math.round(chartData.reduce((sum, d) => sum + d.Bodyweight, 0)).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Treadmill Progress Chart (Advanced Tracking)
export const TreadmillProgressChart = ({ workouts }) => {
  const [activeTab, setActiveTab] = React.useState('speed');

  // Filter out treadmill workouts
  const treadmillWorkouts = workouts
    .filter(w => w.type !== 'rest_day')
    .flatMap(workout => 
      workout.exercises
        ?.filter(ex => ex.name.toLowerCase().includes('treadmill'))
        .flatMap(ex => 
          ex.sets
            // Accept all sets from treadmill exercises, even without speed/incline
            .map(set => ({
              date: new Date(workout.date),
              dateStr: format(new Date(workout.date), 'MMM d'),
              duration: set.duration || 0,
              incline: parseFloat(set.incline) || 0,
              speed: parseFloat(set.speed) || 0,
              distance: ((parseFloat(set.speed) || 0) * (set.duration || 0)) / 60, // km
              timestamp: new Date(workout.date).getTime()
            }))
        ) || []
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  if (treadmillWorkouts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p className="text-4xl mb-2">🏃‍♂️</p>
          <p>No treadmill data available yet</p>
          <p className="text-sm mt-1">Start tracking treadmill workouts with speed and incline!</p>
        </div>
      </div>
    );
  }

  // 1. SPEED PROGRESSION
  const speedData = treadmillWorkouts.slice(-20).map((tw, idx) => ({
    session: `#${idx + 1}`,
    date: tw.dateStr,
    speed: tw.speed,
    avgSpeed: (treadmillWorkouts.slice(0, idx + 1).reduce((sum, w) => sum + w.speed, 0) / (idx + 1)).toFixed(1)
  }));

  // 2. INCLINE PROGRESSION
  const inclineData = treadmillWorkouts.slice(-20).map((tw, idx) => ({
    session: `#${idx + 1}`,
    date: tw.dateStr,
    incline: tw.incline,
    avgIncline: (treadmillWorkouts.slice(0, idx + 1).reduce((sum, w) => sum + w.incline, 0) / (idx + 1)).toFixed(1)
  }));

  // 3. DISTANCE COVERED (by day)
  const distanceByDay = {};
  treadmillWorkouts.forEach(tw => {
    if (!distanceByDay[tw.dateStr]) {
      distanceByDay[tw.dateStr] = 0;
    }
    distanceByDay[tw.dateStr] += tw.distance;
  });

  const distanceData = Object.entries(distanceByDay)
    .slice(-15)
    .map(([date, distance]) => ({
      date,
      distance: parseFloat(distance.toFixed(2))
    }));

  // 4. PERSONAL RECORDS
  const maxSpeed = Math.max(...treadmillWorkouts.map(tw => tw.speed));
  const maxIncline = Math.max(...treadmillWorkouts.map(tw => tw.incline));
  const maxDistance = Math.max(...treadmillWorkouts.map(tw => tw.distance));
  const maxDuration = Math.max(...treadmillWorkouts.map(tw => tw.duration));
  
  const avgSpeed = (treadmillWorkouts.reduce((sum, tw) => sum + tw.speed, 0) / treadmillWorkouts.length).toFixed(1);
  const avgIncline = (treadmillWorkouts.reduce((sum, tw) => sum + tw.incline, 0) / treadmillWorkouts.length).toFixed(1);
  const totalDistance = treadmillWorkouts.reduce((sum, tw) => sum + tw.distance, 0).toFixed(2);
  const totalDuration = treadmillWorkouts.reduce((sum, tw) => sum + tw.duration, 0);

  // 5. INTENSITY ZONES (based on speed and incline)
  const getIntensityZone = (speed, incline) => {
    const intensity = speed + (incline * 0.5); // Simple formula
    if (intensity < 6) return 'Low';
    if (intensity < 10) return 'Moderate';
    return 'High';
  };

  const intensityZones = { Low: 0, Moderate: 0, High: 0 };
  treadmillWorkouts.forEach(tw => {
    const zone = getIntensityZone(tw.speed, tw.incline);
    intensityZones[zone]++;
  });

  const intensityData = [
    { name: 'Low', value: intensityZones.Low, color: '#10b981' },
    { name: 'Moderate', value: intensityZones.Moderate, color: '#f59e0b' },
    { name: 'High', value: intensityZones.High, color: '#ef4444' }
  ];

  const tabs = [
    { id: 'speed', label: 'Speed', icon: '⚡' },
    { id: 'incline', label: 'Incline', icon: '📈' },
    { id: 'distance', label: 'Distance', icon: '📏' },
    { id: 'intensity', label: 'Intensity', icon: '🔥' },
    { id: 'records', label: 'Records', icon: '🏆' }
  ];

  return (
    <div className="space-y-4">
      {/* Modern Tab Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center px-3 md:px-4 py-2.5 rounded-lg font-medium text-xs md:text-sm transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-primary-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="md:mr-1">{tab.icon}</span>
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[320px]">
        {/* SPEED PROGRESSION */}
        {activeTab === 'speed' && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={speedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="session" tick={{ fontSize: 11 }} />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft', fontSize: 12 }}
                  domain={[0, 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="speed"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={{ fill: '#0284c7', r: 4 }}
                  name="Speed"
                />
                <Line
                  type="monotone"
                  dataKey="avgSpeed"
                  stroke="#94a3b8"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Avg Speed"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-xs text-blue-600 font-semibold mb-1">Max Speed</div>
                <div className="text-xl font-bold text-blue-700">{maxSpeed} km/h</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-xs text-blue-600 font-semibold mb-1">Avg Speed</div>
                <div className="text-xl font-bold text-blue-700">{avgSpeed} km/h</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-xs text-blue-600 font-semibold mb-1">Sessions</div>
                <div className="text-xl font-bold text-blue-700">{treadmillWorkouts.length}</div>
              </div>
            </div>
          </div>
        )}

        {/* INCLINE PROGRESSION */}
        {activeTab === 'incline' && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={inclineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="session" tick={{ fontSize: 11 }} />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Incline (%)', angle: -90, position: 'insideLeft', fontSize: 12 }}
                  domain={[0, 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="incline"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  name="Incline"
                />
                <Line
                  type="monotone"
                  dataKey="avgIncline"
                  stroke="#94a3b8"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Avg Incline"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-xs text-green-600 font-semibold mb-1">Max Incline</div>
                <div className="text-xl font-bold text-green-700">{maxIncline}%</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-xs text-green-600 font-semibold mb-1">Avg Incline</div>
                <div className="text-xl font-bold text-green-700">{avgIncline}%</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-xs text-green-600 font-semibold mb-1">Climb Rate</div>
                <div className="text-xl font-bold text-green-700">
                  {((parseFloat(avgIncline) / 10) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DISTANCE COVERED */}
        {activeTab === 'distance' && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={distanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Distance (km)', angle: -90, position: 'insideLeft', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="distance" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Distance (km)" />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-xs text-purple-600 font-semibold mb-1">Total Distance</div>
                <div className="text-xl font-bold text-purple-700">{totalDistance} km</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-xs text-purple-600 font-semibold mb-1">Longest Run</div>
                <div className="text-xl font-bold text-purple-700">{maxDistance.toFixed(2)} km</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-xs text-purple-600 font-semibold mb-1">Avg/Session</div>
                <div className="text-xl font-bold text-purple-700">
                  {(totalDistance / treadmillWorkouts.length).toFixed(2)} km
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INTENSITY ZONES */}
        {activeTab === 'intensity' && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={intensityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {intensityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {intensityData.map((zone) => (
                <div key={zone.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: zone.color }}
                    />
                    <span className="font-medium text-gray-900">{zone.name} Intensity</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{zone.value} sessions</div>
                    <div className="text-xs text-gray-500">
                      {((zone.value / treadmillWorkouts.length) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                <strong>💡 Intensity Formula:</strong> Speed + (Incline × 0.5)
                <br />
                <span className="text-amber-700">
                  Low: &lt;6 | Moderate: 6-10 | High: &gt;10
                </span>
              </p>
            </div>
          </div>
        )}

        {/* PERSONAL RECORDS */}
        {activeTab === 'records' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-2xl">
                      ⚡
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Fastest Speed</p>
                      <p className="text-2xl font-bold text-gray-900">{maxSpeed} km/h</p>
                    </div>
                  </div>
                  <span className="text-3xl">🏆</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center text-2xl">
                      📈
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Highest Incline</p>
                      <p className="text-2xl font-bold text-gray-900">{maxIncline}%</p>
                    </div>
                  </div>
                  <span className="text-3xl">🏔️</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-400 rounded-full flex items-center justify-center text-2xl">
                      📏
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Longest Distance</p>
                      <p className="text-2xl font-bold text-gray-900">{maxDistance.toFixed(2)} km</p>
                    </div>
                  </div>
                  <span className="text-3xl">🎯</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-2xl">
                      ⏱️
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Longest Duration</p>
                      <p className="text-2xl font-bold text-gray-900">{maxDuration} min</p>
                    </div>
                  </div>
                  <span className="text-3xl">⏳</span>
                </div>
              </div>
            </div>

            {/* Total Stats Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 mt-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>📊</span> Total Statistics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600">Total Distance</p>
                  <p className="text-lg font-bold text-gray-900">{totalDistance} km</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Time</p>
                  <p className="text-lg font-bold text-gray-900">{totalDuration} min</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Avg Speed</p>
                  <p className="text-lg font-bold text-gray-900">{avgSpeed} km/h</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Avg Incline</p>
                  <p className="text-lg font-bold text-gray-900">{avgIncline}%</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

